import type { ConvolutionMode, TermContribution } from '../convolutionTypes.ts'

export function discreteConvolve(a: number[], b: number[], mode: ConvolutionMode = 'full'): number[] {
  const left = sanitizeSequence(a)
  const right = sanitizeSequence(b)
  if (left.length === 0 || right.length === 0) return []

  const full = Array.from({ length: getFullConvolutionLength(left.length, right.length) }, (_, k) => discreteConvolutionAt(left, right, k))
  return cropConvolution(full, left.length, right.length, mode)
}

export function discreteConvolutionAt(a: number[], b: number[], k: number): number {
  return discreteConvolutionTerms(a, b, k).reduce((sum, term) => sum + term.product, 0)
}

export function discreteConvolutionTerms(a: number[], b: number[], k: number): TermContribution[] {
  const terms: TermContribution[] = []
  for (let aIndex = 0; aIndex < a.length; aIndex += 1) {
    const bIndex = k - aIndex
    if (bIndex < 0 || bIndex >= b.length) continue
    const aValue = safeNumber(a[aIndex])
    const bValue = safeNumber(b[bIndex])
    terms.push({ aIndex, bIndex, aValue, bValue, product: aValue * bValue })
  }
  return terms
}

export function crossCorrelate(a: number[], b: number[], mode: ConvolutionMode = 'full'): number[] {
  return discreteConvolve(a, flipSequence(b), mode)
}

export function flipSequence(sequence: number[]): number[] {
  return [...sequence].reverse()
}

export function padSequence(sequence: number[], leftPad: number, rightPad: number, padValue = 0): number[] {
  const left = Math.max(0, Math.floor(leftPad))
  const right = Math.max(0, Math.floor(rightPad))
  return [...Array.from({ length: left }, () => padValue), ...sequence, ...Array.from({ length: right }, () => padValue)]
}

export function normalizeSequence(sequence: number[]): number[] {
  const clean = sanitizeSequence(sequence)
  const sum = clean.reduce((total, value) => total + value, 0)
  if (Math.abs(sum) < 1e-12) return clean
  return clean.map((value) => value / sum)
}

export function trimNearZero(sequence: number[], epsilon = 1e-10): number[] {
  return sequence.map((value) => (Math.abs(value) <= epsilon ? 0 : value))
}

export function isSymmetricKernel(sequence: number[]): boolean {
  for (let index = 0; index < Math.floor(sequence.length / 2); index += 1) {
    if (Math.abs(safeNumber(sequence[index]) - safeNumber(sequence[sequence.length - 1 - index])) > 1e-10) return false
  }
  return true
}

export function getFullConvolutionLength(aLength: number, bLength: number): number {
  if (aLength <= 0 || bLength <= 0) return 0
  return aLength + bLength - 1
}

export function cropConvolution(full: number[], aLength: number, bLength: number, mode: ConvolutionMode): number[] {
  if (mode === 'full') return full
  if (mode === 'same') {
    const start = Math.floor((bLength - 1) / 2)
    return full.slice(start, start + aLength)
  }
  const start = Math.min(aLength, bLength) - 1
  const length = Math.max(aLength, bLength) - Math.min(aLength, bLength) + 1
  return full.slice(start, start + Math.max(0, length))
}

function sanitizeSequence(sequence: number[]): number[] {
  return sequence.map(safeNumber)
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0
}
