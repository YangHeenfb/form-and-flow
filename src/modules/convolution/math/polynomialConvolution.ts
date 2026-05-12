import type { TermContribution } from '../convolutionTypes.ts'
import { discreteConvolve, discreteConvolutionTerms } from './discreteConvolution.ts'

export function polynomialMultiply(aCoefficients: number[], bCoefficients: number[]): number[] {
  return discreteConvolve(cleanCoefficients(aCoefficients), cleanCoefficients(bCoefficients), 'full')
}

export function polynomialToString(coefficients: number[]): string {
  const terms = cleanCoefficients(coefficients)
    .map((coefficient, power) => formatTerm(coefficient, power))
    .filter((term) => term.length > 0)
  if (terms.length === 0) return '0'
  return terms.join(' + ').replace(/\+ -/g, '- ')
}

export function convolutionTermsForCoefficient(aCoefficients: number[], bCoefficients: number[], k: number): TermContribution[] {
  return discreteConvolutionTerms(cleanCoefficients(aCoefficients), cleanCoefficients(bCoefficients), k)
}

export function evaluatePolynomial(coefficients: number[], x: number): number {
  return cleanCoefficients(coefficients).reduce((sum, coefficient, power) => sum + coefficient * x ** power, 0)
}

export function parseCoefficientList(input: string): number[] {
  const values = input
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite)
  return values.length > 0 ? values.slice(0, 32) : [0]
}

export function formatCoefficientList(coefficients: number[]): string {
  return cleanCoefficients(coefficients).join(', ')
}

function cleanCoefficients(coefficients: number[]): number[] {
  const clean = coefficients.map((value) => (Number.isFinite(value) ? value : 0))
  return clean.length > 0 ? clean : [0]
}

function formatTerm(coefficient: number, power: number): string {
  if (Math.abs(coefficient) < 1e-12) return ''
  const rounded = round(coefficient)
  if (power === 0) return String(rounded)
  const magnitude = Math.abs(rounded)
  const sign = rounded < 0 ? '-' : ''
  const coefficientText = magnitude === 1 ? '' : `${magnitude}`
  const variable = power === 1 ? 'x' : `x^${power}`
  return `${sign}${coefficientText}${variable}`
}

function round(value: number): number {
  return Math.round(value * 1000000) / 1000000
}
