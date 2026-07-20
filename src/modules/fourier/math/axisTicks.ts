export type AxisDomain = {
  min: number
  max: number
}

export type AxisTick = {
  value: number
  label: string
}

type MeasureLabel = (label: string) => number

const EPSILON = 1e-9
const NICE_MULTIPLIERS = [1, 2, 5]

export function frequencyDisplayDomain(frequencyMin: number, frequencyMax: number, positiveOnly: boolean): AxisDomain {
  const start = Math.min(frequencyMin, frequencyMax)
  const end = Math.max(frequencyMin, frequencyMax)
  const min = positiveOnly ? Math.max(0, start) : start
  if (end - min > EPSILON) return { min, max: end }
  return { min, max: min + 1 }
}

export function axisValueToPosition(value: number, domain: AxisDomain, start: number, end: number): number {
  const ratio = (value - domain.min) / Math.max(EPSILON, domain.max - domain.min)
  return start + ratio * (end - start)
}

export function axisContains(domain: AxisDomain, value: number): boolean {
  return value >= domain.min - EPSILON && value <= domain.max + EPSILON
}

export function integerMinorTicks(domain: AxisDomain): number[] {
  const first = Math.ceil(domain.min - EPSILON)
  const last = Math.floor(domain.max + EPSILON)
  const ticks: number[] = []
  for (let value = first; value <= last; value += 1) ticks.push(normalizeZero(value))
  return ticks
}

export function frequencyAxisTicks(
  domain: AxisDomain,
  plotWidth: number,
  measureLabel: MeasureLabel = estimateLabelWidth,
): AxisTick[] {
  const span = Math.max(EPSILON, domain.max - domain.min)
  const safeWidth = Math.max(1, plotWidth)
  const minimumStep = (span * 8) / safeWidth
  const startingExponent = Math.floor(Math.log10(Math.max(EPSILON, minimumStep)))

  for (let exponent = startingExponent; exponent <= startingExponent + 12; exponent += 1) {
    for (const multiplier of NICE_MULTIPLIERS) {
      const step = multiplier * 10 ** exponent
      const pixelGap = (step / span) * safeWidth
      if (pixelGap + EPSILON < 8) continue
      const values = tickValues(domain, step)
      if (values.length < 2) continue
      const labels = values.map((value) => formatAxisTick(value, step))
      const maxLabelWidth = Math.max(...labels.map(measureLabel), 0)
      if (pixelGap + EPSILON >= maxLabelWidth + 8) {
        return values.map((value, index) => ({ value, label: labels[index] }))
      }
    }
  }

  return [
    { value: normalizeZero(domain.min), label: formatAxisTick(domain.min, span) },
    { value: normalizeZero(domain.max), label: formatAxisTick(domain.max, span) },
  ]
}

function tickValues(domain: AxisDomain, step: number): number[] {
  const first = Math.ceil((domain.min - EPSILON) / step)
  const last = Math.floor((domain.max + EPSILON) / step)
  const precision = Math.max(0, -Math.floor(Math.log10(step)) + 1)
  const scale = 10 ** Math.min(12, precision)
  const values: number[] = []
  for (let index = first; index <= last; index += 1) {
    values.push(normalizeZero(Math.round(index * step * scale) / scale))
  }
  return values
}

function formatAxisTick(value: number, step: number): string {
  const decimals = Math.max(0, -Math.floor(Math.log10(Math.abs(step))))
  return String(normalizeZero(Number(value.toFixed(Math.min(6, decimals)))))
}

function estimateLabelWidth(label: string): number {
  return label.length * 5.5
}

function normalizeZero(value: number): number {
  return Math.abs(value) < EPSILON ? 0 : value
}
