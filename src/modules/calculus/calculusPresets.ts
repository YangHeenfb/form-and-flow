import { compileExpression } from '../../core/math/expression.ts'
import type { CompiledExpression } from '../../core/math/expression.ts'
import type { TaylorPresetId } from './math/calculus.ts'
import { normalizeMathInput } from './shared/mathInput.ts'

export type FunctionPreset = {
  id: string
  label: string
  expression: string
  defaultX0?: number
  defaultA?: number
  defaultB?: number
  taylorId?: TaylorPresetId
}

export const calculusPresets: FunctionPreset[] = [
  { id: 'sin', label: 'sin(x)', expression: 'sin(x)', defaultX0: 1, defaultA: 0, defaultB: Math.PI, taylorId: 'sin' },
  { id: 'cos', label: 'cos(x)', expression: 'cos(x)', defaultX0: 1, defaultA: 0, defaultB: Math.PI, taylorId: 'cos' },
  { id: 'x2', label: 'x^2', expression: 'x^2', defaultX0: 1, defaultA: 0, defaultB: 2 },
  { id: 'x3', label: 'x^3', expression: 'x^3', defaultX0: 1, defaultA: -1, defaultB: 2 },
  { id: 'exp', label: 'exp(x)', expression: 'exp(x)', defaultX0: 0, defaultA: 0, defaultB: 1, taylorId: 'exp' },
  { id: 'gaussian', label: 'exp(-x^2)', expression: 'exp(-x^2)', defaultX0: 0, defaultA: -2, defaultB: 2 },
  { id: 'reciprocal', label: '1 / (1 + x^2)', expression: '1/(1+x^2)', defaultX0: 0, defaultA: -2, defaultB: 2 },
  { id: 'abs', label: 'abs(x)', expression: 'abs(x)', defaultX0: 0, defaultA: -1, defaultB: 1 },
  { id: 'log1p', label: 'log(1 + x)', expression: 'log(1+x)', defaultX0: 0, defaultA: 0, defaultB: 1, taylorId: 'log1p' },
  { id: 'geometric', label: '1 / (1 - x)', expression: '1/(1-x)', defaultX0: 0, defaultA: -0.5, defaultB: 0.5, taylorId: 'geometric' },
]

export function compileCalculusExpression(expression: string): CompiledExpression {
  return compileExpression(normalizeMathInput(expression), { variables: ['x'] })
}

export function presetFunction(preset: FunctionPreset) {
  const compiled = compileCalculusExpression(preset.expression)
  return (x: number) => compiled.evaluate({ x })
}
