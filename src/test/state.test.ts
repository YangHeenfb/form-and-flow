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
})
