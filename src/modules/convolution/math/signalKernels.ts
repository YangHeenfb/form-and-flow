import type { ConvolutionMode } from '../convolutionTypes.ts'
import { discreteConvolve } from './discreteConvolution.ts'

export function makeMovingAverageKernel(size: number): number[] {
  const length = Math.max(1, Math.floor(size))
  return Array.from({ length }, () => 1 / length)
}

export function makeGaussianKernel1D(size: number, sigma: number): number[] {
  const length = Math.max(1, Math.floor(size))
  const safeSigma = Math.max(0.05, Number.isFinite(sigma) ? sigma : 1)
  const center = (length - 1) / 2
  return normalizeKernel(
    Array.from({ length }, (_, index) => {
      const x = index - center
      return Math.exp(-(x * x) / (2 * safeSigma * safeSigma))
    }),
  )
}

export function makeDifferenceKernel(): number[] {
  return [-1, 1]
}

export function makeSharpen1DKernel(): number[] {
  return [-0.5, 2, -0.5]
}

export function makeEdgeDetect1DKernel(): number[] {
  return [-1, 0, 1]
}

export function normalizeKernel(kernel: number[]): number[] {
  const sum = kernel.reduce((total, value) => total + safeNumber(value), 0)
  if (Math.abs(sum) < 1e-12) return kernel.map(safeNumber)
  return kernel.map((value) => safeNumber(value) / sum)
}

export function convolveSignal(signal: number[], kernel: number[], mode: ConvolutionMode = 'same'): number[] {
  return discreteConvolve(signal, kernel, mode)
}

export function addNoise(signal: number[], amplitude: number, seed: number): number[] {
  let state = Math.max(1, Math.floor(Math.abs(seed))) % 2147483647
  const scale = Number.isFinite(amplitude) ? amplitude : 0
  return signal.map((value) => {
    state = (state * 16807) % 2147483647
    const random = (state - 1) / 2147483646
    return value + (random * 2 - 1) * scale
  })
}

export function makeStepSignal(length: number): number[] {
  const count = boundedLength(length)
  return Array.from({ length: count }, (_, index) => (index >= count / 2 ? 1 : 0))
}

export function makeImpulseSignal(length: number, index: number): number[] {
  const count = boundedLength(length)
  const impulseIndex = Math.max(0, Math.min(count - 1, Math.floor(index)))
  return Array.from({ length: count }, (_, current) => (current === impulseIndex ? 1 : 0))
}

export function makeSineSignal(length: number, frequency: number): number[] {
  const count = boundedLength(length)
  return Array.from({ length: count }, (_, index) => Math.sin((Math.PI * 2 * frequency * index) / count))
}

export function makeMixedSignal(length: number, frequencies: number[]): number[] {
  const count = boundedLength(length)
  const active = frequencies.length > 0 ? frequencies : [2, 7]
  return Array.from({ length: count }, (_, index) => {
    const total = active.reduce((sum, frequency) => sum + Math.sin((Math.PI * 2 * frequency * index) / count), 0)
    return total / active.length
  })
}

function boundedLength(length: number): number {
  return Math.max(1, Math.min(512, Math.floor(length)))
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0
}
