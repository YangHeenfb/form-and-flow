import type { NumericSample } from '../convolutionTypes.ts'

export type RealFunction = (x: number) => number

export type ContinuousPresetId = 'rectangle' | 'triangle' | 'gaussian' | 'exponential' | 'bumps'

export type ContinuousPresetParams = {
  width?: number
  sigma?: number
  decay?: number
}

export function sampleFunction(fn: RealFunction, xMin: number, xMax: number, samples: number): NumericSample[] {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const x = xMin + ((xMax - xMin) * index) / (count - 1)
    const y = fn(x)
    return { x, y: Number.isFinite(y) ? y : Number.NaN }
  })
}

export function continuousConvolutionAt(f: RealFunction, g: RealFunction, t: number, tauMin: number, tauMax: number, samples: number): number {
  const product = productCurveAtShift(f, g, t, tauMin, tauMax, samples)
  return trapezoidIntegral(product)
}

export function continuousConvolutionCurve(
  f: RealFunction,
  g: RealFunction,
  tMin: number,
  tMax: number,
  tauMin: number,
  tauMax: number,
  samples: number,
): NumericSample[] {
  const count = Math.max(2, Math.floor(samples))
  return Array.from({ length: count }, (_, index) => {
    const t = tMin + ((tMax - tMin) * index) / (count - 1)
    return { x: t, y: continuousConvolutionAt(f, g, t, tauMin, tauMax, samples) }
  })
}

export function productCurveAtShift(f: RealFunction, g: RealFunction, t: number, tauMin: number, tauMax: number, samples: number): NumericSample[] {
  return sampleFunction((tau) => {
    const fValue = f(tau)
    const gValue = g(t - tau)
    const product = fValue * gValue
    return Number.isFinite(product) ? product : Number.NaN
  }, tauMin, tauMax, samples)
}

export function trapezoidIntegral(samples: NumericSample[]): number {
  let total = 0
  for (let index = 1; index < samples.length; index += 1) {
    const left = samples[index - 1]
    const right = samples[index]
    if (!Number.isFinite(left.y) || !Number.isFinite(right.y)) continue
    total += ((left.y + right.y) / 2) * (right.x - left.x)
  }
  return total
}

export function makeContinuousPresetFunction(presetId: ContinuousPresetId, params: ContinuousPresetParams = {}): RealFunction {
  const width = Math.max(0.05, params.width ?? 1)
  const sigma = Math.max(0.05, params.sigma ?? 0.55)
  const decay = Math.max(0.05, params.decay ?? 1)
  if (presetId === 'rectangle') return (x) => (Math.abs(x) <= width / 2 ? 1 : 0)
  if (presetId === 'triangle') return (x) => Math.max(0, 1 - Math.abs(x) / width)
  if (presetId === 'gaussian') return (x) => Math.exp(-(x * x) / (2 * sigma * sigma))
  if (presetId === 'exponential') return (x) => (x >= 0 ? Math.exp(-decay * x) : 0)
  return (x) => Math.exp(-((x + 0.75) ** 2) / (2 * sigma * sigma)) + 0.65 * Math.exp(-((x - 0.85) ** 2) / (2 * (sigma * 0.65) ** 2))
}

export function estimateSupport(presetId: ContinuousPresetId, params: ContinuousPresetParams = {}): [number, number] {
  const width = Math.max(0.05, params.width ?? 1)
  const sigma = Math.max(0.05, params.sigma ?? 0.55)
  const decay = Math.max(0.05, params.decay ?? 1)
  if (presetId === 'rectangle') return [-width / 2, width / 2]
  if (presetId === 'triangle') return [-width, width]
  if (presetId === 'gaussian') return [-4 * sigma, 4 * sigma]
  if (presetId === 'exponential') return [0, 6 / decay]
  return [-2, 2]
}
