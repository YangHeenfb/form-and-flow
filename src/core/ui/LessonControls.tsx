import type { ReactNode } from 'react'
import { SelectMenu, type SelectMenuOption } from './SelectMenu.tsx'

export function RangeField({
  label,
  accessibleLabel,
  value,
  min,
  max,
  step,
  onChange,
  className = 'range-control',
  valueSuffix,
  valueFormatter = defaultNumberFormat,
  hint,
}: {
  label: ReactNode
  accessibleLabel?: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  className?: string
  valueSuffix?: string
  valueFormatter?: (value: number) => string
  hint?: ReactNode
}) {
  return (
    <label className={className}>
      <span className="range-label">
        {label}: <strong>{valueFormatter(value)}{valueSuffix}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={accessibleLabel}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint && <small className="control-hint">{hint}</small>}
    </label>
  )
}

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  ariaLabel,
  className = 'control-field',
}: {
  label: ReactNode
  value: T
  options: SelectMenuOption<T>[]
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
}) {
  return (
    <div className={className}>
      <span>{label}</span>
      <SelectMenu value={value} options={options} onChange={onChange} ariaLabel={ariaLabel} />
    </div>
  )
}

export function ToggleField({
  label,
  checked,
  onChange,
  className = 'toggle-row',
}: {
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}) {
  return (
    <label className={className}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export function PlaybackProgress({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const progress = Math.max(0, Math.min(1, value))
  return (
    <label className="playback-progress-control">
      <span>{label}</span>
      <input type="range" min={0} max={1} step={0.001} value={progress} aria-label={label} onChange={(event) => onChange(Number(event.target.value))} />
      <strong>{Math.round(progress * 100)}%</strong>
    </label>
  )
}

export function TransportRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`transport-buttons${className ? ` ${className}` : ''}`}>{children}</div>
}

export function ReadoutList({ rows }: { rows: Array<{ key?: string; label: ReactNode; value: ReactNode }> }) {
  return (
    <dl>
      {rows.map((row, index) => (
        <div key={row.key ?? String(index)}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function defaultNumberFormat(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)))
}
