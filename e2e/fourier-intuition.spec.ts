import { expect, test, type Page } from '@playwright/test'

type CanvasStrokeCall = {
  style: string
  width: number
  dash: number[]
}

type CanvasFillCall = {
  style: string
  alpha: number
}

async function installCanvasRecorder(page: Page) {
  await page.addInitScript(() => {
    const target = window as typeof window & {
      __fourierStrokeCalls: CanvasStrokeCall[]
      __fourierFillCalls: CanvasFillCall[]
      __fourierTextCalls: string[]
    }
    target.__fourierStrokeCalls = []
    target.__fourierFillCalls = []
    target.__fourierTextCalls = []

    const originalStroke = CanvasRenderingContext2D.prototype.stroke
    CanvasRenderingContext2D.prototype.stroke = function patchedStroke(path) {
      target.__fourierStrokeCalls.push({ style: String(this.strokeStyle), width: this.lineWidth, dash: this.getLineDash() })
      if (path === undefined) return originalStroke.call(this)
      return originalStroke.call(this, path)
    }

    const originalFillRect = CanvasRenderingContext2D.prototype.fillRect
    CanvasRenderingContext2D.prototype.fillRect = function patchedFillRect(x, y, width, height) {
      target.__fourierFillCalls.push({ style: String(this.fillStyle), alpha: this.globalAlpha })
      return originalFillRect.call(this, x, y, width, height)
    }

    const originalFillText = CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText = function patchedFillText(text, x, y, maxWidth) {
      target.__fourierTextCalls.push(String(text))
      if (maxWidth === undefined) return originalFillText.call(this, text, x, y)
      return originalFillText.call(this, text, x, y, maxWidth)
    }
  })
}

async function gotoFourier(page: Page, route: string) {
  await page.goto(route)
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.locator('.fourier-canvas')).toBeVisible()
}

async function openDesktopIntuition(page: Page) {
  await page.getByRole('button', { name: 'Intuition', exact: true }).click()
  const drawer = page.locator('.lesson-standard-readout-drawer')
  await expect(drawer).toBeVisible()
  return drawer
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

test.describe('Fourier intuition explanation', () => {
  test('explains winding, imbalance, center of mass, and spectrum with a dynamic response', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await gotoFourier(page, '/modules/fourier?mode=spectrum&preset=sum-of-sines&freq=2')
    const drawer = await openDesktopIntuition(page)

    await expect(drawer.getByRole('heading', { name: 'Core idea' })).toBeVisible()
    await expect(drawer.locator('.fourier-intuition-steps li')).toHaveCount(3)
    await expect(drawer).toContainText('center of mass (average point)')
    await expect(drawer.locator('.fourier-current-state')).toContainText('weak response')
    await expect(drawer.locator('details')).not.toHaveAttribute('open', '')

    const windingFrequency = page.getByRole('slider', { name: 'winding frequency' })
    await windingFrequency.fill('1')
    await expect(drawer.locator('.fourier-current-state')).toContainText('strong response')
    await windingFrequency.fill('1.5')
    await expect(drawer.locator('.fourier-current-state')).toContainText('continuous winding test')

    await drawer.getByText('Exact readout and formula', { exact: true }).click()
    await expect(drawer).toContainText('|C(f)|')
    await expect(drawer.getByText('Related terms', { exact: true })).toBeVisible()
  })

  test('links the newest reconstruction contribution to the same highlighted spectrum bars', async ({ page }) => {
    await installCanvasRecorder(page)
    await page.setViewportSize({ width: 1280, height: 900 })
    await gotoFourier(page, '/modules/fourier?mode=reconstruction&preset=square-wave&count=1')
    const drawer = await openDesktopIntuition(page)

    await expect(drawer).toContainText('Each block makes a contribution')
    await expect(drawer.locator('.fourier-current-state')).toContainText('highlighted independent contribution')
    await expect(drawer.locator('.fourier-current-state')).toContainText('cumulative reconstruction now uses')

    const calls = await page.evaluate(() => {
      const target = window as typeof window & { __fourierStrokeCalls?: CanvasStrokeCall[] }
      return target.__fourierStrokeCalls ?? []
    })
    const highlightedStyles = new Set(calls.filter((call) => call.dash.length > 0 && call.width >= 2).map((call) => call.style))
    expect([...highlightedStyles].some((style) => calls.some((call) => call.style === style && call.dash.length === 0 && call.width >= 4))).toBe(true)

    const canvasTexts = await page.evaluate(() => {
      const target = window as typeof window & { __fourierTextCalls?: string[] }
      return target.__fourierTextCalls ?? []
    })
    expect(canvasTexts).toContain('current contribution')
    expect(canvasTexts).toContain('current block')

    await page.evaluate(() => {
      const target = window as typeof window & { __fourierStrokeCalls?: CanvasStrokeCall[]; __fourierTextCalls?: string[] }
      if (target.__fourierStrokeCalls) target.__fourierStrokeCalls.length = 0
      if (target.__fourierTextCalls) target.__fourierTextCalls.length = 0
    })
    await page.getByRole('checkbox', { name: 'labels' }).uncheck()
    await page.waitForTimeout(80)
    const hiddenState = await page.evaluate(() => {
      const target = window as typeof window & { __fourierStrokeCalls?: CanvasStrokeCall[]; __fourierTextCalls?: string[] }
      return { strokes: target.__fourierStrokeCalls ?? [], texts: target.__fourierTextCalls ?? [] }
    })
    expect(hiddenState.texts).not.toContain('current contribution')
    expect(hiddenState.texts).not.toContain('current block')
    expect(hiddenState.strokes.some((call) => call.dash.length > 0 && call.width >= 2)).toBe(true)
  })

  test('shows filtering as spectrum editing followed by the same reconstruction', async ({ page }) => {
    await installCanvasRecorder(page)
    await page.setViewportSize({ width: 1280, height: 900 })
    await gotoFourier(page, '/modules/fourier?mode=filtering&preset=noisy-sine&filter=low-pass&cutoff=5')
    const drawer = await openDesktopIntuition(page)

    await expect(drawer).toContainText('Lower or delete spectrum bars')
    await expect(drawer).toContainText('Reuse the same reconstruction')
    await expect(drawer.locator('.fourier-current-state')).toContainText('integer frequencies remain')

    const fills = await page.evaluate(() => {
      const target = window as typeof window & { __fourierFillCalls?: CanvasFillCall[] }
      return target.__fourierFillCalls ?? []
    })
    const strokes = await page.evaluate(() => {
      const target = window as typeof window & { __fourierStrokeCalls?: CanvasStrokeCall[] }
      return target.__fourierStrokeCalls ?? []
    })
    expect(fills.some((call) => call.alpha > 0 && call.alpha < 0.2)).toBe(true)
    expect(strokes.some((call) => call.dash.length > 0 && call.width >= 1.2)).toBe(true)

    await page.getByRole('button', { name: 'filter type' }).click()
    await page.getByRole('option', { name: 'magnitude threshold' }).click()
    await expect(drawer.locator('.fourier-current-state')).toContainText('Magnitude thresholding')
  })

  test('carries only the current signal definition through spectrum, reconstruction, and filtering', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const expression = 'sin(2*pi*t) + 0.5*cos(6*pi*t)'
    await gotoFourier(page, `/modules/fourier?mode=spectrum&preset=custom&f=${encodeURIComponent(expression)}&samples=256&normalize=true&freq=7&fmin=-20&fmax=20`)
    let drawer = await openDesktopIntuition(page)
    const reconstruct = drawer.getByRole('link', { name: 'Reconstruct this signal' })
    const reconstructionUrl = new URL(await reconstruct.getAttribute('href') ?? '', 'http://localhost')
    expect(Object.fromEntries(reconstructionUrl.searchParams)).toEqual({
      mode: 'reconstruction',
      preset: 'custom',
      f: expression,
      samples: '256',
      normalize: 'true',
    })
    await reconstruct.click()
    await expect(page.locator('.explorer-stage-header h1')).toHaveText('Signal Reconstruction')
    await expect(page.locator('.fourier-controls input:not([type])')).toHaveValue(expression)

    drawer = await openDesktopIntuition(page)
    await drawer.getByRole('link', { name: 'Filter this signal' }).click()
    await expect(page.locator('.explorer-stage-header h1')).toHaveText('Frequency Filtering')
    await expect(page.locator('.fourier-controls input:not([type])')).toHaveValue(expression)

    drawer = await openDesktopIntuition(page)
    await drawer.getByRole('link', { name: 'View this signal’s spectrum' }).click()
    await expect(page.locator('.explorer-stage-header h1')).toHaveText('Frequency Spectrum')
    const finalUrl = new URL(page.url())
    expect(finalUrl.searchParams.get('f')).toBe(expression)
    expect(finalUrl.searchParams.has('view')).toBe(false)
    expect(finalUrl.searchParams.has('freq')).toBe(false)
  })

  test('keeps the Chinese light mobile explanation touch-safe and free of source attribution', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 })
    await gotoFourier(page, '/modules/fourier?mode=spectrum&view=pair')
    await page.getByRole('button', { name: 'Light mode' }).click()
    await page.getByRole('button', { name: 'Switch language' }).click()
    await page.locator('.lesson-shell-explanation .lesson-mobile-section-toggle').click()

    const explanation = page.locator('.lesson-shell-explanation')
    await expect(explanation).toContainText('让箭头反向旋转')
    await expect(explanation).toContainText('黄色曲线只表示这对箭头的贡献')
    await expect(explanation.getByRole('link', { name: '用当前信号重建' })).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/3Blue1Brown/i)
    await expect(page.locator('.fourier-canvas')).not.toHaveAttribute('aria-label', /3Blue1Brown/i)
    await expectNoHorizontalOverflow(page)

    const actionBox = await explanation.getByRole('link', { name: '用当前信号重建' }).boundingBox()
    expect(actionBox).toBeTruthy()
    expect(actionBox!.height).toBeGreaterThanOrEqual(44)
  })
})
