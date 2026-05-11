import type { FourierCoefficient, Spectrum } from '../fourierTypes.ts'
import { expi, mul } from './complex.ts'
import { selectTopCoefficients } from './fourier.ts'
import { generateTimeValues } from './signal.ts'

export function reconstructAtT(coefficients: FourierCoefficient[], t: number): number {
  return coefficients.reduce((sum, coefficient) => {
    const contribution = mul(coefficient.value, expi(2 * Math.PI * coefficient.frequency * t))
    return sum + contribution.re
  }, 0)
}

export function reconstructSamples(coefficients: FourierCoefficient[], sampleCount: number): number[] {
  return generateTimeValues(sampleCount).map((t) => reconstructAtT(coefficients, t))
}

export function reconstructFromTopFrequencies(spectrum: Spectrum, count: number, sampleCount: number): number[] {
  return reconstructSamples(selectTopCoefficients(spectrum.coefficients, count), sampleCount)
}

export function reconstructFromFrequencyRange(spectrum: Spectrum, minFrequency: number, maxFrequency: number, sampleCount: number): number[] {
  const low = Math.min(minFrequency, maxFrequency)
  const high = Math.max(minFrequency, maxFrequency)
  return reconstructSamples(
    spectrum.coefficients.filter((coefficient) => coefficient.frequency >= low && coefficient.frequency <= high),
    sampleCount,
  )
}

export function reconstructionError(originalSamples: number[], reconstructedSamples: number[]): { mse: number; maxAbs: number } {
  return {
    mse: meanSquaredError(originalSamples, reconstructedSamples),
    maxAbs: maxAbsError(originalSamples, reconstructedSamples),
  }
}

export function meanSquaredError(originalSamples: number[], reconstructedSamples: number[]): number {
  const count = Math.min(originalSamples.length, reconstructedSamples.length)
  if (count === 0) return 0
  let total = 0
  for (let index = 0; index < count; index += 1) {
    const diff = originalSamples[index] - reconstructedSamples[index]
    total += diff * diff
  }
  return total / count
}

export function maxAbsError(originalSamples: number[], reconstructedSamples: number[]): number {
  const count = Math.min(originalSamples.length, reconstructedSamples.length)
  let max = 0
  for (let index = 0; index < count; index += 1) {
    max = Math.max(max, Math.abs(originalSamples[index] - reconstructedSamples[index]))
  }
  return max
}
