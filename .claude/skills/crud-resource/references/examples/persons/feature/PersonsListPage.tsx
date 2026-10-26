import { keepPreviousData, useQueryClient } from '@tanstack/react-query'
import {
  getGetPersonQueryKey,
  getListPersonsQueryKey,
  useDeletePerson,
  useListPersons,
} from '@/api/generated/endpoints/persons/persons'
import { ListPersonsQueryParams } from '@/api/generated/endpoints/persons/persons.zod'
import { ListPersonsStatus } from '@/api/generated/model'
import { ResourceList } from '@/components/app/list/ResourceList'
import { useListState } from '@/components/app/list/listState'
import { getResource } from '@/manifest'

const persons = getResource('persons')
const filterValues = { status: Object.values(ListPersonsStatus) }

export function PersonsListPage() {
  const queryClient = useQueryClient()
  const list = useListState(persons, ListPersonsQueryParams)
  const query = useListPersons(list.apiParams, { query: { placeholderData: keepPreviousData } })
  const remove = useDeletePerson()
  return (
    <ResourceList
      resource={persons}
      list={list}
      query={query}
      filterValues={filterValues}
      remove={(person) => remove.mutateAsync({ id: person.id })}
      onDeleted={(person) => {
        queryClient.removeQueries({ queryKey: getGetPersonQueryKey(person.id) })
        void queryClient.invalidateQueries({ queryKey: getListPersonsQueryKey() })
      }}
    />
  )
}
