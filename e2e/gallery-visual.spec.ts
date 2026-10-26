import { expect, test } from '@playwright/test'
import { openGallery, sections } from './support/gallery.ts'

// Visual regression of the gallery: every section and the app shell at 375, 768 and 1440 px, light and dark.
// Baselines are made only in the Playwright Docker image (`npm run test:visual:update`, see README "Visual
// regression"), so the spec is skipped elsewhere. Runs in the `visual` project (fixed locale, time zone, pixel ratio).

test.skip(!process.env.VISUAL, 'screenshots run only in the Playwright Docker image: npm run test:visual')

const stylePath = 'e2e/support/visual.css'

for (const width of [375, 768, 1440]) {
  for (const theme of ['light', 'dark'] as const) {
    test.describe(`${width} px, ${theme}`, () => {
      test.use({ viewport: { width, height: 900 } })

      test.beforeEach(async ({ page }) => {
        await openGallery(page, theme)
        // The persons list loads from its in-memory source after the first render; the row menu is in table and cards.
        await expect(page.locator('#list').getByRole('button', { name: 'Actions for Olivia Brown' })).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
      })

      test('app shell', async ({ page }) => {
        await expect(page).toHaveScreenshot(`shell-${width}-${theme}.png`, { stylePath })
      })

      for (const [id, name] of sections) {
        test(name, async ({ page }) => {
          await expect(page.locator(`#${id}`)).toHaveScreenshot(`${id}-${width}-${theme}.png`, { stylePath })
        })
      }
    })
  }
}
