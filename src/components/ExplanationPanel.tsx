import {
  applyMatrixToVector,
  determinant2,
  determinant3,
  getBasisVectorsForMap,
  isSquareMatrix,
  nullity,
  rank,
} from '../math/matrix.ts'
import { appCopy, translateValidationMessage } from '../i18n.ts'
import type { AppCopy, Locale } from '../i18n.ts'
import type { LinearMap, MapSequenceValidation, VectorState } from '../math/types.ts'
import { formatNumber, formatVector } from '../math/vector.ts'

type Props = {
  locale?: Locale
  maps: LinearMap[]
  composedMap: LinearMap | null
  stepMaps: LinearMap[]
  vectors: VectorState[]
  validation: MapSequenceValidation
}

type ExplanationCopy = AppCopy['explanation']

export function ExplanationPanel({ locale = 'en', maps, composedMap, stepMaps, vectors, validation }: Props) {
  const copy = appCopy[locale].explanation

  return (
    <aside className="right-panel">
      <MappingTypeCard copy={copy} maps={maps} composedMap={composedMap} />

      <section className="info-card">
        <h2>{copy.title}</h2>
        {validation.valid && composedMap ? (
          <p>
            {copy.sequence(
              maps.map((map) => map.name).join(', '),
              maps.map((map) => map.name).reverse().join(''),
              composedMap.inputDim,
              composedMap.outputDim,
            )}
          </p>
        ) : (
          <p>{copy.fixDimensions}</p>
        )}
      </section>

      {!validation.valid && (
        <section className="info-card danger">
          <h2>{copy.dimensionCheck}</h2>
          {validation.errors.map((error) => (
            <p key={error}>{translateValidationMessage(error, locale)}</p>
          ))}
        </section>
      )}

      {composedMap && validation.valid && (
        <>
          <section className="info-card">
            <h2>{copy.currentDimensions}</h2>
            <dl className="metric-list">
              <div>
                <dt>{copy.inputDimension}</dt>
                <dd>R{composedMap.inputDim}</dd>
              </div>
              <div>
                <dt>{copy.outputDimension}</dt>
                <dd>R{composedMap.outputDim}</dd>
              </div>
              <div>
                <dt>{copy.matrixShape}</dt>
                <dd>{composedMap.outputDim}x{composedMap.inputDim}</dd>
              </div>
            </dl>
          </section>

          <section className="info-card">
            <h2>{copy.finalMatrix}</h2>
            <MatrixBlock matrix={composedMap.matrix} />
          </section>

          <InvariantCard copy={copy} map={composedMap} />

          <section className="info-card">
            <h2>{copy.transformedBasis}</h2>
            <BasisList copy={copy} map={composedMap} />
          </section>

          <section className="info-card">
            <h2>{copy.transformedVectors}</h2>
            {vectors.map((vector) => {
              if (vector.dim !== composedMap.inputDim) {
                return (
                  <p key={vector.id} className="warning-text">
                    {copy.vectorMismatch(vector.name, vector.dim, composedMap.inputDim)}
                  </p>
                )
              }
              const output = applyMatrixToVector(composedMap.matrix, vector.values)
              return (
                <p key={vector.id}>
                  <strong>{vector.name}</strong>: {formatVector(vector.values)} → {formatVector(output)}
                </p>
              )
            })}
          </section>

          <section className="info-card">
            <h2>{copy.stepMatrices}</h2>
            <div className="step-list">
              {stepMaps.map((map, index) => (
                <div key={map.id}>
                  <strong>{copy.afterStep(index + 1)}</strong>
                  <MatrixBlock matrix={map.matrix} />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </aside>
  )
}

function MappingTypeCard({ copy, maps, composedMap }: { copy: ExplanationCopy; maps: LinearMap[]; composedMap: LinearMap | null }) {
  const inputDim = composedMap?.inputDim ?? maps[0]?.inputDim ?? 2
  const outputDim = composedMap?.outputDim ?? maps.at(-1)?.outputDim ?? inputDim
  const current = `${inputDim}-${outputDim}`
  const options = [
    { value: '2-2', label: 'R2 → R2', hint: copy.mappingHints['2-2'] },
    { value: '3-3', label: 'R3 → R3', hint: copy.mappingHints['3-3'] },
    { value: '3-2', label: 'R3 → R2', hint: copy.mappingHints['3-2'] },
    { value: '2-3', label: 'R2 → R3', hint: copy.mappingHints['2-3'] },
  ]

  return (
    <section className="info-card mapping-type-card" aria-label={copy.mappingAria}>
      <h2>{copy.mappingType}</h2>
      <div className="mapping-type-readonly" role="list">
        {options.map((option) => (
          <div key={option.value} className={option.value === current ? 'active' : ''} role="listitem" aria-current={option.value === current}>
            <strong>{option.label}</strong>
            <span>{option.hint}</span>
          </div>
        ))}
      </div>
      <p className="muted compact">{copy.mappingSummary}</p>
    </section>
  )
}

function InvariantCard({ copy, map }: { copy: ExplanationCopy; map: LinearMap }) {
  const square = isSquareMatrix(map.matrix)
  const matrixRank = rank(map.matrix)
  const matrixNullity = nullity(map.matrix, map.inputDim)

  if (square) {
    const det = map.inputDim === 2 ? determinant2(map.matrix) : determinant3(map.matrix)
    return (
      <section className="info-card">
        <h2>{map.inputDim === 2 ? copy.areaScale : copy.volumeScale}</h2>
        <p>
          {copy.determinant} = <strong>{formatNumber(det, 4)}</strong>
        </p>
        {Math.abs(det) < 1e-8 && <p className="warning-text">{copy.notInvertible}</p>}
        {det < 0 && <p className="warning-text">{copy.orientationFlipped}</p>}
      </section>
    )
  }

  return (
    <section className="info-card">
      <h2>{copy.rankAndNullity}</h2>
      <dl className="metric-list">
        <div>
          <dt>{copy.rank}</dt>
          <dd>{matrixRank}</dd>
        </div>
        <div>
          <dt>{copy.nullity}</dt>
          <dd>{matrixNullity}</dd>
        </div>
        <div>
          <dt>{copy.imageDimension}</dt>
          <dd>{matrixRank}</dd>
        </div>
      </dl>
      {map.inputDim === 3 && map.outputDim === 2 && <CompressionText copy={copy} rankValue={matrixRank} />}
    </section>
  )
}

function CompressionText({ copy, rankValue }: { copy: ExplanationCopy; rankValue: number }) {
  if (rankValue === 2) {
    return <p>{copy.compressionRank2}</p>
  }
  if (rankValue === 1) {
    return <p>{copy.compressionRank1}</p>
  }
  return <p>{copy.compressionRank0}</p>
}

function BasisList({ copy, map }: { copy: ExplanationCopy; map: LinearMap }) {
  const basis = getBasisVectorsForMap(map)
  return (
    <div>
      {basis.map((vector, index) => (
        <p key={`${map.id}-basis-${index}`}>
          T({['i', 'j', 'k'][index]}) = {formatVector(vector)}
        </p>
      ))}
      {map.outputDim === 2 && map.inputDim === 3 && (
        <p className="muted">{copy.r3ToR2BasisNote}</p>
      )}
      {map.outputDim === 3 && map.inputDim === 2 && (
        <p className="muted">{copy.r2ToR3BasisNote}</p>
      )}
    </div>
  )
}

function MatrixBlock({ matrix }: { matrix: number[][] }) {
  return (
    <div className="matrix-block">
      {matrix.map((row, rowIndex) => (
        <code key={`row-${rowIndex}`}>[{row.map((value) => formatNumber(value, 3)).join(', ')}]</code>
      ))}
    </div>
  )
}
