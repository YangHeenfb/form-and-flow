import { describe, expect, it } from 'vitest'
import { compileExpression } from '../core/math/expression.ts'
import {
  approximateDerivative,
  classifyLimit,
  factorial,
  referenceIntegral,
  riemannSum,
  taylorPolynomialValue,
} from '../modules/calculus/math/calculus.ts'
import { completeBareFunctionInput, normalizeMathInput } from '../modules/calculus/shared/mathInput.ts'

describe('safe expression parser', () => {
  it('evaluates simple expressions with x', () => {
    const compiled = compileExpression('sin(x) + x^2', { variables: ['x'] })
    expect(compiled.evaluate({ x: 0 })).toBeCloseTo(0)
    expect(compiled.evaluate({ x: 2 })).toBeCloseTo(4 + Math.sin(2))
  })

  it('supports ln as a natural log alias', () => {
    const compiled = compileExpression('ln(x)', { variables: ['x'] })
    expect(compiled.evaluate({ x: Math.E })).toBeCloseTo(1)
  })

  it('uses standard precedence for unary minus and exponentiation', () => {
    const negatedSquare = compileExpression('-x^2', { variables: ['x'] })
    const parenthesizedSquare = compileExpression('(-x)^2', { variables: ['x'] })
    const gaussian = compileExpression('exp(-x^2)', { variables: ['x'] })

    expect(negatedSquare.evaluate({ x: 2 })).toBeCloseTo(-4)
    expect(parenthesizedSquare.evaluate({ x: 2 })).toBeCloseTo(4)
    expect(gaussian.evaluate({ x: 2 })).toBeCloseTo(Math.exp(-4))
  })

  it('rejects variables outside the whitelist', () => {
    expect(() => compileExpression('sin(y)', { variables: ['x'] })).toThrow()
  })

  it('rejects assignment-like syntax by token failure', () => {
    expect(() => compileExpression('x = 2', { variables: ['x'] })).toThrow()
  })
})

describe('calculus math input helpers', () => {
  it('completes bare common function names', () => {
    expect(completeBareFunctionInput('sin')).toBe('sin(x)')
    expect(completeBareFunctionInput('ln')).toBe('ln(x)')
  })

  it('normalizes common math symbols', () => {
    expect(normalizeMathInput('√(x) + π × x')).toBe('sqrt(x) + pi * x')
    expect(normalizeMathInput('sin x + ln x + x²')).toBe('sin(x) + ln(x) + x^2')
    expect(normalizeMathInput('√x + x³')).toBe('sqrt(x) + x^3')
  })
})

describe('calculus numerics', () => {
  it('derivative of x^2 at x=2 is approximately 4', () => {
    expect(approximateDerivative((x) => x * x, 2)).toBeCloseTo(4, 3)
  })

  it('derivative of sin(x) at x=0 is approximately 1', () => {
    expect(approximateDerivative(Math.sin, 0)).toBeCloseTo(1, 3)
  })

  it('integrates x from 0 to 1 near 0.5', () => {
    expect(referenceIntegral((x) => x, 0, 1)).toBeCloseTo(0.5, 3)
  })

  it('integrates x^2 from 0 to 1 near one third', () => {
    expect(referenceIntegral((x) => x * x, 0, 1)).toBeCloseTo(1 / 3, 3)
  })

  it('riemann midpoint sum gives a finite result', () => {
    expect(riemannSum(Math.sin, 0, Math.PI, 20, 'midpoint')).toBeGreaterThan(1.9)
  })

  it('factorial works for small values', () => {
    expect(factorial(0)).toBe(1)
    expect(factorial(5)).toBe(120)
  })

  it('taylor polynomial helper evaluates coefficients', () => {
    expect(taylorPolynomialValue([1, 1, 0.5], 0, 2)).toBe(5)
  })

  it('classifies matching one-sided values as an existing numerical limit', () => {
    expect(classifyLimit(1.001, 0.999, 0.01)).toBe('exists')
    expect(classifyLimit(1, -1, 0.01)).toBe('does-not-exist')
  })
})
