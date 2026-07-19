import { describe, expect, it } from 'vitest'
import { compileFourierExpression, sampleFourierExpression, sampleFourierPreset } from '../modules/fourier/fourierPresets.ts'
import { complex, div, expi, formatComplex, magnitude, mul, nearlyEqualComplex } from '../modules/fourier/math/complex.ts'
import { applyHighPass, applyLowPass } from '../modules/fourier/math/filters.ts'
import { computeFrequencyPair, computeFrequencyPairFrame, synthesizeFrequencyPair } from '../modules/fourier/math/frequencyPair.ts'
import { computeCoefficientAtFrequency, computeIntegerSpectrum, findDominantFrequencies, interpolateWindingPoint, selectPairedFrequencyBlocks } from '../modules/fourier/math/fourier.ts'
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

  it('preserves expression amplitude unless normalization is explicitly enabled', () => {
    const raw = sampleFourierExpression('0.25*sin(2*pi*t)', 256)
    const normalized = sampleFourierExpression('0.25*sin(2*pi*t)', 256, true)
    expect(Math.max(...raw)).toBeCloseTo(0.25, 6)
    expect(Math.max(...normalized)).toBeCloseTo(1, 6)
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

  it('preserves conjugate symmetry for real-valued samples', () => {
    const samples = sampleFourierPreset('mixed-signal', 256, false)
    for (const frequency of [1, 2, 3, 5]) {
      const positive = computeCoefficientAtFrequency(samples, frequency).value
      const negative = computeCoefficientAtFrequency(samples, -frequency).value
      expect(negative.re).toBeCloseTo(positive.re, 10)
      expect(negative.im).toBeCloseTo(-positive.im, 10)
    }
  })

  it('reconstructs from the integer spectrum', () => {
    const samples = sampleFourierPreset('sum-of-sines', 256, false)
    const spectrum = computeIntegerSpectrum(samples, 8)
    const reconstructed = reconstructSamples(spectrum.coefficients, samples.length)
    expect(maxAbsError(samples, reconstructed)).toBeLessThan(0.02)
  })

  it('selects real-signal reconstruction frequencies as mirrored blocks', () => {
    const samples = sampleFourierPreset('sum-of-sines', 256, false)
    const spectrum = computeIntegerSpectrum(samples, 8)
    const selected = selectPairedFrequencyBlocks(spectrum.coefficients, 2).map((coefficient) => coefficient.frequency)
    expect(selected).toEqual([-3, -1, 1, 3])
  })

  it('filters high and low components', () => {
    const samples = sampleFourierPreset('mixed-signal', 256, false)
    const spectrum = computeIntegerSpectrum(samples, 10)
    const lowPass = applyLowPass(spectrum, 2)
    const highPass = applyHighPass(spectrum, 3)
    expect(findDominantFrequencies(lowPass, 2).every((coefficient) => Math.abs(coefficient.frequency) <= 2)).toBe(true)
    expect(findDominantFrequencies(highPass, 2).every((coefficient) => Math.abs(coefficient.frequency) >= 3)).toBe(true)
  })

  it('interpolates the animated winding vector between adjacent samples', () => {
    const points = [
      { t: 0, sample: 0, point: complex(0, 0) },
      { t: 0.5, sample: 1, point: complex(2, 2) },
    ]
    expect(interpolateWindingPoint(points, 0.25)).toEqual(complex(1, 1))
    expect(interpolateWindingPoint(points, 0.75)).toEqual(complex(1, 1))
    expect(interpolateWindingPoint([], 0.5)).toBeUndefined()
  })
})

describe('conjugate frequency-pair synthesis', () => {
  it('reconstructs a cosine from equal conjugate arrows', () => {
    const samples = sampleFourierPreset('cosine-2', 256, false)
    const pair = computeFrequencyPair(samples, 2)

    expect(pair.positive.magnitude).toBeCloseTo(0.5, 10)
    expect(pair.negative?.magnitude).toBeCloseTo(0.5, 10)
    expect(pair.negative?.value.re).toBeCloseTo(pair.positive.value.re, 10)
    expect(pair.negative?.value.im).toBeCloseTo(-pair.positive.value.im, 10)
    expect(maxAbsError(samples, synthesizeFrequencyPair(pair, samples.length))).toBeLessThan(1e-10)
  })

  it('cancels the two arrow heights while reconstructing a sine', () => {
    const samples = sampleFourierPreset('sine-3', 256, false)
    const pair = computeFrequencyPair(samples, 3)

    for (const t of [0, 0.071, 0.25, 0.413, 0.9]) {
      const frame = computeFrequencyPairFrame(pair, t)
      expect(frame.negative).not.toBeNull()
      expect(frame.positive.im + frame.negative!.im).toBeCloseTo(0, 10)
      expect(frame.sum.im).toBeCloseTo(0, 10)
    }
    expect(maxAbsError(samples, synthesizeFrequencyPair(pair, samples.length))).toBeLessThan(1e-10)
  })

  it('keeps a non-peak frequency naturally weak', () => {
    const samples = sampleFourierPreset('sine-1', 256, false)
    const pair = computeFrequencyPair(samples, 2)
    const contribution = synthesizeFrequencyPair(pair, samples.length)

    expect(pair.positive.magnitude).toBeLessThan(0.01)
    expect(pair.negative?.magnitude).toBeLessThan(0.01)
    expect(Math.max(...contribution.map(Math.abs))).toBeLessThan(0.01)
  })

  it('treats DC as one stationary coefficient instead of doubling it', () => {
    const samples = sampleFourierPreset('constant', 128, false)
    const pair = computeFrequencyPair(samples, 0)
    const frame = computeFrequencyPairFrame(pair, 0.73)

    expect(pair.negative).toBeNull()
    expect(frame.negative).toBeNull()
    expect(frame.sum.re).toBeCloseTo(1, 10)
    expect(synthesizeFrequencyPair(pair, samples.length)).toEqual(samples)
  })
})
