import { clampProbability, safeDivide } from './probability.ts'

export type MedicalTestResult = {
  prevalence: number
  sensitivity: number
  specificity: number
  truePositive: number
  falseNegative: number
  trueNegative: number
  falsePositive: number
  positivePredictiveValue: number | null
  negativePredictiveValue: number | null
  falseDiscoveryRate: number | null
}

export function medicalTestMetrics(prevalenceInput: number, sensitivityInput: number, specificityInput: number): MedicalTestResult {
  const prevalence = clampProbability(prevalenceInput)
  const sensitivity = clampProbability(sensitivityInput)
  const specificity = clampProbability(specificityInput)
  const truePositive = prevalence * sensitivity
  const falseNegative = prevalence * (1 - sensitivity)
  const trueNegative = (1 - prevalence) * specificity
  const falsePositive = (1 - prevalence) * (1 - specificity)
  const positivePredictiveValue = safeDivide(truePositive, truePositive + falsePositive, null)
  const negativePredictiveValue = safeDivide(trueNegative, trueNegative + falseNegative, null)
  const falseDiscoveryRate = safeDivide(falsePositive, truePositive + falsePositive, null)
  return {
    prevalence,
    sensitivity,
    specificity,
    truePositive,
    falseNegative,
    trueNegative,
    falsePositive,
    positivePredictiveValue,
    negativePredictiveValue,
    falseDiscoveryRate,
  }
}
