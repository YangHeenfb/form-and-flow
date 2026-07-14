import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const readyExplorerRoutes = [
  '/modules/matrix/transformations',
  '/modules/calculus/derivative',
  '/modules/calculus/integral',
  '/modules/calculus/fundamental-theorem',
  '/modules/calculus/taylor',
  '/modules/fourier/spectrum',
  '/modules/fourier/reconstruction',
  '/modules/fourier/filtering',
  '/modules/differential-equations/slope-fields',
  '/modules/differential-equations/numerical-methods',
  '/modules/differential-equations/phase-portraits',
  '/modules/differential-equations/pendulum',
  '/modules/differential-equations/population',
  '/modules/differential-equations/heat-equation',
  '/modules/probability/conditional-probability',
  '/modules/probability/bayes',
  '/modules/probability/medical-test',
  '/modules/probability/binomial',
  '/modules/probability/continuous-density',
  '/modules/probability/central-limit-theorem',
  '/modules/probability/random-variable-sum',
  '/modules/convolution/discrete',
  '/modules/convolution/probability',
  '/modules/convolution/signal',
  '/modules/convolution/image-kernel',
  '/modules/convolution/polynomial',
  '/modules/convolution/continuous',
] as const

const representativeRoutes = [
  '/modules',
  '/modules/matrix/transformations',
  '/modules/calculus/derivative',
  '/modules/fourier/spectrum',
  '/modules/differential-equations/slope-fields',
  '/modules/probability/conditional-probability',
  '/modules/convolution/discrete',
] as const

function collectRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

test.describe('ready explorers', () => {
  for (const route of readyExplorerRoutes) {
    test(`${route} renders without runtime or accessibility errors`, async ({ page }) => {
      const errors = collectRuntimeErrors(page)
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(route)
      await expect(page.locator('.platform-shell')).toBeVisible()
      await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
      await expectNoHorizontalOverflow(page)

      const accessibility = await new AxeBuilder({ page }).analyze()
      const blocking = accessibility.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
      expect(errors).toEqual([])
    })
  }
})

for (const width of [375, 390, 768, 1280]) {
  test.describe(`${width}px layout`, () => {
    for (const route of representativeRoutes) {
      test(`${route} has no viewport overflow`, async ({ page }) => {
        const errors = collectRuntimeErrors(page)
        await page.setViewportSize({ width, height: 900 })
        await page.goto(route)
        await expect(page.locator('.platform-shell')).toBeVisible()
        await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
        await expectNoHorizontalOverflow(page)
        expect(errors).toEqual([])
      })
    }
  })
}

test('mobile primary controls meet the 44px touch target', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 })
  await page.goto('/modules/differential-equations/slope-fields')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
  const undersized = await page.locator('button:visible, a.platform-brand:visible, .platform-sidebar a:visible, input:visible, .select-menu-trigger:visible').evaluateAll((elements) =>
    elements
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return { name: element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName, width: rect.width, height: rect.height }
      })
      .filter(({ width, height }) => width < 44 || height < 44),
  )
  expect(undersized, JSON.stringify(undersized, null, 2)).toEqual([])
})

test('Matrix 2D does not request the Three.js vendor chunk', async ({ page }) => {
  const scripts: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url())
  })
  await page.goto('/modules/matrix/transformations')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
  expect(scripts.some((url) => /vendor-three/i.test(url))).toBe(false)
})
