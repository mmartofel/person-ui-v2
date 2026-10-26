import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { DataTable } from './DataTable'
import { fixtureResource } from '@/test/fixtures'

const persons = fixtureResource('persons')
const rows = [
  {
    id: 7,
    firstName: 'Anna',
    lastName: 'Nowak',
    email: 'anna@example.com',
    birthDate: '1990-01-01',
    status: 'UNAVAILABLE',
    address: { city: 'Kraków', countryCode: 'PL' },
  },
]

function renderTable(onSortChange = vi.fn()) {
  render(
    <MemoryRouter>
      <DataTable
        resource={persons}
        rows={rows}
        sort={{ field: 'lastName', direction: 'asc' }}
        onSortChange={onSortChange}
        getRowHref={(row) => `/persons/${row.id}`}
      />
    </MemoryRouter>,
  )
  return onSortChange
}

describe('DataTable', () => {
  it('renders manifest columns with formatted values and marks the sorted column', () => {
    renderTable()
    const table = screen.getByRole('table')
    expect(within(table).getByRole('columnheader', { name: /Last name/ })).toHaveAttribute('aria-sort', 'ascending')
    expect(within(table).getByText('Jan 1, 1990')).toBeInTheDocument()
    expect(within(table).getByText('Unavailable')).toHaveAttribute('data-variant', 'secondary')
    expect(within(table).getByRole('columnheader', { name: /City/ })).toBeInTheDocument()
    // Status comes right after the names, so it stays in view when the table scrolls.
    expect(within(table).getAllByRole('columnheader')[2]).toHaveTextContent('Status')
    expect(within(table).getByText('Kraków')).toBeInTheDocument()
    expect(within(table).getByRole('link', { name: 'Nowak' })).toHaveAttribute('href', '/persons/7')
  })

  it('toggles the direction of the sorted column and sorts another column ascending', async () => {
    const onSortChange = renderTable()
    await userEvent.click(screen.getByRole('button', { name: /Last name/ }))
    expect(onSortChange).toHaveBeenLastCalledWith({ field: 'lastName', direction: 'desc' })
    await userEvent.click(screen.getByRole('button', { name: /^Email/ }))
    expect(onSortChange).toHaveBeenLastCalledWith({ field: 'email', direction: 'asc' })
  })

  it('renders mobile cards titled by the display template, with the subtitle columns below', () => {
    renderTable()
    const card = screen.getByRole('link', { name: 'Anna Nowak' }).closest('li')!
    expect(card).toHaveTextContent('Anna NowakUnavailableanna@example.com')
    expect(within(card).getByRole('link')).toHaveAttribute('href', '/persons/7')
  })

  it('right-aligns number columns and adds the row actions to the table and each card', () => {
    const tasks = fixtureResource('tasks')
    render(
      <MemoryRouter>
        <DataTable
          resource={{ ...tasks, list: { ...tasks.list, columns: [...tasks.list.columns, { field: 'estimateHours' }] } }}
          rows={[{ id: 1, title: 'Report', done: false, estimateHours: 2.5 }]}
          sort={{ field: 'dueDate', direction: 'asc' }}
          onSortChange={vi.fn()}
          getRowHref={(row) => `/tasks/${row.id}`}
          rowActions={() => <button type="button">Actions</button>}
        />
      </MemoryRouter>,
    )
    const table = screen.getByRole('table')
    expect(within(table).getByText('2.5').closest('td')).toHaveClass('text-right')
    expect(within(table).getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Actions' })).toHaveLength(2)
  })
})
