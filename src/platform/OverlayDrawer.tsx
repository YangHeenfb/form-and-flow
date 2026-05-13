import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { OverlayPanelSide } from './visualizationLayoutTypes.ts'

type OverlayDrawerProps = {
  title: string
  side?: OverlayPanelSide
  children: ReactNode
  closeLabel: string
  onClose: () => void
}

export function OverlayDrawer({ title, side = 'right', children, closeLabel, onClose }: OverlayDrawerProps) {
  const titleRef = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <aside
      className={`visualization-overlay-drawer ${side}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="visualization-overlay-title"
    >
      <header className="visualization-drawer-header">
        <h2 id="visualization-overlay-title" ref={titleRef} tabIndex={-1}>
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
