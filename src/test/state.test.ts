import { describe, expect, it } from 'vitest'
import { loadStoredSurfaceMode, platformSurfaceStorageKey } from '../platform/platformLocale.tsx'
import {
  loadThemeSettings,
  neutralDarkTheme,
  neutralLightTheme,
  normalizeThemeSurface,
  saveThemeSettings,
} from '../state/useThemeState.ts'

describe('theme state', () => {
  it('defaults new users to dark while preserving an explicit light preference', () => {
    localStorage.clear()
    expect(loadStoredSurfaceMode()).toBe('dark')

    localStorage.setItem(platformSurfaceStorageKey, 'light')
    expect(loadStoredSurfaceMode()).toBe('light')
  })

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

  it('uses a stored Matrix surface preference only when no platform preference exists', () => {
    localStorage.clear()
    localStorage.setItem('matrix-motion-lab-theme', JSON.stringify({ ...neutralDarkTheme, surfaceMode: 'dark' }))
    expect(loadStoredSurfaceMode()).toBe('dark')

    localStorage.setItem(platformSurfaceStorageKey, 'light')
    expect(loadStoredSurfaceMode()).toBe('light')
  })

  it('normalizes safety-critical surface colors while preserving custom object colors', () => {
    const custom = {
      ...neutralLightTheme,
      colors: {
        ...neutralLightTheme.colors,
        background: '#ffeeaa',
        text: '#112233',
        grid: '#abcdef',
        axis: '#fedcba',
        vectorI: '#123456',
        transformedGrid: '#654321',
      },
    }

    const dark = normalizeThemeSurface(custom, 'dark')
    expect(dark.colors.background).toBe(neutralDarkTheme.colors.background)
    expect(dark.colors.text).toBe(neutralDarkTheme.colors.text)
    expect(dark.colors.grid).toBe(neutralDarkTheme.colors.grid)
    expect(dark.colors.axis).toBe(neutralDarkTheme.colors.axis)
    expect(dark.colors.vectorI).toBe('#123456')
    expect(dark.colors.transformedGrid).toBe('#654321')
  })

  it('uses a light-safe palette for high contrast mode', () => {
    const light = normalizeThemeSurface({ ...neutralDarkTheme, colorPreset: 'high-contrast' }, 'light')
    expect(light.colors.background).toBe('#ffffff')
    expect(light.colors.text).toBe('#000000')
    expect(light.colors.axis).toBe('#000000')
  })
})
