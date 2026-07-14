import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

export type SelectMenuOption<T extends string | number> = {
  value: T
  label: ReactNode
  textValue: string
  disabled?: boolean
}

type Props<T extends string | number> = {
  value: T
  options: SelectMenuOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
  disabled?: boolean
}

export function SelectMenu<T extends string | number>({ value, options, onChange, ariaLabel, className, disabled = false }: Props<T>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const listboxId = useId()
  const selected = useMemo(() => options.find((option) => option.value === value) ?? options[0], [options, value])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value && !option.disabled))
    const frame = window.requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open, options, value])

  return (
    <div
      className={`select-menu${className ? ` ${className}` : ''}`}
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="select-menu-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (disabled) return
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (!open) setOpen(true)
            else focusAdjacentOption(optionRefs.current, 1)
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            if (!open) setOpen(true)
            else focusAdjacentOption(optionRefs.current, -1)
          }
        }}
      >
        <span className="select-menu-value">{selected?.label}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="select-menu-popover"
          role="listbox"
          id={listboxId}
          aria-label={ariaLabel}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              focusAdjacentOption(optionRefs.current, event.key === 'ArrowDown' ? 1 : -1)
            } else if (event.key === 'Home' || event.key === 'End') {
              event.preventDefault()
              focusBoundaryOption(optionRefs.current, event.key === 'Home' ? 'first' : 'last')
            }
          }}
        >
          {options.map((option, index) => (
            <button
              ref={(node) => { optionRefs.current[index] = node }}
              type="button"
              key={String(option.value)}
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              tabIndex={option.value === value ? 0 : -1}
              className="select-menu-option"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
                buttonRef.current?.focus()
              }}
            >
              <span>{option.label}</span>
              <span className="select-menu-option-text">{option.textValue}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function focusAdjacentOption(options: Array<HTMLButtonElement | null>, direction: 1 | -1): void {
  const enabled = options.filter((option): option is HTMLButtonElement => Boolean(option && !option.disabled))
  if (enabled.length === 0) return
  const currentIndex = enabled.findIndex((option) => option === document.activeElement)
  const nextIndex = currentIndex < 0 ? 0 : (currentIndex + direction + enabled.length) % enabled.length
  enabled[nextIndex]?.focus()
}

function focusBoundaryOption(options: Array<HTMLButtonElement | null>, boundary: 'first' | 'last'): void {
  const enabled = options.filter((option): option is HTMLButtonElement => Boolean(option && !option.disabled))
  const target = boundary === 'first' ? enabled[0] : enabled.at(-1)
  target?.focus()
}
