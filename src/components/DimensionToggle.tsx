import type { MapKind } from '../math/types.ts'
import { Formula } from '../core/ui/Formula.tsx'
import { appCopy } from '../i18n.ts'
import type { Locale } from '../i18n.ts'

type Props = {
  value: MapKind
  onChange: (value: MapKind) => void
  locale?: Locale
}

const options: Array<{ value: MapKind; label: string }> = [
  { value: '2-2', label: '\\mathbb{R}^2 \\to \\mathbb{R}^2' },
  { value: '3-3', label: '\\mathbb{R}^3 \\to \\mathbb{R}^3' },
  { value: '3-2', label: '\\mathbb{R}^3 \\to \\mathbb{R}^2' },
  { value: '2-3', label: '\\mathbb{R}^2 \\to \\mathbb{R}^3' },
]

export function DimensionToggle({ value, onChange, locale = 'en' }: Props) {
  const copy = appCopy[locale].explanation

  return (
    <section className="panel-section">
      <div className="section-heading">
        <h2>{copy.mappingType}</h2>
      </div>
      <div className="segmented segmented-grid" role="group" aria-label={copy.mappingAria}>
        {options.map((option) => (
          <button
            key={option.value}
            className={option.value === value ? 'active' : ''}
            type="button"
            title={copy.mappingHints[option.value]}
            onClick={() => onChange(option.value)}
          >
            <span><Formula tex={option.label} /></span>
            <small>{copy.mappingHints[option.value]}</small>
          </button>
        ))}
      </div>
    </section>
  )
}
