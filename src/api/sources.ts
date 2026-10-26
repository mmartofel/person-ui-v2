// The generated list/get functions of each resource, by manifest key, for generic components that read a
// resource: relation inputs and filters, embedded links, related lists and the breadcrumbs. One line per resource.
import { getGetPersonQueryKey, getListPersonsQueryKey, getPerson, listPersons } from '@/api/generated/endpoints/persons/persons'
import { getGetTaskQueryKey, getListTasksQueryKey, getTask, listTasks } from '@/api/generated/endpoints/tasks/tasks'
import type { ResourceKey } from '@/manifest'

/** A record as generic code sees it: an id and fields read through the manifest. */
export type AnyRecord = { id: number } & object

export interface ResourceSource {
  /** The paged list endpoint (`q`, `page`, `size`, `sort` and the resource's filters). */
  list: (params: Record<string, unknown>) => Promise<{ content?: AnyRecord[]; page?: { totalElements?: number } }>
  get: (id: number) => Promise<AnyRecord>
  /** orval's list query key, so invalidating a resource's lists also refreshes these queries. */
  listKey: (params: Record<string, unknown>) => readonly unknown[]
  /** orval's get query key, so the breadcrumbs share the record the detail or edit page already loaded. */
  getKey: (id: number) => readonly unknown[]
}

// One line per resource, e.g. (imports from '@/api/generated/endpoints/orders/orders'):
//   orders: { list: listOrders, get: getOrder, listKey: getListOrdersQueryKey, getKey: getGetOrderQueryKey },
export const sources: Record<ResourceKey, ResourceSource> = {
  persons: { list: listPersons, get: getPerson, listKey: getListPersonsQueryKey, getKey: getGetPersonQueryKey },
  tasks: { list: listTasks, get: getTask, listKey: getListTasksQueryKey, getKey: getGetTaskQueryKey },
}

/** The registered source of a resource; every resource must be in `sources`. */
export function sourceOf(resource: ResourceKey): ResourceSource {
  const source = (sources as Partial<Record<string, ResourceSource>>)[resource]
  if (!source) throw new Error(`No source for resource "${resource}": add it to src/api/sources.ts`)
  return source
}
