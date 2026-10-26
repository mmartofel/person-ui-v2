import type { Resource } from '@/manifest'

export type PageKind = 'list' | 'detail' | 'new' | 'edit'

export interface ResourcePage {
  resource: Resource
  kind: PageKind
  /** The record id of a detail or edit page. */
  id?: number
}

const idPattern = /^[1-9]\d*$/

/**
 * Which resource page a path shows, by the routes every resource has (`routes.tsx`): `<route>`, `<route>/new`,
 * `<route>/:id`, `<route>/:id/edit`. Null outside them (home, 404, a malformed id), so no breadcrumbs are shown.
 */
export function resourcePage(pathname: string, resources: readonly Resource[]): ResourcePage | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  const resource = resources
    .filter((r) => path === r.route || path.startsWith(`${r.route}/`))
    .sort((a, b) => b.route.length - a.route.length)[0]
  if (!resource) return null

  const [first, second, ...rest] = path.slice(resource.route.length).split('/').filter(Boolean)
  if (first === undefined) return { resource, kind: 'list' }
  if (first === 'new' && second === undefined) return { resource, kind: 'new' }
  if (!idPattern.test(first) || !Number.isSafeInteger(Number(first)) || rest.length > 0) return null
  if (second === undefined) return { resource, kind: 'detail', id: Number(first) }
  return second === 'edit' ? { resource, kind: 'edit', id: Number(first) } : null
}
