import { useQueryClient } from '@tanstack/react-query'
import {
  getGetTaskQueryKey,
  getListTasksQueryKey,
  useDeleteTask,
  useGetTask,
} from '@/api/generated/endpoints/tasks/tasks'
import { NotFoundPage } from '@/components/app/NotFoundPage'
import { ResourceDetail } from '@/components/app/ResourceDetail'
import { useIdParam } from '@/lib/ids'
import { getResource } from '@/manifest'

const tasks = getResource('tasks')

export function TaskDetailPage() {
  const id = useIdParam()
  return id === null ? <NotFoundPage /> : <TaskDetail id={id} />
}

function TaskDetail({ id }: { id: number }) {
  const queryClient = useQueryClient()
  const query = useGetTask(id)
  const remove = useDeleteTask()
  return (
    <ResourceDetail
      resource={tasks}
      query={query}
      remove={() => remove.mutateAsync({ id })}
      onDeleted={() => {
        queryClient.removeQueries({ queryKey: getGetTaskQueryKey(id) })
        void queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() })
      }}
    />
  )
}
