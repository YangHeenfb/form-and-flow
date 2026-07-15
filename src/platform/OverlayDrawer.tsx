import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { OverlayPanelSide } from './visualizationLayoutTypes.ts'

type OverlayDrawerProps = {
  className?: string
  title: string
  side?: OverlayPanelSide
  children: ReactNode
  closeLabel: string
  onClose: () => void
}

export function OverlayDrawer({ className, title, side = 'right', children, closeLabel, onClose }: OverlayDrawerProps) {
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const titleId = useId()
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    titleRef.current?.focus()
    return () => previousFocusRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <aside
      className={['visualization-overlay-drawer', side, className].filter(Boolean).join(' ')}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <header className="visualization-drawer-header">
        <h2 id={titleId} ref={titleRef} tabIndex={-1}>
          {title}
        </h2>
        <button className="visualization-icon-button" type="button" aria-label={closeLabel} title={closeLabel} onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      <div className="visualization-drawer-body">{children}</div>
    </aside>
  )
}
