import type { Complex, FourierCoefficient, Spectrum, WindingPoint } from '../fourierTypes.ts'
import { add, complex, expi, magnitude, phase, scale } from './complex.ts'

export function computeCoefficient(samples: number[], frequency: number): FourierCoefficient {
  return computeCoefficientAtFrequency(samples, frequency)
}

export function computeCoefficientAtFrequency(samples: number[], frequency: number): FourierCoefficient {
  const count = Math.max(1, samples.length)
  let sum = complex(0, 0)
  for (let index = 0; index < count; index += 1) {
    const t = index / count
    const sample = Number.isFinite(samples[index]) ? samples[index] : 0
    sum = add(sum, scale(expi(-2 * Math.PI * frequency * t), sample))
  }
  const value = scale(sum, 1 / count)
  return {
    frequency,
    value,
    magnitude: magnitude(value),
    phase: phase(value),
  }
}

export function computeSpectrum(samples: number[], frequencyMin: number, frequencyMax: number, frequencyStep: number): Spectrum {
  const step = Math.max(0.05, Math.abs(frequencyStep))
  const start = Math.min(frequencyMin, frequencyMax)
  const end = Math.max(frequencyMin, frequencyMax)
  const coefficients: FourierCoefficient[] = []
  for (let frequency = start; frequency <= end + step / 2; frequency += step) {
    coefficients.push(computeCoefficientAtFrequency(samples, roundFrequency(frequency)))
  }
  return {
    coefficients,
    frequencyMin: start,
    frequencyMax: end,
    frequencyStep: step,
    sampleCount: samples.length,
  }
}

export function computeIntegerSpectrum(samples: number[], maxHarmonic: number): Spectrum {
  const harmonic = Math.max(0, Math.floor(maxHarmonic))
  const coefficients = getFrequencyBins(harmonic).map((frequency) => computeCoefficientAtFrequency(samples, frequency))
  return {
    coefficients,
    frequencyMin: -harmonic,
    frequencyMax: harmonic,
    frequencyStep: 1,
    sampleCount: samples.length,
  }
}

export function computeWindingPoints(samples: number[], frequency: number): WindingPoint[] {
  const count = Math.max(1, samples.length)
  return samples.map((sample, index) => {
    const t = index / count
    return {
      t,
      sample,
      point: scale(expi(-2 * Math.PI * frequency * t), Number.isFinite(sample) ? sample : 0),
    }
  })
}

export function interpolateWindingPoint(points: WindingPoint[], progress: number): Complex | undefined {
  if (points.length === 0) return undefined
  const wrappedProgress = ((progress % 1) + 1) % 1
  const position = wrappedProgress * points.length
  const lowerIndex = Math.floor(position) % points.length
  const upperIndex = (lowerIndex + 1) % points.length
  const mix = position - Math.floor(position)
  const lower = points[lowerIndex].point
  const upper = points[upperIndex].point
  return complex(
    lower.re + (upper.re - lower.re) * mix,
    lower.im + (upper.im - lower.im) * mix,
  )
}

export function computeCenterOfMass(samples: number[], frequency: number): Complex {
  return computeCoefficientAtFrequency(samples, frequency).value
}

export function computeMagnitudeSpectrum(coefficients: FourierCoefficient[]): Array<{ frequency: number; magnitude: number }> {
  return coefficients.map((coefficient) => ({ frequency: coefficient.frequency, magnitude: coefficient.magnitude }))
}

export function computePhaseSpectrum(coefficients: FourierCoefficient[]): Array<{ frequency: number; phase: number }> {
  return coefficients.map((coefficient) => ({ frequency: coefficient.frequency, phase: coefficient.phase }))
}

export function sortCoefficientsByMagnitude(coefficients: FourierCoefficient[]): FourierCoefficient[] {
  return [...coefficients].sort((a, b) => b.magnitude - a.magnitude)
}

export function selectTopCoefficients(coefficients: FourierCoefficient[], count: number): FourierCoefficient[] {
  return sortCoefficientsByMagnitude(coefficients).slice(0, Math.max(0, Math.floor(count)))
}

export function selectPairedFrequencyBlocks(coefficients: FourierCoefficient[], blockCount: number): FourierCoefficient[] {
  const count = Math.max(0, Math.floor(blockCount))
  if (count === 0) return []

  const groups = new Map<number, FourierCoefficient[]>()
  coefficients.forEach((coefficient) => {
    const frequencyBlock = Math.abs(coefficient.frequency) < 1e-9 ? 0 : Math.abs(coefficient.frequency)
    groups.set(frequencyBlock, [...(groups.get(frequencyBlock) ?? []), coefficient])
  })

  const selectedBlocks = [...groups.entries()]
    .map(([frequencyBlock, group]) => ({
      frequencyBlock,
      group,
      strength: group.reduce((sum, coefficient) => sum + coefficient.magnitude, 0),
    }))
    .sort((a, b) => b.strength - a.strength || a.frequencyBlock - b.frequencyBlock)
    .slice(0, count)

  const selectedFrequencies = new Set(selectedBlocks.flatMap((block) => block.group.map((coefficient) => coefficient.frequency)))
  return coefficients.filter((coefficient) => selectedFrequencies.has(coefficient.frequency))
}

export function getFrequencyBins(maxHarmonic: number): number[] {
  const harmonic = Math.max(0, Math.floor(maxHarmonic))
  const bins: number[] = []
  for (let frequency = -harmonic; frequency <= harmonic; frequency += 1) bins.push(frequency)
  return bins
}

export function coefficientToPolar(coefficient: FourierCoefficient): { radius: number; angle: number } {
  return { radius: coefficient.magnitude, angle: coefficient.phase }
}

export function normalizeSpectrumForDisplay(spectrum: Spectrum): Array<FourierCoefficient & { displayMagnitude: number }> {
  const maxMagnitude = spectrum.coefficients.reduce((max, coefficient) => Math.max(max, coefficient.magnitude), 0)
  return spectrum.coefficients.map((coefficient) => ({
    ...coefficient,
    displayMagnitude: maxMagnitude > 0 ? coefficient.magnitude / maxMagnitude : 0,
  }))
}

export function findDominantFrequencies(spectrum: Spectrum, count: number): FourierCoefficient[] {
  return sortCoefficientsByMagnitude(spectrum.coefficients.filter((coefficient) => Math.abs(coefficient.frequency) > 1e-9)).slice(0, Math.max(0, count))
}

function roundFrequency(frequency: number): number {
  return Math.round(frequency * 1000) / 1000
}
