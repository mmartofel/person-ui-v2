import type { ReactNode } from 'react'
import { useDocumentTitle } from './useDocumentTitle'

interface PageHeaderProps {
  title: string
  description?: string
  /** A status badge next to the title (the detail's `detail.status`). */
  badge?: ReactNode
  /** Page actions (buttons); they wrap below the title on small screens. */
  actions?: ReactNode
}

export function PageHeader({ title, description, badge, actions }: PageHeaderProps) {
  useDocumentTitle(title)
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-page-title break-words">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
