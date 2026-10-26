import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { sourceOf } from '@/api/sources'
import { enumLabelKey, filterLabelKey, tDynamic } from '@/i18n/dynamic'
import { formatDate } from '@/i18n/format'
import { countryName } from '@/lib/countries'
import { formatDisplay, getResource, type FilterManifest, type Resource } from '@/manifest'

interface FilterChipsProps {
  resource: Resource
  /** The set filters, by query param (from `useListState`). */
  values: Record<string, string>
  /** Clears one filter. */
  onRemove: (param: string) => void
  /** Focused when the last chip is removed (the search box). */
  onEmpty?: () => void
}

/** The active filters as removable chips ("Status: Available ×"), in manifest order. */
export function FilterChips({ resource, values, onRemove, onEmpty }: FilterChipsProps) {
  const { t } = useTranslation()
  const listRef = useRef<HTMLUListElement>(null)
  const active = (resource.list.filters ?? []).filter(({ param }) => values[param])
  if (active.length === 0) return null

  // The removed chip disappears: keep keyboard focus on the next chip, else the previous one, else `onEmpty`.
  const remove = (index: number, param: string) => {
    const chips = [...(listRef.current?.querySelectorAll('button') ?? [])]
    const next = chips[index + 1] ?? chips[index - 1]
    onRemove(param)
    if (next) next.focus()
    else onEmpty?.()
  }

  return (
    <ul ref={listRef} aria-label={t('common.list.activeFilters')} className="flex flex-wrap gap-2">
      {active.map((filter, index) => (
        <li key={filter.param}>
          <FilterChip resource={resource} filter={filter} value={values[filter.param]} onRemove={() => remove(index, filter.param)} />
        </li>
      ))}
    </ul>
  )
}

function FilterChip({
  resource,
  filter,
  value,
  onRemove,
}: {
  resource: Resource
  filter: FilterManifest
  value: string
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const label = tDynamic(t, filterLabelKey(resource.key, filter.param))
  const text = useFilterValueText(filter, value)
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={t('common.list.removeFilter', { label, value: text })}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border bg-secondary py-1 pr-2 pl-3 text-sm text-secondary-foreground outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring md:min-h-8"
    >
      <span className="text-muted-foreground">{label}:</span>
      <span className="max-w-48 truncate font-medium">{text}</span>
      <X className="size-4 text-muted-foreground" aria-hidden />
    </button>
  )
}

/** A filter value as the filter input shows it: enum label, date, country name or the related record's name. */
function useFilterValueText(filter: FilterManifest, value: string): string {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const related = filter.input === 'relation' && filter.resource ? filter.resource : undefined
  // The same query as RelationSelect's selected label, so both share the cache.
  const record = useQuery({
    queryKey: related ? [...sourceOf(related).listKey({}), 'label', value] : ['filter-chip', value],
    queryFn: () => sourceOf(related!).get(Number(value)),
    enabled: !!related,
  })
  if (related) {
    if (record.data) return formatDisplay(getResource(related).display, record.data)
    return record.isError ? t('common.form.unknownRecord') : t('common.form.loadingRecords')
  }
  if (filter.input === 'date') return formatDate(value, language)
  if (filter.input === 'country') return countryName(value, language)
  return filter.enum ? tDynamic(t, enumLabelKey(filter.enum, value)) : value
}
