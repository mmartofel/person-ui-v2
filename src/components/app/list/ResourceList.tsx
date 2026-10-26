import { useEffect, useRef } from 'react'
import { FilterX, Plus, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'
import type { AnyRecord } from '@/api/sources'
import { useRoles } from '@/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { tDynamic } from '@/i18n/dynamic'
import { useFormat } from '@/i18n/format'
import { canWrite, formatDisplay, type Resource } from '@/manifest'
import { DataState } from '../DataState'
import { PageHeader } from '../PageHeader'
import { useDeleteRecord } from '../useDeleteRecord'
import { DataTable } from './DataTable'
import { FilterChips } from './FilterChips'
import { ListFilters } from './ListFilters'
import { ListSkeleton } from './ListSkeleton'
import { Pagination } from './Pagination'
import { RowActions } from './RowActions'
import { SearchInput } from './SearchInput'
import { isListFocusSearch, type useListState } from './listState'

/** The parts of a generated list query (`useListPersons(...)`) the list reads. */
export interface ListQuery<T extends AnyRecord> {
  data?: { content?: T[]; page?: { totalElements?: number; totalPages?: number } }
  isPending: boolean
  isError: boolean
  isPlaceholderData: boolean
  refetch: () => unknown
}

interface ResourceListProps<T extends AnyRecord> {
  resource: Resource
  /** `useListState(resource, List<Resource>sQueryParams)`. */
  list: ReturnType<typeof useListState>
  /** The generated list hook called with `list.apiParams` and `placeholderData: keepPreviousData`. */
  query: ListQuery<T>
  /** Allowed values of each select filter, from the generated model (e.g. `Object.values(ListPersonsStatus)`). */
  filterValues?: Record<string, readonly string[]>
  /** Deletes a record from the row menu (the generated delete mutation). */
  remove: (record: T) => Promise<unknown>
  /** Updates the query cache after a delete: remove the record's detail query, invalidate the lists. */
  onDeleted: (record: T) => void
}

/**
 * A resource's list page: header with "New" (writers), and one card holding the toolbar (search, filters, record
 * count, active-filter chips), the table or cards with a row menu (writers), the four data states and paging.
 */
export function ResourceList<T extends AnyRecord>({
  resource,
  list,
  query,
  filterValues,
  remove,
  onDeleted,
}: ResourceListProps<T>) {
  const { t } = useTranslation()
  const format = useFormat()
  const roles = useRoles()
  const writer = canWrite(roles, resource)
  const { state, setPage, setSize, setSort, setQuery, setFilter, clearFilters, clampPage } = list
  const toolbarRef = useRef<HTMLDivElement>(null)
  const rows = query.data?.content ?? []
  const page = query.data?.page
  const total = page?.totalElements ?? 0
  const totalPages = page?.totalPages ?? 0
  const filtered = Object.keys(state.filters).length > 0

  useEffect(() => clampPage(totalPages), [clampPage, totalPages])

  // Empty-state actions disappear with the state they clear: keep keyboard focus in the toolbar (the search box).
  const focusSearch = () => toolbarRef.current?.querySelector<HTMLElement>('input[type=search]')?.focus()
  // Arriving from a deleted record's detail page: focus the search box, not the page body. The state is cleared, so a
  // reload or Back does not move focus again.
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (!isListFocusSearch(location.state)) return
    focusSearch()
    void navigate({ search: location.search, hash: location.hash }, { replace: true, state: null })
    // On arrival only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Deleting the last row removes the menu that opened the dialog: focus goes to the search box.
  const deletion = useDeleteRecord<T>({ resource, remove, onDeleted, fallbackFocus: focusSearch })
  const newButton = (
    <Button asChild>
      <Link to={`${resource.route}/new`}>
        <Plus aria-hidden />
        {t('common.actions.new')}
      </Link>
    </Button>
  )
  const empty = filtered
    ? {
        icon: FilterX,
        title: t('common.list.noFilterResultsTitle'),
        description: t('common.list.noFilterResultsText'),
        action: (
          <Button
            variant="outline"
            onClick={() => {
              clearFilters()
              focusSearch()
            }}
          >
            {t('common.list.clearFilters')}
          </Button>
        ),
      }
    : state.q
      ? {
          icon: SearchX,
          title: t('common.list.noResultsTitle'),
          description: t('common.list.noResultsText', { q: state.q }),
          action: (
            <Button
              variant="outline"
              onClick={() => {
                setQuery('')
                focusSearch()
              }}
            >
              {t('common.list.clearSearch')}
            </Button>
          ),
        }
      : {
          title: tDynamic(t, `${resource.key}.empty`),
          description: t('common.states.emptyText'),
          action: writer && newButton,
        }

  return (
    <>
      <PageHeader title={tDynamic(t, `${resource.key}.title`)} actions={writer && newButton} />
      <Card className="gap-0 overflow-hidden py-0">
        <div ref={toolbarRef} className="flex flex-col gap-3 border-b px-4 py-3 md:px-6 md:py-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 md:flex-none md:basis-80">
              <SearchInput value={state.q} onChange={setQuery} />
            </div>
            {query.data && (
              <p className="sr-only self-center text-sm text-muted-foreground md:not-sr-only md:ml-auto" aria-live="polite">
                {t('common.list.count', { count: total, formatted: format.number(total) })}
              </p>
            )}
            <ListFilters
              resource={resource}
              values={state.filters}
              onChange={setFilter}
              onClear={clearFilters}
              enumValues={filterValues}
            />
          </div>
          <FilterChips
            resource={resource}
            values={state.filters}
            onRemove={(param) => setFilter(param, '')}
            onEmpty={focusSearch}
          />
        </div>
        <DataState
          isLoading={query.isPending}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          isEmpty={total === 0}
          loading={<ListSkeleton columns={Math.min(resource.list.columns.length, 6)} />}
          empty={empty}
        >
          <div className="transition-opacity aria-busy:opacity-60" aria-busy={query.isPlaceholderData}>
            <DataTable
              resource={resource}
              rows={rows}
              sort={state.sort}
              onSortChange={setSort}
              getRowHref={(row) => `${resource.route}/${row.id}`}
              rowActions={
                writer
                  ? (row) => (
                      <RowActions
                        name={formatDisplay(resource.display, row)}
                        href={`${resource.route}/${row.id}`}
                        editHref={`${resource.route}/${row.id}/edit`}
                        onDelete={() => deletion.request(row)}
                      />
                    )
                  : undefined
              }
            />
            <div className="border-t px-4 py-3 md:px-6">
              <Pagination
                page={state.page}
                size={state.size}
                pageSizes={resource.list.pageSizes}
                totalElements={total}
                totalPages={totalPages}
                onPageChange={setPage}
                onSizeChange={setSize}
              />
            </div>
          </div>
        </DataState>
      </Card>
      {deletion.dialog}
    </>
  )
}
