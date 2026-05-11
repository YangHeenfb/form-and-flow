import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import type { AppCopy } from '../i18n.ts'
import { canonicalBridgeMatrix } from '../math/matrix.ts'
import type { LinearMap, SpaceDim } from '../math/types.ts'

type Props = {
  copy: AppCopy['matrixInput']
  map: LinearMap
  index: number
  canMoveUp: boolean
  canMoveDown: boolean
  onChange: (map: LinearMap) => void
  onDelete: () => void
  onMove: (direction: -1 | 1) => void
}

const dims: SpaceDim[] = [2, 3]

export function MatrixInput({ copy, map, index, canMoveUp, canMoveDown, onChange, onDelete, onMove }: Props) {
  const setEntry = (row: number, col: number, value: number) => {
    onChange({
      ...map,
      matrix: map.matrix.map((matrixRow, rowIndex) =>
        rowIndex === row ? matrixRow.map((entry, colIndex) => (colIndex === col ? value : entry)) : matrixRow,
      ),
    })
  }

  const setDims = (inputDim: SpaceDim, outputDim: SpaceDim) => {
    onChange({
      ...map,
      inputDim,
      outputDim,
      matrix: canonicalBridgeMatrix(outputDim, inputDim),
    })
  }

  return (
    <article className="matrix-card">
      <header className="matrix-card-header">
        <div>
          <strong>{map.name}</strong>
          <span>{map.outputDim}x{map.inputDim}</span>
        </div>
        <div className="icon-row">
          <button type="button" aria-label={copy.moveUp(map.name)} disabled={!canMoveUp} onClick={() => onMove(-1)}>
            <ArrowUp size={16} />
          </button>
          <button type="button" aria-label={copy.moveDown(map.name)} disabled={!canMoveDown} onClick={() => onMove(1)}>
            <ArrowDown size={16} />
          </button>
          <button type="button" aria-label={copy.deleteMap(map.name)} onClick={onDelete}>
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      <div className="dim-selectors">
        <label>
          {copy.input}
          <select value={map.inputDim} onChange={(event) => setDims(Number(event.target.value) as SpaceDim, map.outputDim)}>
            {dims.map((dim) => (
              <option key={dim} value={dim}>R{dim}</option>
            ))}
          </select>
        </label>
        <label>
          {copy.output}
          <select value={map.outputDim} onChange={(event) => setDims(map.inputDim, Number(event.target.value) as SpaceDim)}>
            {dims.map((dim) => (
              <option key={dim} value={dim}>R{dim}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="matrix-grid" style={{ gridTemplateColumns: `repeat(${map.inputDim}, minmax(0, 1fr))` }}>
        {map.matrix.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <label key={`${map.id}-${rowIndex}-${colIndex}`}>
              <span>a{rowIndex + 1}{colIndex + 1}</span>
              <input
                type="number"
                step="0.5"
                value={Number.isFinite(value) ? value : 0}
                onChange={(event) => setEntry(rowIndex, colIndex, Number(event.target.value))}
              />
            </label>
          )),
        )}
      </div>
      <p className="muted compact">{copy.stepNote(index + 1)}</p>
    </article>
  )
}
