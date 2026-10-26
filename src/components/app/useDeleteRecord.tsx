import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isApiError } from '@/api/fetcher'
import type { AnyRecord } from '@/api/sources'
import { formatDisplay, type Resource } from '@/manifest'
import { ConfirmDialog } from './ConfirmDialog'
import { toastDeleteError } from './deleteError'

export interface DeleteOptions<T extends AnyRecord> {
  resource: Resource
  /** Deletes the record (the generated delete mutation, e.g. `(p) => remove.mutateAsync({ id: p.id })`). */
  remove: (record: T) => Promise<unknown>
  /** Updates the query cache after a delete (remove the detail query, invalidate the lists). */
  onDeleted: (record: T) => void
}

/**
 * Delete with confirmation: `request(record)` opens a dialog naming the record; on success (or a 404: someone else
 * already deleted it, the outcome the user wanted) the cache is updated and a toast shown; a failure toasts why
 * (`toastDeleteError`). Render `dialog` once.
 */
export function useDeleteRecord<T extends AnyRecord>({ resource, remove, onDeleted }: DeleteOptions<T>) {
  const { t } = useTranslation()
  // The record stays set while the dialog animates out, so its title keeps the name.
  const [record, setRecord] = useState<T>()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const name = record ? formatDisplay(resource.display, record) : ''

  const confirm = async () => {
    if (!record) return
    setPending(true)
    try {
      await remove(record)
      deleted(record)
    } catch (error) {
      if (isApiError(error) && error.status === 404) deleted(record)
      else toastDeleteError(t, error, name)
    } finally {
      setPending(false)
      setOpen(false)
    }
  }
  const deleted = (target: T) => {
    onDeleted(target)
    toast.success(t('common.toast.deleted', { name: formatDisplay(resource.display, target) }))
  }

  const dialog = (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title={t('common.delete.title', { name })}
      description={t('common.delete.text')}
      confirmLabel={t('common.actions.delete')}
      destructive
      pending={pending}
      onConfirm={() => void confirm()}
    />
  )

  const request = (target: T) => {
    setRecord(target)
    setOpen(true)
  }
  return { request, dialog }
}
