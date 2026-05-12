import type { DiscreteDistribution } from './probability.ts'
import { expectedValue, normalizeDistribution, variance } from './probability.ts'

export type PairMass = {
  x: number
  y: number
  sum: number
  probability: number
}

export function convolveDiscrete(xInput: DiscreteDistribution, yInput: DiscreteDistribution): DiscreteDistribution {
  const x = normalizeDistribution(xInput)
  const y = normalizeDistribution(yInput)
  const masses = new Map<number, number>()
  for (let i = 0; i < x.values.length; i += 1) {
    for (let j = 0; j < y.values.length; j += 1) {
      const sum = (x.values[i] ?? 0) + (y.values[j] ?? 0)
      const probability = (x.probabilities[i] ?? 0) * (y.probabilities[j] ?? 0)
      masses.set(sum, (masses.get(sum) ?? 0) + probability)
    }
  }
  const values = [...masses.keys()].sort((a, b) => a - b)
  return { values, probabilities: values.map((value) => masses.get(value) ?? 0) }
}

export function probabilityMassGrid(xInput: DiscreteDistribution, yInput: DiscreteDistribution): PairMass[] {
  const x = normalizeDistribution(xInput)
  const y = normalizeDistribution(yInput)
  const grid: PairMass[] = []
  for (let i = 0; i < x.values.length; i += 1) {
    for (let j = 0; j < y.values.length; j += 1) {
      const xValue = x.values[i] ?? 0
      const yValue = y.values[j] ?? 0
      grid.push({
        x: xValue,
        y: yValue,
        sum: xValue + yValue,
        probability: (x.probabilities[i] ?? 0) * (y.probabilities[j] ?? 0),
      })
    }
  }
  return grid
}

export function distributionById(id: string): DiscreteDistribution {
  if (id === 'coin') return normalizeDistribution({ values: [0, 1], probabilities: [1, 1] })
  if (id === 'biased-coin') return normalizeDistribution({ values: [0, 1], probabilities: [0.75, 0.25] })
  if (id === 'small-custom') return normalizeDistribution({ values: [0, 2, 5], probabilities: [2, 5, 3] })
  return normalizeDistribution({ values: [1, 2, 3, 4, 5, 6], probabilities: [1, 1, 1, 1, 1, 1] })
}

export function sumDistributionStats(x: DiscreteDistribution, y: DiscreteDistribution) {
  const sum = convolveDiscrete(x, y)
  return {
    xMean: expectedValue(x),
    yMean: expectedValue(y),
    sumMean: expectedValue(sum),
    xVariance: variance(x),
    yVariance: variance(y),
    sumVariance: variance(sum),
  }
}
