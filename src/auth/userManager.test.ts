// The OIDC client is created on first use, so `@/auth` can be imported without the OIDC variables (the gallery).
afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

test('importing the module needs no OIDC variables; first use names the missing one', async () => {
  vi.stubEnv('VITE_OIDC_AUTHORITY', '')
  vi.resetModules()

  const { getUserManager } = await import('./userManager')

  expect(() => getUserManager()).toThrow(/VITE_OIDC_AUTHORITY is not set/)
})

test('returns one client', async () => {
  vi.stubEnv('VITE_OIDC_AUTHORITY', 'http://localhost:8080/realms/test')
  vi.stubEnv('VITE_OIDC_CLIENT_ID', 'test-ui')
  vi.resetModules()

  const { getUserManager } = await import('./userManager')

  expect(getUserManager()).toBe(getUserManager())
  expect(getUserManager().settings.client_id).toBe('test-ui')
})
