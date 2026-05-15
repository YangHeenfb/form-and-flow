import type { Kernel2D } from './math/imageConvolution.ts'
import {
  makeBoxBlurKernel3,
  makeEdgeDetectKernel3,
  makeEmbossKernel3,
  makeGaussianBlurKernel3,
  makeIdentityKernel3,
  makeSharpenKernel3,
  makeSobelXKernel3,
  makeSobelYKernel3,
} from './math/imageConvolution.ts'
import { convolveDistributions, makeCoinDistribution, makeCustomDistribution, makeDieDistribution, makeSumOfNDiceDistribution, type DiscreteDistribution } from './math/probabilityConvolution.ts'
import { addNoise, makeDifferenceKernel, makeEdgeDetect1DKernel, makeGaussianKernel1D, makeImpulseSignal, makeMixedSignal, makeMovingAverageKernel, makeSharpen1DKernel, makeSineSignal, makeStepSignal } from './math/signalKernels.ts'

export type SequencePreset = {
  id: string
  label: string
  a: number[]
  b: number[]
}

export type ProbabilityPreset = {
  id: string
  label: string
  x: DiscreteDistribution
  y: DiscreteDistribution
  note: string
}

export type SignalPreset = {
  id: string
  label: string
  make: (length: number, seed: number, noise: number) => number[]
}

export type KernelPreset1D = {
  id: string
  label: string
  make: (size: number, sigma: number) => number[]
}

export type ImageKernelPreset = {
  id: string
  label: string
  kernel: Kernel2D
}

export type PolynomialPreset = {
  id: string
  label: string
  a: number[]
  b: number[]
}

export const discretePresets: SequencePreset[] = [
  { id: 'impulse', label: 'impulse identity', a: [0, 1, 0, 0], b: [1] },
  { id: 'box-blur', label: 'box blur', a: [1, 3, 2, 0, 2], b: [1 / 3, 1 / 3, 1 / 3] },
  { id: 'edge', label: 'edge detector', a: [0, 0, 1, 1, 3, 3], b: [-1, 1] },
  { id: 'custom-small', label: 'small custom', a: [1, 2, 3], b: [1, 1] },
  { id: 'asymmetric', label: 'asymmetric kernel', a: [1, 0, 2, 1], b: [0, 1, 2] },
  { id: 'symmetric', label: 'symmetric kernel', a: [2, 1, 3, 0, 1], b: [1, 2, 1] },
]

export const probabilityPresets: ProbabilityPreset[] = [
  { id: 'd6-d6', label: 'fair d6 + fair d6', x: makeDieDistribution(6), y: makeDieDistribution(6), note: 'The middle sums have the most pairs.' },
  { id: 'coin-coin', label: 'biased coin + biased coin', x: makeCoinDistribution(0.7), y: makeCoinDistribution(0.35), note: 'Each sum collects the matching coin outcomes.' },
  { id: 'd4-d8', label: 'd4 + d8', x: makeDieDistribution(4), y: makeDieDistribution(8), note: 'Different supports produce a trapezoid-like sum distribution.' },
  { id: 'custom', label: 'custom small distribution', x: makeCustomDistribution([0, 1, 1, 2]), y: makeCustomDistribution([0, 2, 2, 3]), note: 'Repeated values act like larger probability mass.' },
  { id: 'three-dice', label: 'repeated dice sum', x: makeSumOfNDiceDistribution(2, 6), y: makeDieDistribution(6), note: 'Repeated convolution builds a bell-shaped dice total.' },
  { id: 'coins', label: 'binomial coin flips', x: makeSumOfNCoinsDistribution(3), y: makeSumOfNCoinsDistribution(2), note: 'Many independent 0/1 coin flips concentrate near the center.' },
]

function makeSumOfNCoinsDistribution(count: number, p = 0.5): DiscreteDistribution {
  let distribution = makeCoinDistribution(p)
  for (let index = 1; index < Math.max(1, Math.floor(count)); index += 1) {
    distribution = convolveDistributions(distribution, makeCoinDistribution(p))
  }
  return distribution
}

export const signalPresets: SignalPreset[] = [
  { id: 'impulse', label: 'impulse', make: (length) => makeImpulseSignal(length, Math.floor(length / 2)) },
  { id: 'step', label: 'step', make: (length) => makeStepSignal(length) },
  { id: 'sine', label: 'sine', make: (length) => makeSineSignal(length, 3) },
  { id: 'mixed-sine', label: 'mixed sine', make: (length) => makeMixedSignal(length, [2, 7, 13]) },
  { id: 'noisy-sine', label: 'noisy sine', make: (length, seed, noise) => addNoise(makeSineSignal(length, 4), noise, seed) },
  { id: 'random-spikes', label: 'random spikes', make: (length, seed, noise) => addNoise(makeImpulseSignal(length, Math.floor(length * 0.25)).map((value, index) => value + (index % 17 === 0 ? 0.8 : 0)), Math.max(noise, 0.25), seed) },
]

export const signalKernelPresets: KernelPreset1D[] = [
  { id: 'identity', label: 'identity', make: () => [1] },
  { id: 'moving-average-3', label: 'moving average 3', make: () => makeMovingAverageKernel(3) },
  { id: 'moving-average-5', label: 'moving average 5', make: () => makeMovingAverageKernel(5) },
  { id: 'gaussian', label: 'gaussian', make: (size, sigma) => makeGaussianKernel1D(size, sigma) },
  { id: 'difference', label: 'difference', make: () => makeDifferenceKernel() },
  { id: 'edge', label: 'edge detect', make: () => makeEdgeDetect1DKernel() },
  { id: 'sharpen', label: 'sharpen-like 1D', make: () => makeSharpen1DKernel() },
]

export const imageKernelPresets: ImageKernelPreset[] = [
  { id: 'identity', label: 'identity', kernel: makeIdentityKernel3() },
  { id: 'box-blur', label: 'box blur', kernel: makeBoxBlurKernel3() },
  { id: 'gaussian-blur', label: 'gaussian blur', kernel: makeGaussianBlurKernel3() },
  { id: 'sharpen', label: 'sharpen', kernel: makeSharpenKernel3() },
  { id: 'edge-detect', label: 'edge detect', kernel: makeEdgeDetectKernel3() },
  { id: 'emboss', label: 'emboss', kernel: makeEmbossKernel3() },
  { id: 'sobel-x', label: 'sobel x', kernel: makeSobelXKernel3() },
  { id: 'sobel-y', label: 'sobel y', kernel: makeSobelYKernel3() },
]

export const polynomialPresets: PolynomialPreset[] = [
  { id: 'binomial', label: '(1 + x)(1 + x)', a: [1, 1], b: [1, 1] },
  { id: 'square', label: '(1 + x)^2', a: [1, 1], b: [1, 1] },
  { id: 'cube-step', label: '(1 + x)^3 step', a: [1, 2, 1], b: [1, 1] },
  { id: 'asymmetric', label: 'asymmetric polynomials', a: [2, -1, 3], b: [1, 4] },
  { id: 'negative', label: 'negative coefficients', a: [1, -2, 1], b: [2, 0, -1] },
  { id: 'zeros', label: 'zero coefficients', a: [0, 1, 0, 2], b: [1, 0, 3] },
]
