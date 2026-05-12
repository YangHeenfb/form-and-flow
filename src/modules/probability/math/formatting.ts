export { formatPercent, formatProbability, roundProbability } from './probability.ts'

export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return Math.round(value).toLocaleString('en-US')
}

export function formatNumber(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'not defined'
  if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(2)
  return value.toFixed(digits).replace(/\.?0+$/, '')
}
