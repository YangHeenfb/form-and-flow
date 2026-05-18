import { describe, expect, it } from 'vitest'
import { loadThemeSettings, neutralDarkTheme, saveThemeSettings } from '../state/useThemeState.ts'

describe('theme state', () => {
  it('saves and restores color settings', () => {
    localStorage.clear()
    const theme = {
      ...neutralDarkTheme,
      colors: {
        ...neutralDarkTheme.colors,
        grid: '#123456',
      },
    }
    saveThemeSettings(theme)
    expect(loadThemeSettings().colors.grid).toBe('#123456')
  })

  it('adds text and background colors to older stored themes', () => {
    localStorage.clear()
    const legacyColors: Partial<typeof neutralDarkTheme.colors> = { ...neutralDarkTheme.colors }
    delete legacyColors.background
    delete legacyColors.text
    localStorage.setItem('matrix-motion-lab-theme', JSON.stringify({ ...neutralDarkTheme, colors: legacyColors }))

    const loaded = loadThemeSettings()
    expect(loaded.colors.background).toBe(neutralDarkTheme.colors.background)
    expect(loaded.colors.text).toBe(neutralDarkTheme.colors.text)
  })
})
