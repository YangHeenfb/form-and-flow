import type { DiscreteDistribution } from './probability.ts'
import { clampProbability, cumulativeProbability } from './probability.ts'
import { createSeededRng } from './random.ts'

export type BinomialRangeMode = 'exact' | 'at-most' | 'at-least' | 'between'

export function combination(nInput: number, kInput: number): number {
  const n = Math.floor(nInput)
  const k = Math.floor(kInput)
  if (n < 0 || k < 0 || k > n) return 0
  const m = Math.min(k, n - k)
  let result = 1
  for (let index = 1; index <= m; index += 1) {
    result = (result * (n - m + index)) / index
  }
  return result
}

export function binomialPMF(nInput: number, pInput: number, kInput: number): number {
  const n = clampTrials(nInput)
  const p = clampProbability(pInput)
  const k = Math.floor(kInput)
  if (k < 0 || k > n) return 0
  if (p === 0) return k === 0 ? 1 : 0
  if (p === 1) return k === n ? 1 : 0
  return combination(n, k) * p ** k * (1 - p) ** (n - k)
}

export function binomialCDF(n: number, p: number, k: number): number {
  let total = 0
  for (let index = 0; index <= Math.floor(k); index += 1) total += binomialPMF(n, p, index)
  return total
}

export function binomialDistribution(nInput: number, pInput: number): DiscreteDistribution {
  const n = clampTrials(nInput)
  const p = clampProbability(pInput)
  const values: number[] = []
  const probabilities: number[] = []
  for (let k = 0; k <= n; k += 1) {
    values.push(k)
    probabilities.push(binomialPMF(n, p, k))
  }
  return { values, probabilities }
}

export function binomialRangeProbability(n: number, p: number, mode: BinomialRangeMode, k: number, k2: number): number {
  const distribution = binomialDistribution(n, p)
  const low = Math.min(Math.floor(k), Math.floor(k2))
  const high = Math.max(Math.floor(k), Math.floor(k2))
  if (mode === 'exact') return binomialPMF(n, p, k)
  if (mode === 'at-most') return binomialCDF(n, p, k)
  if (mode === 'at-least') return 1 - binomialCDF(n, p, Math.floor(k) - 1)
  return cumulativeProbability(distribution, (value) => value >= low && value <= high)
}

export function binomialMean(n: number, p: number): number {
  return clampTrials(n) * clampProbability(p)
}

export function binomialVariance(n: number, p: number): number {
  const probability = clampProbability(p)
  return clampTrials(n) * probability * (1 - probability)
}

export function simulateBinomial(nInput: number, pInput: number, runsInput: number, seed: number): DiscreteDistribution {
  const n = clampTrials(nInput)
  const p = clampProbability(pInput)
  const runs = Math.max(0, Math.min(100_000, Math.floor(runsInput)))
  const counts = Array.from({ length: n + 1 }, () => 0)
  const rng = createSeededRng(seed)
  for (let run = 0; run < runs; run += 1) {
    let successes = 0
    for (let trial = 0; trial < n; trial += 1) {
      if (rng() < p) successes += 1
    }
    counts[successes] += 1
  }
  return {
    values: counts.map((_, index) => index),
    probabilities: runs > 0 ? counts.map((count) => count / runs) : counts,
  }
}

export function clampTrials(n: number): number {
  if (!Number.isFinite(n)) return 1
  return Math.max(1, Math.min(100, Math.round(n)))
}
