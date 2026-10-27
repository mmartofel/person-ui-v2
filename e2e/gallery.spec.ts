import { expect, test } from '@playwright/test'
import { openGallery, sections } from './support/gallery.ts'

// The dev-only component gallery (/__gallery): no login, no API. Runs in the `gallery` project (playwright.config.ts).

test('renders every section without console errors', async ({ page }) => {
  const errors = await openGallery(page)

  for (const [, name] of sections) await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible()
  await expect(page.locator('#list')).toContainText('Available')
  await expect(page.getByRole('heading', { name: /^Tasks \(\d+\)$/ })).toBeVisible()
  expect(errors).toEqual([])
})

test('the person form shows field errors from the API, then the stale-version dialog', async ({ page }) => {
  await openGallery(page)
  const form = page.locator('form').first()

  await form.getByRole('button', { name: 'Save' }).click()
  await expect(form.getByText('This value is already in use.')).toBeVisible()

  await page.getByLabel('Next save').click()
  await page.getByRole('option', { name: 'Stale version (409)' }).click()
  await form.getByRole('button', { name: 'Save' }).click()
  const dialog = page.getByRole('alertdialog', { name: 'This record was changed' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Reload' }).click()
  await expect(dialog).toBeHidden()
})

test('the reader sees no write actions', async ({ page }) => {
  await openGallery(page)
  const detail = page.locator('#detail')
  const list = page.locator('#list')
  await expect(detail.getByRole('button', { name: 'Delete' }).first()).toBeVisible()
  await expect(list.getByRole('button', { name: /^Actions for / }).first()).toBeVisible()
  // Exact names: a task link such as "Renew the office lease" also contains "New".
  await expect(list.getByRole('link', { name: 'New', exact: true })).toBeVisible()
  await expect(page.locator('#states').getByRole('button', { name: 'New', exact: true })).toBeVisible()

  await page.getByLabel('Role').click()
  await page.getByRole('option', { name: 'Reader (read only)' }).click()

  await expect(detail.getByRole('button', { name: 'Delete' })).toHaveCount(0)
  await expect(list.getByRole('link', { name: 'New', exact: true })).toHaveCount(0)
  await expect(list.getByRole('button', { name: /^Actions for / })).toHaveCount(0)
  await expect(page.locator('#states').getByRole('button', { name: 'New', exact: true })).toHaveCount(0)
})

test('the row menu deletes a record after confirmation; cancel returns focus to the menu', async ({ page }) => {
  await openGallery(page)
  const list = page.locator('#list')
  await expect(list.getByText('24 records')).toBeVisible()
  const menu = list.getByRole('button', { name: 'Actions for Olivia Brown' })

  await menu.click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  const dialog = page.getByRole('alertdialog', { name: 'Delete Olivia Brown?' })
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
  await expect(menu).toBeFocused()

  await menu.click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
  await dialog.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('region', { name: /Notifications/ })).toContainText('Olivia Brown was deleted.')
  await expect(list.getByText('23 records')).toBeVisible()
  await expect(list.getByRole('link', { name: 'Brown' })).toHaveCount(1)
})

test('an active filter shows as a chip that removes it', async ({ page }) => {
  await openGallery(page)
  const list = page.locator('#list')
  await list.getByRole('combobox', { name: 'Status' }).click()
  await page.getByRole('option', { name: 'Unavailable' }).click()
  await expect(list.getByText('8 records')).toBeVisible()

  await list.getByRole('button', { name: 'Remove filter Status: Unavailable' }).click()
  await expect(list.getByText('24 records')).toBeVisible()
  await expect(list.getByRole('combobox', { name: 'Status' })).toHaveText('Any')
  await expect(list.getByRole('searchbox')).toBeFocused()
})

test('the search without results offers to clear it', async ({ page }) => {
  await openGallery(page)
  const list = page.locator('#list')
  await list.getByRole('searchbox').fill('zzz')
  await expect(list.getByText('Nothing matches “zzz”.', { exact: false })).toBeVisible()
  await list.getByRole('button', { name: 'Clear search' }).last().click()
  await expect(list.getByText('24 records')).toBeVisible()
})

test('the detail header shows the status badge; a delete blocked by related records says so', async ({ page }) => {
  await openGallery(page)
  const detail = page.locator('#detail')
  const header = detail.getByRole('heading', { level: 1, name: 'Anna Kowalska' }).locator('..')
  await expect(header.getByText('Available')).toBeVisible()
  await expect(detail.getByRole('heading', { level: 2, name: 'Address' })).toBeVisible()
  await expect(detail.getByRole('heading', { level: 2, name: 'Record information' })).toBeVisible()

  await detail.getByRole('button', { name: 'Delete' }).first().click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('region', { name: /Notifications/ })).toContainText('still used by other records')
})

test('delete asks for confirmation and toasts; the theme switches to dark', async ({ page }) => {
  await openGallery(page)
  const dialogs = page.locator('#dialogs')

  await dialogs.getByRole('button', { name: 'Delete' }).click()
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toContainText('Anna Kowalska')
  await confirm.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('region', { name: /Notifications/ })).toContainText('deleted')

  await page.getByRole('button', { name: /user menu/i }).click()
  await page.getByRole('menuitem', { name: /^Theme/ }).click()
  await page.getByRole('menuitemradio', { name: 'Dark' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('the breadcrumbs name the opened record and lead back to the list', async ({ page }) => {
  await openGallery(page)
  const breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' })
  await expect(breadcrumbs.getByText('Persons')).toHaveAttribute('aria-current', 'page')

  await page.locator('#list').getByRole('link', { name: 'Prepare the quarterly report' }).click()
  await expect(breadcrumbs.getByText('Prepare the quarterly report')).toHaveAttribute('aria-current', 'page')
  await breadcrumbs.getByRole('link', { name: 'Tasks' }).click()
  await expect(breadcrumbs.getByText('Tasks')).toHaveAttribute('aria-current', 'page')
})

test('the sidebar collapses to icons and the active item is marked', async ({ page }) => {
  await openGallery(page)
  const nav = page.getByRole('navigation', { name: 'Main navigation' })
  await expect(nav.getByRole('link', { name: 'Persons' })).toHaveAttribute('aria-current', 'page')

  await page.getByRole('button', { name: 'Collapse navigation' }).click()
  await expect(page.locator('[data-slot=sidebar]')).toHaveAttribute('data-state', 'collapsed')
  await expect(nav.getByRole('link', { name: 'Persons' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('sidebar'))).toBe('collapsed')
})

test('the footer stays in view while the page scrolls; on mobile the form actions sit above it', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await openGallery(page)
  const footer = page.getByRole('contentinfo')
  const save = page.locator('form').first().getByRole('button', { name: 'Save' })

  await save.scrollIntoViewIfNeeded()
  await page.locator('#form').scrollIntoViewIfNeeded()
  await expect(footer).toBeInViewport()
  const footerBox = await footer.boundingBox()
  const saveBox = await save.boundingBox()
  expect(footerBox!.y + footerBox!.height).toBeCloseTo(800, 0)
  expect(saveBox!.y + saveBox!.height).toBeLessThanOrEqual(footerBox!.y)

  await footer.getByRole('button', { name: /^API status: / }).click()
  const details = await page.getByRole('dialog', { name: 'API status' }).boundingBox()
  expect(details!.x).toBeGreaterThanOrEqual(16)
  expect(details!.x + details!.width).toBeLessThanOrEqual(375 - 16)
})

for (const { width, height } of [{ width: 375, height: 420 }, { width: 768, height: 1024 }, { width: 1440, height: 640 }]) {
  test(`at ${width}x${height} a focused form field stays clear of the sticky header, footer and form actions`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await openGallery(page)
    const form = page.locator('form').first()
    await form.getByRole('textbox').first().focus()

    for (let i = 0; i < 30; i++) {
      const hidden = await page.evaluate(() => {
        const focused = document.activeElement as HTMLElement
        if (!focused.closest('form')) return null
        // The whole field: label, control and message.
        const box = (focused.closest('[data-form-field]') ?? focused).getBoundingClientRect()
        const top = document.querySelector('header')!.getBoundingClientRect().bottom
        let bottom = document.querySelector('footer')!.getBoundingClientRect().top
        const actions = focused.closest('form')!.querySelector('[data-form-actions]')!
        if (getComputedStyle(actions).position === 'sticky' && !actions.contains(focused)) bottom = actions.getBoundingClientRect().top
        return box.top < top - 0.5 || box.bottom > bottom + 0.5 ? `${focused.outerHTML.slice(0, 80)} at ${box.top}-${box.bottom}, clear ${top}-${bottom}` : ''
      })
      if (hidden === null) break
      expect(hidden).toBe('')
      await page.keyboard.press('Tab')
    }
  })
}

test('a new page opens at the top; sorting keeps the scroll position', async ({ page }) => {
  await openGallery(page)
  await page.locator('#dialogs').scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0)

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Tasks' }).click()
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)

  const sort = page.locator('#list').getByRole('columnheader').getByRole('button').first()
  await sort.scrollIntoViewIfNeeded()
  const before = await page.evaluate(() => scrollY)
  expect(before).toBeGreaterThan(0)
  await sort.click()
  await expect(page.locator('#list').getByRole('columnheader').first()).toHaveAttribute('aria-sort', /ascending|descending/)
  expect(await page.evaluate(() => scrollY)).toBe(before)
})

for (const width of [375, 1440]) {
  test(`at ${width} px keyboard paging moves view and focus to the top of the list`, async ({ page }) => {
    await page.setViewportSize({ width, height: 700 })
    await openGallery(page)
    const list = page.getByRole('region', { name: 'Persons' })
    const next = list.getByRole('button', { name: 'Next page' })
    await next.focus()
    await page.keyboard.press('Enter')

    await expect(list).toBeFocused()
    await expect(list).toContainText('21–24 of 24')
    const top = await list.evaluate((el) => el.getBoundingClientRect().top)
    expect(top).toBeGreaterThanOrEqual(56 - 1)
    expect(top).toBeLessThan(120)
  })
}

test('the skip link moves focus to the content without a history entry', async ({ page }) => {
  await openGallery(page)
  const entries = await page.evaluate(() => history.length)
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page.locator('#main')).toBeFocused()
  expect(await page.evaluate(() => [location.hash, history.length])).toEqual(['', entries])
})
