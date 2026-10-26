import { test } from '@playwright/test'
import { expectAccessible } from './support/a11y.ts'
import { openGallery, sections } from './support/gallery.ts'
import { openUserMenu } from './support/shell.ts'

// axe on every gallery section, in both themes (contrast differs) and at a width with the table and one with the
// cards. Runs in the `gallery` project: no login or API, also in CI.

for (const width of [1440, 375]) {
  for (const theme of ['light', 'dark'] as const) {
    test.describe(`${width} px, ${theme}`, () => {
      test.use({ viewport: { width, height: 900 } })

      for (const [id, name] of sections) {
        test(`${name} has no serious accessibility violations`, async ({ page }) => {
          await openGallery(page, theme)
          await expectAccessible(page, `#${id}`)
        })
      }

      test('the whole page, app shell included, has no serious accessibility violations', async ({ page }) => {
        await openGallery(page, theme)
        await expectAccessible(page)
      })

      test('the open confirm dialog and user menu have no serious accessibility violations', async ({ page }) => {
        await openGallery(page, theme)
        await page.locator('#dialogs').getByRole('button', { name: 'Delete' }).click()
        await expectAccessible(page, '[role=alertdialog]')
        await page.keyboard.press('Escape')

        await openUserMenu(page)
        await expectAccessible(page, '[role=menu]')
      })
    })
  }
}
