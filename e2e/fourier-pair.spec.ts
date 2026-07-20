import { expect, test, type Page } from '@playwright/test'

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

test.describe('Fourier conjugate frequency-pair view', () => {
  test('defaults to the probe view and accepts only view=pair as a deep link', async ({ page }) => {
    await page.goto('/modules/fourier/spectrum')
    await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })

    const switcher = page.getByRole('group', { name: 'Spectrum view' })
    await expect(switcher.getByRole('button', { name: 'Frequency probe' })).toHaveAttribute('aria-pressed', 'true')
    await expect(switcher.getByRole('button', { name: '± frequency synthesis' })).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('.explorer-stage-header h1')).toHaveText('Frequency Spectrum')

    await page.goto('/modules/fourier/spectrum?view=unknown')
    await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Frequency probe' })).toHaveAttribute('aria-pressed', 'true')

    await page.goto('/modules/fourier/spectrum?view=pair&freq=-3')
    await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
    await expect(page.getByRole('button', { name: '± frequency synthesis' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.explorer-stage-header h1')).toHaveText('Positive and Negative Frequency Synthesis')
    await expect(page.getByRole('slider', { name: 'rotation frequency ±f' })).toHaveValue('3')
  })

  test('switches views from the keyboard and keeps the default URL clean', async ({ page }) => {
    await page.goto('/modules/fourier/spectrum?freq=-3')
    await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })

    const pairButton = page.getByRole('button', { name: '± frequency synthesis' })
    await pairButton.focus()
    await expect(pairButton).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(pairButton).toHaveAttribute('aria-pressed', 'true')
    await expect(page).toHaveURL(/view=pair/)
    await expect(page.getByRole('slider', { name: 'rotation frequency ±f' })).toHaveValue('3')

    const probeButton = page.getByRole('button', { name: 'Frequency probe' })
    await probeButton.focus()
    await page.keyboard.press('Space')
    await expect(probeButton).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => new URL(page.url()).searchParams.has('view')).toBe(false)
  })

  test('plays time at a fixed frequency, exposes pair readouts, and resets pair state', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/modules/fourier/spectrum?view=pair')
    await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })

    const pairFrequency = page.getByRole('slider', { name: 'rotation frequency ±f' })
    const timeProgress = page.getByRole('slider', { name: 'Time in one cycle' })
    await pairFrequency.fill('3')
    await timeProgress.fill('0.25')
    await expect(pairFrequency).toHaveValue('3')
    await expect(timeProgress).toHaveValue('0.25')

    await page.getByRole('button', { name: 'Intuition' }).click()
    const readout = page.locator('.lesson-standard-readout-drawer')
    await expect(readout).toBeVisible()
    await readout.getByText('Exact readout and formula', { exact: true }).click()
    await expect(readout).toContainText('C(+f)')
    await expect(readout).toContainText('C(-f)')
    await expect(readout).toContainText('remaining imaginary')
    const timeValue = readout.locator('dt').filter({ hasText: /^t$/ }).locator('..').locator('dd')
    await expect(timeValue).toHaveText('0.25')
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: 'Play rotation' }).click()
    await expect.poll(async () => Number(await timeProgress.inputValue())).toBeGreaterThan(0.27)
    await expect(pairFrequency).toHaveValue('3')
    await page.getByRole('button', { name: 'Pause' }).click()

    await page.getByRole('button', { name: 'Reset animation', exact: true }).click()
    await expect(pairFrequency).toHaveValue('1')
    await expect(timeProgress).toHaveValue('0')
  })

  test('keeps the pair layout touch-safe without horizontal overflow at target widths', async ({ page }) => {
    for (const width of [375, 390, 768, 1024, 1280]) {
      await test.step(`${width}px`, async () => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto('/modules/fourier/spectrum?view=pair')
        await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
        await expect(page.locator('.fourier-canvas')).toBeVisible()
        await expectNoHorizontalOverflow(page)

        const undersized = await page.locator('.fourier-spectrum-view-switch button').evaluateAll((buttons) =>
          buttons
            .map((button) => {
              const rect = button.getBoundingClientRect()
              return { label: button.textContent?.trim(), width: rect.width, height: rect.height }
            })
            .filter(({ width: buttonWidth, height }) => buttonWidth < 44 || height < 44),
        )
        expect(undersized, `${width}px: ${JSON.stringify(undersized)}`).toEqual([])
      })
    }
  })

  test('keeps pair copy and controls coherent in the light Chinese surface', async ({ page }) => {
    await page.goto('/modules/fourier/spectrum?view=pair')
    await expect(page.locator('.module-loading')).toHaveCount(0, { timeout: 15_000 })
    await expect(page.locator('.platform-shell')).toHaveAttribute('data-surface-mode', 'dark')

    await page.getByRole('button', { name: 'Light mode' }).click()
    await expect(page.locator('.platform-shell')).toHaveAttribute('data-surface-mode', 'light')
    await page.getByRole('button', { name: 'Switch language' }).click()
    await expect(page.locator('.platform-shell')).toHaveAttribute('data-locale', 'zh')
    await expect(page.locator('.explorer-stage-header h1')).toHaveText('正负频率合成')
    await expect(page.getByRole('button', { name: '正负频率合成' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('slider', { name: '旋转频率 ±f' })).toBeVisible()
    await expect(page.getByRole('slider', { name: '单周期时间' })).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})
