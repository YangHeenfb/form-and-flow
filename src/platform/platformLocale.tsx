import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'
import type { Locale } from '../i18n.ts'

export type PlatformSurfaceMode = 'dark' | 'light'

export const platformLocaleStorageKey = 'form-and-flow-locale'
export const platformSurfaceStorageKey = 'form-and-flow-surface-mode'
export const platformLocaleEventName = 'form-and-flow-locale'
export const platformSurfaceModeEventName = 'form-and-flow-surface-mode'

const legacyPlatformLocaleStorageKey = 'visual-math-lab-locale'
const legacyPlatformSurfaceStorageKey = 'visual-math-lab-surface-mode'

type PlatformLocaleContextValue = {
  locale: Locale
  setLocale: Dispatch<SetStateAction<Locale>>
}

const noopSetLocale: Dispatch<SetStateAction<Locale>> = () => undefined

export const PlatformLocaleContext = createContext<PlatformLocaleContextValue>({
  locale: 'en',
  setLocale: noopSetLocale,
})

export function usePlatformLocale(): PlatformLocaleContextValue {
  return useContext(PlatformLocaleContext)
}

export function readStoredPlatformLocaleValue(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(platformLocaleStorageKey) ?? localStorage.getItem(legacyPlatformLocaleStorageKey)
}

export function readStoredSurfaceModeValue(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(platformSurfaceStorageKey) ?? localStorage.getItem(legacyPlatformSurfaceStorageKey)
}

export function loadStoredPlatformLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const storedLocale = readStoredPlatformLocaleValue()
  return storedLocale === 'zh' ? 'zh' : 'en'
}

export function loadStoredSurfaceMode(): PlatformSurfaceMode {
  if (typeof window === 'undefined') return 'dark'
  const storedSurfaceMode = readStoredSurfaceModeValue()
  return storedSurfaceMode === 'light' ? 'light' : 'dark'
}
