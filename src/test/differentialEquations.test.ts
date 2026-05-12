import { describe, expect, it } from 'vitest'
import { compileScalarOdeExpression } from '../modules/differential-equations/differentialPresets.ts'
import {
  integrateScalarOde,
  makeLotkaVolterraSystem,
  makePendulumSystem,
  sampleSlopeField,
  sampleVectorField,
  simulateHeatEquation,
  simulatePopulation,
} from '../modules/differential-equations/math/differentialEquations.ts'

describe('differential equation numerics', () => {
  it('solves exponential growth accurately with RK4', () => {
    const path = integrateScalarOde((_, y) => y, { t0: 0, y0: 1, step: 0.05, steps: 20, method: 'rk4' })
    expect(path.at(-1)?.y).toBeCloseTo(Math.E, 3)
  })

  it("shows Euler is less accurate than RK4 on y' equals y", () => {
    const euler = integrateScalarOde((_, y) => y, { t0: 0, y0: 1, step: 0.2, steps: 5, method: 'euler' }).at(-1)?.y ?? 0
    const rk4 = integrateScalarOde((_, y) => y, { t0: 0, y0: 1, step: 0.2, steps: 5, method: 'rk4' }).at(-1)?.y ?? 0

    expect(Math.abs(rk4 - Math.E)).toBeLessThan(Math.abs(euler - Math.E))
  })

  it('compiles scalar ODE expressions with t and y variables', () => {
    const fn = compileScalarOdeExpression('sin(t)-0.5*y')
    expect(fn(Math.PI / 2, 2)).toBeCloseTo(0)
  })

  it('samples slope fields and vector fields', () => {
    expect(sampleSlopeField((_, y) => y, { tMin: -1, tMax: 1, yMin: -1, yMax: 1 }, 5, 5)).toHaveLength(25)
    expect(sampleVectorField(makePendulumSystem({ damping: 0, gravity: 1 }), { xMin: -1, xMax: 1, yMin: -1, yMax: 1 }, 4, 3)).toHaveLength(12)
  })

  it('keeps population simulation non-negative', () => {
    const system = makeLotkaVolterraSystem({ preyGrowth: 0.9, predation: 0.08, predatorDeath: 0.5, conversion: 0.05 })
    expect(system(10, 4)?.dx).toBeGreaterThan(0)

    const path = simulatePopulation({ prey0: 8, predator0: 3, preyGrowth: 0.9, predation: 0.08, predatorDeath: 0.5, conversion: 0.05, step: 0.03, steps: 200 })
    expect(path.every((point) => point.x >= 0 && point.y >= 0)).toBe(true)
  })

  it('diffuses heat by lowering the peak over time', () => {
    const initial = simulateHeatEquation({ shape: 'pulse', diffusivity: 0.2, time: 0, points: 64 })
    const later = simulateHeatEquation({ shape: 'pulse', diffusivity: 0.2, time: 0.25, points: 64 })

    expect(later.max).toBeLessThan(initial.max)
    expect(later.average).toBeGreaterThan(0)
  })
})
