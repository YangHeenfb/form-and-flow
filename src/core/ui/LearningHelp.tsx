import { useEffect, useRef, type ReactNode } from 'react'
import { BookOpen, CircleHelp, X } from 'lucide-react'
import { renderMathText } from './Formula.tsx'

export type HelpSection = {
  title: string
  body?: ReactNode
  items?: ReactNode[]
}

export type HelpTopic = {
  eyebrow?: string
  title: string
  summary?: ReactNode
  sections: HelpSection[]
}

type HelpTriggerProps = {
  children: ReactNode
  onClick: () => void
  variant?: 'default' | 'graph'
  ariaLabel?: string
}

export function HelpTrigger({ children, onClick, variant = 'default', ariaLabel }: HelpTriggerProps) {
  const Icon = variant === 'graph' ? CircleHelp : BookOpen
  return (
    <button className={`learning-help-trigger learning-help-trigger-${variant}`} type="button" aria-label={ariaLabel} onClick={onClick}>
      <Icon size={16} />
      <span>{children}</span>
    </button>
  )
}

export function TermButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button className="concept-term" type="button" onClick={onClick}>
      {children}
    </button>
  )
}

export function LearningDrawer({
  topic,
  closeLabel,
  onClose,
}: {
  topic: HelpTopic | null
  closeLabel: string
  onClose: () => void
}) {
  const drawerRef = useRef<HTMLElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!topic) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = getFocusableElements(drawerRef.current)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    window.setTimeout(() => closeRef.current?.focus(), 0)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [onClose, topic])

  if (!topic) return null

  return (
    <div className="learning-drawer-backdrop" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <aside ref={drawerRef} className="learning-drawer" role="dialog" aria-modal="true" aria-labelledby="learning-drawer-title">
        <div className="learning-drawer-header">
          <div>
            {topic.eyebrow && <p className="eyebrow">{topic.eyebrow}</p>}
            <h2 id="learning-drawer-title">{renderMathText(topic.title)}</h2>
          </div>
          <button ref={closeRef} className="learning-drawer-close" type="button" aria-label={closeLabel} title={closeLabel} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {topic.summary && <div className="learning-drawer-summary">{renderMathText(topic.summary)}</div>}
        <div className="learning-drawer-sections">
          {topic.sections.map((section) => (
            <section className="learning-help-section" key={section.title}>
              <h3>{renderMathText(section.title)}</h3>
              {section.body && <div className="learning-help-body">{renderMathText(section.body)}</div>}
              {section.items && (
                <ul>
                  {section.items.map((item, index) => (
                    <li key={index}>{renderMathText(item)}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </aside>
    </div>
  )
}

function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return []
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true')
}
