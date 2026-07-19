import type { Complex, FourierCoefficient } from '../fourierTypes.ts'
import { add, expi, mul } from './complex.ts'
import { computeCoefficientAtFrequency } from './fourier.ts'
import { generateTimeValues } from './signal.ts'

export type FrequencyPair = {
  frequency: number
  positive: FourierCoefficient
  negative: FourierCoefficient | null
}

export type FrequencyPairFrame = {
  positive: Complex
  negative: Complex | null
  sum: Complex
}

export function computeFrequencyPair(samples: number[], frequency: number): FrequencyPair {
  const normalizedFrequency = normalizePairFrequency(frequency)
  const positive = computeCoefficientAtFrequency(samples, normalizedFrequency)
  if (normalizedFrequency === 0) {
    return { frequency: 0, positive, negative: null }
  }
  return {
    frequency: normalizedFrequency,
    positive,
    negative: computeCoefficientAtFrequency(samples, -normalizedFrequency),
  }
}

export function computeFrequencyPairFrame(pair: FrequencyPair, t: number): FrequencyPairFrame {
  if (pair.frequency === 0 || !pair.negative) {
    return {
      positive: pair.positive.value,
      negative: null,
      sum: pair.positive.value,
    }
  }

  const angle = 2 * Math.PI * pair.frequency * t
  const positive = mul(pair.positive.value, expi(angle))
  const negative = mul(pair.negative.value, expi(-angle))
  return { positive, negative, sum: add(positive, negative) }
}

export function synthesizeFrequencyPair(pair: FrequencyPair, sampleCount: number): number[] {
  return generateTimeValues(sampleCount).map((t) => computeFrequencyPairFrame(pair, t).sum.re)
}

function normalizePairFrequency(frequency: number): number {
  if (!Number.isFinite(frequency) || Math.abs(frequency) < 1e-9) return 0
  return Math.abs(frequency)
}
