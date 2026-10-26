import { useRef } from 'react'
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface RowActionsProps {
  /** The record's display name, for the button's accessible name. */
  name: string
  href: string
  editHref: string
  onDelete: () => void
}

/** A list row's menu for writers: view, edit, delete (which asks first, see `useDeleteRecord`). */
export function RowActions({ name, href, editHref, onDelete }: RowActionsProps) {
  const { t } = useTranslation()
  const triggerRef = useRef<HTMLButtonElement>(null)
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button ref={triggerRef} variant="ghost" size="icon-sm" aria-label={t('common.actions.more', { name })}>
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem asChild>
          <Link to={href}>
            <Eye aria-hidden />
            {t('common.actions.view')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={editHref}>
            <Pencil aria-hidden />
            {t('common.actions.edit')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            // The confirm dialog returns focus to the element focused when it opens: the trigger, not this item.
            triggerRef.current?.focus()
            onDelete()
          }}
        >
          <Trash2 aria-hidden />
          {t('common.actions.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
