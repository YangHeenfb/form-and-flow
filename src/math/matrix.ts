import type { LinearMap, MapSequenceValidation, MapValidation, Matrix, SpaceDim } from './types.ts'

export function identityMatrix(n: number): Matrix {
  return Array.from({ length: n }, (_, row) =>
    Array.from({ length: n }, (_, col) => (row === col ? 1 : 0)),
  )
}

export function zeroMatrix(rows: number, cols: number): Matrix {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))
}

export function matrixShape(matrix: Matrix): { rows: number; cols: number } {
  return {
    rows: matrix.length,
    cols: matrix[0]?.length ?? 0,
  }
}

export function isSquareMatrix(matrix: Matrix): boolean {
  const { rows, cols } = matrixShape(matrix)
  return rows > 0 && rows === cols && matrix.every((row) => row.length === cols)
}

export function multiplyMatrices(A: Matrix, B: Matrix): Matrix {
  const aShape = matrixShape(A)
  const bShape = matrixShape(B)
  if (aShape.cols !== bShape.rows) {
    throw new Error(`Cannot multiply ${aShape.rows}x${aShape.cols} by ${bShape.rows}x${bShape.cols}.`)
  }

  return Array.from({ length: aShape.rows }, (_, row) =>
    Array.from({ length: bShape.cols }, (_, col) =>
      A[row].reduce((sum, value, index) => sum + value * B[index][col], 0),
    ),
  )
}

export function applyMatrixToVector(A: Matrix, v: number[]): number[] {
  const { cols } = matrixShape(A)
  if (cols !== v.length) {
    throw new Error(`Matrix expects an R${cols} vector, but received R${v.length}.`)
  }
  return A.map((row) => row.reduce((sum, value, index) => sum + value * v[index], 0))
}

export function composeMatricesInUserOrder(matrices: Matrix[]): Matrix {
  if (matrices.length === 0) {
    throw new Error('At least one matrix is required.')
  }
  return matrices.slice(1).reduce((composed, next) => multiplyMatrices(next, composed), matrices[0])
}

export function composeLinearMapsInUserOrder(maps: LinearMap[]): LinearMap | null {
  const validation = validateMapSequence(maps)
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '))
  }
  if (maps.length === 0) {
    return null
  }
  const matrix = composeMatricesInUserOrder(maps.map((map) => map.matrix))
  return {
    id: 'composed',
    name: maps.map((map) => map.name).reverse().join(' · '),
    inputDim: maps[0].inputDim,
    outputDim: maps[maps.length - 1].outputDim,
    matrix,
  }
}

export function cumulativeLinearMapsInUserOrder(maps: LinearMap[]): LinearMap[] {
  const validation = validateMapSequence(maps)
  if (!validation.valid) {
    return []
  }

  return maps.map((map, index) => {
    const slice = maps.slice(0, index + 1)
    const composed = composeLinearMapsInUserOrder(slice)
    if (!composed) {
      throw new Error('Unexpected empty composition.')
    }
    return {
      ...composed,
      id: `step-${index + 1}`,
      name: `After ${map.name}`,
    }
  })
}

export function determinant2(A: Matrix): number {
  assertMatrixDimension(A, 2)
  return A[0][0] * A[1][1] - A[0][1] * A[1][0]
}

export function determinant3(A: Matrix): number {
  assertMatrixDimension(A, 3)
  const [a, b, c] = A[0]
  const [d, e, f] = A[1]
  const [g, h, i] = A[2]
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
}

export function inverse2(A: Matrix, epsilon = 1e-9): Matrix | null {
  const det = determinant2(A)
  if (Math.abs(det) < epsilon) {
    return null
  }
  return [
    [A[1][1] / det, -A[0][1] / det],
    [-A[1][0] / det, A[0][0] / det],
  ]
}

export function inverse3(A: Matrix, epsilon = 1e-9): Matrix | null {
  const det = determinant3(A)
  if (Math.abs(det) < epsilon) {
    return null
  }
  const m = A
  const cofactors: Matrix = [
    [
      m[1][1] * m[2][2] - m[1][2] * m[2][1],
      -(m[1][0] * m[2][2] - m[1][2] * m[2][0]),
      m[1][0] * m[2][1] - m[1][1] * m[2][0],
    ],
    [
      -(m[0][1] * m[2][2] - m[0][2] * m[2][1]),
      m[0][0] * m[2][2] - m[0][2] * m[2][0],
      -(m[0][0] * m[2][1] - m[0][1] * m[2][0]),
    ],
    [
      m[0][1] * m[1][2] - m[0][2] * m[1][1],
      -(m[0][0] * m[1][2] - m[0][2] * m[1][0]),
      m[0][0] * m[1][1] - m[0][1] * m[1][0],
    ],
  ]
  return transpose(cofactors).map((row) => row.map((value) => value / det))
}

export function transpose(A: Matrix): Matrix {
  const { rows, cols } = matrixShape(A)
  return Array.from({ length: cols }, (_, col) => Array.from({ length: rows }, (_, row) => A[row][col]))
}

export function lerpMatrix(A: Matrix, B: Matrix, t: number): Matrix {
  const aShape = matrixShape(A)
  const bShape = matrixShape(B)
  if (aShape.rows !== bShape.rows || aShape.cols !== bShape.cols) {
    throw new Error(`Cannot interpolate ${aShape.rows}x${aShape.cols} with ${bShape.rows}x${bShape.cols}.`)
  }
  const clamped = Math.max(0, Math.min(1, t))
  return A.map((row, rowIndex) => row.map((value, colIndex) => value + (B[rowIndex][colIndex] - value) * clamped))
}

export function smoothstep(t: number): number {
  const clamped = Math.max(0, Math.min(1, t))
  return clamped * clamped * (3 - 2 * clamped)
}

export function getBasisVectors(A: Matrix): number[][] {
  return transpose(A)
}

export function getBasisVectorsForMap(map: LinearMap): number[][] {
  return getBasisVectors(map.matrix)
}

export function validateMatrixDimension(A: Matrix, dimension: SpaceDim): MapValidation {
  const errors: string[] = []
  if (A.length !== dimension) {
    errors.push(`Expected ${dimension} rows, received ${A.length}.`)
  }
  A.forEach((row, index) => {
    if (row.length !== dimension) {
      errors.push(`Row ${index + 1} must contain ${dimension} values.`)
    }
  })
  if (!A.flat().every(Number.isFinite)) {
    errors.push('Every matrix entry must be a finite number.')
  }
  return { valid: errors.length === 0, errors }
}

function assertMatrixDimension(A: Matrix, dimension: SpaceDim): void {
  const validation = validateMatrixDimension(A, dimension)
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '))
  }
}

export function validateVectorDimension(v: number[], dimension: SpaceDim): MapValidation {
  const errors: string[] = []
  if (v.length !== dimension) {
    errors.push(`Vector must live in R${dimension}; received R${v.length}.`)
  }
  if (!v.every(Number.isFinite)) {
    errors.push('Every vector entry must be a finite number.')
  }
  return { valid: errors.length === 0, errors }
}

export function validateLinearMap(map: LinearMap): MapValidation {
  const errors: string[] = []
  if (map.inputDim !== 2 && map.inputDim !== 3) {
    errors.push(`${map.name} input dimension must be 2 or 3.`)
  }
  if (map.outputDim !== 2 && map.outputDim !== 3) {
    errors.push(`${map.name} output dimension must be 2 or 3.`)
  }
  if (map.matrix.length !== map.outputDim) {
    errors.push(`${map.name} must have ${map.outputDim} rows because outputDim is ${map.outputDim}.`)
  }
  map.matrix.forEach((row, index) => {
    if (row.length !== map.inputDim) {
      errors.push(`${map.name} row ${index + 1} must have ${map.inputDim} values.`)
    }
  })
  if (!map.matrix.flat().every(Number.isFinite)) {
    errors.push(`${map.name} contains a non-finite value.`)
  }
  return { valid: errors.length === 0, errors }
}

export function validateMapSequence(maps: LinearMap[]): MapSequenceValidation {
  const errors = maps.flatMap((map) => validateLinearMap(map).errors)
  maps.slice(1).forEach((map, index) => {
    const previous = maps[index]
    if (map.inputDim !== previous.outputDim) {
      errors.push(
        `${map.name} cannot follow ${previous.name}: ${map.name}.inputDim is ${map.inputDim}, but ${previous.name}.outputDim is ${previous.outputDim}.`,
      )
    }
  })
  return {
    valid: errors.length === 0,
    errors,
    inputDim: maps[0]?.inputDim,
    outputDim: maps.at(-1)?.outputDim,
  }
}

export function rank(matrix: Matrix, epsilon = 1e-9): number {
  const { rows, cols } = matrixShape(matrix)
  const work = matrix.map((row) => [...row])
  let pivotRow = 0

  for (let col = 0; col < cols && pivotRow < rows; col += 1) {
    let bestRow = pivotRow
    for (let row = pivotRow + 1; row < rows; row += 1) {
      if (Math.abs(work[row][col]) > Math.abs(work[bestRow][col])) {
        bestRow = row
      }
    }
    if (Math.abs(work[bestRow][col]) <= epsilon) {
      continue
    }
    ;[work[pivotRow], work[bestRow]] = [work[bestRow], work[pivotRow]]
    const pivot = work[pivotRow][col]
    for (let c = col; c < cols; c += 1) {
      work[pivotRow][c] /= pivot
    }
    for (let row = 0; row < rows; row += 1) {
      if (row === pivotRow) {
        continue
      }
      const factor = work[row][col]
      for (let c = col; c < cols; c += 1) {
        work[row][c] -= factor * work[pivotRow][c]
      }
    }
    pivotRow += 1
  }

  return pivotRow
}

export function nullity(matrix: Matrix, inputDim = matrixShape(matrix).cols, epsilon = 1e-9): number {
  return inputDim - rank(matrix, epsilon)
}

export function canonicalBridgeMatrix(outputDim: SpaceDim, inputDim: SpaceDim): Matrix {
  return Array.from({ length: outputDim }, (_, row) =>
    Array.from({ length: inputDim }, (_, col) => (row === col ? 1 : 0)),
  )
}

export function embeddedMatrixFor3D(matrix: Matrix, outputDim: SpaceDim, inputDim: SpaceDim): Matrix {
  if (outputDim === 3) {
    return matrix
  }
  return [
    [...matrix[0]],
    [...matrix[1]],
    Array.from({ length: inputDim }, () => 0),
  ]
}
