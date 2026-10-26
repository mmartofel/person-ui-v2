import { Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { sourceOf } from '@/api/sources'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { tDynamic } from '@/i18n/dynamic'
import { cn } from '@/lib/utils'
import { formatDisplay } from '@/manifest'
import { useListHref } from './list/listState'
import type { ResourcePage } from './resourcePage'

interface Crumb {
  key: string
  label: string | null
  /** A link, unless it is the page being shown (`aria-current="page"`). */
  href?: string
}

// 44 px tall below md (touch), text height from md.
const linkClass =
  'flex min-h-11 min-w-0 items-center rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none md:min-h-0'

/**
 * list › record › edit, from the route and the manifest's `display`. The record comes from the same query as the
 * detail or edit page (orval's key in `sources`), so it costs no extra request. Below `md` only the last two crumbs.
 */
export function AppBreadcrumbs({ page }: { page: ResourcePage }) {
  const { t } = useTranslation()
  const { resource, kind, id } = page
  const listHref = useListHref(resource)
  const source = sourceOf(resource.key)
  const record = useQuery({
    queryKey: source.getKey(id ?? 0),
    queryFn: () => source.get(id!),
    enabled: id !== undefined,
  })
  // null while loading (a skeleton); on an error the page explains it and the crumb is left out.
  const name = record.data ? formatDisplay(resource.display, record.data) : null

  const crumbs: Crumb[] = [
    { key: 'list', label: tDynamic(t, `${resource.key}.title`), href: kind === 'list' ? undefined : listHref },
  ]
  if (kind === 'new') crumbs.push({ key: 'new', label: tDynamic(t, `${resource.key}.newTitle`) })
  if (id !== undefined && !record.isError) {
    crumbs.push({ key: 'record', label: name, href: kind === 'edit' ? `${resource.route}/${id}` : undefined })
  }
  if (kind === 'edit') crumbs.push({ key: 'edit', label: t('common.actions.edit') })

  const last = crumbs.length - 1
  return (
    <Breadcrumb aria-label={t('common.nav.breadcrumb')} className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          // Below md: only the last two crumbs (and the separator between them).
          const hidden = (i: number) => i < last - 1
          return (
            <Fragment key={crumb.key}>
              {index > 0 && <BreadcrumbSeparator className={cn(hidden(index - 1) && 'hidden md:block')} />}
              <BreadcrumbItem className={cn('min-w-0', hidden(index) && 'hidden md:inline-flex')}>
                {crumb.label === null ? (
                  <Skeleton className="h-4 w-24" />
                ) : crumb.href === undefined ? (
                  <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className={linkClass}>
                    <Link to={crumb.href}>
                      <span className="truncate">{crumb.label}</span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
