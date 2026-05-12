import { compileExpression } from '../../core/math/expression.ts'
import { normalizeMathInput } from '../calculus/shared/mathInput.ts'
import type { ScalarOde, System2D } from './math/differentialEquations.ts'

export type ScalarOdePreset = {
  id: string
  label: string
  expression: string
  formulaTex: string
  defaultT0: number
  defaultY0: number
  defaultDuration: number
}

export type SystemPreset = {
  id: string
  label: string
  formulaTex: string
  xRange: [number, number]
  yRange: [number, number]
  defaultX0: number
  defaultY0: number
  system: System2D
}

export const scalarOdePresets: ScalarOdePreset[] = [
  {
    id: 'growth',
    label: "y' = y",
    expression: 'y',
    formulaTex: "\\frac{dy}{dt}=y",
    defaultT0: 0,
    defaultY0: 1,
    defaultDuration: 1.5,
  },
  {
    id: 'logistic',
    label: "y' = y(1-y/4)",
    expression: 'y*(1-y/4)',
    formulaTex: "\\frac{dy}{dt}=y\\left(1-\\frac{y}{4}\\right)",
    defaultT0: 0,
    defaultY0: 0.7,
    defaultDuration: 6,
  },
  {
    id: 'cooling',
    label: "y' = -0.7(y-1)",
    expression: '-0.7*(y-1)',
    formulaTex: "\\frac{dy}{dt}=-0.7(y-1)",
    defaultT0: 0,
    defaultY0: 3,
    defaultDuration: 6,
  },
  {
    id: 'driven',
    label: "y' = sin(t) - 0.35y",
    expression: 'sin(t)-0.35*y',
    formulaTex: "\\frac{dy}{dt}=\\sin(t)-0.35y",
    defaultT0: 0,
    defaultY0: 0.2,
    defaultDuration: 10,
  },
]

export const phasePresets: SystemPreset[] = [
  {
    id: 'spiral-sink',
    label: 'Spiral sink',
    formulaTex: "x'=y,\\quad y'=-x-0.28y",
    xRange: [-4, 4],
    yRange: [-4, 4],
    defaultX0: 3,
    defaultY0: 0.5,
    system: (x, y) => ({ dx: y, dy: -x - 0.28 * y }),
  },
  {
    id: 'saddle',
    label: 'Saddle',
    formulaTex: "x'=x,\\quad y'=-y",
    xRange: [-4, 4],
    yRange: [-4, 4],
    defaultX0: 0.7,
    defaultY0: 2.3,
    system: (x, y) => ({ dx: x, dy: -y }),
  },
  {
    id: 'center',
    label: 'Center',
    formulaTex: "x'=y,\\quad y'=-x",
    xRange: [-4, 4],
    yRange: [-4, 4],
    defaultX0: 2.5,
    defaultY0: 0,
    system: (x, y) => ({ dx: y, dy: -x }),
  },
  {
    id: 'node',
    label: 'Stable node',
    formulaTex: "x'=-0.6x,\\quad y'=-1.3y",
    xRange: [-4, 4],
    yRange: [-4, 4],
    defaultX0: 3,
    defaultY0: -2,
    system: (x, y) => ({ dx: -0.6 * x, dy: -1.3 * y }),
  },
]

export function compileScalarOdeExpression(expression: string): ScalarOde {
  const compiled = compileExpression(normalizeDifferentialInput(expression), { variables: ['t', 'y'], aliases: { x: 't' } })
  return (t, y) => compiled.evaluate({ t, y })
}

export function scalarPresetFunction(preset: ScalarOdePreset): ScalarOde {
  return compileScalarOdeExpression(preset.expression)
}

export function normalizeDifferentialInput(input: string): string {
  return normalizeMathInput(input)
    .replace(/\b(sin|cos|tan|ln|log|exp|sqrt|abs)\s+t\b/g, '$1(t)')
    .replace(/\b(sin|cos|tan|ln|log|exp|sqrt|abs)\s+y\b/g, '$1(y)')
}
