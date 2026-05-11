import type { CompiledExpression } from '../../../core/math/expression.ts'

export function sampleExpressionSignal(compiledExpression: CompiledExpression, sampleCount: number): number[] {
  return generateTimeValues(sampleCount).map((t) => compiledExpression.evaluate({ t }) ?? 0)
}

export function samplePresetSignal(presetId: string, sampleCount: number, getPresetSamples: (id: string, count: number) => number[]): number[] {
  return getPresetSamples(presetId, sampleCount)
}

export function resampleDrawnSignal(points: Array<{ t: number; value: number }>, sampleCount: number): number[] {
  if (points.length === 0) return Array.from({ length: sampleCount }, () => 0)
  const sorted = [...points].sort((a, b) => a.t - b.t)
  return generateTimeValues(sampleCount).map((t) => {
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    if (t <= first.t) return first.value
    if (t >= last.t) return last.value
    const rightIndex = sorted.findIndex((point) => point.t >= t)
    const left = sorted[Math.max(0, rightIndex - 1)]
    const right = sorted[rightIndex]
    const span = Math.max(1e-9, right.t - left.t)
    const alpha = (t - left.t) / span
    return left.value * (1 - alpha) + right.value * alpha
  })
}

export function normalizeSamples(samples: number[]): number[] {
  const finite = sanitizeSamples(samples)
  const maxAbs = finite.reduce((max, value) => Math.max(max, Math.abs(value)), 0)
  if (maxAbs <= 1e-9) return finite
  return finite.map((value) => value / maxAbs)
}

export function clampSamples(samples: number[], min: number, max: number): number[] {
  return samples.map((value) => Math.max(min, Math.min(max, value)))
}

export function getSampleAtT(samples: number[], t: number): number {
  if (samples.length === 0) return 0
  const wrapped = wrapUnit(t)
  const index = Math.min(samples.length - 1, Math.max(0, Math.round(wrapped * samples.length) % samples.length))
  return Number.isFinite(samples[index]) ? samples[index] : 0
}

export function interpolateSample(samples: number[], t: number): number {
  if (samples.length === 0) return 0
  const wrapped = wrapUnit(t)
  const scaled = wrapped * samples.length
  const leftIndex = Math.floor(scaled) % samples.length
  const rightIndex = (leftIndex + 1) % samples.length
  const alpha = scaled - Math.floor(scaled)
  const left = Number.isFinite(samples[leftIndex]) ? samples[leftIndex] : 0
  const right = Number.isFinite(samples[rightIndex]) ? samples[rightIndex] : 0
  return left * (1 - alpha) + right * alpha
}

export function generateTimeValues(sampleCount: number): number[] {
  const count = Math.max(1, Math.floor(sampleCount))
  return Array.from({ length: count }, (_, index) => index / count)
}

export function sanitizeSamples(samples: number[]): number[] {
  return samples.map((value) => (Number.isFinite(value) ? value : 0))
}

export function detectDiscontinuities(samples: number[], jumpThreshold = 1.25): number[] {
  const jumps: number[] = []
  for (let index = 1; index < samples.length; index += 1) {
    if (Math.abs(samples[index] - samples[index - 1]) > jumpThreshold) jumps.push(index)
  }
  return jumps
}

function wrapUnit(value: number): number {
  return ((value % 1) + 1) % 1
}
