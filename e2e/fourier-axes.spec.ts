import { expect, test, type Page } from '@playwright/test'

type CanvasTextCall = {
  text: string
  x: number
  y: number
}

async function installCanvasTextRecorder(page: Page) {
  await page.addInitScript(() => {
    const target = window as typeof window & { __fourierCanvasTextCalls: CanvasTextCall[] }
    target.__fourierCanvasTextCalls = []
    const originalFillText = CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText = function patchedFillText(text, x, y, maxWidth) {
      target.__fourierCanvasTextCalls.push({ text: String(text), x, y })
      if (maxWidth === undefined) return originalFillText.call(this, text, x, y)
      return originalFillText.call(this, text, x, y, maxWidth)
    }
  })
}

async function canvasTextCalls(page: Page): Promise<CanvasTextCall[]> {
  return page.evaluate(() => {
    const target = window as typeof window & { __fourierCanvasTextCalls?: CanvasTextCall[] }
    return target.__fourierCanvasTextCalls ?? []
  })
}

async function clearCanvasTextCalls(page: Page) {
  await page.evaluate(() => {
    const target = window as typeof window & { __fourierCanvasTextCalls?: CanvasTextCall[] }
    if (target.__fourierCanvasTextCalls) target.__fourierCanvasTextCalls.length = 0
  })
}

async function gotoFourier(page: Page, route: string) {
  await page.goto(route)
  await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.locator('.fourier-canvas')).toBeVisible()
  await expect.poll(async () => (await canvasTextCalls(page)).length).toBeGreaterThan(0)
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

function textSet(calls: CanvasTextCall[]) {
  return new Set(calls.map((call) => call.text))
}

function lastTextCall(calls: CanvasTextCall[], text: string) {
  return [...calls].reverse().find((call) => call.text === text)
}

function expectTexts(texts: Set<string>, expected: string[]) {
  expected.forEach((text) => expect(texts.has(text), `missing canvas text: ${text}`).toBe(true))
}

test.describe('Fourier canvas axes', () => {
  test.beforeEach(async ({ page }) => {
    await installCanvasTextRecorder(page)
  })

  test('draws normalized time labels, desktop integer frequency labels, and an exact probe label', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await gotoFourier(page, '/modules/fourier/spectrum?freq=1')

    const texts = textSet(await canvasTextCalls(page))
    expectTexts(texts, ['0', '0.5', '1', '-10', '-9', '9', '10', 'f = 1'])
  })

  test('keeps the positive-only bars, labels, phase, and probe marker on one visible domain', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await gotoFourier(page, '/modules/fourier/spectrum?freq=1')
    const mirroredMarker = lastTextCall(await canvasTextCalls(page), 'f = 1')
    expect(mirroredMarker).toBeTruthy()

    await clearCanvasTextCalls(page)
    await page.getByRole('checkbox', { name: 'positive only' }).check()
    await expect.poll(async () => lastTextCall(await canvasTextCalls(page), 'f = 1')?.x ?? Number.POSITIVE_INFINITY).toBeLessThan(mirroredMarker!.x - 100)
    const positiveTexts = textSet(await canvasTextCalls(page))
    expect(positiveTexts.has('-1')).toBe(false)
    expectTexts(positiveTexts, ['0', '1', '10', 'f = 1'])

    await page.getByRole('checkbox', { name: 'positive only' }).uncheck()
    await clearCanvasTextCalls(page)
    await page.getByRole('checkbox', { name: 'phase' }).check()
    await expect.poll(async () => textSet(await canvasTextCalls(page)).has('-10')).toBe(true)
    expectTexts(textSet(await canvasTextCalls(page)), ['-10', '0', '10', 'f = 1'])

    await clearCanvasTextCalls(page)
    await page.getByRole('checkbox', { name: 'labels' }).uncheck()
    await expect(page.getByRole('checkbox', { name: 'labels' })).not.toBeChecked()
    await page.waitForTimeout(80)
    const hiddenTexts = textSet(await canvasTextCalls(page))
    expect(hiddenTexts.has('0.5')).toBe(false)
    expect(hiddenTexts.has('-10')).toBe(false)
    expect(hiddenTexts.has('f = 1')).toBe(false)
  })

  test('uses the same time scale and frequency baseline across synthesis, reconstruction, and filtering', async ({ page }) => {
    const routes = [
      { route: '/modules/fourier/spectrum?view=pair', expected: ['0', '0.5', '1', '-1', '+1'] },
      { route: '/modules/fourier/reconstruction', expected: ['0', '0.5', '1', '-20', '20'] },
      { route: '/modules/fourier/filtering', expected: ['0', '0.5', '1', '-40', '40'] },
    ]

    for (const { route, expected } of routes) {
      await gotoFourier(page, route)
      expectTexts(textSet(await canvasTextCalls(page)), expected)
    }
  })

  test('adapts frequency labels at all target widths without overflow', async ({ page }) => {
    for (const width of [375, 390, 768, 1024, 1280]) {
      await test.step(`${width}px`, async () => {
        await page.setViewportSize({ width, height: 900 })
        await gotoFourier(page, '/modules/fourier/spectrum?freq=1')
        await expectNoHorizontalOverflow(page)
        const texts = textSet(await canvasTextCalls(page))
        expectTexts(texts, ['0', '0.5', '1', 'f = 1'])
        if (width <= 390) {
          expectTexts(texts, ['-10', '-5', '5', '10'])
          expect(texts.has('-9')).toBe(false)
        }
        if (width === 1280) expect(texts.has('-9')).toBe(true)
      })
    }
  })

  test('redraws the axes coherently in the light Chinese surface', async ({ page }) => {
    await gotoFourier(page, '/modules/fourier/spectrum?freq=1')
    await clearCanvasTextCalls(page)
    await page.getByRole('button', { name: 'Light mode' }).click()
    await page.getByRole('button', { name: 'Switch language' }).click()
    await expect(page.locator('.platform-shell')).toHaveAttribute('data-surface-mode', 'light')
    await expect(page.locator('.platform-shell')).toHaveAttribute('data-locale', 'zh')
    await expect.poll(async () => textSet(await canvasTextCalls(page)).has('时间信号')).toBe(true)
    expectTexts(textSet(await canvasTextCalls(page)), ['时间信号', '幅值频谱', '0', '0.5', '1', 'f = 1'])
    await expectNoHorizontalOverflow(page)
  })
})
