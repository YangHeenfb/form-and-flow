import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { compileExpression } from '../core/math/expression.ts'
import { CalculusLesson } from '../modules/calculus/CalculusLesson.tsx'
import {
  approximateDerivative,
  buildTaylorCoefficientsForPreset,
  classifyLimit,
  derivativeDiagnostic,
  estimateMaxError,
  factorial,
  finiteDifference,
  isTaylorPresetId,
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

  it('keeps displayed secant slope tied to the chosen h', () => {
    expect(finiteDifference((x) => x * x, 1, 2)).toBeCloseTo(4)
  })

  it('marks abs(x) at 0 as not differentiable', () => {
    const diagnostic = derivativeDiagnostic(Math.abs, 0)

    expect(diagnostic.value).toBeNull()
    expect(diagnostic.reason).toBe('one-sided-mismatch')
    expect(diagnostic.leftSlope).toBeCloseTo(-1)
    expect(diagnostic.rightSlope).toBeCloseTo(1)
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

  it('keeps rectangular Riemann sums distinct from the trapezoidal rule', () => {
    expect(riemannSum((x) => x, 0, 1, 1, 'left')).toBeCloseTo(0)
    expect(riemannSum((x) => x, 0, 1, 1, 'trapezoid')).toBeCloseTo(0.5)
  })

  it('matches the FTC relation between accumulation slope and function height', () => {
    const fn = (x: number) => Math.sin(x) + 1
    const accumulation = (x: number) => referenceIntegral(fn, 0, x)

    expect(approximateDerivative(accumulation, 0.7)).toBeCloseTo(fn(0.7), 3)
  })

  it('states the FTC identity exactly while numerical readouts remain estimates', () => {
    const html = renderToStaticMarkup(createElement(CalculusLesson, { lessonId: 'fundamental-theorem' }))

    expect(html).toContain('A&#x27;(x)=f(x)')
    expect(html).not.toContain('A&#x27;(x)≈f(x)')
  })

  it('factorial works for small values', () => {
    expect(factorial(0)).toBe(1)
    expect(factorial(5)).toBe(120)
  })

  it('taylor polynomial helper evaluates coefficients', () => {
    expect(taylorPolynomialValue([1, 1, 0.5], 0, 2)).toBe(5)
  })

  it('only builds Taylor coefficients for supported analytic presets', () => {
    expect(isTaylorPresetId('sin')).toBe(true)
    expect(isTaylorPresetId('x2')).toBe(false)
    const coefficients = buildTaylorCoefficientsForPreset('sin', 0, 3)

    expect(coefficients[0]).toBeCloseTo(0)
    expect(coefficients[1]).toBeCloseTo(1)
    expect(coefficients[2]).toBeCloseTo(0)
    expect(coefficients[3]).toBeCloseTo(-1 / 6)
  })

  it('estimates max Taylor error across a sampled window', () => {
    const coefficients = buildTaylorCoefficientsForPreset('sin', 0, 3)
    const approximation = (x: number) => taylorPolynomialValue(coefficients, 0, x)

    expect(estimateMaxError(Math.sin, approximation, -0.5, 0.5, 50)).toBeLessThan(0.003)
  })

  it('classifies matching one-sided values as an existing numerical limit', () => {
    expect(classifyLimit(1.001, 0.999, 0.01)).toBe('exists')
    expect(classifyLimit(1, -1, 0.01)).toBe('does-not-exist')
  })
})
