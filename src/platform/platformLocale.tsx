import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { Locale } from '../i18n.ts'

export type PlatformSurfaceMode = 'dark' | 'light'

export const platformLocaleStorageKey = 'form-and-flow-locale'
export const platformSurfaceStorageKey = 'form-and-flow-surface-mode'
export const platformLocaleEventName = 'form-and-flow-locale'

const legacyPlatformLocaleStorageKey = 'visual-math-lab-locale'
const legacyPlatformSurfaceStorageKey = 'visual-math-lab-surface-mode'
const matrixThemeStorageKeys = ['form-and-flow-matrix-theme', 'matrix-motion-lab-theme'] as const

type PlatformLocaleContextValue = {
  locale: Locale
  setLocale: Dispatch<SetStateAction<Locale>>
}

type PlatformSurfaceModeContextValue = {
  surfaceMode: PlatformSurfaceMode
  setSurfaceMode: Dispatch<SetStateAction<PlatformSurfaceMode>>
}

const noopSetLocale: Dispatch<SetStateAction<Locale>> = () => undefined
const noopSetSurfaceMode: Dispatch<SetStateAction<PlatformSurfaceMode>> = () => undefined

export const PlatformLocaleContext = createContext<PlatformLocaleContextValue>({
  locale: 'en',
  setLocale: noopSetLocale,
})

const PlatformSurfaceModeContext = createContext<PlatformSurfaceModeContextValue | null>(null)
const fallbackSurfaceModeContext: PlatformSurfaceModeContextValue = {
  surfaceMode: 'light',
  setSurfaceMode: noopSetSurfaceMode,
}

export function usePlatformLocale(): PlatformLocaleContextValue {
  return useContext(PlatformLocaleContext)
}

export function PlatformSurfaceModeProvider({ children }: { children: ReactNode }) {
  const [surfaceMode, setSurfaceMode] = useState<PlatformSurfaceMode>(() => loadStoredSurfaceMode())

  useEffect(() => {
    localStorage.setItem(platformSurfaceStorageKey, surfaceMode)
  }, [surfaceMode])

  const value = useMemo(() => ({ surfaceMode, setSurfaceMode }), [surfaceMode])
  return <PlatformSurfaceModeContext.Provider value={value}>{children}</PlatformSurfaceModeContext.Provider>
}

export function usePlatformSurfaceMode(): PlatformSurfaceModeContextValue {
  return useContext(PlatformSurfaceModeContext) ?? fallbackSurfaceModeContext
}

export function useOptionalPlatformSurfaceMode(): PlatformSurfaceModeContextValue | null {
  return useContext(PlatformSurfaceModeContext)
}

export function readStoredPlatformLocaleValue(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(platformLocaleStorageKey) ?? localStorage.getItem(legacyPlatformLocaleStorageKey)
}

export function readStoredSurfaceModeValue(): string | null {
  if (typeof window === 'undefined') return null
  const platformValue = localStorage.getItem(platformSurfaceStorageKey) ?? localStorage.getItem(legacyPlatformSurfaceStorageKey)
  if (platformValue) return platformValue

  for (const key of matrixThemeStorageKeys) {
    const raw = localStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as { surfaceMode?: unknown }
      if (parsed.surfaceMode === 'dark' || parsed.surfaceMode === 'light') return parsed.surfaceMode
    } catch {
      // Ignore stale or malformed legacy preferences and keep the safe light default.
    }
  }
  return null
}

export function loadStoredPlatformLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const storedLocale = readStoredPlatformLocaleValue()
  return storedLocale === 'zh' ? 'zh' : 'en'
}

export function loadStoredSurfaceMode(): PlatformSurfaceMode {
  if (typeof window === 'undefined') return 'light'
  const storedSurfaceMode = readStoredSurfaceModeValue()
  return storedSurfaceMode === 'dark' ? 'dark' : 'light'
}
