import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import type { AppCopy } from '../i18n.ts'
import { Formula } from '../core/ui/Formula.tsx'
import { SelectMenu } from '../core/ui/SelectMenu.tsx'
import { indexedNameTex, spaceTex } from '../core/ui/mathNotation.ts'
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
const dimensionOptions = dims.map((dim) => ({
  value: dim,
  textValue: `R${dim}`,
  label: <Formula tex={spaceTex(dim)} />,
}))

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
          <strong>
            <Formula tex={indexedNameTex(map.name)} />
          </strong>
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
          <SelectMenu
            value={map.inputDim}
            options={dimensionOptions}
            onChange={(next) => setDims(next, map.outputDim)}
            ariaLabel={copy.input}
          />
        </label>
        <label>
          {copy.output}
          <SelectMenu
            value={map.outputDim}
            options={dimensionOptions}
            onChange={(next) => setDims(map.inputDim, next)}
            ariaLabel={copy.output}
          />
        </label>
      </div>

      <div className="matrix-grid" style={{ gridTemplateColumns: `repeat(${map.inputDim}, minmax(0, 1fr))` }}>
        {map.matrix.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <label key={`${map.id}-${rowIndex}-${colIndex}`}>
              <span>
                <Formula tex={`a_{${rowIndex + 1}${colIndex + 1}}`} />
              </span>
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
