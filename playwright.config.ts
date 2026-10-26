import { defineConfig, devices } from '@playwright/test'

// E2E users and the OIDC authority come from .env.local (see .env.example).
try {
  process.loadEnvFile('.env.local')
} catch {
  // No .env.local: the variables must be set in the environment.
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // In CI and the Docker image the report is only written (CircleCI keeps it as an artifact), never served.
  reporter: process.env.CI || process.env.VISUAL
    ? [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'reports/e2e-junit.xml' }]]
    : 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    // Signs in each demo user once; tests pick a role with `test.use({ storageState: authFile(user) })`.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    // Against the API and the OIDC provider. With resources, the full parallel suite (dev server, API and provider on
    // one machine) is slower than the defaults allow: more time per assertion and per test.
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'], testIgnore: /gallery.*\.spec\.ts/, expect: { timeout: 10_000 }, timeout: 60_000 },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, dependencies: ['setup'], testIgnore: /gallery.*\.spec\.ts/, expect: { timeout: 10_000 }, timeout: 60_000 },
    // The component gallery needs no login or API: `npx playwright test --project=gallery` runs without .env.local
    // (functional and axe specs). Every list or role change re-renders the whole gallery page (about 0.7 s in dev
    // mode), which can pass the default 5 s under the full parallel suite: its assertions get more time.
    {
      name: 'gallery',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /gallery(-a11y)?\.spec\.ts/,
      expect: { timeout: 15_000 },
    },
    // Screenshots of the gallery. Rendering differs per OS, so they run only in the Playwright Docker image
    // (`npm run test:visual`, CI), which sets VISUAL=1; elsewhere they are skipped. Fixed locale, time zone and
    // pixel ratio; the theme and width come from the spec.
    {
      name: 'visual',
      use: { ...devices['Desktop Chrome'], locale: 'en-US', timezoneId: 'UTC', deviceScaleFactor: 1, contextOptions: { reducedMotion: 'reduce' } },
      testMatch: /gallery-visual\.spec\.ts/,
      // Each screenshot waits for two identical captures in a row: slow under the parallel dev-mode suite.
      expect: { timeout: 30_000, toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css' } },
    },
  ],
  // One baseline per screenshot, without the platform suffix: they are only made in the Docker image.
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
