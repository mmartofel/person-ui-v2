import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { FlexRender, rowSortingFeature, tableFeatures, useTable, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fieldLabelKey, tDynamic } from '@/i18n/dynamic'
import { cn } from '@/lib/utils'
import { formatDisplay, getPath, isNumeric, type ColumnManifest, type Resource } from '@/manifest'
import { renderFieldValue } from '../formatValue'
import type { ListState } from './listState'

const features = tableFeatures({
  rowSortingFeature,
  columnMeta: {} as { mobile: ColumnManifest['mobile'] },
})

type Row = object

interface DataTableProps<T extends Row> {
  resource: Resource
  rows: T[]
  sort: ListState['sort']
  onSortChange: (sort: ListState['sort']) => void
  /** Detail URL of a row; the first column links to it. */
  getRowHref: (row: T) => string
  /** A row's actions menu (`RowActions`), only for users who may write; the last column, and beside each card. */
  rowActions?: (row: T) => ReactNode
}

/**
 * A manifest-driven list: a sortable table from `md`, a list of cards below it. Sorting and paging are done by the
 * API. It fills a `Card` edge to edge (`ResourceList`): the table's first and last cells line up with the card's padding.
 */
export function DataTable<T extends Row>({ resource, rows, sort, onSortChange, getRowHref, rowActions }: DataTableProps<T>) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const language = i18n.resolvedLanguage ?? i18n.language

  const columns = useMemo<ColumnDef<typeof features, T>[]>(
    () =>
      resource.list.columns.map((column) => ({
        id: column.field,
        accessorFn: (row: T) => getPath(row, column.field),
        header: tDynamic(t, fieldLabelKey(resource.key, column.field)),
        cell: (ctx) =>
          renderFieldValue(resource, column.field, ctx.getValue(), t, language) || (
            <>
              <span aria-hidden className="text-muted-foreground">
                —
              </span>
              <span className="sr-only">{t('common.detail.empty')}</span>
            </>
          ),
        enableSorting: !!column.sortable,
        meta: { mobile: column.mobile },
      })),
    [resource, t, language],
  )

  const sorting: SortingState = [{ id: sort.field, desc: sort.direction === 'desc' }]
  const table = useTable({
    features,
    columns,
    data: rows,
    state: { sorting },
    manualSorting: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      if (next[0]) onSortChange({ field: next[0].id, direction: next[0].desc ? 'desc' : 'asc' })
    },
  })

  const { frameRef, overflow } = useHorizontalOverflow()
  const subtitleFields = resource.list.columns.filter((c) => c.mobile === 'subtitle').map((c) => c.field)
  const linkColumn = resource.list.columns[0]?.field
  const subtitle = (row: T) =>
    subtitleFields
      // The card is a link: no links inside it.
      .map((field) => ({ field, value: renderFieldValue(resource, field, getPath(row, field), t, language, { link: false }) }))
      .filter(({ value }) => value)

  return (
    <>
      <div ref={frameRef} className="relative hidden md:block">
        <ScrollHint side="left" visible={overflow.left} />
        {/* With row actions the fade sits left of their sticky column (w-16). */}
        <ScrollHint side="right" visible={overflow.right} className={rowActions ? 'right-16' : undefined} />
        {/* The frame scrolls both ways, so the header can stick to its top; it fits the viewport below the app header. */}
        <Table
          containerClassName="max-h-[calc(100dvh-10rem)] overflow-y-auto"
          className="[&_td:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:first-child]:pl-6 [&_th:last-child]:pr-6"
        >
          <TableHeader className="sticky top-0 z-20 bg-card [&_tr]:border-b-0">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const label = tDynamic(t, fieldLabelKey(resource.key, header.column.id))
                  const numeric = isNumeric(resource, header.column.id)
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                      // A sticky header loses collapsed borders on scroll: the bottom line is an inset shadow.
                      className={cn(
                        'text-muted-foreground shadow-[inset_0_-1px_0_var(--color-border)]',
                        numeric && 'text-right',
                      )}
                    >
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'inline-flex h-9 items-center gap-1 rounded-md px-2 font-medium hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none',
                            numeric ? '-mr-2 flex-row-reverse' : '-ml-2',
                          )}
                        >
                          {label}
                          {sorted === 'asc' ? (
                            <ArrowUp className="size-4" aria-hidden />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="size-4" aria-hidden />
                          ) : (
                            <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden />
                          )}
                          {sorted && (
                            <span className="sr-only">
                              {sorted === 'asc' ? t('common.list.sortedAsc') : t('common.list.sortedDesc')}
                            </span>
                          )}
                        </button>
                      ) : (
                        label
                      )}
                    </TableHead>
                  )
                })}
                {rowActions && (
                  // Sticky on the right, so the menu stays reachable when the table scrolls sideways.
                  <TableHead className="sticky right-0 w-16 min-w-16 bg-card shadow-[inset_0_-1px_0_var(--color-border),inset_1px_0_0_var(--color-border)]">
                    <span className="sr-only">{t('common.list.actions')}</span>
                  </TableHead>
                )}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const href = getRowHref(row.original)
              return (
                <TableRow
                  key={row.id}
                  className="group cursor-pointer hover:bg-accent"
                  onClick={(event) => {
                    // Clicks on the link itself, the actions menu (or with modifier keys) are handled by them.
                    const target = event.target as HTMLElement
                    if (target.closest('a, button, [role=menu]') || event.metaKey || event.ctrlKey) return
                    navigate(href)
                  }}
                >
                  {row.getAllCells().map((cell) => (
                    // The link column holds free text (a title can be long): it wraps instead of widening the table.
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.id === linkColumn && 'max-w-96 min-w-48 whitespace-normal break-words',
                        isNumeric(resource, cell.column.id) && 'text-right',
                      )}
                    >
                      {cell.column.id === linkColumn ? (
                        <Link
                          to={href}
                          className="rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-[3px] focus-visible:ring-ring"
                        >
                          <FlexRender cell={cell} />
                        </Link>
                      ) : (
                        <FlexRender cell={cell} />
                      )}
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell className="sticky right-0 z-10 w-16 min-w-16 bg-card py-1 text-right shadow-[inset_1px_0_0_var(--color-border)] group-hover:bg-accent">
                      {rowActions(row.original)}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y md:hidden">
        {rows.map((row) => (
          // The title link covers the whole row (a stretched link); the actions button sits above it, not inside.
          <li key={getRowHref(row)} className="relative flex items-start gap-2 px-4 py-3 hover:bg-accent">
            <div className="min-w-0 flex-1">
              <Link
                to={getRowHref(row)}
                className="font-medium break-words outline-none after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-ring focus-visible:after:ring-inset"
              >
                {formatDisplay(resource.display, row)}
              </Link>
              {subtitleFields.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm break-words text-muted-foreground">
                  {subtitle(row).map(({ field, value }) => (
                    <span key={field} className="min-w-0">
                      {value}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {rowActions && <div className="relative -my-2 -mr-2">{rowActions(row)}</div>}
          </li>
        ))}
      </ul>
    </>
  )
}

/**
 * Which sides of the table's scroll container (`ui/table`) have more columns to scroll to. A table wider than the
 * screen scrolls inside its frame, and the fades below show that columns are out of view.
 */
function useHorizontalOverflow() {
  const frameRef = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState({ left: false, right: false })

  useEffect(() => {
    const scroller = frameRef.current?.querySelector<HTMLElement>('[data-slot=table-container]')
    if (!scroller || typeof ResizeObserver === 'undefined') return
    const update = () => {
      // When the table fits, scrollLeft may still hold an old value until the browser clamps it.
      const overflows = scroller.scrollWidth - scroller.clientWidth > 1
      const left = overflows && scroller.scrollLeft > 0
      const right = overflows && scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1
      setOverflow((prev) => (prev.left === left && prev.right === right ? prev : { left, right }))
    }
    // The observer also reports the first size, and rows changing the table's width.
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild)
    scroller.addEventListener('scroll', update, { passive: true })
    return () => {
      observer.disconnect()
      scroller.removeEventListener('scroll', update)
    }
  }, [])

  return { frameRef, overflow }
}

/** A fade over the edge of the table where more columns are out of view; decorative, the table still scrolls. */
function ScrollHint({ side, visible, className }: { side: 'left' | 'right'; visible: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      data-slot="scroll-hint"
      data-side={side}
      className={cn(
        'pointer-events-none absolute inset-y-0 z-30 w-10 from-card to-transparent transition-opacity',
        side === 'right' ? 'right-0 bg-linear-to-l' : 'left-0 bg-linear-to-r',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
    />
  )
}
