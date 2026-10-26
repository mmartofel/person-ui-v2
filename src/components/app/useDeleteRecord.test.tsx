import { render, screen } from '@testing-library/react'
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

  it('says when the record is still in use', async () => {
    const inUse = new ApiError(409, 'Conflict', undefined, [{ field: 'id', code: 'in-use', message: 'in use' }])
    const { onDeleted } = await confirmDelete(() => Promise.reject(inUse))
    expect(onDeleted).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Anna Nowak is still used by other records and was not deleted.')
  })
})
