import type { SpaceDim, VectorState } from './types.ts'

export function resizeVector(values: number[], dim: SpaceDim): number[] {
  return Array.from({ length: dim }, (_, index) => values[index] ?? 0)
}

export function createVector(id: string, dim: SpaceDim, color: string, index: number): VectorState {
  return {
    id,
    name: `v${index}`,
    dim,
    values: dim === 2 ? [1, 1] : [1, 1, 1],
    color,
  }
}

export function formatVector(values: number[], digits = 2): string {
  return `(${values.map((value) => formatNumber(value, digits)).join(', ')})`
}

export function formatNumber(value: number, digits = 2): string {
  if (Math.abs(value) < 1e-9) {
    return '0'
  }
  return Number.parseFloat(value.toFixed(digits)).toString()
}
