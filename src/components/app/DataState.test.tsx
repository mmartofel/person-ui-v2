import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataState } from './DataState'

describe('DataState', () => {
  it('shows a loading status', () => {
    render(<DataState isLoading isError={false}>data</DataState>)
    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
    expect(screen.queryByText('data')).not.toBeInTheDocument()
  })

  it('shows an error with a working retry button', async () => {
    const onRetry = vi.fn()
    render(<DataState isLoading={false} isError onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load data')
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('shows the empty message', () => {
    render(<DataState isLoading={false} isError={false} isEmpty />)
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()
  })

  it('shows an empty state with its own title, text and action', () => {
    render(
      <DataState isLoading={false} isError={false} isEmpty empty={{ title: 'No persons yet.', description: 'Add one.', action: <button type="button">New</button> }} />,
    )
    expect(screen.getByText('No persons yet.')).toBeInTheDocument()
    expect(screen.getByText('Add one.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument()
  })

  it('shows the data', () => {
    render(<DataState isLoading={false} isError={false}>data</DataState>)
    expect(screen.getByText('data')).toBeInTheDocument()
  })
})
