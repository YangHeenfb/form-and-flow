import type { BoundaryMode, ConvolutionMode, OperationMode } from '../convolutionTypes.ts'

export type DiscreteUrlState = {
  a: number[]
  b: number[]
  mode: ConvolutionMode
  operation: OperationMode
  k: number
}

export type ProbabilityUrlState = {
  preset: string
  sum: number
}

export type SignalUrlState = {
  signal: string
  kernel: string
  mode: ConvolutionMode
  boundary: BoundaryMode
  length: number
  sigma: number
  noise: number
  seed: number
  index: number
}

export type ImageKernelUrlState = {
  image: string
  kernel: string
  boundary: BoundaryMode
  operation: OperationMode
  normalize: boolean
  preserveAlpha: boolean
  grayscale: boolean
}

export type PolynomialUrlState = {
  a: number[]
  b: number[]
  k: number
}

export type ContinuousUrlState = {
  f: string
  g: string
  t: number
  samples: number
}

export function decodeDiscreteState(params: URLSearchParams): DiscreteUrlState {
  return {
    a: readNumberList(params, 'a', [1, 2, 3]),
    b: readNumberList(params, 'b', [1, 1]),
    mode: readChoice(params, 'mode', ['full', 'same', 'valid'], 'full'),
    operation: readChoice(params, 'operation', ['convolution', 'correlation'], 'convolution'),
    k: readNumber(params, 'k', 0),
  }
}

export function decodeProbabilityState(params: URLSearchParams): ProbabilityUrlState {
  return {
    preset: params.get('preset') ?? 'd6-d6',
    sum: readNumber(params, 'sum', 7),
  }
}

export function decodeSignalState(params: URLSearchParams): SignalUrlState {
  return {
    signal: params.get('signal') ?? 'noisy-sine',
    kernel: params.get('kernel') ?? 'gaussian',
    mode: readChoice(params, 'mode', ['full', 'same', 'valid'], 'same'),
    boundary: readChoice(params, 'boundary', ['zero', 'clamp', 'wrap'], 'zero'),
    length: clamp(readNumber(params, 'length', 64), 8, 512),
    sigma: clamp(readNumber(params, 'sigma', 1.2), 0.1, 5),
    noise: clamp(readNumber(params, 'noise', 0.35), 0, 2),
    seed: Math.round(clamp(readNumber(params, 'seed', 13), 1, 9999)),
    index: Math.round(clamp(readNumber(params, 'index', 0), 0, 1024)),
  }
}

export function decodeImageKernelState(params: URLSearchParams): ImageKernelUrlState {
  return {
    image: params.get('image') ?? 'edge-shapes',
    kernel: params.get('kernel') ?? 'sharpen',
    boundary: readChoice(params, 'boundary', ['zero', 'clamp', 'wrap'], 'clamp'),
    operation: readChoice(params, 'operation', ['convolution', 'correlation'], 'correlation'),
    normalize: readBoolean(params, 'normalize', false),
    preserveAlpha: readBoolean(params, 'preserveAlpha', true),
    grayscale: readBoolean(params, 'grayscale', false),
  }
}

export function decodePolynomialState(params: URLSearchParams): PolynomialUrlState {
  return {
    a: readNumberList(params, 'a', [1, 1]),
    b: readNumberList(params, 'b', [1, 1]),
    k: readNumber(params, 'k', 0),
  }
}

export function decodeContinuousState(params: URLSearchParams): ContinuousUrlState {
  return {
    f: params.get('f') ?? 'rectangle',
    g: params.get('g') ?? 'gaussian',
    t: clamp(readNumber(params, 't', 0), -5, 5),
    samples: Math.round(clamp(readNumber(params, 'samples', 96), 24, 320)),
  }
}

export function readNumberList(params: URLSearchParams, key: string, fallback: number[]): number[] {
  const raw = params.get(key)
  if (!raw || raw.length > 240) return fallback
  const values = raw
    .split(',')
    .map((part) => Number(part.trim()))
    .filter(Number.isFinite)
  return values.length > 0 && values.length <= 32 ? values : fallback
}

export function formatNumberList(values: number[]): string {
  return values.slice(0, 32).map(formatNumber).join(',')
}

function readNumber(params: URLSearchParams, key: string, fallback: number): number {
  const raw = params.get(key)
  if (raw === null) return fallback
  const value = Number(raw)
  return Number.isFinite(value) ? value : fallback
}

function readChoice<T extends string>(params: URLSearchParams, key: string, choices: readonly T[], fallback: T): T {
  const value = params.get(key)
  return choices.includes(value as T) ? (value as T) : fallback
}

function readBoolean(params: URLSearchParams, key: string, fallback: boolean): boolean {
  const value = params.get(key)
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function formatNumber(value: number): string {
  return String(Math.round(value * 1000) / 1000)
}
