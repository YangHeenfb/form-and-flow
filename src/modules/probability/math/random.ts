import type { DiscreteDistribution } from './probability.ts'
import { normalizeDistribution } from './probability.ts'

export type Rng = () => number

export function createSeededRng(seed: number | string): Rng {
  let state = seedToUint(seed)
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2_147_483_647)
}

export function randomInt(rng: Rng, min: number, max: number): number {
  const low = Math.ceil(min)
  const high = Math.floor(max)
  return Math.floor(rng() * (high - low + 1)) + low
}

export function sampleDiscrete(distribution: DiscreteDistribution, rng: Rng): number {
  const normalized = normalizeDistribution(distribution)
  const roll = rng()
  let cumulative = 0
  for (let index = 0; index < normalized.values.length; index += 1) {
    cumulative += normalized.probabilities[index] ?? 0
    if (roll <= cumulative) return normalized.values[index] ?? normalized.values[0] ?? 0
  }
  return normalized.values.at(-1) ?? 0
}

function seedToUint(seed: number | string): number {
  if (typeof seed === 'number' && Number.isFinite(seed)) return seed >>> 0
  const text = String(seed)
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
