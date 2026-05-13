import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Focus } from 'lucide-react'
import { useModuleActions } from './ModuleActionContext.tsx'
import { usePlatformLocale } from './platformLocale.tsx'
import './ModuleFocusFrame.css'

type ModuleFocusFrameRenderProps = {
  isFocusMode: boolean
  focusButton: ReactNode
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
  const labels = focusLabels[locale]

  const enterFocus = useCallback(() => setIsFocusMode(true), [])
  const exitFocus = useCallback(() => setIsFocusMode(false), [])
  const toggleFocus = useCallback(() => setIsFocusMode((current) => !current), [])

  const moduleActions = useMemo(
    () => ({
      isVisualizationExpanded: isFocusMode,
    }),
    [isFocusMode],
  )
  useModuleActions(moduleActions)

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

  return (
    <div className={`module-focus-frame${isFocusMode ? ' is-focus' : ''}`} data-focus-mode={isFocusMode ? 'focus' : 'standard'}>
      {children({ isFocusMode, focusButton, enterFocus, exitFocus, toggleFocus })}
    </div>
  )
}

const focusLabels = {
  en: {
    focus: 'Focus',
    exitFocus: 'Exit focus',
  },
  zh: {
    focus: '专注视图',
    exitFocus: '退出专注视图',
  },
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tagName = target.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable
}
