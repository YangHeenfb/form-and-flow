import { Trash2 } from 'lucide-react'
import type { AppCopy } from '../i18n.ts'
import type { SpaceDim, VectorState } from '../math/types.ts'
import { resizeVector } from '../math/vector.ts'

type Props = {
  copy: AppCopy['vectorInput']
  vector: VectorState
  requiredDim: SpaceDim
  canDelete: boolean
  onChange: (vector: VectorState) => void
  onDelete: () => void
}

export function VectorInput({ copy, vector, requiredDim, canDelete, onChange, onDelete }: Props) {
  const setValue = (index: number, value: number) => {
    onChange({
      ...vector,
      dim: requiredDim,
      values: resizeVector(vector.values, requiredDim).map((entry, entryIndex) => (entryIndex === index ? value : entry)),
    })
  }

  return (
    <article className="vector-row">
      <label className="color-dot-label" title={copy.colorTitle}>
        <input
          type="color"
          value={vector.color ?? '#c88cff'}
          onChange={(event) => onChange({ ...vector, color: event.target.value })}
        />
        <span style={{ background: vector.color ?? '#c88cff' }} />
      </label>
      <strong>{vector.name}</strong>
      {Array.from({ length: requiredDim }, (_, index) => (
        <label key={`${vector.id}-${index}`}>
          <span>{['x', 'y', 'z'][index]}</span>
          <input
            type="number"
            step="0.5"
            value={resizeVector(vector.values, requiredDim)[index]}
            onChange={(event) => setValue(index, Number(event.target.value))}
          />
        </label>
      ))}
      <button type="button" aria-label={copy.deleteVector(vector.name)} disabled={!canDelete} onClick={onDelete}>
        <Trash2 size={16} />
      </button>
    </article>
  )
}
