import { fetchApiStatus } from './status'

type Reply = { status: number; body?: unknown } | Error | DOMException

/** Answers /actuator/health and /actuator/info with the given replies (a raw string body is sent as is). */
function stubActuator(health: Reply, info: Reply = { status: 404 }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const reply = url === '/actuator/health' ? health : info
      if (!('status' in reply)) throw reply
      const text = reply.body === undefined ? '' : typeof reply.body === 'string' ? reply.body : JSON.stringify(reply.body)
      return new Response(text, { status: reply.status })
    }),
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('fetchApiStatus', () => {
  it('is available with the running version when health is UP', async () => {
    stubActuator({ status: 200, body: { status: 'UP' } }, { status: 200, body: { build: { version: '3.5.0' } } })
    expect(await fetchApiStatus(undefined, '3.4.2')).toEqual({ state: 'available', version: '3.5.0', versionSource: 'api' })
  })

  it('falls back to the contract version when the API does not expose its info', async () => {
    stubActuator({ status: 200, body: { status: 'UP' } }, { status: 401 })
    expect(await fetchApiStatus(undefined, '3.4.2')).toEqual({ state: 'available', version: '3.4.2', versionSource: 'contract' })
  })

  it('is degraded and names the components that are down', async () => {
    stubActuator({ status: 503, body: { status: 'DOWN', components: { db: { status: 'DOWN' }, ping: { status: 'UP' } } } })
    expect(await fetchApiStatus(undefined, '3.4.2')).toMatchObject({ state: 'degraded', problem: { key: 'down', detail: 'db: DOWN' } })
  })

  it('is degraded with the overall status when the API lists no components', async () => {
    stubActuator({ status: 503, body: { status: 'OUT_OF_SERVICE' } })
    expect(await fetchApiStatus(undefined, null)).toMatchObject({ state: 'degraded', problem: { key: 'down', detail: 'OUT_OF_SERVICE' } })
  })

  it('is degraded when the running major version differs from the contract', async () => {
    stubActuator({ status: 200, body: { status: 'UP' } }, { status: 200, body: { build: { version: '4.0.0' } } })
    expect(await fetchApiStatus(undefined, '3.4.2')).toMatchObject({ state: 'degraded', problem: { key: 'incompatible', detail: '3.4.2' } })
  })

  it('is unavailable when the API cannot be reached', async () => {
    stubActuator(new TypeError('Failed to fetch'))
    expect(await fetchApiStatus(undefined, '3.4.2')).toEqual({
      state: 'unavailable',
      version: '3.4.2',
      versionSource: 'contract',
      problem: { key: 'network' },
    })
  })

  it('is unavailable after a timeout', async () => {
    stubActuator(new DOMException('timed out', 'TimeoutError'))
    expect(await fetchApiStatus(undefined, null)).toEqual({ state: 'unavailable', problem: { key: 'timeout' } })
  })

  it('is unavailable when a proxy answers with an error page instead of the API', async () => {
    stubActuator({ status: 502, body: '<html>Bad Gateway</html>' })
    expect(await fetchApiStatus(undefined, null)).toEqual({ state: 'unavailable', problem: { key: 'network', detail: 'HTTP 502' } })
  })

  it('is unavailable when no API answers at /actuator/health', async () => {
    stubActuator({ status: 200, body: '<!doctype html>' })
    expect(await fetchApiStatus(undefined, null)).toEqual({ state: 'unavailable', problem: { key: 'noHealth', detail: 'HTTP 200' } })
  })

  it('reuses the running version while the API stays reachable, and reads it again after an outage', async () => {
    stubActuator({ status: 200, body: { status: 'UP' } }, { status: 200, body: { build: { version: '3.5.0' } } })
    const reachable = { state: 'available', version: '3.4.2', versionSource: 'contract' } as const
    expect(await fetchApiStatus(reachable, '3.4.2')).toEqual(reachable)
    expect(fetch).toHaveBeenCalledTimes(1)

    expect(await fetchApiStatus({ state: 'unavailable', problem: { key: 'network' } }, '3.4.2')).toEqual({
      state: 'available',
      version: '3.5.0',
      versionSource: 'api',
    })
  })

  it('is degraded when the health JSON has no status', async () => {
    stubActuator({ status: 500, body: { error: 'boom' } })
    expect(await fetchApiStatus(undefined, null)).toMatchObject({ state: 'degraded', problem: { key: 'unexpected', detail: 'HTTP 500' } })
  })
})
