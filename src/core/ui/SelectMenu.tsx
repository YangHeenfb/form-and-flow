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

  const moveSelection = (direction: 1 | -1) => {
    const enabled = options.filter((option) => !option.disabled)
    const selectedIndex = enabled.findIndex((option) => option.value === value)
    const next = enabled[(selectedIndex + direction + enabled.length) % enabled.length]
    if (next) onChange(next.value)
  }

  return (
    <div className={`select-menu${className ? ` ${className}` : ''}`} ref={rootRef}>
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
            else moveSelection(1)
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            if (!open) setOpen(true)
            else moveSelection(-1)
          }
        }}
      >
        <span className="select-menu-value">{selected?.label}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div className="select-menu-popover" role="listbox" id={listboxId} aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              type="button"
              key={String(option.value)}
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
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
