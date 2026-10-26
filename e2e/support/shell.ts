import type { Page } from '@playwright/test'

// The user menu sits at the bottom of the sidebar; below lg (1024 px) the sidebar is a sheet behind "Open menu".
const isSheet = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024

/** Opens the user menu (opening the navigation sheet first below lg). */
export async function openUserMenu(page: Page) {
  if (isSheet(page)) await page.getByRole('button', { name: /^(Open menu|Otwórz menu)$/ }).click()
  await page.getByRole('button', { name: /(user menu|menu użytkownika)$/i }).click()
}

/**
 * Switches the UI language through the user menu, e.g. `switchLanguage(page, 'Polski')`, and closes the sheet.
 * From lg the languages are a submenu; in the sheet they are listed in the menu itself.
 */
export async function switchLanguage(page: Page, language: string) {
  await openUserMenu(page)
  if (!isSheet(page)) await page.getByRole('menuitem', { name: /^(Language|Język)/ }).click()
  await page.getByRole('menuitemradio', { name: language }).click()
  if (isSheet(page)) await page.getByRole('button', { name: /^(Close menu|Zamknij menu)$/ }).click()
}
