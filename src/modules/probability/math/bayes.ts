import { clampProbability, safeDivide } from './probability.ts'

export type BayesResult = {
  prior: number
  likelihood: number
  falseAlarm: number
  evidence: number
  posterior: number | null
  priorOdds: number | null
  likelihoodRatio: number | null
  posteriorOdds: number | null
}

export function bayesPosterior(priorInput: number, likelihoodInput: number, falseAlarmInput: number): BayesResult {
  const prior = clampProbability(priorInput)
  const likelihood = clampProbability(likelihoodInput)
  const falseAlarm = clampProbability(falseAlarmInput)
  const evidence = likelihood * prior + falseAlarm * (1 - prior)
  const posterior = safeDivide(likelihood * prior, evidence, null)
  const priorOdds = oddsFromProbability(prior)
  const ratio = likelihoodRatio(likelihood, falseAlarm)
  const posteriorOdds = priorOdds === null || ratio === null || (priorOdds === 0 && ratio === Number.POSITIVE_INFINITY) ? null : priorOdds * ratio
  return { prior, likelihood, falseAlarm, evidence, posterior, priorOdds, likelihoodRatio: ratio, posteriorOdds }
}

export function oddsFromProbability(probabilityInput: number): number | null {
  const probability = clampProbability(probabilityInput)
  if (probability >= 1) return null
  return safeDivide(probability, 1 - probability, null)
}

export function probabilityFromOdds(odds: number): number | null {
  if (!Number.isFinite(odds) || odds < 0) return null
  return safeDivide(odds, 1 + odds, null)
}

export function likelihoodRatio(likelihoodInput: number, falseAlarmInput: number): number | null {
  const likelihood = clampProbability(likelihoodInput)
  const falseAlarm = clampProbability(falseAlarmInput)
  if (falseAlarm === 0) return likelihood > 0 ? Number.POSITIVE_INFINITY : null
  return safeDivide(likelihood, falseAlarm, null)
}

export function conditionalProbability(intersection: number, condition: number): number | null {
  return safeDivide(clampProbability(intersection), clampProbability(condition), null)
}

export function clampIntersection(probabilityA: number, probabilityB: number, intersection: number): number {
  const a = clampProbability(probabilityA)
  const b = clampProbability(probabilityB)
  const lower = Math.max(0, a + b - 1)
  const upper = Math.min(a, b)
  if (!Number.isFinite(intersection)) return lower
  return Math.min(upper, Math.max(lower, intersection))
}

export function contingencyFromIntersection(probabilityA: number, probabilityB: number, intersectionInput: number) {
  const a = clampProbability(probabilityA)
  const b = clampProbability(probabilityB)
  const intersection = clampIntersection(a, b, intersectionInput)
  const aOnly = Math.max(0, a - intersection)
  const bOnly = Math.max(0, b - intersection)
  const neither = Math.max(0, 1 - intersection - aOnly - bOnly)
  return {
    a,
    b,
    intersection,
    aOnly,
    bOnly,
    neither,
    aGivenB: conditionalProbability(intersection, b),
    bGivenA: conditionalProbability(intersection, a),
    aGivenNotB: conditionalProbability(aOnly, 1 - b),
    bGivenNotA: conditionalProbability(bOnly, 1 - a),
  }
}

export function contingencyFromConditionals(probabilityA: number, bGivenAInput: number, bGivenNotAInput: number) {
  const a = clampProbability(probabilityA)
  const bGivenA = clampProbability(bGivenAInput)
  const bGivenNotA = clampProbability(bGivenNotAInput)
  const intersection = a * bGivenA
  const bOnly = (1 - a) * bGivenNotA
  const b = intersection + bOnly
  return contingencyFromIntersection(a, b, intersection)
}
