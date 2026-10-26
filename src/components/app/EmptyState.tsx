import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  /** One line under the title. */
  description?: ReactNode
  /** The next step, e.g. "New" for writers on an empty list, "Clear filters", "Retry". */
  action?: ReactNode
  /** `destructive` for errors. */
  tone?: 'muted' | 'destructive'
  /** Less padding and a smaller icon, inside a small card (a related list). */
  compact?: boolean
}

/** An empty or error state: an icon in a soft circle, a title, one line of text and an optional action. */
export function EmptyState({ icon: Icon, title, description, action, tone = 'muted', compact }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-4 text-center', compact ? 'py-2' : 'py-10')}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full [&_svg]:size-1/2',
          compact ? 'size-9' : 'size-12',
          tone === 'destructive' ? 'bg-destructive/12 text-destructive' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon aria-hidden />
      </div>
      <div className="flex max-w-prose flex-col gap-1">
        <p className={compact ? 'text-sm font-medium' : 'text-section-title'}>{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
