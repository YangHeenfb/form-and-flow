import { createContext, useContext, type Dispatch, type SetStateAction } from 'react'
import type { Locale } from '../i18n.ts'

export type PlatformSurfaceMode = 'dark' | 'light'

export const platformLocaleStorageKey = 'visual-math-lab-locale'
export const platformSurfaceStorageKey = 'visual-math-lab-surface-mode'
export const platformLocaleEventName = 'visual-math-lab-locale'
export const platformSurfaceModeEventName = 'visual-math-lab-surface-mode'

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

export function loadStoredPlatformLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  return localStorage.getItem(platformLocaleStorageKey) === 'zh' ? 'zh' : 'en'
}

export function loadStoredSurfaceMode(): PlatformSurfaceMode {
  if (typeof window === 'undefined') return 'dark'
  return localStorage.getItem(platformSurfaceStorageKey) === 'light' ? 'light' : 'dark'
}
