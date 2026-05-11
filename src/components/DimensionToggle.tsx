import type { MapKind } from '../math/types.ts'

type Props = {
  value: MapKind
  onChange: (value: MapKind) => void
}

const options: Array<{ value: MapKind; label: string; hint: string }> = [
  { value: '2-2', label: 'R2 → R2', hint: '2x2 square map' },
  { value: '3-3', label: 'R3 → R3', hint: '3x3 square map' },
  { value: '3-2', label: 'R3 → R2', hint: '2x3 compression' },
  { value: '2-3', label: 'R2 → R3', hint: '3x2 embedding' },
]

export function DimensionToggle({ value, onChange }: Props) {
  return (
    <section className="panel-section">
      <div className="section-heading">
        <h2>Mapping Type</h2>
      </div>
      <div className="segmented segmented-grid" role="group" aria-label="Mapping type">
        {options.map((option) => (
          <button
            key={option.value}
            className={option.value === value ? 'active' : ''}
            type="button"
            title={option.hint}
            onClick={() => onChange(option.value)}
          >
            <span>{option.label}</span>
            <small>{option.hint}</small>
          </button>
        ))}
      </div>
    </section>
  )
}
