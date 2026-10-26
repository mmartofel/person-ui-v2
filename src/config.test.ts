afterEach(() => {
  delete window.__APP_CONFIG__
  vi.unstubAllEnvs()
  vi.resetModules()
})

test('without /config.js (dev) the values come from .env.local', async () => {
  vi.stubEnv('VITE_OIDC_AUTHORITY', 'http://localhost:8080/realms/dev')
  vi.stubEnv('VITE_OIDC_ROLES_CLAIM', '')
  vi.resetModules()

  const { requireConfig, rolesClaim } = await import('./config')

  expect(requireConfig('OIDC_AUTHORITY')).toBe('http://localhost:8080/realms/dev')
  expect(rolesClaim()).toBe('realm_access.roles')
})

test('the runtime config of the image wins over the build-time values', async () => {
  vi.stubEnv('VITE_OIDC_AUTHORITY', 'http://localhost:8080/realms/dev')
  window.__APP_CONFIG__ = { OIDC_AUTHORITY: 'https://sso.example.com/realms/prod', OIDC_ROLES_CLAIM: 'roles' }
  vi.resetModules()

  const { requireConfig, rolesClaim } = await import('./config')

  expect(requireConfig('OIDC_AUTHORITY')).toBe('https://sso.example.com/realms/prod')
  expect(rolesClaim()).toBe('roles')
})

test('a missing runtime value names the container variable, not the .env.local one', async () => {
  vi.stubEnv('VITE_OIDC_CLIENT_ID', 'dev-ui')
  window.__APP_CONFIG__ = { OIDC_AUTHORITY: 'https://sso.example.com/realms/prod', OIDC_CLIENT_ID: '' }
  vi.resetModules()

  const { requireConfig } = await import('./config')

  expect(() => requireConfig('OIDC_CLIENT_ID')).toThrow(/OIDC_CLIENT_ID is not set in the container environment/)
})
