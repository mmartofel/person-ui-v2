// The API's status for the footer, from the Spring Boot Actuator endpoints in docs/API-CONTRACT.md "Status endpoints".
// Plain fetch, not `fetcher`: both endpoints are public, and a 401 here must not start a re-login.
import { useQuery, useQueryClient } from '@tanstack/react-query'

export type ApiState = 'available' | 'degraded' | 'unavailable'

/** Why the API is not `available`; the footer translates `key` (`common.footer.problem.<key>`) with `detail`. */
export interface ApiProblem {
  key: 'network' | 'timeout' | 'noHealth' | 'down' | 'unexpected' | 'incompatible'
  detail?: string
}

export interface ApiStatus {
  state: ApiState
  /** The running API's `build.version`, or the contract's `info.version` when the API does not report one. */
  version?: string
  versionSource?: 'api' | 'contract'
  problem?: ApiProblem
}

const TIMEOUT_MS = 5_000

async function getJson(url: string): Promise<{ status: number; body: unknown }> {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) })
  const text = await response.text()
  try {
    return { status: response.status, body: text ? JSON.parse(text) : undefined }
  } catch {
    return { status: response.status, body: undefined }
  }
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/** The components that are not UP, e.g. `db: DOWN`; empty when the API does not list them. */
function downComponents(health: Record<string, unknown>): string {
  if (!isObject(health.components)) return ''
  return Object.entries(health.components)
    .filter(([, component]) => isObject(component) && component.status !== 'UP')
    .map(([name, component]) => `${name}: ${String((component as Record<string, unknown>).status)}`)
    .join(', ')
}

async function runningVersion(): Promise<string | undefined> {
  try {
    const { body } = await getJson('/actuator/info')
    const version = isObject(body) && isObject(body.build) ? body.build.version : undefined
    return typeof version === 'string' ? version : undefined
  } catch {
    return undefined
  }
}

const major = (version: string) => version.split('.')[0]

/**
 * Checks `/actuator/health` and reads `/actuator/info`; never throws. The running version of the `previous` check is
 * reused while the API stays reachable, so an API without a public `/actuator/info` (it is optional) logs one failed
 * request per outage instead of one every 30 s; after the API was unavailable it is read again (a new deployment).
 */
export async function fetchApiStatus(
  previous?: ApiStatus,
  contractVersion: string | null = __CONTRACT_VERSION__,
): Promise<ApiStatus> {
  const fallback: Pick<ApiStatus, 'version' | 'versionSource'> = contractVersion
    ? { version: contractVersion, versionSource: 'contract' }
    : {}

  let health: { status: number; body: unknown }
  const info =
    previous && previous.state !== 'unavailable'
      ? Promise.resolve(previous.versionSource === 'api' ? previous.version : undefined)
      : runningVersion()
  try {
    health = await getJson('/actuator/health')
  } catch (error) {
    const key = isObject(error) && error.name === 'TimeoutError' ? 'timeout' : 'network'
    return { state: 'unavailable', ...fallback, problem: { key } }
  }

  // No health JSON: a proxy's 5xx page (the API is down) or a page from something else, such as the SPA's
  // index.html when nothing proxies /actuator/health.
  if (!isObject(health.body) || typeof health.body.status !== 'string') {
    const detail = `HTTP ${health.status}`
    if (isObject(health.body)) return { state: 'degraded', ...fallback, problem: { key: 'unexpected', detail } }
    return { state: 'unavailable', ...fallback, problem: { key: health.status >= 500 ? 'network' : 'noHealth', detail } }
  }

  const running = await info
  const versions: Pick<ApiStatus, 'version' | 'versionSource'> = running
    ? { version: running, versionSource: 'api' }
    : fallback

  if (health.body.status !== 'UP') {
    return { state: 'degraded', ...versions, problem: { key: 'down', detail: downComponents(health.body) || health.body.status } }
  }
  // A different major version is a breaking change (docs/API-CONTRACT.md): the screens may no longer match the API.
  if (running && contractVersion && major(running) !== major(contractVersion)) {
    return { state: 'degraded', ...versions, problem: { key: 'incompatible', detail: contractVersion } }
  }
  return { state: 'available', ...versions }
}

/** Where the footer gets the status; the gallery replaces `check` with a fixture (src/gallery/register.ts). */
export const apiStatusSource: { check: (previous?: ApiStatus) => Promise<ApiStatus> } = {
  check: (previous) => fetchApiStatus(previous),
}

/** The API status, checked every 30 s while the page is visible and when the window regains focus. */
export function useApiStatus() {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ['api-status'],
    queryFn: () => apiStatusSource.check(queryClient.getQueryData<ApiStatus>(['api-status'])),
    refetchInterval: 30_000,
    retry: false,
  })
}
