import { describe, expect, it } from 'vitest'
import { compileFourierExpression, sampleFourierExpression, sampleFourierPreset } from '../modules/fourier/fourierPresets.ts'
import { complex, div, expi, formatComplex, magnitude, mul, nearlyEqualComplex } from '../modules/fourier/math/complex.ts'
import { applyHighPass, applyLowPass } from '../modules/fourier/math/filters.ts'
import { computeFrequencyPair, computeFrequencyPairFrame, synthesizeFrequencyPair } from '../modules/fourier/math/frequencyPair.ts'
import { computeCoefficientAtFrequency, computeIntegerSpectrum, findDominantFrequencies, interpolateWindingPoint, selectPairedFrequencyBlocks } from '../modules/fourier/math/fourier.ts'
import { maxAbsError, reconstructSamples } from '../modules/fourier/math/reconstruction.ts'
import { axisContains, axisValueToPosition, frequencyAxisTicks, frequencyDisplayDomain, integerMinorTicks } from '../modules/fourier/math/axisTicks.ts'
import { buildFourierModeHref, filterSummary, pairSynthesisConclusion, probeResponseConclusion, reconstructionContributionLabel, selectCurrentContribution } from '../modules/fourier/fourierExplanation.ts'
import type { FilterConfig, FourierCoefficient, Spectrum } from '../modules/fourier/fourierTypes.ts'

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

describe('fourier axes', () => {
  const measureLabel = (label: string) => label.length * 5

  it('labels every integer in the default desktop frequency range', () => {
    const domain = frequencyDisplayDomain(-10, 10, false)
    expect(frequencyAxisTicks(domain, 510, measureLabel).map((tick) => tick.value)).toEqual([
      -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
    expect(integerMinorTicks(domain)).toHaveLength(21)
  })

  it('reduces mobile labels while retaining integer minor ticks and zero', () => {
    const domain = frequencyDisplayDomain(-10, 10, false)
    expect(frequencyAxisTicks(domain, 185, measureLabel).map((tick) => tick.value)).toEqual([-10, -5, 0, 5, 10])
    expect(integerMinorTicks(domain)).toContain(1)
    expect(integerMinorTicks(domain)).toContain(-3)
  })

  it('uses the visible positive-frequency domain for every coordinate', () => {
    const domain = frequencyDisplayDomain(-10, 10, true)
    expect(domain).toEqual({ min: 0, max: 10 })
    expect(axisContains(domain, -1)).toBe(false)
    expect(axisContains(domain, 3)).toBe(true)
    expect(axisValueToPosition(5, domain, 12, 212)).toBe(112)
  })

  it('creates readable nice ticks for non-integer ranges', () => {
    const domain = frequencyDisplayDomain(-0.75, 1.25, false)
    const ticks = frequencyAxisTicks(domain, 240, measureLabel)
    expect(ticks.map((tick) => tick.value)).toEqual([-0.5, 0, 0.5, 1])
    expect(ticks.find((tick) => tick.value === 0)?.label).toBe('0')
  })
})

describe('fourier intuition explanation model', () => {
  it('classifies weak, partial, and strong winding responses and marks non-integer tests', () => {
    expect(probeResponseConclusion({ locale: 'en', frequency: 1, magnitude: 0.1, peakMagnitude: 1 })).toContain('weak response')
    expect(probeResponseConclusion({ locale: 'en', frequency: 1, magnitude: 0.4, peakMagnitude: 1 })).toContain('partial response')
    expect(probeResponseConclusion({ locale: 'en', frequency: 1, magnitude: 0.7, peakMagnitude: 1 })).toContain('strong response')
    expect(probeResponseConclusion({ locale: 'en', frequency: 1.5, magnitude: 0.4, peakMagnitude: 1 })).toContain('continuous winding test')
    expect(probeResponseConclusion({ locale: 'zh', frequency: 1.5, magnitude: 0.4, peakMagnitude: 1 })).toContain('连续缠绕测试')
  })

  it('selects and labels DC, mirrored pairs, and single-coefficient contributions', () => {
    const dcSpectrum = computeIntegerSpectrum(sampleFourierPreset('constant', 128, false), 3)
    const pairSpectrum = computeIntegerSpectrum(sampleFourierPreset('sine-1', 128, false), 3)
    const dc = selectCurrentContribution(dcSpectrum.coefficients, 'paired-frequency-blocks', 1)
    const pair = selectCurrentContribution(pairSpectrum.coefficients, 'paired-frequency-blocks', 1)
    const single = selectCurrentContribution(pairSpectrum.coefficients, 'top-magnitudes', 1)

    expect(dc.map((coefficient) => coefficient.frequency)).toEqual([0])
    expect(reconstructionContributionLabel(dc, 'en')).toBe('0')
    expect(pair.map((coefficient) => coefficient.frequency)).toEqual([-1, 1])
    expect(reconstructionContributionLabel(pair, 'en')).toBe('±1')
    expect(single).toHaveLength(1)
    expect(reconstructionContributionLabel(single, 'en')).toMatch(/^-?1$/)
  })

  it('distinguishes continuous arrow pairs and the single DC contribution', () => {
    const continuous = pairSynthesisConclusion({ locale: 'en', frequency: 1.5, magnitude: 0.2, hasNegative: true })
    expect(continuous).toContain("only this pair's contribution")
    expect(continuous).toContain('not a discrete reconstruction block')
    const dc = pairSynthesisConclusion({ locale: 'en', frequency: 0, magnitude: 1, hasNegative: false })
    expect(dc).toContain('never a doubled pair')
  })

  it('summarizes all five filtering rules with retained and removed bin counts', () => {
    const coefficients: FourierCoefficient[] = [-2, -1, 0, 1, 2].map((frequency) => ({
      frequency,
      value: complex(0.5, 0),
      magnitude: 0.5,
      phase: 0,
    }))
    const spectrum: Spectrum = { coefficients, frequencyMin: -2, frequencyMax: 2, frequencyStep: 1, sampleCount: 5 }
    const cases: Array<{ config: FilterConfig; name: string; counts: string }> = [
      { config: { type: 'low-pass', cutoff: 1, lowCutoff: 0, highCutoff: 0, threshold: 0 }, name: 'Low-pass', counts: '3 integer frequencies remain and 2 are removed' },
      { config: { type: 'high-pass', cutoff: 1, lowCutoff: 0, highCutoff: 0, threshold: 0 }, name: 'High-pass', counts: '4 integer frequencies remain and 1 is removed' },
      { config: { type: 'band-pass', cutoff: 0, lowCutoff: 1, highCutoff: 2, threshold: 0 }, name: 'Band-pass', counts: '4 integer frequencies remain and 1 is removed' },
      { config: { type: 'band-stop', cutoff: 0, lowCutoff: 1, highCutoff: 2, threshold: 0 }, name: 'Band-stop', counts: '1 integer frequency remains and 4 are removed' },
      { config: { type: 'magnitude-threshold', cutoff: 0, lowCutoff: 0, highCutoff: 0, threshold: 0.4 }, name: 'Magnitude thresholding', counts: '5 integer frequencies remain and 0 are removed' },
    ]

    cases.forEach(({ config, name, counts }) => {
      const summary = filterSummary({ locale: 'en', config, spectrum })
      expect(summary).toContain(name)
      expect(summary).toContain(counts)
    })
  })

  it('carries only preset or custom signal definition into the next Fourier mode', () => {
    const presetHref = buildFourierModeHref({ nextMode: 'reconstruction', presetId: 'square-wave', expression: 'ignored', sampleCount: 256, normalizeAmplitude: false })
    const presetUrl = new URL(presetHref, 'http://localhost')
    expect(Object.fromEntries(presetUrl.searchParams)).toEqual({
      mode: 'reconstruction',
      preset: 'square-wave',
      samples: '256',
      normalize: 'false',
    })

    const customExpression = 'sin(2*pi*t) + 0.5*cos(6*pi*t)'
    const customHref = buildFourierModeHref({ nextMode: 'filtering', presetId: 'custom', expression: customExpression, sampleCount: 512, normalizeAmplitude: true })
    const customUrl = new URL(customHref, 'http://localhost')
    expect(Object.fromEntries(customUrl.searchParams)).toEqual({
      mode: 'filtering',
      preset: 'custom',
      f: customExpression,
      samples: '512',
      normalize: 'true',
    })
    expect(customUrl.searchParams.has('freq')).toBe(false)
    expect(customUrl.searchParams.has('cutoff')).toBe(false)
  })
})
