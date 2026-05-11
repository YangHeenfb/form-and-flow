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
import { formatNumber } from '../math/vector.ts'
import { Formula } from '../core/ui/Formula.tsx'
import { indexedNameTex, spaceTex } from '../core/ui/mathNotation.ts'

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
                <dd><Formula tex={spaceTex(composedMap.inputDim)} /></dd>
              </div>
              <div>
                <dt>{copy.outputDimension}</dt>
                <dd><Formula tex={spaceTex(composedMap.outputDim)} /></dd>
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
                  <Formula tex={`${indexedNameTex(vector.name)}:${vectorToTex(vector.values)}\\to${vectorToTex(output)}`} />
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
  const labelTex = `${spaceTex(inputDim)}\\to${spaceTex(outputDim)}`
  const hint = copy.mappingHints[current as keyof typeof copy.mappingHints]

  return (
    <section className="info-card mapping-type-card" aria-label={copy.mappingAria}>
      <h2>{copy.mappingType}</h2>
      <div className="mapping-type-readonly compact-current" role="status">
        <div className="active">
          <strong>
            <Formula tex={labelTex} />
          </strong>
          <span>{hint}</span>
        </div>
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
          <Formula tex={`\\det(T)=${formatNumber(det, 4)}`} />
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
          <Formula tex={`T(\\mathbf{${['i', 'j', 'k'][index]}})=${vectorToTex(vector)}`} />
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
      <Formula tex={matrixToTex(matrix)} block />
    </div>
  )
}

function matrixToTex(matrix: number[][]): string {
  return `\\begin{bmatrix}${matrix.map((row) => row.map((value) => formatNumber(value, 3)).join(' & ')).join(' \\\\ ')}\\end{bmatrix}`
}

function vectorToTex(vector: number[]): string {
  return `\\begin{bmatrix}${vector.map((value) => formatNumber(value, 3)).join(' \\\\ ')}\\end{bmatrix}`
}
