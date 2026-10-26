import { useQueryClient } from '@tanstack/react-query'
import {
  getGetPersonQueryKey,
  getListPersonsQueryKey,
  useDeletePerson,
  useGetPerson,
} from '@/api/generated/endpoints/persons/persons'
import { NotFoundPage } from '@/components/app/NotFoundPage'
import { ResourceDetail } from '@/components/app/ResourceDetail'
import { useIdParam } from '@/lib/ids'
import { getResource } from '@/manifest'

const persons = getResource('persons')

export function PersonDetailPage() {
  const id = useIdParam()
  return id === null ? <NotFoundPage /> : <PersonDetail id={id} />
}

function PersonDetail({ id }: { id: number }) {
  const queryClient = useQueryClient()
  const query = useGetPerson(id)
  const remove = useDeletePerson()
  return (
    <ResourceDetail
      resource={persons}
      query={query}
      remove={() => remove.mutateAsync({ id })}
      onDeleted={() => {
        queryClient.removeQueries({ queryKey: getGetPersonQueryKey(id) })
        void queryClient.invalidateQueries({ queryKey: getListPersonsQueryKey() })
      }}
    />
  )
}
