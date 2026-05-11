import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ExplanationPanel } from '../components/ExplanationPanel.tsx'
import {
  applyMatrixToVector,
  composeLinearMapsInUserOrder,
  composeMatricesInUserOrder,
  determinant2,
  determinant3,
  getBasisVectors,
  getBasisVectorsForMap,
  identityMatrix,
  inverse2,
  multiplyMatrices,
  nullity,
  rank,
  validateMapSequence,
  validateVectorDimension,
} from '../math/matrix.ts'
import { presetsR3ToR2 } from '../math/presets3d.ts'
import type { LinearMap } from '../math/types.ts'

describe('matrix math', () => {
  it('identity matrix does not change a vector', () => {
    expect(applyMatrixToVector(identityMatrix(3), [2, -1, 4])).toEqual([2, -1, 4])
  })

  it('calculates a 2D determinant correctly', () => {
    expect(determinant2([
      [3, 8],
      [4, 6],
    ])).toBe(-14)
  })

  it('calculates a 3D determinant correctly', () => {
    expect(determinant3([
      [6, 1, 1],
      [4, -2, 5],
      [2, 8, 7],
    ])).toBe(-306)
  })

  it('applies a matrix to a 2D vector correctly', () => {
    expect(applyMatrixToVector([
      [2, 1],
      [0, 3],
    ], [4, 5])).toEqual([13, 15])
  })

  it('applies a matrix to a 3D vector correctly', () => {
    expect(applyMatrixToVector([
      [1, 0, 2],
      [0, 1, -1],
      [3, 0, 1],
    ], [2, 4, 5])).toEqual([12, -1, 11])
  })

  it('multiplies matrices correctly', () => {
    expect(multiplyMatrices([
      [1, 2, 3],
      [4, 5, 6],
    ], [
      [7, 8],
      [9, 10],
      [11, 12],
    ])).toEqual([
      [58, 64],
      [139, 154],
    ])
  })

  it('user order [A, B] means first A then B, so composition is BA', () => {
    const A = [
      [2, 0],
      [0, 1],
    ]
    const B = [
      [1, 1],
      [0, 1],
    ]
    expect(composeMatricesInUserOrder([A, B])).toEqual(multiplyMatrices(B, A))
  })

  it('user order [A, B, C] means first A then B then C, so composition is CBA', () => {
    const A = [
      [2, 0],
      [0, 1],
    ]
    const B = [
      [1, 1],
      [0, 1],
    ]
    const C = [
      [0, -1],
      [1, 0],
    ]
    expect(composeMatricesInUserOrder([A, B, C])).toEqual(multiplyMatrices(C, multiplyMatrices(B, A)))
  })

  it('returns 2D basis vectors as matrix columns', () => {
    expect(getBasisVectors([
      [1, 2],
      [3, 4],
    ])).toEqual([
      [1, 3],
      [2, 4],
    ])
  })

  it('returns 3D basis vectors as matrix columns', () => {
    expect(getBasisVectors([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ])).toEqual([
      [1, 4, 7],
      [2, 5, 8],
      [3, 6, 9],
    ])
  })

  it('identifies a singular 2D matrix as not invertible', () => {
    expect(inverse2([
      [1, 2],
      [2, 4],
    ])).toBeNull()
  })
})

describe('rectangular linear maps', () => {
  const A: LinearMap = {
    id: 'A',
    name: 'A',
    inputDim: 3,
    outputDim: 2,
    matrix: [
      [1, 2, 3],
      [4, 5, 6],
    ],
  }
  const B: LinearMap = {
    id: 'B',
    name: 'B',
    inputDim: 2,
    outputDim: 2,
    matrix: [
      [2, 0],
      [0, 3],
    ],
  }
  const C: LinearMap = {
    id: 'C',
    name: 'C',
    inputDim: 3,
    outputDim: 3,
    matrix: identityMatrix(3),
  }

  it('maps a 2x3 matrix from R3 to R2 correctly', () => {
    expect(applyMatrixToVector(A.matrix, [1, 2, 3])).toEqual([14, 32])
  })

  it('maps a 3x2 matrix from R2 to R3 correctly', () => {
    expect(applyMatrixToVector([
      [1, 0],
      [0, 1],
      [0.5, 0.5],
    ], [2, 4])).toEqual([2, 4, 3])
  })

  it('Drop z preset maps (x, y, z) to (x, y)', () => {
    const dropZ = presetsR3ToR2.find((preset) => preset.name === 'Drop z')
    expect(dropZ).toBeTruthy()
    expect(applyMatrixToVector(dropZ!.matrix, [3, 4, 5])).toEqual([3, 4])
  })

  it('does not display determinant for an R3 to R2 matrix', () => {
    const validation = validateMapSequence([A])
    const html = renderToStaticMarkup(
      <ExplanationPanel maps={[A]} composedMap={A} stepMaps={[A]} vectors={[]} validation={validation} />,
    )
    expect(html.toLowerCase()).not.toContain('determinant')
  })

  it('displays rank and nullity for non-square matrices', () => {
    const validation = validateMapSequence([A])
    const html = renderToStaticMarkup(
      <ExplanationPanel maps={[A]} composedMap={A} stepMaps={[A]} vectors={[]} validation={validation} />,
    )
    expect(html).toContain('Rank And Nullity')
    expect(rank(A.matrix)).toBe(2)
    expect(nullity(A.matrix, A.inputDim)).toBe(1)
  })

  it('accepts sequence [A: R3 to R2, B: R2 to R2]', () => {
    expect(validateMapSequence([A, B]).valid).toBe(true)
  })

  it('rejects sequence [A: R3 to R2, C: R3 to R3]', () => {
    expect(validateMapSequence([A, C]).valid).toBe(false)
  })

  it('composes [A: R3 to R2, B: R2 to R2] as BA with shape 2x3', () => {
    const composed = composeLinearMapsInUserOrder([A, B])
    expect(composed?.matrix).toEqual(multiplyMatrices(B.matrix, A.matrix))
    expect(composed?.outputDim).toBe(2)
    expect(composed?.inputDim).toBe(3)
    expect(composed?.matrix.length).toBe(2)
    expect(composed?.matrix[0].length).toBe(3)
  })

  it('basis vectors for a 2x3 matrix are its three columns in R2', () => {
    expect(getBasisVectorsForMap(A)).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ])
  })

  it('requires vector input dimension to match the first matrix input dimension', () => {
    expect(validateVectorDimension([1, 2, 3], A.inputDim).valid).toBe(true)
    expect(validateVectorDimension([1, 2], A.inputDim).valid).toBe(false)
  })
})
