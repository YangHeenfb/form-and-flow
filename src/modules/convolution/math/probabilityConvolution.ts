export type DiscreteDistribution = {
  support: number[]
  probabilities: number[]
}

export function normalizeDistribution(distribution: DiscreteDistribution): DiscreteDistribution {
  const combined = new Map<number, number>()
  for (let index = 0; index < distribution.support.length; index += 1) {
    const value = distribution.support[index]
    const probability = distribution.probabilities[index]
    if (!Number.isFinite(value) || !Number.isFinite(probability) || probability < 0) continue
    combined.set(value, (combined.get(value) ?? 0) + probability)
  }
  const entries = [...combined.entries()].sort((left, right) => left[0] - right[0])
  const total = entries.reduce((sum, entry) => sum + entry[1], 0)
  if (entries.length === 0 || total <= 0) return { support: [0], probabilities: [1] }
  return {
    support: entries.map((entry) => entry[0]),
    probabilities: entries.map((entry) => entry[1] / total),
  }
}

export function validateDistribution(distribution: DiscreteDistribution): boolean {
  if (distribution.support.length === 0 || distribution.support.length !== distribution.probabilities.length) return false
  const total = distribution.probabilities.reduce((sum, value) => sum + value, 0)
  return (
    Number.isFinite(total) &&
    total > 0 &&
    distribution.support.every(Number.isFinite) &&
    distribution.probabilities.every((value) => Number.isFinite(value) && value >= 0)
  )
}

export function convolveDistributions(xDistribution: DiscreteDistribution, yDistribution: DiscreteDistribution): DiscreteDistribution {
  const x = normalizeDistribution(xDistribution)
  const y = normalizeDistribution(yDistribution)
  const probabilities = new Map<number, number>()
  for (let xIndex = 0; xIndex < x.support.length; xIndex += 1) {
    for (let yIndex = 0; yIndex < y.support.length; yIndex += 1) {
      const sum = x.support[xIndex] + y.support[yIndex]
      const probability = x.probabilities[xIndex] * y.probabilities[yIndex]
      probabilities.set(sum, (probabilities.get(sum) ?? 0) + probability)
    }
  }
  return normalizeDistribution({
    support: [...probabilities.keys()],
    probabilities: [...probabilities.values()],
  })
}

export function distributionMean(distribution: DiscreteDistribution): number {
  const normalized = normalizeDistribution(distribution)
  return normalized.support.reduce((sum, value, index) => sum + value * normalized.probabilities[index], 0)
}

export function distributionVariance(distribution: DiscreteDistribution): number {
  const normalized = normalizeDistribution(distribution)
  const mean = distributionMean(normalized)
  return normalized.support.reduce((sum, value, index) => sum + (value - mean) ** 2 * normalized.probabilities[index], 0)
}

export function makeDieDistribution(sides: number): DiscreteDistribution {
  const count = Math.max(1, Math.floor(sides))
  return {
    support: Array.from({ length: count }, (_, index) => index + 1),
    probabilities: Array.from({ length: count }, () => 1 / count),
  }
}

export function makeCoinDistribution(p: number): DiscreteDistribution {
  const heads = Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : 0.5
  return { support: [0, 1], probabilities: [1 - heads, heads] }
}

export function makeCustomDistribution(values: number[]): DiscreteDistribution {
  if (values.length === 0) return { support: [0], probabilities: [1] }
  const counts = new Map<number, number>()
  for (const value of values) {
    if (Number.isFinite(value)) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return normalizeDistribution({
    support: [...counts.keys()],
    probabilities: [...counts.values()],
  })
}

export function makeSumOfNDiceDistribution(n: number, sides: number): DiscreteDistribution {
  const diceCount = Math.max(1, Math.floor(n))
  let distribution = makeDieDistribution(sides)
  for (let index = 1; index < diceCount; index += 1) {
    distribution = convolveDistributions(distribution, makeDieDistribution(sides))
  }
  return distribution
}
