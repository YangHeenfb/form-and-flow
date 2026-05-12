export type OdeMethod = 'euler' | 'midpoint' | 'rk4'

export type ScalarOde = (t: number, y: number) => number | null

export type ScalarPoint = {
  t: number
  y: number
}

export type SlopeSample = {
  t: number
  y: number
  slope: number
}

export type SystemVector = {
  dx: number
  dy: number
}

export type System2D = (x: number, y: number) => SystemVector | null

export type PhasePoint = {
  x: number
  y: number
}

export type VectorSample = PhasePoint & SystemVector

export type PendulumPoint = {
  t: number
  theta: number
  omega: number
  energy: number
}

export type HeatShape = 'pulse' | 'bar' | 'two-peaks'

export type HeatPoint = {
  x: number
  value: number
}

export type HeatResult = {
  profile: HeatPoint[]
  initial: HeatPoint[]
  max: number
  average: number
}

export function scalarOdeStep(fn: ScalarOde, t: number, y: number, h: number, method: OdeMethod): number | null {
  const step = finite(h)
  if (step === null) return null

  const k1 = fn(t, y)
  if (!isFiniteNumber(k1)) return null

  if (method === 'euler') {
    return finite(y + step * k1)
  }

  if (method === 'midpoint') {
    const k2 = fn(t + step / 2, y + (step * k1) / 2)
    return isFiniteNumber(k2) ? finite(y + step * k2) : null
  }

  const k2 = fn(t + step / 2, y + (step * k1) / 2)
  const k3 = isFiniteNumber(k2) ? fn(t + step / 2, y + (step * k2) / 2) : null
  const k4 = isFiniteNumber(k3) ? fn(t + step, y + step * k3) : null
  if (!isFiniteNumber(k2) || !isFiniteNumber(k3) || !isFiniteNumber(k4)) return null
  return finite(y + (step / 6) * (k1 + 2 * k2 + 2 * k3 + k4))
}

export function integrateScalarOde(fn: ScalarOde, options: { t0: number; y0: number; step: number; steps: number; method: OdeMethod }): ScalarPoint[] {
  const steps = clampInteger(options.steps, 1, 2000)
  const points: ScalarPoint[] = [{ t: options.t0, y: options.y0 }]
  let t = options.t0
  let y = options.y0

  for (let index = 0; index < steps; index += 1) {
    const next = scalarOdeStep(fn, t, y, options.step, options.method)
    if (!isFiniteNumber(next) || Math.abs(next) > 1e5) break
    t += options.step
    y = next
    points.push({ t, y })
  }

  return points
}

export function sampleSlopeField(fn: ScalarOde, bounds: { tMin: number; tMax: number; yMin: number; yMax: number }, columns = 19, rows = 13): SlopeSample[] {
  const samples: SlopeSample[] = []
  const columnCount = clampInteger(columns, 2, 80)
  const rowCount = clampInteger(rows, 2, 80)

  for (let column = 0; column < columnCount; column += 1) {
    const t = bounds.tMin + ((bounds.tMax - bounds.tMin) * column) / (columnCount - 1)
    for (let row = 0; row < rowCount; row += 1) {
      const y = bounds.yMin + ((bounds.yMax - bounds.yMin) * row) / (rowCount - 1)
      const slope = fn(t, y)
      if (isFiniteNumber(slope)) {
        samples.push({ t, y, slope: clamp(slope, -20, 20) })
      }
    }
  }

  return samples
}

export function systemStep(system: System2D, x: number, y: number, h: number): PhasePoint | null {
  const k1 = system(x, y)
  if (!isVector(k1)) return null

  const k2 = system(x + (h * k1.dx) / 2, y + (h * k1.dy) / 2)
  if (!isVector(k2)) return null

  const k3 = system(x + (h * k2.dx) / 2, y + (h * k2.dy) / 2)
  if (!isVector(k3)) return null

  const k4 = system(x + h * k3.dx, y + h * k3.dy)
  if (!isVector(k4)) return null

  return {
    x: finite(x + (h / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx)) ?? x,
    y: finite(y + (h / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy)) ?? y,
  }
}

export function integrateSystem(system: System2D, options: { x0: number; y0: number; step: number; steps: number; bounds?: { xMin: number; xMax: number; yMin: number; yMax: number } }): PhasePoint[] {
  const steps = clampInteger(options.steps, 1, 4000)
  const points: PhasePoint[] = [{ x: options.x0, y: options.y0 }]
  let x = options.x0
  let y = options.y0

  for (let index = 0; index < steps; index += 1) {
    const next = systemStep(system, x, y, options.step)
    if (!next || !isFiniteNumber(next.x) || !isFiniteNumber(next.y)) break
    if (options.bounds && isOutside(next, options.bounds, 1.5)) break
    x = next.x
    y = next.y
    points.push(next)
  }

  return points
}

export function sampleVectorField(system: System2D, bounds: { xMin: number; xMax: number; yMin: number; yMax: number }, columns = 17, rows = 13): VectorSample[] {
  const samples: VectorSample[] = []
  const columnCount = clampInteger(columns, 2, 70)
  const rowCount = clampInteger(rows, 2, 70)

  for (let column = 0; column < columnCount; column += 1) {
    const x = bounds.xMin + ((bounds.xMax - bounds.xMin) * column) / (columnCount - 1)
    for (let row = 0; row < rowCount; row += 1) {
      const y = bounds.yMin + ((bounds.yMax - bounds.yMin) * row) / (rowCount - 1)
      const vector = system(x, y)
      if (isVector(vector)) {
        samples.push({ x, y, dx: vector.dx, dy: vector.dy })
      }
    }
  }

  return samples
}

export function makePendulumSystem(options: { damping: number; gravity: number }): System2D {
  return (theta, omega) => ({
    dx: omega,
    dy: -options.gravity * Math.sin(theta) - options.damping * omega,
  })
}

export function simulatePendulum(options: { theta0: number; omega0: number; damping: number; gravity: number; step: number; steps: number }): PendulumPoint[] {
  const system = makePendulumSystem(options)
  const phase = integrateSystem(system, { x0: options.theta0, y0: options.omega0, step: options.step, steps: options.steps })
  return phase.map((point, index) => ({
    t: index * options.step,
    theta: point.x,
    omega: point.y,
    energy: 0.5 * point.y * point.y + options.gravity * (1 - Math.cos(point.x)),
  }))
}

export function makeLotkaVolterraSystem(options: { preyGrowth: number; predation: number; predatorDeath: number; conversion: number }): System2D {
  return (prey, predator) => {
    if (prey < 0 || predator < 0) return null
    return {
      dx: prey * (options.preyGrowth - options.predation * predator),
      dy: predator * (options.conversion * prey - options.predatorDeath),
    }
  }
}

export function simulatePopulation(options: { prey0: number; predator0: number; preyGrowth: number; predation: number; predatorDeath: number; conversion: number; step: number; steps: number }): PhasePoint[] {
  const system = makeLotkaVolterraSystem(options)
  const points: PhasePoint[] = [{ x: Math.max(0, options.prey0), y: Math.max(0, options.predator0) }]
  let x = points[0].x
  let y = points[0].y

  for (let index = 0; index < clampInteger(options.steps, 1, 4000); index += 1) {
    const next = systemStep(system, x, y, options.step)
    if (!next || !isFiniteNumber(next.x) || !isFiniteNumber(next.y)) break
    x = clamp(next.x, 0, 80)
    y = clamp(next.y, 0, 80)
    points.push({ x, y })
  }

  return points
}

export function simulateHeatEquation(options: { shape: HeatShape; diffusivity: number; time: number; points?: number }): HeatResult {
  const count = clampInteger(options.points ?? 81, 12, 240)
  const dx = 1 / (count - 1)
  const diffusivity = Math.max(0.001, options.diffusivity)
  const targetTime = Math.max(0, options.time)
  const stableDt = (0.42 * dx * dx) / diffusivity
  const iterations = Math.max(1, Math.ceil(targetTime / stableDt))
  const dt = targetTime / iterations
  const ratio = diffusivity * dt / (dx * dx)
  let values = Array.from({ length: count }, (_, index) => heatInitialValue(options.shape, index / (count - 1)))
  const initial = values.map((value, index) => ({ x: index / (count - 1), value }))

  for (let step = 0; step < iterations; step += 1) {
    const next = values.slice()
    next[0] = 0
    next[count - 1] = 0
    for (let index = 1; index < count - 1; index += 1) {
      next[index] = values[index] + ratio * (values[index - 1] - 2 * values[index] + values[index + 1])
    }
    values = next
  }

  const profile = values.map((value, index) => ({ x: index / (count - 1), value: Math.max(0, value) }))
  const max = profile.reduce((current, point) => Math.max(current, point.value), 0)
  const average = profile.reduce((sum, point) => sum + point.value, 0) / profile.length

  return { profile, initial, max, average }
}

function heatInitialValue(shape: HeatShape, x: number): number {
  if (shape === 'bar') {
    return Math.abs(x - 0.5) < 0.16 ? 1 : 0.05
  }
  if (shape === 'two-peaks') {
    return 0.78 * Math.exp(-120 * (x - 0.28) ** 2) + 0.62 * Math.exp(-95 * (x - 0.72) ** 2)
  }
  return Math.exp(-90 * (x - 0.38) ** 2)
}

function isOutside(point: PhasePoint, bounds: { xMin: number; xMax: number; yMin: number; yMax: number }, marginFactor: number): boolean {
  const xMargin = (bounds.xMax - bounds.xMin) * marginFactor
  const yMargin = (bounds.yMax - bounds.yMin) * marginFactor
  return point.x < bounds.xMin - xMargin || point.x > bounds.xMax + xMargin || point.y < bounds.yMin - yMargin || point.y > bounds.yMax + yMargin
}

function isVector(value: SystemVector | null): value is SystemVector {
  return isFiniteNumber(value?.dx) && isFiniteNumber(value?.dy)
}

function finite(value: number): number | null {
  return Number.isFinite(value) ? value : null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}
