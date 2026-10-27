import { useTranslation } from 'react-i18next'
import { useApiStatus, type ApiState, type ApiStatus } from '@/api/status'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const dotColour: Record<ApiState | 'checking', string> = {
  available: 'bg-success',
  degraded: 'bg-warning',
  unavailable: 'bg-destructive',
  checking: 'bg-muted-foreground',
}

/** The details of an API status: the status, the problem, the running and contract versions, the last check. */
export function ApiStatusDetails({ status, checkedAt }: { status?: ApiStatus; checkedAt?: number }) {
  const { t, i18n } = useTranslation()
  const state = status?.state ?? 'checking'

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">{t('common.footer.statusTerm')}</dt>
      <dd className="flex items-center gap-2 font-medium">
        <span aria-hidden className={cn('size-2 rounded-full', dotColour[state])} />
        {t(`common.footer.status.${state}`)}
      </dd>
      {status?.problem && (
        <>
          <dt className="text-muted-foreground">{t('common.footer.problemTerm')}</dt>
          <dd className="break-words">{t(`common.footer.problem.${status.problem.key}`, { detail: status.problem.detail })}</dd>
        </>
      )}
      <dt className="text-muted-foreground">{t('common.footer.apiVersionTerm')}</dt>
      <dd>{status?.versionSource === 'api' ? status.version : t('common.footer.notReported')}</dd>
      <dt className="text-muted-foreground">{t('common.footer.contractVersionTerm')}</dt>
      <dd>{__CONTRACT_VERSION__ ?? t('common.footer.noContract')}</dd>
      {checkedAt ? (
        <>
          <dt className="text-muted-foreground">{t('common.footer.checkedTerm')}</dt>
          <dd>{new Intl.DateTimeFormat(i18n.language, { timeStyle: 'medium' }).format(checkedAt)}</dd>
        </>
      ) : null}
    </dl>
  )
}

/**
 * The API status as a coloured dot with its name (colour is never the only signal); the button opens the details
 * (`ApiStatusDetails`). Without `status` the first check is still running.
 */
export function ApiStatusIndicator({ status, checkedAt }: { status?: ApiStatus; checkedAt?: number }) {
  const { t } = useTranslation()
  const state = status?.state ?? 'checking'
  const label = t(`common.footer.status.${state}`)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="-mr-3 font-normal text-muted-foreground" aria-label={t('common.footer.statusLabel', { status: label })}>
          <span aria-hidden className={cn('size-2 rounded-full', dotColour[state])} />
          {/* On a span: tailwind-merge does not know text-caption and would keep the button's text-sm. */}
          <span className="text-caption">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-88" aria-label={t('common.footer.statusTerm')}>
        <ApiStatusDetails status={status} checkedAt={checkedAt} />
      </PopoverContent>
    </Popover>
  )
}

/** Below the page: the blueprint release on the left, the API version and status on the right. */
export function AppFooter() {
  const { t } = useTranslation()
  const { data: status, dataUpdatedAt } = useApiStatus()
  const version = status?.version
    ? status.versionSource === 'contract'
      ? t('common.footer.apiContractVersion', { version: status.version })
      : t('common.footer.apiVersion', { version: status.version })
    : t('common.footer.apiVersionUnknown')

  return (
    <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t bg-background px-4 py-1 text-caption text-muted-foreground md:px-6 lg:px-8">
      <span>{t('common.footer.blueprint', { version: __BLUEPRINT_VERSION__ })}</span>
      <div className="ml-auto flex items-center gap-2">
        <span>{version}</span>
        <ApiStatusIndicator status={status} checkedAt={dataUpdatedAt || undefined} />
      </div>
    </footer>
  )
}
