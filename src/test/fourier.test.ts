import { describe, expect, it } from 'vitest'
import { compileFourierExpression, sampleFourierPreset } from '../modules/fourier/fourierPresets.ts'
import { complex, div, expi, formatComplex, magnitude, mul, nearlyEqualComplex } from '../modules/fourier/math/complex.ts'
import { applyHighPass, applyLowPass } from '../modules/fourier/math/filters.ts'
import { computeCoefficientAtFrequency, computeIntegerSpectrum, findDominantFrequencies } from '../modules/fourier/math/fourier.ts'
import { maxAbsError, reconstructSamples } from '../modules/fourier/math/reconstruction.ts'

describe('fourier complex math', () => {
  it('multiplies, divides, and formats complex numbers', () => {
    const product = mul(complex(1, 2), complex(3, -1))
    expect(product.re).toBeCloseTo(5)
    expect(product.im).toBeCloseTo(5)
    expect(div(product, complex(3, -1)).re).toBeCloseTo(1)
    expect(div(product, complex(3, -1)).im).toBeCloseTo(2)
    expect(formatComplex(complex(0, -0.5))).toBe('0 - 0.5i')
  })

  it('creates unit phasors', () => {
    expect(nearlyEqualComplex(expi(Math.PI), complex(-1, 0), 1e-9)).toBe(true)
    expect(magnitude(expi(1.7))).toBeCloseTo(1)
  })
})

describe('fourier expression and presets', () => {
  it('uses t and x as the same normalized variable', () => {
    const tExpression = compileFourierExpression('sin(2*pi*t)')
    const xExpression = compileFourierExpression('sin(2*pi*x)')
    expect(tExpression.evaluate({ t: 0.25 })).toBeCloseTo(1)
    expect(xExpression.evaluate({ t: 0.25 })).toBeCloseTo(1)
  })

  it('generates deterministic noisy samples', () => {
    expect(sampleFourierPreset('noisy-sine', 16)).toEqual(sampleFourierPreset('noisy-sine', 16))
  })
})

describe('fourier transform math', () => {
  it('finds the frequency pair in a sine wave', () => {
    const samples = sampleFourierPreset('sine-3', 256, false)
    const positive = computeCoefficientAtFrequency(samples, 3)
    const negative = computeCoefficientAtFrequency(samples, -3)
    expect(positive.magnitude).toBeCloseTo(0.5, 2)
    expect(negative.magnitude).toBeCloseTo(0.5, 2)
    expect(computeCoefficientAtFrequency(samples, 1).magnitude).toBeLessThan(0.01)
  })

  it('reconstructs from the integer spectrum', () => {
    const samples = sampleFourierPreset('sum-of-sines', 256, false)
    const spectrum = computeIntegerSpectrum(samples, 8)
    const reconstructed = reconstructSamples(spectrum.coefficients, samples.length)
    expect(maxAbsError(samples, reconstructed)).toBeLessThan(0.02)
  })

  it('filters high and low components', () => {
    const samples = sampleFourierPreset('mixed-signal', 256, false)
    const spectrum = computeIntegerSpectrum(samples, 10)
    const lowPass = applyLowPass(spectrum, 2)
    const highPass = applyHighPass(spectrum, 3)
    expect(findDominantFrequencies(lowPass, 2).every((coefficient) => Math.abs(coefficient.frequency) <= 2)).toBe(true)
    expect(findDominantFrequencies(highPass, 2).every((coefficient) => Math.abs(coefficient.frequency) >= 3)).toBe(true)
  })
})
