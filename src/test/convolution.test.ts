import { describe, expect, it } from 'vitest'
import { moduleRegistry } from '../platform/moduleRegistry.ts'
import { resolveRoute } from '../platform/routes.ts'
import { continuousConvolutionAt, continuousConvolutionCurve, makeContinuousPresetFunction, productCurveAtShift, trapezoidIntegral } from '../modules/convolution/math/continuousConvolution.ts'
import { crossCorrelate, discreteConvolutionTerms, discreteConvolve, isSymmetricKernel } from '../modules/convolution/math/discreteConvolution.ts'
import {
  applyKernelToImageData,
  clampPixel,
  getPixelWithBoundaryMode,
  makeBoxBlurKernel3,
  makeIdentityKernel3,
  normalizeKernel2D,
} from '../modules/convolution/math/imageConvolution.ts'
import { convolutionTermsForCoefficient, polynomialMultiply, polynomialToString } from '../modules/convolution/math/polynomialConvolution.ts'
import { convolveDistributions, distributionMean, makeDieDistribution, normalizeDistribution, validateDistribution } from '../modules/convolution/math/probabilityConvolution.ts'
import { addNoise, convolveSignal, makeDifferenceKernel, makeGaussianKernel1D, makeImpulseSignal, makeMovingAverageKernel, makeStepSignal } from '../modules/convolution/math/signalKernels.ts'
import {
  decodeContinuousState,
  decodeDiscreteState,
  decodeImageKernelState,
  decodePolynomialState,
  decodeProbabilityState,
  decodeSignalState,
} from '../modules/convolution/shared/convolutionUrlState.ts'

describe('discrete convolution math', () => {
  it('computes full convolution and lengths', () => {
    expect(discreteConvolve([1, 2, 3], [1, 1], 'full')).toEqual([1, 3, 5, 3])
    expect(discreteConvolve([1, 2, 3], [1, 1], 'full')).toHaveLength(4)
    expect(discreteConvolve([1, 2, 3], [1, 1], 'same')).toHaveLength(3)
    expect(discreteConvolve([1, 2, 3], [1, 1], 'valid')).toHaveLength(2)
  })

  it('keeps mathematical convolution distinct from correlation for asymmetric kernels', () => {
    expect(discreteConvolve([1, 2, 3], [0, 1], 'full')).toEqual([0, 1, 2, 3])
    expect(crossCorrelate([1, 2, 3], [0, 1], 'full')).toEqual([1, 2, 3, 0])
    expect(crossCorrelate([1, 2, 3], [1, 2, 1], 'full')).toEqual(discreteConvolve([1, 2, 3], [1, 2, 1], 'full'))
    expect(isSymmetricKernel([1, 2, 1])).toBe(true)
  })

  it('returns terms for an output coefficient', () => {
    expect(discreteConvolutionTerms([1, 2, 3], [1, 1], 2)).toEqual([
      { aIndex: 1, bIndex: 1, aValue: 2, bValue: 1, product: 2 },
      { aIndex: 2, bIndex: 0, aValue: 3, bValue: 1, product: 3 },
    ])
  })
})

describe('probability convolution math', () => {
  it('convolves fair dice and preserves moments', () => {
    const d6 = makeDieDistribution(6)
    const sum = convolveDistributions(d6, d6)
    const p7 = sum.probabilities[sum.support.indexOf(7)]
    const p2 = sum.probabilities[sum.support.indexOf(2)]
    expect(sum.probabilities.reduce((total, value) => total + value, 0)).toBeCloseTo(1)
    expect(p7).toBeCloseTo(6 / 36)
    expect(p2).toBeCloseTo(1 / 36)
    expect(distributionMean(sum)).toBeCloseTo(distributionMean(d6) + distributionMean(d6))
  })

  it('normalizes and validates safely', () => {
    expect(validateDistribution({ support: [0], probabilities: [-1] })).toBe(false)
    expect(normalizeDistribution({ support: [0, 1], probabilities: [0, 0] })).toEqual({ support: [0], probabilities: [1] })
  })
})

describe('signal filtering math', () => {
  it('handles impulse, smoothing kernels, step differences, and deterministic noise', () => {
    expect(convolveSignal(makeImpulseSignal(5, 2), [2, 3], 'full')).toEqual([0, 0, 2, 3, 0, 0])
    expect(makeMovingAverageKernel(5).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1)
    expect(makeGaussianKernel1D(5, 1).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1)
    expect(convolveSignal([1, 2, 3], [1, 1], 'same')).toHaveLength(3)
    expect(Math.max(...convolveSignal(makeStepSignal(8), makeDifferenceKernel(), 'same').map(Math.abs))).toBeGreaterThan(0.9)
    expect(addNoise([1, 1, 1], 0.5, 42)).toEqual(addNoise([1, 1, 1], 0.5, 42))
  })
})

describe('image convolution math', () => {
  it('applies identity and box blur kernels correctly', () => {
    const image = makeImageData(
      new Uint8ClampedArray([
        0, 0, 0, 255, 10, 10, 10, 255, 20, 20, 20, 255,
        30, 30, 30, 255, 90, 90, 90, 255, 60, 60, 60, 255,
        70, 70, 70, 255, 80, 80, 80, 255, 100, 100, 100, 255,
      ]),
      3,
      3,
    )
    expect([...applyKernelToImageData(image, makeIdentityKernel3(), { mode: 'correlation', boundaryMode: 'zero', normalize: false, preserveAlpha: true }).data]).toEqual([...image.data])
    const blurred = applyKernelToImageData(image, makeBoxBlurKernel3(), { mode: 'correlation', boundaryMode: 'clamp', normalize: false, preserveAlpha: true })
    expect(blurred.data[(1 * 3 + 1) * 4]).toBe(51)
  })

  it('handles boundary modes, clamping, alpha, and zero-sum normalization', () => {
    const image = makeImageData(new Uint8ClampedArray([10, 20, 30, 40]), 1, 1)
    expect(clampPixel(300)).toBe(255)
    expect(getPixelWithBoundaryMode(image, -1, 0, 'zero')).toEqual([0, 0, 0, 0])
    expect(getPixelWithBoundaryMode(image, -1, 0, 'clamp')).toEqual([10, 20, 30, 40])
    expect(getPixelWithBoundaryMode(image, -1, 0, 'wrap')).toEqual([10, 20, 30, 40])
    expect(applyKernelToImageData(image, makeIdentityKernel3(), { mode: 'correlation', boundaryMode: 'zero', normalize: false, preserveAlpha: true }).data[3]).toBe(40)
    expect(normalizeKernel2D([[1, -1]])).toEqual([[1, -1]])
  })
})

describe('polynomial coefficient convolution', () => {
  it('multiplies ascending-power coefficient lists', () => {
    expect(polynomialMultiply([1, 1], [1, 1])).toEqual([1, 2, 1])
    expect(polynomialMultiply([1, 2, 3], [4, 5])).toEqual([4, 13, 22, 15])
    expect(convolutionTermsForCoefficient([1, 2, 3], [4, 5], 1).map((term) => term.product)).toEqual([5, 8])
    expect(polynomialToString([0, -1, 2])).toBe('-x + 2x^2')
  })
})

describe('continuous convolution numerics', () => {
  it('integrates products and returns finite curves', () => {
    const rectangle = makeContinuousPresetFunction('rectangle')
    const gaussian = makeContinuousPresetFunction('gaussian')
    expect(continuousConvolutionAt(rectangle, rectangle, 0, -2, 2, 160)).toBeGreaterThan(0.9)
    expect(continuousConvolutionAt(rectangle, rectangle, 2, -2, 2, 160)).toBeLessThan(0.05)
    expect(continuousConvolutionCurve(gaussian, gaussian, -1, 1, -4, 4, 80).every((sample) => Number.isFinite(sample.y))).toBe(true)
    expect(continuousConvolutionAt(() => Number.NaN, rectangle, 0, -1, 1, 20)).toBe(0)
    expect(trapezoidIntegral([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toBeCloseTo(0.5)
    expect(productCurveAtShift(rectangle, rectangle, 0, -1, 1, 20).every((sample) => Number.isFinite(sample.y))).toBe(true)
  })
})

describe('convolution module registry and URL params', () => {
  it('registers the convolution module once with all six ready routes', () => {
    const modules = moduleRegistry.filter((module) => module.id === 'convolution')
    expect(modules).toHaveLength(1)
    expect(modules[0].status).toBe('ready')
    expect(modules[0].lessons).toHaveLength(6)
    expect(resolveRoute('/modules/convolution').kind).toBe('module')
    expect(resolveRoute('/modules/convolution/discrete').kind).toBe('lesson')
    expect(resolveRoute('/modules/convolution/probability').kind).toBe('lesson')
    expect(resolveRoute('/modules/convolution/signal').kind).toBe('lesson')
    expect(resolveRoute('/modules/convolution/image-kernel').kind).toBe('lesson')
    expect(resolveRoute('/modules/convolution/polynomial').kind).toBe('lesson')
    expect(resolveRoute('/modules/convolution/continuous').kind).toBe('lesson')
    expect(moduleRegistry.find((module) => module.id === 'matrix')).toBeTruthy()
    expect(moduleRegistry.find((module) => module.id === 'calculus')).toBeTruthy()
  })

  it('reads lesson URL params and falls back on invalid params', () => {
    expect(decodeDiscreteState(new URLSearchParams('a=1,2&b=3&mode=same&operation=correlation&k=1')).mode).toBe('same')
    expect(decodeProbabilityState(new URLSearchParams('preset=d6-d6&sum=7')).sum).toBe(7)
    expect(decodeSignalState(new URLSearchParams('signal=sine&kernel=gaussian&mode=same&boundary=wrap&length=64&sigma=1.2&noise=0.2&seed=4&index=3')).boundary).toBe('wrap')
    expect(decodeImageKernelState(new URLSearchParams('image=edge-shapes&kernel=sharpen&boundary=clamp&operation=correlation&normalize=false&preserveAlpha=true&grayscale=false')).kernel).toBe('sharpen')
    expect(decodePolynomialState(new URLSearchParams('a=1,1&b=1,1&k=2')).a).toEqual([1, 1])
    expect(decodeContinuousState(new URLSearchParams('f=rectangle&g=gaussian&t=0.5&samples=96')).t).toBe(0.5)
    expect(decodeDiscreteState(new URLSearchParams('mode=bad&a=')).mode).toBe('full')
    expect(decodeProbabilityState(new URLSearchParams()).sum).toBe(7)
    expect(decodeSignalState(new URLSearchParams()).length).toBe(64)
    expect(decodeContinuousState(new URLSearchParams()).samples).toBe(96)
  })
})

function makeImageData(data: Uint8ClampedArray, width: number, height: number): ImageData {
  if (typeof ImageData !== 'undefined') return new ImageData(data as ImageDataArray, width, height)
  return { data, width, height, colorSpace: 'srgb' } as ImageData
}
