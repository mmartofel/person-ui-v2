import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

// Accessibility check with axe: WCAG 2.1 A and AA rules, failing on serious and critical violations only (minor and
// moderate ones are left to the ui-reviewer). Call it on every distinct page or state a test opens.

/** Fails with the rule, impact and elements of every serious or critical axe violation on the page (or `include`). */
export async function expectAccessible(page: Page, include?: string) {
  // A dialog or menu fades in, and its text fails contrast until the animation ends: wait for finite animations
  // (skeleton pulses run forever).
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => {})),
    ),
  )
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  if (include) builder = builder.include(include)
  const { violations } = await builder.analyze()
  const blocking = violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => `${violation.id} (${violation.impact}): ${violation.help}\n  ${violation.nodes.map((node) => node.target.join(' ')).join('\n  ')}`)
  expect(blocking, blocking.join('\n')).toEqual([])
}
