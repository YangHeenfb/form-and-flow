export type RealFunction = (x: number) => number | null
export type RiemannMethod = 'left' | 'right' | 'midpoint' | 'trapezoid'
export type TaylorPresetId = 'sin' | 'cos' | 'exp' | 'log1p' | 'geometric'

export type DerivativeDiagnostic = {
  value: number | null
  leftSlope: number | null
  rightSlope: number | null
  reason: 'one-sided-mismatch' | 'not-finite' | null
}

const taylorPresetIds = new Set<string>(['sin', 'cos', 'exp', 'log1p', 'geometric'])

export function finiteDifference(fn: RealFunction, x: number, h: number): number | null {
  const step = nonzeroStep(h)
  const a = fn(x)
  const b = fn(x + step)
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) {
    return null
  }
  return finite((b - a) / step)
}

export function oneSidedDerivativeSlopes(fn: RealFunction, x: number, h = 1e-4): Pick<DerivativeDiagnostic, 'leftSlope' | 'rightSlope'> {
  const step = clampStep(h)
  const yLeft = fn(x - step)
  const yCenter = fn(x)
  const yRight = fn(x + step)
  return {
    leftSlope: isFiniteNumber(yLeft) && isFiniteNumber(yCenter) ? finite((yCenter - yLeft) / step) : null,
    rightSlope: isFiniteNumber(yCenter) && isFiniteNumber(yRight) ? finite((yRight - yCenter) / step) : null,
  }
}

export function derivativeDiagnostic(fn: RealFunction, x: number, h = 1e-4, tolerance = 1e-2): DerivativeDiagnostic {
  const slopes = oneSidedDerivativeSlopes(fn, x, h)
  if (!isFiniteNumber(slopes.leftSlope) || !isFiniteNumber(slopes.rightSlope)) {
    return { ...slopes, value: null, reason: 'not-finite' }
  }
  const scale = Math.max(1, Math.abs(slopes.leftSlope), Math.abs(slopes.rightSlope))
  if (Math.abs(slopes.leftSlope - slopes.rightSlope) > tolerance * scale) {
    return { ...slopes, value: null, reason: 'one-sided-mismatch' }
  }
  return { ...slopes, value: finite((slopes.leftSlope + slopes.rightSlope) / 2), reason: null }
}

export function centralDifference(fn: RealFunction, x: number, h = 1e-4): number | null {
  const step = clampStep(h)
  const a = fn(x - step)
  const b = fn(x + step)
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) {
    return null
  }
  return finite((b - a) / (2 * step))
}

export function secondCentralDifference(fn: RealFunction, x: number, h = 1e-3): number | null {
  const step = clampStep(h)
  const a = fn(x - step)
  const b = fn(x)
  const c = fn(x + step)
  if (!isFiniteNumber(a) || !isFiniteNumber(b) || !isFiniteNumber(c)) {
    return null
  }
  return finite((a - 2 * b + c) / (step * step))
}

export function approximateDerivative(fn: RealFunction, x: number): number | null {
  return centralDifference(fn, x, 1e-4)
}

export function riemannSum(fn: RealFunction, a: number, b: number, n: number, method: RiemannMethod): number {
  const count = clampInteger(n, 1, 500)
  const dx = (b - a) / count
  let sum = 0
  for (let index = 0; index < count; index += 1) {
    const left = a + index * dx
    const right = left + dx
    if (method === 'trapezoid') {
      const y1 = fn(left)
      const y2 = fn(right)
      if (isFiniteNumber(y1) && isFiniteNumber(y2)) {
        sum += ((y1 + y2) / 2) * dx
      }
      continue
    }
    const x = method === 'left' ? left : method === 'right' ? right : (left + right) / 2
    const y = fn(x)
    if (isFiniteNumber(y)) {
      sum += y * dx
    }
  }
  return sum
}

export function trapezoidRule(fn: RealFunction, a: number, b: number, n: number): number {
  return riemannSum(fn, a, b, n, 'trapezoid')
}

export function referenceIntegral(fn: RealFunction, a: number, b: number): number {
  return trapezoidRule(fn, a, b, 1000)
}

export function makeAccumulationFunction(fn: RealFunction, a: number): RealFunction {
  return (x) => referenceIntegral(fn, a, x)
}

export function factorial(n: number): number {
  const count = clampInteger(n, 0, 30)
  let result = 1
  for (let value = 2; value <= count; value += 1) {
    result *= value
  }
  return result
}

export function taylorPolynomialValue(coefficients: number[], center: number, x: number): number {
  return coefficients.reduce((sum, coefficient, index) => sum + coefficient * (x - center) ** index, 0)
}

export function isTaylorPresetId(presetId: string | undefined): presetId is TaylorPresetId {
  return typeof presetId === 'string' && taylorPresetIds.has(presetId)
}

export function buildTaylorCoefficientsForPreset(presetId: TaylorPresetId, center: number, degree: number): number[] {
  const count = clampInteger(degree, 0, 10)
  return Array.from({ length: count + 1 }, (_, k) => nthDerivativeForPreset(presetId, k, center) / factorial(k))
}

export function estimateMaxError(fn: RealFunction, approximationFn: RealFunction, xMin: number, xMax: number, samples: number): number | null {
  const count = clampInteger(samples, 2, 1000)
  let max = 0
  let compared = 0
  for (let index = 0; index < count; index += 1) {
    const x = xMin + ((xMax - xMin) * index) / (count - 1)
    const original = fn(x)
    const approximation = approximationFn(x)
    if (isFiniteNumber(original) && isFiniteNumber(approximation)) {
      max = Math.max(max, Math.abs(original - approximation))
      compared += 1
    }
  }
  return compared > 0 ? max : null
}

export function approximateLeftLimit(fn: RealFunction, a: number, epsilon: number): number | null {
  return fn(a - Math.abs(epsilon))
}

export function approximateRightLimit(fn: RealFunction, a: number, epsilon: number): number | null {
  return fn(a + Math.abs(epsilon))
}

export function classifyLimit(left: number | null, right: number | null, tolerance: number): 'exists' | 'does-not-exist' | 'unknown' {
  if (!isFiniteNumber(left) || !isFiniteNumber(right)) {
    return 'unknown'
  }
  return Math.abs(left - right) <= tolerance ? 'exists' : 'does-not-exist'
}

function nthDerivativeForPreset(presetId: TaylorPresetId, n: number, x: number): number {
  if (presetId === 'sin') {
    const mod = n % 4
    return mod === 0 ? Math.sin(x) : mod === 1 ? Math.cos(x) : mod === 2 ? -Math.sin(x) : -Math.cos(x)
  }
  if (presetId === 'cos') {
    const mod = n % 4
    return mod === 0 ? Math.cos(x) : mod === 1 ? -Math.sin(x) : mod === 2 ? -Math.cos(x) : Math.sin(x)
  }
  if (presetId === 'exp') {
    return Math.exp(x)
  }
  if (presetId === 'log1p') {
    if (n === 0) return Math.log(1 + x)
    return ((n % 2 === 1 ? 1 : -1) * factorial(n - 1)) / (1 + x) ** n
  }
  if (presetId === 'geometric') {
    return factorial(n) / (1 - x) ** (n + 1)
  }
  return 0
}

function finite(value: number): number | null {
  return Number.isFinite(value) ? value : null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function clampStep(h: number): number {
  const abs = Math.abs(h)
  return Math.max(1e-6, Math.min(1, abs || 1e-4))
}

function nonzeroStep(h: number): number {
  const abs = Math.abs(h)
  return Math.max(1e-6, Number.isFinite(abs) ? abs || 1e-4 : 1e-4)
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}
