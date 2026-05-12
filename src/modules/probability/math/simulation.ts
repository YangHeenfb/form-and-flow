import { histogram, type HistogramBin } from './continuous.ts'

export function boundedRunCount(value: number, max = 100_000): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(max, Math.round(value)))
}

export function histogramFromSamples(samples: number[], min: number, max: number, bins = 40): HistogramBin[] {
  return histogram(samples, min, max, bins)
}
