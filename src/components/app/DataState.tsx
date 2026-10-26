import type { ReactNode } from 'react'
import { CircleAlert, Inbox, RotateCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, type EmptyStateProps } from './EmptyState'

interface DataStateProps {
  isLoading: boolean
  isError: boolean
  isEmpty?: boolean
  onRetry?: () => void
  /** Custom skeleton matching the data view; defaults to a few rows. */
  loading?: ReactNode
  /** The empty state: a short message, or an `EmptyState`'s icon, title, text and action. Defaults to `common.states.empty`. */
  empty?: string | Partial<EmptyStateProps>
  children?: ReactNode
}

/** The four states every data view has: loading (skeleton), error (with retry), empty, data. */
export function DataState({ isLoading, isError, isEmpty, onRetry, loading, empty, children }: DataStateProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div role="status" aria-live="polite">
        {loading ?? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        )}
        <span className="sr-only">{t('common.states.loading')}</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div role="alert">
        <EmptyState
          icon={CircleAlert}
          tone="destructive"
          title={t('common.states.errorTitle')}
          description={t('common.states.errorText')}
          action={
            onRetry && (
              <Button variant="outline" onClick={onRetry}>
                <RotateCw aria-hidden />
                {t('common.states.retry')}
              </Button>
            )
          }
        />
      </div>
    )
  }

  if (isEmpty) {
    const props = typeof empty === 'string' ? { title: empty } : empty
    return <EmptyState icon={Inbox} {...props} title={props?.title ?? t('common.states.empty')} />
  }

  return children
}
