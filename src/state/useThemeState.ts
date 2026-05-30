import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ColorPreset, ThemeSettings, ThemeSurfaceMode } from '../math/types.ts'

const storageKey = 'form-and-flow-matrix-theme'
const legacyStorageKey = 'matrix-motion-lab-theme'

export const neutralDarkTheme: ThemeSettings = {
  surfaceMode: 'dark',
  colorPreset: 'neutral',
  colors: {
    background: '#0d141c',
    text: '#eef3f8',
    grid: '#3f4a55',
    transformedGrid: '#55b9aa',
    axis: '#d7dde5',
    vectorI: '#7fd6c2',
    vectorJ: '#b9a7ff',
    vectorK: '#c7dc8a',
    inputVector: '#e2a8cf',
    unitShape: '#9fb7ce',
  },
}

export const neutralLightTheme: ThemeSettings = {
  ...neutralDarkTheme,
  surfaceMode: 'light',
  colors: {
    background: '#f8fafc',
    text: '#15202b',
    grid: '#c7d0da',
    transformedGrid: '#2f8d82',
    axis: '#22303d',
    vectorI: '#166d63',
    vectorJ: '#6550a8',
    vectorK: '#718326',
    inputVector: '#9a4c7b',
    unitShape: '#52708b',
  },
}

const highContrastColors: ThemeSettings['colors'] = {
  background: '#000000',
  text: '#ffffff',
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
      colors: settings.surfaceMode === 'dark' ? highContrastColors : { ...highContrastColors, background: '#ffffff', text: '#000000', axis: '#000000' },
    }
  }
  return settings.surfaceMode === 'dark'
    ? neutralDarkTheme
    : neutralLightTheme
}

export function saveThemeSettings(settings: ThemeSettings, storage: Storage = localStorage): void {
  storage.setItem(storageKey, JSON.stringify(settings))
}

export function loadThemeSettings(storage: Storage = localStorage): ThemeSettings {
  const raw = storage.getItem(storageKey) ?? storage.getItem(legacyStorageKey)
  if (!raw) {
    return neutralDarkTheme
  }
  try {
    const parsed = JSON.parse(raw) as ThemeSettings
    if ((parsed.surfaceMode === 'dark' || parsed.surfaceMode === 'light') && parsed.colors) {
      if (isLegacyNeutralTheme(parsed)) {
        return parsed.surfaceMode === 'dark' ? neutralDarkTheme : neutralLightTheme
      }
      return completeThemeSettings(parsed)
    }
  } catch {
    return neutralDarkTheme
  }
  return neutralDarkTheme
}

function isLegacyNeutralTheme(settings: ThemeSettings): boolean {
  return (
    settings.colorPreset === 'neutral' &&
    settings.colors.vectorI.toLowerCase() === '#6aa4ff' &&
    settings.colors.vectorK.toLowerCase() === '#f2c66d'
  )
}

function completeThemeSettings(settings: ThemeSettings): ThemeSettings {
  const defaults = settings.surfaceMode === 'dark' ? neutralDarkTheme : neutralLightTheme
  return {
    ...defaults,
    ...settings,
    colors: {
      ...defaults.colors,
      ...settings.colors,
    },
  }
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
        colors: {
          ...base.colors,
          text: current.colors.text,
          background: current.colors.background,
        },
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

  const cssVariables = useMemo(() => {
    const dark = theme.surfaceMode === 'dark'
    return {
      '--app-bg': theme.colors.background,
      '--panel-bg': dark ? '#151d26' : '#ffffff',
      '--panel-bg-soft': dark ? '#101720' : '#f7f9fc',
      '--panel-border': dark ? '#2b3642' : '#d6dde7',
      '--text-main': theme.colors.text,
      '--text-muted': dark ? '#a7b1bd' : '#5e6a78',
      '--control-bg': dark ? '#1d2732' : '#edf2f8',
      '--control-bg-strong': dark ? '#263343' : '#dfe8f3',
      '--focus': dark ? '#7fd6c2' : '#166d63',
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
    setTheme,
  }
}
