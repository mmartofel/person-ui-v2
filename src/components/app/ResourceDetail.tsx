import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { sourceOf, type AnyRecord } from '@/api/sources'
import { useRoles } from '@/auth'
import { Button } from '@/components/ui/button'
import { canWrite, formatDisplay, getPath, type Resource } from '@/manifest'
import { DataState } from './DataState'
import { DetailSections } from './DetailSections'
import { DetailSkeleton } from './DetailSkeleton'
import { errorPageFor } from './errorPageFor'
import { renderFieldValue } from './formatValue'
import { listFocusSearch, useListHref } from './list/listState'
import { PageHeader } from './PageHeader'
import { RelatedLists } from './RelatedList'
import { useDeleteRecord } from './useDeleteRecord'

/** The parts of a generated get query (`useGetPerson(id)`) the detail reads. */
export interface RecordQuery<T extends AnyRecord> {
  data?: T
  error: unknown
  isPending: boolean
  isError: boolean
  refetch: () => unknown
}

interface ResourceDetailProps<T extends AnyRecord> {
  resource: Resource
  query: RecordQuery<T>
  /** Deletes the record (the generated delete mutation). */
  remove: (record: T) => Promise<unknown>
  /** Updates the query cache after a delete: remove the record's detail query, invalidate the lists. */
  onDeleted: (record: T) => void
}

/**
 * A resource's detail page: 403/404 pages, the four data states, back link, the record's name with its
 * `detail.status` badge, Edit and Delete for writers, the fields in section cards and the related lists.
 */
export function ResourceDetail<T extends AnyRecord>({ resource, query, remove, onDeleted }: ResourceDetailProps<T>) {
  return (
    errorPageFor(query.error) ?? (
      <DataState
        isLoading={query.isPending}
        isError={query.isError}
        onRetry={() => void query.refetch()}
        loading={<DetailSkeleton />}
      >
        {query.data && <DetailView resource={resource} record={query.data} remove={remove} onDeleted={onDeleted} />}
      </DataState>
    )
  )
}

function DetailView<T extends AnyRecord>({
  resource,
  record,
  remove,
  onDeleted,
}: Omit<ResourceDetailProps<T>, 'query'> & { record: T }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const roles = useRoles()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const listHref = useListHref(resource)
  const deletion = useDeleteRecord<T>({
    resource,
    remove,
    onDeleted: (deleted) => {
      deletedRecord.current = deleted
      // Before leaving: the list page reads its cache while rendering, so cached lists would show the deleted
      // record until the refetch. This page observes no list of its own resource, so nothing refetches here.
      queryClient.removeQueries({ queryKey: sourceOf(resource.key).listKey({}) })
      // The list puts focus in its search box: the Delete button that had it is gone.
      navigate(listHref, { replace: true, state: listFocusSearch })
    },
  })
  // The feature's cache update (remove the detail query, invalidate the lists) waits until this page has unmounted:
  // removing the detail query while the page (or the breadcrumbs) still shows the record would fetch it again (a 404).
  // It runs before the list page subscribes, so the list still loads only once.
  const deletedRecord = useRef<T>(undefined)
  const onDeletedRef = useRef(onDeleted)
  useEffect(() => {
    onDeletedRef.current = onDeleted
  })
  useEffect(
    () => () => {
      const deleted = deletedRecord.current
      if (deleted) onDeletedRef.current(deleted)
    },
    [],
  )
  const status = resource.detail.status

  return (
    <>
      <Button asChild variant="link" className="mb-2 -ml-3 text-muted-foreground">
        <Link to={listHref}>
          <ArrowLeft aria-hidden />
          {t('common.actions.backToList')}
        </Link>
      </Button>
      <PageHeader
        title={formatDisplay(resource.display, record)}
        badge={status && renderFieldValue(resource, status, getPath(record, status), t, language)}
        actions={
          canWrite(roles, resource) && (
            <>
              <Button asChild variant="outline">
                <Link to={`${resource.route}/${record.id}/edit`}>
                  <Pencil aria-hidden />
                  {t('common.actions.edit')}
                </Link>
              </Button>
              <Button variant="destructive" onClick={() => deletion.request(record)}>
                <Trash2 aria-hidden />
                {t('common.actions.delete')}
              </Button>
            </>
          )
        }
      />
      <div className="flex flex-col gap-6">
        <DetailSections resource={resource} record={record} />
        <RelatedLists resource={resource} id={record.id} />
      </div>
      {deletion.dialog}
    </>
  )
}
