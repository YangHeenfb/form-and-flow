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

test('mobile navigation uses a dismissible top drawer instead of a persistent rail', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/modules/calculus/derivative')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })

  const trigger = page.locator('.platform-mobile-nav-toggle')
  const navigation = page.locator('#platform-navigation')
  await expect(trigger).toBeVisible()
  await expect(navigation).toBeHidden()

  await trigger.click()
  await expect(navigation).toBeVisible()
  await expect(page.locator('.platform-sidebar-backdrop')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(navigation).toBeHidden()
  await expect(trigger).toBeFocused()

  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([])
})

test('mobile lessons prioritize the graph and progressively disclose parameters and readout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/modules/calculus/derivative')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })

  const graph = page.locator('.calculus-canvas')
  const playback = page.locator('.calculus-playback')
  const parameters = page.locator('.lesson-shell-controls .lesson-mobile-section-toggle')
  const readout = page.locator('.lesson-shell-explanation .lesson-mobile-section-toggle')
  await expect(parameters).toHaveAttribute('aria-expanded', 'false')
  await expect(readout).toHaveAttribute('aria-expanded', 'false')

  const graphBox = await graph.boundingBox()
  const playbackBox = await playback.boundingBox()
  const parametersBox = await parameters.boundingBox()
  expect(graphBox && playbackBox && parametersBox).toBeTruthy()
  expect(graphBox!.y).toBeLessThan(playbackBox!.y)
  expect(playbackBox!.y).toBeLessThan(parametersBox!.y)

  await parameters.click()
  await expect(parameters).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.lesson-shell-controls .lesson-mobile-section-content')).toBeVisible()
})

test('Matrix mobile workbench keeps controls collapsed below visualization and transport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/modules/matrix/transformations')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })

  const controls = page.locator('.visualization-standard-left .visualization-mobile-section-toggle')
  const readout = page.locator('.visualization-standard-right .visualization-mobile-section-toggle')
  await expect(controls).toHaveAttribute('aria-expanded', 'false')
  await expect(readout).toHaveAttribute('aria-expanded', 'false')
  await controls.click()
  await expect(page.locator('.visualization-standard-left .visualization-mobile-section-content')).toBeVisible()

  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([])
})

test('custom explorer selector supports keyboard focus and selection', async ({ page }) => {
  await page.goto('/modules/calculus/derivative')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
  const trigger = page.locator('.platform-tool-menu .select-menu-trigger')
  await trigger.focus()
  await page.keyboard.press('ArrowDown')
  const selectedOption = page.locator('.platform-tool-menu [role="option"][aria-selected="true"]')
  await expect(selectedOption).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/modules\/calculus\?mode=integral/)
})

test('surface theme updates canvas colors and keeps the stored preference', async ({ page }) => {
  await page.goto('/modules/calculus/derivative')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
  await page.getByRole('button', { name: 'Dark mode' }).click()
  await expect(page.getByRole('button', { name: 'Light mode' })).toBeVisible()

  const background = await page.locator('.calculus-canvas').evaluate((canvas: HTMLCanvasElement) =>
    Array.from(canvas.getContext('2d')!.getImageData(2, 2, 1, 1).data.slice(0, 3)),
  )
  expect(background).toEqual([17, 23, 27])

  await page.reload()
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Light mode' })).toBeVisible()
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
