import { Plus } from 'lucide-react'
import type { AppCopy } from '../i18n.ts'
import type { SpaceDim, VectorState } from '../math/types.ts'
import { VectorInput } from './VectorInput.tsx'

type Props = {
  copy: AppCopy
  vectors: VectorState[]
  requiredDim: SpaceDim
  onAdd: () => void
  onUpdate: (id: string, updater: (vector: VectorState) => VectorState) => void
  onDelete: (id: string) => void
}

export function VectorPanel({ copy, vectors, requiredDim, onAdd, onUpdate, onDelete }: Props) {
  const mismatched = vectors.filter((vector) => vector.dim !== requiredDim)

  return (
    <section className="panel-section">
      <div className="section-heading">
        <h2>{copy.vectorPanel.title}</h2>
        <button className="mini-button" type="button" onClick={onAdd}>
          <Plus size={16} />
          {copy.vectorPanel.add}
        </button>
      </div>
      {mismatched.length > 0 && (
        <div className="warning-box">
          {mismatched.map((vector) => (
            <p key={vector.id}>{copy.vectorPanel.mismatch(vector.name, vector.dim, requiredDim)}</p>
          ))}
        </div>
      )}
      <div className="stack">
        {vectors.map((vector) => (
          <VectorInput
            key={vector.id}
            copy={copy.vectorInput}
            vector={vector}
            requiredDim={requiredDim}
            canDelete={vectors.length > 1}
            onChange={(next) => onUpdate(vector.id, () => next)}
            onDelete={() => onDelete(vector.id)}
          />
        ))}
      </div>
    </section>
  )
}
