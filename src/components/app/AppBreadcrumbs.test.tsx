import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { sources } from '@/api/sources'
import { fixtureResource } from '@/test/fixtures'
import { AppBreadcrumbs } from './AppBreadcrumbs'
import type { ResourcePage } from './resourcePage'

const persons = fixtureResource('persons')
const anna = { id: 7, firstName: 'Anna', lastName: 'Nowak' }

beforeAll(() => {
  Object.assign(sources, {
    persons: {
      list: async () => ({ content: [] }),
      get: async (id: number) => {
        if (id !== anna.id) throw new Error('not found')
        return anna
      },
      listKey: (params: Record<string, unknown>) => ['persons', params],
      getKey: (id: number) => ['persons', id],
    },
  })
})

function renderCrumbs(page: Omit<ResourcePage, 'resource'>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AppBreadcrumbs page={{ resource: persons, ...page }} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return screen.getByRole('navigation', { name: 'Breadcrumb' })
}

describe('AppBreadcrumbs', () => {
  it('shows the list as the current page', () => {
    const nav = renderCrumbs({ kind: 'list' })
    expect(within(nav).getByText('Persons')).toHaveAttribute('aria-current', 'page')
    expect(within(nav).queryByRole('link')).toBeNull()
  })

  it('names the record by the manifest display and links back to the list and the record', async () => {
    const nav = renderCrumbs({ kind: 'edit', id: 7 })
    expect(await within(nav).findByRole('link', { name: 'Anna Nowak' })).toHaveAttribute('href', '/persons/7')
    expect(within(nav).getByRole('link', { name: 'Persons' })).toHaveAttribute('href', '/persons')
    expect(within(nav).getByText('Edit')).toHaveAttribute('aria-current', 'page')
  })

  it('uses the resource title for a new record', () => {
    const nav = renderCrumbs({ kind: 'new' })
    expect(within(nav).getByText('New person')).toHaveAttribute('aria-current', 'page')
  })

  it('leaves out a record that could not be loaded', async () => {
    const nav = renderCrumbs({ kind: 'detail', id: 99 })
    await vi.waitFor(() => expect(within(nav).getAllByRole('listitem')).toHaveLength(1))
    expect(within(nav).getByRole('link', { name: 'Persons' })).toBeInTheDocument()
  })
})
