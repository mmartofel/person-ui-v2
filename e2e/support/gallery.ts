import { expect, type Page } from '@playwright/test'

// The dev-only component gallery (/__gallery), shared by its functional, accessibility and visual specs.

/** The gallery's sections: element id and heading, in page order (src/gallery/GalleryPage.tsx). */
export const sections = [
  ['tokens', 'Colour tokens'],
  ['typography', 'Typography'],
  ['controls', 'Buttons and badges'],
  ['list', 'List'],
  ['detail', 'Detail'],
  ['form', 'Form'],
  ['states', 'States'],
  ['dialogs', 'Confirm dialog and toasts'],
] as const

export type GalleryTheme = 'light' | 'dark'

/** Opens the gallery in English (and `theme`, else the system theme) and collects console errors. */
export async function openGallery(page: Page, theme?: GalleryTheme): Promise<string[]> {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript((theme) => {
    localStorage.setItem('lang', 'en')
    if (theme) localStorage.setItem('theme', theme)
  }, theme)
  await page.goto('/__gallery')
  await expect(page.getByRole('heading', { level: 1, name: 'Component gallery' })).toBeVisible()
  if (theme) await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /\bdark\b/ : /^(?!.*\bdark\b)/)
  return errors
}
