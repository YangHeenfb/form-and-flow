import { clampProbability } from './probability.ts'
import { createSeededRng, type Rng } from './random.ts'

export type ContinuousDistributionId = 'uniform' | 'normal' | 'exponential' | 'triangular'

export type ContinuousDistributionSpec = {
  id: ContinuousDistributionId
  label: string
  params: Record<string, number>
  domain: [number, number]
  pdf: (x: number) => number
  cdf?: (x: number) => number
  mean: number
  variance: number
  sampler: (rng: Rng) => number
}

export function makeContinuousDistribution(id: ContinuousDistributionId, params: Record<string, number> = {}): ContinuousDistributionSpec {
  if (id === 'normal') return normalDistribution(params.mu ?? 0, params.sigma ?? 1)
  if (id === 'exponential') return exponentialDistribution(params.lambda ?? 1)
  if (id === 'triangular') return triangularDistribution(params.min ?? 0, params.mode ?? 0.5, params.max ?? 1)
  return uniformDistribution(params.min ?? 0, params.max ?? 1)
}

export function uniformDistribution(minInput: number, maxInput: number): ContinuousDistributionSpec {
  const min = Number.isFinite(minInput) ? minInput : 0
  const max = Number.isFinite(maxInput) && maxInput > min ? maxInput : min + 1
  const width = max - min
  return {
    id: 'uniform',
    label: 'Uniform',
    params: { min, max },
    domain: [min - width * 0.08, max + width * 0.08],
    pdf: (x) => (x >= min && x <= max ? 1 / width : 0),
    cdf: (x) => (x <= min ? 0 : x >= max ? 1 : (x - min) / width),
    mean: (min + max) / 2,
    variance: width ** 2 / 12,
    sampler: (rng) => min + rng() * width,
  }
}

export function normalDistribution(muInput: number, sigmaInput: number): ContinuousDistributionSpec {
  const mu = Number.isFinite(muInput) ? muInput : 0
  const sigma = Number.isFinite(sigmaInput) && sigmaInput > 0 ? sigmaInput : 1
  return {
    id: 'normal',
    label: 'Normal',
    params: { mu, sigma },
    domain: [mu - 4 * sigma, mu + 4 * sigma],
    pdf: (x) => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI)),
    cdf: (x) => 0.5 * (1 + erf((x - mu) / (sigma * Math.sqrt(2)))),
    mean: mu,
    variance: sigma ** 2,
    sampler: (rng) => {
      const u1 = Math.max(Number.EPSILON, rng())
      const u2 = rng()
      return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    },
  }
}

export function exponentialDistribution(lambdaInput: number): ContinuousDistributionSpec {
  const lambda = Number.isFinite(lambdaInput) && lambdaInput > 0 ? lambdaInput : 1
  return {
    id: 'exponential',
    label: 'Exponential',
    params: { lambda },
    domain: [0, Math.max(4, 6 / lambda)],
    pdf: (x) => (x < 0 ? 0 : lambda * Math.exp(-lambda * x)),
    cdf: (x) => (x <= 0 ? 0 : 1 - Math.exp(-lambda * x)),
    mean: 1 / lambda,
    variance: 1 / lambda ** 2,
    sampler: (rng) => -Math.log(Math.max(Number.EPSILON, 1 - rng())) / lambda,
  }
}

export function triangularDistribution(minInput: number, modeInput: number, maxInput: number): ContinuousDistributionSpec {
  const min = Number.isFinite(minInput) ? minInput : 0
  const max = Number.isFinite(maxInput) && maxInput > min ? maxInput : min + 1
  const mode = Math.min(max, Math.max(min, Number.isFinite(modeInput) ? modeInput : (min + max) / 2))
  return {
    id: 'triangular',
    label: 'Triangular',
    params: { min, mode, max },
    domain: [min - (max - min) * 0.08, max + (max - min) * 0.08],
    pdf: (x) => {
      if (x < min || x > max) return 0
      if (x <= mode) return (2 * (x - min)) / ((max - min) * Math.max(Number.EPSILON, mode - min))
      return (2 * (max - x)) / ((max - min) * Math.max(Number.EPSILON, max - mode))
    },
    cdf: (x) => {
      if (x <= min) return 0
      if (x >= max) return 1
      if (x <= mode) return ((x - min) ** 2) / ((max - min) * Math.max(Number.EPSILON, mode - min))
      return 1 - ((max - x) ** 2) / ((max - min) * Math.max(Number.EPSILON, max - mode))
    },
    mean: (min + mode + max) / 3,
    variance: (min ** 2 + mode ** 2 + max ** 2 - min * mode - min * max - mode * max) / 18,
    sampler: (rng) => {
      const roll = rng()
      const split = (mode - min) / (max - min)
      if (roll < split) return min + Math.sqrt(roll * (max - min) * (mode - min))
      return max - Math.sqrt((1 - roll) * (max - min) * (max - mode))
    },
  }
}

export function intervalProbability(distribution: ContinuousDistributionSpec, aInput: number, bInput: number): number {
  const a = Math.min(aInput, bInput)
  const b = Math.max(aInput, bInput)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  if (distribution.cdf) return clampProbability(distribution.cdf(b) - distribution.cdf(a))
  return clampProbability(integrate(distribution.pdf, a, b, 512))
}

export function sampleContinuousDistribution(distribution: ContinuousDistributionSpec, countInput: number, seed: number): number[] {
  const count = Math.max(0, Math.min(100_000, Math.floor(countInput)))
  const rng = createSeededRng(seed)
  const samples: number[] = []
  for (let index = 0; index < count; index += 1) samples.push(distribution.sampler(rng))
  return samples
}

export type HistogramBin = {
  x0: number
  x1: number
  density: number
  probability: number
}

export function histogram(samples: number[], minInput: number, maxInput: number, binCountInput = 40): HistogramBin[] {
  const min = Number.isFinite(minInput) ? minInput : 0
  const max = Number.isFinite(maxInput) && maxInput > min ? maxInput : min + 1
  const binCount = Math.max(1, Math.min(100, Math.round(binCountInput)))
  const width = (max - min) / binCount
  const counts = Array.from({ length: binCount }, () => 0)
  for (const sample of samples) {
    if (!Number.isFinite(sample) || sample < min || sample > max) continue
    const index = Math.min(binCount - 1, Math.max(0, Math.floor((sample - min) / width)))
    counts[index] += 1
  }
  const total = Math.max(1, samples.length)
  return counts.map((count, index) => ({
    x0: min + index * width,
    x1: min + (index + 1) * width,
    probability: count / total,
    density: count / total / width,
  }))
}

export function integrate(fn: (x: number) => number, a: number, b: number, stepsInput = 512): number {
  const steps = Math.max(2, Math.floor(stepsInput / 2) * 2)
  const width = (b - a) / steps
  let sum = 0
  for (let index = 0; index <= steps; index += 1) {
    const x = a + index * width
    const y = fn(x)
    if (!Number.isFinite(y)) continue
    const weight = index === 0 || index === steps ? 1 : index % 2 === 0 ? 2 : 4
    sum += weight * y
  }
  return (sum * width) / 3
}

export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1
  const value = Math.abs(x)
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const t = 1 / (1 + p * value)
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-value * value))
  return sign * y
}
