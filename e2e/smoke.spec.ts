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

async function expectNoVisibleButtonTextOverflow(page: Page) {
  const overflowing = await page.locator('button:visible').evaluateAll((buttons) =>
    buttons
      .filter((button) => !button.classList.contains('select-menu-trigger'))
      .map((button) => ({
        name: button.getAttribute('aria-label') || button.textContent?.trim() || 'button',
        overflow: button.scrollWidth - button.clientWidth,
      }))
      .filter(({ overflow }) => overflow > 1),
  )
  expect(overflowing, JSON.stringify(overflowing, null, 2)).toEqual([])
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

      const isMatrix = route.includes('/matrix/')
      const shell = page.locator(isMatrix ? '.visualization-standard-layout' : '.lesson-shell')
      const stage = page.locator(isMatrix ? '.visualization-center-column' : '.lesson-shell-main')
      const readoutAction = page.locator('.lesson-stage-readout-action')
      const inspector = page.locator(isMatrix ? '.visualization-inspector-header' : '.lesson-inspector-header')
      await expect(page.locator('.visualization-standard-readout-rail, .lesson-standard-readout-rail')).toHaveCount(0)
      await expect(readoutAction).toHaveCount(1)
      await expect(readoutAction).toBeVisible()
      await expect(inspector).toBeVisible()
      await expect(page.locator('.explorer-stage-header')).toBeVisible()
      await expect(page.locator('.lesson-stage-actions')).toBeVisible()
      const actionLabels = await page.locator('.lesson-stage-actions > button:visible').allTextContents()
      expect(actionLabels.map((label) => label.trim())).toEqual(['Visual notes', 'Readout', 'Focus', 'Export PNG'])
      await expect(page.getByRole('button', { name: 'Notes', exact: true }).filter({ visible: true })).toHaveCount(1)
      const shellBox = await shell.boundingBox()
      const stageBox = await stage.boundingBox()
      const gridColumns = await shell.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean))
      expect(shellBox && stageBox).toBeTruthy()
      expect(gridColumns).toHaveLength(2)
      expect(stageBox!.width / shellBox!.width).toBeGreaterThanOrEqual(0.65)
      await expectNoVisibleButtonTextOverflow(page)

      const accessibility = await new AxeBuilder({ page }).analyze()
      const blocking = accessibility.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
      expect(errors).toEqual([])
    })
  }
})

test('module overview uses one card contract for all six ready modules', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/modules')
  const cards = page.locator('.module-grid .module-card-ready')
  await expect(cards).toHaveCount(6)
  for (let index = 0; index < 6; index += 1) {
    const card = cards.nth(index)
    await expect(card.locator('.module-preview')).toBeVisible()
    await expect(card.locator('h2')).toBeVisible()
    await expect(card.locator('p')).toBeVisible()
  }
  await expectNoHorizontalOverflow(page)
})

for (const width of [375, 390, 768, 1024, 1280]) {
  test(`all 27 explorers keep the shared chrome at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const route of readyExplorerRoutes) {
      await test.step(route, async () => {
        await page.goto(route)
        await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
        await expect(page.locator('.explorer-stage-header')).toBeVisible()
        await expect(page.locator('.lesson-stage-actions')).toBeVisible()
        await expectNoHorizontalOverflow(page)
        await expectNoVisibleButtonTextOverflow(page)

        if (width < 1180) {
          await expect(page.locator('.lesson-stage-readout-action')).toBeHidden()
          const visibleActions = await page.locator('.lesson-stage-actions > button:visible').allTextContents()
          expect(visibleActions.map((label) => label.trim())).toEqual(['Visual notes', 'Focus', 'Export PNG'])
        }

        if (width <= 860) {
          const undersized = await page.locator('.explorer-stage-header-actions button:visible, .explorer-transport button:visible').evaluateAll((elements) =>
            elements
              .map((element) => {
                const rect = element.getBoundingClientRect()
                return { name: element.getAttribute('aria-label') || element.textContent?.trim() || 'control', width: rect.width, height: rect.height }
              })
              .filter(({ width: elementWidth, height }) => elementWidth < 44 || height < 44),
          )
          expect(undersized, `${route}: ${JSON.stringify(undersized, null, 2)}`).toEqual([])
        }
      })
    }
  })
}

for (const width of [375, 390, 768, 1024, 1280]) {
  test.describe(`${width}px layout`, () => {
    for (const route of representativeRoutes) {
      test(`${route} has no viewport overflow`, async ({ page }) => {
        const errors = collectRuntimeErrors(page)
        await page.setViewportSize({ width, height: 900 })
        await page.goto(route)
        await expect(page.locator('.platform-shell')).toBeVisible()
        await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
        await expectNoHorizontalOverflow(page)
        if (width <= 1024 && route !== '/modules') {
          await expect(page.locator('.lesson-stage-readout-action')).toBeHidden()
          const lowerReadout = route.includes('/matrix/')
            ? page.locator('.visualization-standard-right .visualization-mobile-section-toggle')
            : page.locator('.lesson-shell-explanation .lesson-mobile-section-toggle')
          await expect(lowerReadout).toBeVisible()
        }
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

test('expanded mobile inspectors keep field help and edit actions touch-safe', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  for (const route of ['/modules/fourier/spectrum', '/modules/convolution/discrete']) {
    await test.step(route, async () => {
      await page.goto(route)
      await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
      await page.locator('.lesson-shell-controls .lesson-mobile-section-toggle').click()
      const undersized = await page.locator('.lesson-shell-controls button:visible').evaluateAll((elements) =>
        elements
          .map((element) => {
            const rect = element.getBoundingClientRect()
            return { name: element.getAttribute('aria-label') || element.textContent?.trim() || 'control', width: rect.width, height: rect.height }
          })
          .filter(({ width, height }) => width < 44 || height < 44),
      )
      expect(undersized, `${route}: ${JSON.stringify(undersized, null, 2)}`).toEqual([])
    })
  }
})

test('static explorers never reserve an empty transport shell', async ({ page }) => {
  await page.goto('/modules/convolution/image-kernel')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.locator('.lesson-standard-transport')).toHaveCount(0)

  await page.goto('/modules/probability/conditional-probability')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
  const compactTransport = page.locator('.explorer-transport[data-compact="true"]')
  await expect(compactTransport).toBeVisible()
  await expect(compactTransport.getByRole('button', { name: 'Reset parameters' })).toBeVisible()
})

test('shared chrome remains stable when switching languages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/modules/calculus/derivative')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
  await page.getByRole('button', { name: 'Switch language' }).click()
  await expect(page.locator('.platform-shell')).toHaveAttribute('data-locale', 'zh')
  await expect(page.locator('.explorer-stage-header h1')).toHaveText('导数')
  await expect(page.locator('.lesson-shell-controls .lesson-mobile-inspector-action')).toContainText('笔记')
  await expectNoHorizontalOverflow(page)
  await expectNoVisibleButtonTextOverflow(page)

  await page.reload()
  await expect(page.locator('.platform-shell')).toHaveAttribute('data-locale', 'zh')
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

test('Matrix mobile transport stays compact and progressively discloses display options', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 })
  await page.goto('/modules/matrix/transformations')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.locator('.platform-shell')).toHaveAttribute('data-surface-mode', 'dark')

  const transport = page.locator('.transport')
  const transportBox = await transport.boundingBox()
  expect(transportBox).toBeTruthy()
  expect(transportBox!.height).toBeLessThanOrEqual(300)

  const resetAnimation = page.getByRole('button', { name: 'Reset animation', exact: true })
  const resetView = page.getByRole('button', { name: 'Reset view', exact: true })
  for (const button of [resetAnimation, resetView]) {
    const box = await button.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }

  const disclosure = page.locator('.view-options-disclosure')
  await expect(disclosure).not.toHaveAttribute('open', '')
  await expect(disclosure.locator('.view-toggles-mobile input')).toHaveCount(5)
  await expect(disclosure.locator('.view-toggles-mobile input').first()).toBeHidden()
  await disclosure.locator('summary').click()
  await expect(disclosure).toHaveAttribute('open', '')
  await expect(disclosure.locator('.view-toggles-mobile input').first()).toBeVisible()
  await expect(page.locator('.view-toggles-desktop')).toBeHidden()
  await expectNoHorizontalOverflow(page)
})

test('tablet layouts keep the canvas first and collapse parameters and readout', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto('/modules/calculus/derivative')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })

  const graph = page.locator('.calculus-canvas')
  const parameters = page.locator('.lesson-shell-controls .lesson-mobile-section-toggle')
  const readout = page.locator('.lesson-shell-explanation .lesson-mobile-section-toggle')
  await expect(parameters).toBeVisible()
  await expect(readout).toBeVisible()
  await expect(parameters).toHaveAttribute('aria-expanded', 'false')
  await expect(readout).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.lesson-standard-readout-rail')).toHaveCount(0)
  await expect(page.locator('.lesson-stage-readout-action')).toBeHidden()

  const graphBox = await graph.boundingBox()
  const parametersBox = await parameters.boundingBox()
  expect(graphBox && parametersBox).toBeTruthy()
  expect(graphBox!.y).toBeLessThan(parametersBox!.y)
})

test('standard lesson readout opens as a drawer and restores trigger focus', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/modules/calculus/derivative')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })

  const trigger = page.locator('.lesson-stage-readout-action')
  await expect(trigger).toHaveCount(1)
  await trigger.click()
  const drawer = page.locator('.lesson-standard-readout-drawer')
  await expect(drawer).toBeVisible()
  await expect(drawer).toHaveCSS('right', '0px')
  await expect(drawer).toContainText('Formula')
  await page.keyboard.press('Escape')
  await expect(drawer).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('Matrix standard readout uses a drawer and Appearance stays collapsed by default', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/modules/matrix/transformations')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })

  const appearance = page.locator('.matrix-appearance-disclosure')
  await expect(appearance).not.toHaveAttribute('open', '')

  const trigger = page.locator('.lesson-stage-readout-action')
  await expect(trigger).toHaveCount(1)
  await trigger.click()
  const drawer = page.locator('.visualization-standard-readout-drawer')
  await expect(drawer).toBeVisible()
  await expect(drawer).toHaveCSS('right', '0px')
  await expect(drawer).toContainText('Current Dimensions')

  await page.keyboard.press('f')
  await expect(drawer).toHaveCount(0)
  await expect(page.locator('.visualization-workbench')).toHaveClass(/is-focus/)
  await expect(page.locator('.lesson-stage-readout-action')).toHaveCount(0)
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
  await expect(page.getByRole('button', { name: 'Light mode' })).toBeVisible()

  const background = await page.locator('.calculus-canvas').evaluate((canvas: HTMLCanvasElement) =>
    Array.from(canvas.getContext('2d')!.getImageData(2, 2, 1, 1).data.slice(0, 3)),
  )
  expect(background).toEqual([17, 23, 27])

  await page.getByRole('button', { name: 'Light mode' }).click()
  await expect(page.getByRole('button', { name: 'Dark mode' })).toBeVisible()

  await page.reload()
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Dark mode' })).toBeVisible()
})

test('Matrix follows the platform surface mode with a safe dark canvas palette', async ({ page }) => {
  await page.goto('/modules/matrix/transformations')
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'Light mode' })).toBeVisible()

  const background = await page.locator('.canvas-2d').evaluate((canvas: HTMLCanvasElement) =>
    Array.from(canvas.getContext('2d')!.getImageData(2, 2, 1, 1).data.slice(0, 3)),
  )
  expect(background).toEqual([13, 20, 28])

  const colors = await page.locator('.matrix-embedded-shell').evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      background: style.getPropertyValue('--app-bg').trim(),
      text: style.getPropertyValue('--text-main').trim(),
      grid: style.getPropertyValue('--grid-color').trim(),
      axis: style.getPropertyValue('--axis-color').trim(),
    }
  })
  expect(colors).toEqual({ background: '#0d141c', text: '#eef3f8', grid: '#3f4a55', axis: '#d7dde5' })

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

test.describe('Matrix R3 playback', () => {
  const cases = [
    { input: 3, output: 3, label: 'R3 to R3' },
    { input: 3, output: 2, label: 'R3 to R2' },
    { input: 2, output: 3, label: 'R2 to R3' },
  ] as const

  for (const playbackCase of cases) {
    test(`${playbackCase.label} advances and changes the rendered frame`, async ({ page }) => {
      const errors = collectRuntimeErrors(page)
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto('/modules/matrix/transformations')
      await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })

      if (playbackCase.input === 3) await selectMatrixDimension(page, 0, 'R3')
      if (playbackCase.output === 3) await selectMatrixDimension(page, 1, 'R3')

      const threeCanvas = page.locator('.three-host canvas')
      await expect(threeCanvas).toBeVisible({ timeout: 15_000 })
      await expect(page.locator('.three-host-fallback')).toHaveCount(0)

      const firstMatrixEntry = page.locator('.matrix-grid input[type="number"]').first()
      await firstMatrixEntry.fill('2')
      await firstMatrixEntry.blur()
      const progress = page.getByLabel('Playback progress')
      await expect(progress).toHaveValue('0')

      const initialThreeFrame = await threeCanvas.screenshot()
      const trueR2Canvas = page.locator('.canvas-2d')
      const initialR2Frame = playbackCase.input === 3 && playbackCase.output === 2
        ? await trueR2Canvas.screenshot()
        : null

      await page.getByRole('button', { name: 'Play', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
      await expect.poll(async () => Number(await progress.inputValue()), { timeout: 1_000 }).toBeGreaterThan(0.1)

      const middleThreeFrame = await threeCanvas.screenshot()
      const middleR2Frame = initialR2Frame ? await trueR2Canvas.screenshot() : null
      expect(initialThreeFrame.equals(middleThreeFrame)).toBe(false)
      if (initialR2Frame && middleR2Frame) expect(initialR2Frame.equals(middleR2Frame)).toBe(false)

      await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible({ timeout: 5_000 })
      await expect(progress).toHaveValue('1')
      const finalThreeFrame = await threeCanvas.screenshot()
      expect(middleThreeFrame.equals(finalThreeFrame)).toBe(false)
      expect(errors).toEqual([])
    })
  }

  test('pause, seek, resume, speed, and reset preserve exact progress', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/modules/matrix/transformations')
    await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
    await selectMatrixDimension(page, 0, 'R3')
    await selectMatrixDimension(page, 1, 'R3')
    await page.locator('.three-host canvas').waitFor({ state: 'visible' })
    await page.locator('.matrix-grid input[type="number"]').first().fill('2')

    const progress = page.getByLabel('Playback progress')
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect.poll(async () => Number(await progress.inputValue())).toBeGreaterThan(0.1)
    await page.getByRole('button', { name: 'Pause', exact: true }).click()
    const pausedProgress = Number(await progress.inputValue())
    await page.waitForTimeout(250)
    expect(Number(await progress.inputValue())).toBeCloseTo(pausedProgress, 3)

    await progress.fill('0.6')
    await expect(progress).toHaveValue('0.6')
    await page.locator('.speed-control input[type="range"]').fill('2.5')
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible({ timeout: 3_000 })
    await expect(progress).toHaveValue('1')

    await page.getByRole('button', { name: 'Reset animation', exact: true }).click()
    await expect(progress).toHaveValue('0')
  })

  test('step mode advances through every matrix without relying on effect restart', async ({ page }) => {
    await page.goto('/modules/matrix/transformations')
    await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
    await page.getByRole('button', { name: 'Add', exact: true }).first().click()
    await page.getByRole('button', { name: /^Step:/ }).click()
    await page.locator('.matrix-grid input[type="number"]').first().fill('2')

    const progress = page.getByLabel('Playback progress')
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible({ timeout: 6_000 })
    await expect(progress).toHaveValue('1')
  })

  test('reduced motion completes a 3D transformation immediately', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/modules/matrix/transformations')
    await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
    await selectMatrixDimension(page, 0, 'R3')
    await selectMatrixDimension(page, 1, 'R3')
    await page.locator('.three-host canvas').waitFor({ state: 'visible' })
    await page.locator('.matrix-grid input[type="number"]').first().fill('2')

    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect(page.getByLabel('Playback progress')).toHaveValue('1')
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  })

  test('3D PNG export still works after an incremental animation frame', async ({ page }) => {
    await page.goto('/modules/matrix/transformations')
    await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
    await selectMatrixDimension(page, 0, 'R3')
    await selectMatrixDimension(page, 1, 'R3')
    await page.locator('.three-host canvas').waitFor({ state: 'visible' })
    await page.locator('.matrix-grid input[type="number"]').first().fill('2')
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await expect.poll(async () => Number(await page.getByLabel('Playback progress').inputValue())).toBeGreaterThan(0.1)
    await page.getByRole('button', { name: 'Pause', exact: true }).click()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export PNG', exact: true }).click(),
    ])
    expect(download.suggestedFilename()).toBe('matrix-motion.png')
    const stream = await download.createReadStream()
    let byteCount = 0
    for await (const chunk of stream) byteCount += chunk.length
    expect(byteCount).toBeGreaterThan(1_000)
  })
})

async function selectMatrixDimension(page: Page, index: number, label: 'R3') {
  await page.locator('.dim-selectors .select-menu-trigger').nth(index).click()
  await page.locator('[role="option"]').filter({ hasText: label }).last().click()
}
