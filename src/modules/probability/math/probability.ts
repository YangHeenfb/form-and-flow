export type DiscreteDistribution = {
  values: number[]
  probabilities: number[]
}

export type DistributionValidation = {
  valid: boolean
  reason?: string
}

export function clampProbability(p: number): number {
  if (!Number.isFinite(p)) return 0
  return Math.min(1, Math.max(0, p))
}

export function safeDivide(numerator: number, denominator: number, fallback: number | null = null): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || Math.abs(denominator) < 1e-12) return fallback
  return numerator / denominator
}

export function normalizeWeights(weights: number[]): number[] {
  const cleaned = weights.map((weight) => (Number.isFinite(weight) ? Math.max(0, weight) : 0))
  const total = cleaned.reduce((sum, weight) => sum + weight, 0)
  if (total <= 0) return cleaned.map(() => 0)
  return cleaned.map((weight) => weight / total)
}

export function normalizeDistribution(distribution: DiscreteDistribution): DiscreteDistribution {
  return {
    values: [...distribution.values],
    probabilities: normalizeWeights(distribution.probabilities),
  }
}

export function sumProbabilities(distribution: DiscreteDistribution): number {
  return distribution.probabilities.reduce((sum, probability) => sum + (Number.isFinite(probability) ? probability : 0), 0)
}

export function expectedValue(distribution: DiscreteDistribution): number {
  const normalized = normalizeDistribution(distribution)
  return normalized.values.reduce((sum, value, index) => sum + value * (normalized.probabilities[index] ?? 0), 0)
}

export function variance(distribution: DiscreteDistribution): number {
  const normalized = normalizeDistribution(distribution)
  const mean = expectedValue(normalized)
  return normalized.values.reduce((sum, value, index) => sum + (value - mean) ** 2 * (normalized.probabilities[index] ?? 0), 0)
}

export function standardDeviation(distribution: DiscreteDistribution): number {
  return Math.sqrt(Math.max(0, variance(distribution)))
}

export function cumulativeProbability(distribution: DiscreteDistribution, predicate: (value: number) => boolean): number {
  const normalized = normalizeDistribution(distribution)
  return normalized.values.reduce((sum, value, index) => (predicate(value) ? sum + (normalized.probabilities[index] ?? 0) : sum), 0)
}

export function roundProbability(p: number, digits = 4): number {
  if (!Number.isFinite(p)) return Number.NaN
  const scale = 10 ** digits
  return Math.round(p * scale) / scale
}

export function formatProbability(p: number | null | undefined, digits = 4): string {
  if (p === null || p === undefined || !Number.isFinite(p)) return 'not defined'
  const value = roundProbability(p, digits)
  if (Math.abs(value) > 0 && Math.abs(value) < 0.0001) return value.toExponential(2)
  return value.toFixed(digits).replace(/\.?0+$/, '')
}

export function formatPercent(p: number | null | undefined, digits = 2): string {
  if (p === null || p === undefined || !Number.isFinite(p)) return 'not defined'
  const percent = p * 100
  if (Math.abs(percent) > 0 && Math.abs(percent) < 0.01) return `${percent.toExponential(2)}%`
  return `${percent.toFixed(digits).replace(/\.?0+$/, '')}%`
}

export function validateDistribution(distribution: DiscreteDistribution): DistributionValidation {
  if (distribution.values.length === 0) return { valid: false, reason: 'Distribution must include at least one value.' }
  if (distribution.values.length !== distribution.probabilities.length) return { valid: false, reason: 'Values and probabilities must have the same length.' }
  if (distribution.values.some((value) => !Number.isFinite(value))) return { valid: false, reason: 'Distribution values must be finite.' }
  if (distribution.probabilities.some((probability) => !Number.isFinite(probability) || probability < 0)) {
    return { valid: false, reason: 'Probabilities must be non-negative finite numbers.' }
  }
  const total = sumProbabilities(distribution)
  if (total <= 0) return { valid: false, reason: 'Probability sum must be positive.' }
  if (Math.abs(total - 1) > 1e-6) return { valid: false, reason: 'Probabilities must sum to 1.' }
  return { valid: true }
}

export function clampDistribution(distribution: DiscreteDistribution): DiscreteDistribution {
  return normalizeDistribution({
    values: distribution.values.filter((value) => Number.isFinite(value)),
    probabilities: distribution.probabilities.slice(0, distribution.values.length).map((probability) => Math.max(0, Number.isFinite(probability) ? probability : 0)),
  })
}

export function toCounts(distribution: DiscreteDistribution, population: number): number[] {
  const normalized = normalizeDistribution(distribution)
  const size = Math.max(0, Math.round(population))
  const raw = normalized.probabilities.map((probability) => probability * size)
  const counts = raw.map(Math.floor)
  let remainder = size - counts.reduce((sum, count) => sum + count, 0)
  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)
  for (const item of order) {
    if (remainder <= 0) break
    counts[item.index] += 1
    remainder -= 1
  }
  return counts
}
