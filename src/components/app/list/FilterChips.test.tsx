import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { sources } from '@/api/sources'
import { resources } from '@/manifest'
import { fixtureResource, fixtureResources } from '@/test/fixtures'
import { FilterChips } from './FilterChips'

const persons = fixtureResource('persons')
const tasks = fixtureResource('tasks')

beforeAll(() => {
  // The relation chip names the related record by its resource's `display` (getResource).
  resources.push(...fixtureResources.filter((fixture) => !resources.some((r) => r.key === fixture.key)))
  Object.assign(sources, {
    persons: {
      list: async () => ({ content: [] }),
      get: async (id: number) => ({ id, firstName: 'Anna', lastName: 'Nowak' }),
      listKey: (params: Record<string, unknown>) => ['persons', params],
      getKey: (id: number) => ['persons', id],
    },
  })
})

function Chips({ resource, initial }: { resource: typeof persons; initial: Record<string, string> }) {
  const [values, setValues] = useState(initial)
  return (
    <>
      <input type="search" aria-label="Search" />
      <FilterChips
        resource={resource}
        values={values}
        onRemove={(param) => setValues((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => key !== param)))}
        onEmpty={() => screen.getByRole('searchbox').focus()}
      />
    </>
  )
}

function renderChips(resource: typeof persons, initial: Record<string, string>) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Chips resource={resource} initial={initial} />
    </QueryClientProvider>,
  )
}

describe('FilterChips', () => {
  it('names each active filter with its value as the inputs show it', async () => {
    renderChips(persons, { status: 'AVAILABLE', countryCode: 'PL', availableOn: '2026-11-02' })
    expect(screen.getByRole('button', { name: 'Remove filter Status: Available' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove filter Country: Poland' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove filter Available on: Nov 2, 2026' })).toBeInTheDocument()
  })

  it('shows the related record name of a relation filter', async () => {
    renderChips(tasks, { assigneeId: '7' })
    expect(await screen.findByRole('button', { name: /Assignee: Anna Nowak$/ })).toBeInTheDocument()
  })

  it('removes a filter and keeps focus on the next chip, then on the search box', async () => {
    renderChips(persons, { status: 'AVAILABLE', countryCode: 'PL' })
    await userEvent.click(screen.getByRole('button', { name: /Status/ }))
    expect(screen.queryByRole('button', { name: /Status/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Country/ })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: /Country/ }))
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toHaveFocus()
  })
})
