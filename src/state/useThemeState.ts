import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColorPreset, ThemeSettings, ThemeSurfaceMode } from '../math/types.ts'

const storageKey = 'matrix-motion-lab-theme'

export const neutralDarkTheme: ThemeSettings = {
  surfaceMode: 'dark',
  colorPreset: 'neutral',
  includeThemeInShareLink: false,
  colors: {
    grid: '#3f4a55',
    transformedGrid: '#5e8fd8',
    axis: '#d7dde5',
    vectorI: '#6aa4ff',
    vectorJ: '#9adf8f',
    vectorK: '#f2c66d',
    inputVector: '#c88cff',
    unitShape: '#9fb7ce',
  },
}

export const neutralLightTheme: ThemeSettings = {
  ...neutralDarkTheme,
  surfaceMode: 'light',
  colors: {
    grid: '#c7d0da',
    transformedGrid: '#276bb6',
    axis: '#22303d',
    vectorI: '#1e63c8',
    vectorJ: '#32823d',
    vectorK: '#9d6816',
    inputVector: '#7b3fc4',
    unitShape: '#52708b',
  },
}

const highContrastColors: ThemeSettings['colors'] = {
  grid: '#7f8ea3',
  transformedGrid: '#00d4ff',
  axis: '#ffffff',
  vectorI: '#ffd400',
  vectorJ: '#00ff85',
  vectorK: '#ff7a00',
  inputVector: '#ff5cda',
  unitShape: '#ffffff',
}

export function applyColorPreset(settings: ThemeSettings, preset: ColorPreset): ThemeSettings {
  if (preset === 'high-contrast') {
    return {
      ...settings,
      colorPreset: preset,
      colors: settings.surfaceMode === 'dark' ? highContrastColors : { ...highContrastColors, axis: '#000000' },
    }
  }
  return settings.surfaceMode === 'dark'
    ? { ...neutralDarkTheme, includeThemeInShareLink: settings.includeThemeInShareLink }
    : { ...neutralLightTheme, includeThemeInShareLink: settings.includeThemeInShareLink }
}

export function saveThemeSettings(settings: ThemeSettings, storage: Storage = localStorage): void {
  storage.setItem(storageKey, JSON.stringify(settings))
}

export function loadThemeSettings(storage: Storage = localStorage): ThemeSettings {
  const raw = storage.getItem(storageKey)
  if (!raw) {
    return neutralDarkTheme
  }
  try {
    const parsed = JSON.parse(raw) as ThemeSettings
    if ((parsed.surfaceMode === 'dark' || parsed.surfaceMode === 'light') && parsed.colors) {
      return parsed
    }
  } catch {
    return neutralDarkTheme
  }
  return neutralDarkTheme
}

export function useThemeState(initialTheme?: ThemeSettings) {
  const [theme, setTheme] = useState<ThemeSettings>(() => initialTheme ?? loadThemeSettings())

  useEffect(() => {
    saveThemeSettings(theme)
  }, [theme])

  const setSurfaceMode = useCallback((surfaceMode: ThemeSurfaceMode) => {
    setTheme((current) => {
      const base = surfaceMode === 'dark' ? neutralDarkTheme : neutralLightTheme
      const withMode = {
        ...base,
        colorPreset: current.colorPreset,
        includeThemeInShareLink: current.includeThemeInShareLink,
      }
      return current.colorPreset === 'high-contrast' ? applyColorPreset(withMode, 'high-contrast') : withMode
    })
  }, [])

  const setColorPreset = useCallback((colorPreset: ColorPreset) => {
    setTheme((current) => applyColorPreset(current, colorPreset))
  }, [])

  const setColor = useCallback((key: keyof ThemeSettings['colors'], value: string) => {
    setTheme((current) => ({
      ...current,
      colorPreset: 'neutral',
      colors: {
        ...current.colors,
        [key]: value,
      },
    }))
  }, [])

  const setIncludeThemeInShareLink = useCallback((includeThemeInShareLink: boolean) => {
    setTheme((current) => ({ ...current, includeThemeInShareLink }))
  }, [])

  const cssVariables = useMemo(() => {
    const dark = theme.surfaceMode === 'dark'
    return {
      '--app-bg': dark ? '#0e141b' : '#eef2f6',
      '--panel-bg': dark ? '#151d26' : '#ffffff',
      '--panel-bg-soft': dark ? '#101720' : '#f7f9fc',
      '--panel-border': dark ? '#2b3642' : '#d6dde7',
      '--text-main': dark ? '#eef3f8' : '#15202b',
      '--text-muted': dark ? '#a7b1bd' : '#5e6a78',
      '--control-bg': dark ? '#1d2732' : '#edf2f8',
      '--control-bg-strong': dark ? '#263343' : '#dfe8f3',
      '--focus': dark ? '#74a7ff' : '#1e63c8',
      '--grid-color': theme.colors.grid,
      '--transformed-grid-color': theme.colors.transformedGrid,
      '--axis-color': theme.colors.axis,
      '--vector-i-color': theme.colors.vectorI,
      '--vector-j-color': theme.colors.vectorJ,
      '--vector-k-color': theme.colors.vectorK,
      '--input-vector-color': theme.colors.inputVector,
      '--unit-shape-color': theme.colors.unitShape,
      '--native-control-scheme': dark ? 'dark' : 'light',
    } as React.CSSProperties
  }, [theme])

  return {
    theme,
    cssVariables,
    setSurfaceMode,
    setColorPreset,
    setColor,
    setIncludeThemeInShareLink,
    setTheme,
  }
}
