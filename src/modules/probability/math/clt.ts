import type { DiscreteDistribution } from './probability.ts'
import { expectedValue, normalizeDistribution, variance } from './probability.ts'
import { createSeededRng, sampleDiscrete } from './random.ts'

export type SourceDistributionId = 'die' | 'biased-coin' | 'uniform' | 'exponential' | 'skewed-discrete'

export type SourceDistribution = {
  id: SourceDistributionId
  label: string
  mean: number
  variance: number
  sampler: (rng: () => number) => number
  discrete?: DiscreteDistribution
  domain: [number, number]
}

export function getSourceDistribution(id: SourceDistributionId): SourceDistribution {
  if (id === 'biased-coin') {
    const discrete = normalizeDistribution({ values: [0, 1], probabilities: [0.7, 0.3] })
    return makeDiscreteSource(id, 'Biased coin', discrete)
  }
  if (id === 'uniform') {
    return {
      id,
      label: 'Uniform 0 to 1',
      mean: 0.5,
      variance: 1 / 12,
      sampler: (rng) => rng(),
      domain: [0, 1],
    }
  }
  if (id === 'exponential') {
    return {
      id,
      label: 'Exponential',
      mean: 1,
      variance: 1,
      sampler: (rng) => -Math.log(Math.max(Number.EPSILON, 1 - rng())),
      domain: [0, 6],
    }
  }
  if (id === 'skewed-discrete') {
    const discrete = normalizeDistribution({ values: [0, 1, 3, 8], probabilities: [0.55, 0.25, 0.15, 0.05] })
    return makeDiscreteSource(id, 'Skewed discrete', discrete)
  }
  const die = normalizeDistribution({ values: [1, 2, 3, 4, 5, 6], probabilities: [1, 1, 1, 1, 1, 1] })
  return makeDiscreteSource('die', 'Fair die', die)
}

export function allSourceDistributions(): SourceDistribution[] {
  return ['die', 'biased-coin', 'uniform', 'exponential', 'skewed-discrete'].map((id) => getSourceDistribution(id as SourceDistributionId))
}

export function theoreticalStandardError(source: SourceDistribution, sampleSizeInput: number): number {
  const sampleSize = Math.max(1, Math.min(100, Math.round(sampleSizeInput)))
  return Math.sqrt(source.variance) / Math.sqrt(sampleSize)
}

export function sampleMeans(source: SourceDistribution, sampleSizeInput: number, sampleCountInput: number, seed: number, standardized = false): number[] {
  const sampleSize = Math.max(1, Math.min(100, Math.round(sampleSizeInput)))
  const sampleCount = Math.max(0, Math.min(100_000, Math.round(sampleCountInput)))
  const rng = createSeededRng(seed)
  const values: number[] = []
  const standardError = theoreticalStandardError(source, sampleSize)
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    let total = 0
    for (let index = 0; index < sampleSize; index += 1) total += source.sampler(rng)
    const mean = total / sampleSize
    values.push(standardized && standardError > 0 ? (mean - source.mean) / standardError : mean)
  }
  return values
}

export function empiricalMean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function empiricalStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = empiricalMean(values)
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length)
}

export function normalPdf(x: number, mean: number, sd: number): number {
  if (!Number.isFinite(sd) || sd <= 0) return 0
  return Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI))
}

function makeDiscreteSource(id: SourceDistributionId, label: string, discrete: DiscreteDistribution): SourceDistribution {
  return {
    id,
    label,
    mean: expectedValue(discrete),
    variance: variance(discrete),
    sampler: (rng) => sampleDiscrete(discrete, rng),
    discrete,
    domain: [Math.min(...discrete.values), Math.max(...discrete.values)],
  }
}
