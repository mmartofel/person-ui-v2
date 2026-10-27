import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { apiStatusSource, type ApiStatus } from '@/api/status'
import { AppFooter, ApiStatusIndicator } from './AppFooter'

const originalCheck = apiStatusSource.check
afterEach(() => {
  apiStatusSource.check = originalCheck
})

function renderFooter(status: ApiStatus) {
  apiStatusSource.check = async () => status
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AppFooter />
    </QueryClientProvider>,
  )
}

describe('AppFooter', () => {
  it('shows the blueprint release, the running API version and its status', async () => {
    renderFooter({ state: 'available', version: '3.5.0', versionSource: 'api' })

    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent(`Blueprint version used to generate UI: ${__BLUEPRINT_VERSION__}`)
    expect(await screen.findByRole('button', { name: 'API status: Available' })).toBeInTheDocument()
    expect(footer).toHaveTextContent('API version connected: 3.5.0')
  })

  it('marks a version taken from the contract', async () => {
    renderFooter({ state: 'available', version: '3.4.2', versionSource: 'contract' })
    expect(await screen.findByText('API version connected: 3.4.2 (contract)')).toBeInTheDocument()
  })
})

describe('ApiStatusIndicator', () => {
  it('names the state and opens the problem in its details', async () => {
    render(<ApiStatusIndicator status={{ state: 'degraded', problem: { key: 'down', detail: 'db: DOWN' } }} checkedAt={Date.now()} />)

    await userEvent.click(screen.getByRole('button', { name: 'API status: Degraded' }))
    expect(await screen.findByRole('dialog', { name: 'API status' })).toHaveTextContent('Not working: db: DOWN.')
    expect(screen.getByText('Not reported by the API')).toBeInTheDocument()
  })

  it('shows that the first check is still running', () => {
    render(<ApiStatusIndicator />)
    expect(screen.getByRole('button', { name: 'API status: Checking…' })).toBeInTheDocument()
  })
})
