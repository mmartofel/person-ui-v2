import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { ApiError } from '@/api/fetcher'
import { fixtureResource } from '@/test/fixtures'
import { useDeleteRecord } from './useDeleteRecord'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const persons = fixtureResource('persons')
const anna = { id: 7, firstName: 'Anna', lastName: 'Nowak' }

function Harness({ remove, onDeleted }: { remove: () => Promise<unknown>; onDeleted: () => void }) {
  const deletion = useDeleteRecord({ resource: persons, remove, onDeleted })
  return (
    <>
      <button type="button" onClick={() => deletion.request(anna)}>
        Open
      </button>
      {deletion.dialog}
    </>
  )
}

async function confirmDelete(remove: () => Promise<unknown>) {
  const onDeleted = vi.fn()
  render(<Harness remove={remove} onDeleted={onDeleted} />)
  await userEvent.click(screen.getByRole('button', { name: 'Open' }))
  const dialog = screen.getByRole('alertdialog', { name: 'Delete Anna Nowak?' })
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
  return { onDeleted, dialog }
}

describe('useDeleteRecord', () => {
  beforeEach(() => vi.clearAllMocks())

  it('asks first, then deletes, updates the cache and toasts', async () => {
    const { onDeleted } = await confirmDelete(async () => {})
    expect(onDeleted).toHaveBeenCalledWith(anna)
    expect(toast.success).toHaveBeenCalledWith('Anna Nowak was deleted.')
  })

  it('treats a 404 as deleted', async () => {
    const { onDeleted } = await confirmDelete(() => Promise.reject(new ApiError(404, 'Not Found')))
    expect(onDeleted).toHaveBeenCalled()
  })

  it('focuses the fallback when the control that opened the dialog is gone', async () => {
    function Row() {
      const [shown, setShown] = useState(true)
      const deletion = useDeleteRecord({
        resource: persons,
        remove: async () => {},
        onDeleted: () => setShown(false),
        fallbackFocus: () => screen.getByRole('searchbox').focus(),
      })
      return (
        <>
          <input type="search" aria-label="Search" />
          {shown && (
            <button type="button" onClick={() => deletion.request(anna)}>
              Open
            </button>
          )}
          {deletion.dialog}
        </>
      )
    }
    render(<Row />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.getByRole('searchbox')).toHaveFocus())
  })

  it('says when the record is still in use', async () => {
    const inUse = new ApiError(409, 'Conflict', undefined, [{ field: 'id', code: 'in-use', message: 'in use' }])
    const { onDeleted } = await confirmDelete(() => Promise.reject(inUse))
    expect(onDeleted).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Anna Nowak is still used by other records and was not deleted.')
  })
})
