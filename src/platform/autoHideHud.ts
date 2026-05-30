export const autoHideStorageKey = 'form-and-flow-auto-hide-hud'
const legacyAutoHideStorageKey = 'visual-math-lab-auto-hide-hud'
export const hudIdleDelayMs = 2600

export function loadAutoHideHud(): boolean {
  if (typeof localStorage === 'undefined') {
    return false
  }

  try {
    return (localStorage.getItem(autoHideStorageKey) ?? localStorage.getItem(legacyAutoHideStorageKey)) === 'true'
  } catch {
    return false
  }
}

export function saveAutoHideHud(enabled: boolean): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    localStorage.setItem(autoHideStorageKey, JSON.stringify(enabled))
  } catch {
    // Ignore unavailable storage; the in-memory preference still works for this session.
  }
}
