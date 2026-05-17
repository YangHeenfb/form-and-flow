import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Focus } from 'lucide-react'
import { hudIdleDelayMs, loadAutoHideHud, saveAutoHideHud } from './autoHideHud.ts'
import { useModuleActions } from './ModuleActionContext.tsx'
import { usePlatformLocale } from './platformLocale.tsx'
import './ModuleFocusFrame.css'

type ModuleFocusFrameRenderProps = {
  isFocusMode: boolean
  focusButton: ReactNode
  autoHideToggle: ReactNode
  onFocusPanelActiveChange: (active: boolean) => void
  enterFocus: () => void
  exitFocus: () => void
  toggleFocus: () => void
}

type ModuleFocusFrameProps = {
  children: (props: ModuleFocusFrameRenderProps) => ReactNode
}

export function ModuleFocusFrame({ children }: ModuleFocusFrameProps) {
  const { locale } = usePlatformLocale()
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [autoHideHud, setAutoHideHud] = useState(loadAutoHideHud)
  const [hudVisible, setHudVisible] = useState(true)
  const [hudActivityCount, setHudActivityCount] = useState(0)
  const [isFocusPanelActive, setIsFocusPanelActive] = useState(false)
  const labels = focusLabels[locale]

  const revealHud = useCallback(() => {
    setHudVisible(true)
    setHudActivityCount((count) => count + 1)
  }, [])

  const enterFocus = useCallback(() => {
    setIsFocusMode(true)
    revealHud()
  }, [revealHud])
  const exitFocus = useCallback(() => {
    setIsFocusMode(false)
    setIsFocusPanelActive(false)
    revealHud()
  }, [revealHud])
  const toggleFocus = useCallback(() => {
    if (isFocusMode) {
      exitFocus()
      return
    }
    enterFocus()
  }, [enterFocus, exitFocus, isFocusMode])
  const handleFocusPanelActiveChange = useCallback((active: boolean) => {
    setIsFocusPanelActive(active)
  }, [])

  const moduleActions = useMemo(
    () => ({
      isVisualizationExpanded: isFocusMode,
    }),
    [isFocusMode],
  )
  useModuleActions(moduleActions)

  useEffect(() => {
    saveAutoHideHud(autoHideHud)
  }, [autoHideHud])

  useEffect(() => {
    if (!isFocusMode || !autoHideHud || isFocusPanelActive) {
      setHudVisible(true)
      return
    }
    const timer = window.setTimeout(() => setHudVisible(false), hudIdleDelayMs)
    return () => window.clearTimeout(timer)
  }, [autoHideHud, hudActivityCount, isFocusMode, isFocusPanelActive])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return
      }
      if (event.key === 'Escape' && isFocusMode) {
        event.preventDefault()
        exitFocus()
        return
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        toggleFocus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [exitFocus, isFocusMode, toggleFocus])

  const label = isFocusMode ? labels.exitFocus : labels.focus
  const isHudHidden = isFocusMode && autoHideHud && !hudVisible && !isFocusPanelActive
  const focusButton = (
    <button
      className="module-focus-toggle"
      type="button"
      aria-label={label}
      aria-pressed={isFocusMode}
      title={label}
      onClick={toggleFocus}
    >
      <Focus size={16} />
      {label}
    </button>
  )
  const autoHideToggle = isFocusMode ? (
    <label className="visualization-autohide-toggle">
      <input
        type="checkbox"
        checked={autoHideHud}
        onChange={(event) => {
          setAutoHideHud(event.target.checked)
          revealHud()
        }}
      />
      {labels.autoHideUi}
    </label>
  ) : null

  return (
    <div
      className={[
        'module-focus-frame',
        isFocusMode ? 'is-focus' : '',
        isHudHidden ? 'visualization-hud-hidden' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-focus-mode={isFocusMode ? 'focus' : 'standard'}
      onPointerMove={isFocusMode ? revealHud : undefined}
      onTouchStart={isFocusMode ? revealHud : undefined}
      onFocusCapture={isFocusMode ? revealHud : undefined}
    >
      {children({
        isFocusMode,
        focusButton,
        autoHideToggle,
        onFocusPanelActiveChange: handleFocusPanelActiveChange,
        enterFocus,
        exitFocus,
        toggleFocus,
      })}
    </div>
  )
}

const focusLabels = {
  en: {
    focus: 'Focus',
    exitFocus: 'Exit focus',
    autoHideUi: 'Auto-hide UI',
  },
  zh: {
    focus: '专注视图',
    exitFocus: '退出专注视图',
    autoHideUi: '自动隐藏界面控件',
  },
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tagName = target.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable
}
