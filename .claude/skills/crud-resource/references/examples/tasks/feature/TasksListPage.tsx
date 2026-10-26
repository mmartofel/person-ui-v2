import { keepPreviousData, useQueryClient } from '@tanstack/react-query'
import {
  getGetTaskQueryKey,
  getListTasksQueryKey,
  useDeleteTask,
  useListTasks,
} from '@/api/generated/endpoints/tasks/tasks'
import { ListTasksQueryParams } from '@/api/generated/endpoints/tasks/tasks.zod'
import { ListTasksPriority } from '@/api/generated/model'
import { ResourceList } from '@/components/app/list/ResourceList'
import { useListState } from '@/components/app/list/listState'
import { getResource } from '@/manifest'

const tasks = getResource('tasks')
const filterValues = { priority: Object.values(ListTasksPriority) }

export function TasksListPage() {
  const queryClient = useQueryClient()
  const list = useListState(tasks, ListTasksQueryParams)
  const query = useListTasks(list.apiParams, { query: { placeholderData: keepPreviousData } })
  const remove = useDeleteTask()
  return (
    <ResourceList
      resource={tasks}
      list={list}
      query={query}
      filterValues={filterValues}
      remove={(task) => remove.mutateAsync({ id: task.id })}
      onDeleted={(task) => {
        queryClient.removeQueries({ queryKey: getGetTaskQueryKey(task.id) })
        void queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() })
      }}
    />
  )
}
