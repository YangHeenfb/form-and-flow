import { compileExpression } from '../../core/math/expression.ts'
import type { CompiledExpression } from '../../core/math/expression.ts'
import { expressionToTex } from '../../core/ui/mathNotation.ts'
import { normalizeMathInput } from '../calculus/shared/mathInput.ts'
import { clampSamples, generateTimeValues, normalizeSamples } from './math/signal.ts'

export type SignalPreset = {
  id: string
  label: string
  tex: string
  expression?: string
  description: string
  defaultFrequency: number
  sample: (t: number, index: number, sampleCount: number) => number
}

export const fourierPresets: SignalPreset[] = [
  expressionPreset('constant', '1', '1', 'A steady offset lives at frequency 0.', 0),
  expressionPreset('sine-1', 'sin(2*pi*t)', 'sin(2*pi*t)', 'One cycle across the normalized domain.', 1),
  expressionPreset('sine-3', 'sin(2*pi*3*t)', 'sin(2*pi*3*t)', 'Three cycles across the normalized domain.', 3),
  expressionPreset('cosine-2', 'cos(2*pi*2*t)', 'cos(2*pi*2*t)', 'A cosine wave at frequency 2.', 2),
  expressionPreset('sum-of-sines', 'sin(2*pi*t) + 0.5*sin(2*pi*3*t)', 'sin(2*pi*t) + 0.5*sin(2*pi*3*t)', 'Two clean frequency components mixed together.', 1),
  expressionPreset(
    'mixed-signal',
    'sin(2*pi*t) + 0.4*cos(2*pi*4*t) + 0.25*sin(2*pi*7*t)',
    'sin(2*pi*t) + 0.4*cos(2*pi*4*t) + 0.25*sin(2*pi*7*t)',
    'Three visible components with different strengths.',
    4,
  ),
  {
    id: 'square-wave',
    label: 'square wave',
    tex: '\\operatorname{square}(t)',
    description: 'A jumpy signal with many high-frequency harmonics.',
    defaultFrequency: 1,
    sample: (t) => (Math.sin(2 * Math.PI * t) >= 0 ? 1 : -1),
  },
  {
    id: 'sawtooth',
    label: 'sawtooth',
    tex: '2t-1',
    description: 'A ramp with a hard reset at the boundary.',
    defaultFrequency: 1,
    sample: (t) => 2 * t - 1,
  },
  {
    id: 'triangle-wave',
    label: 'triangle wave',
    tex: '1-4\\left|t-0.5\\right|',
    description: 'A sharp but continuous periodic wave.',
    defaultFrequency: 1,
    sample: (t) => 1 - 4 * Math.abs(t - 0.5),
  },
  expressionPreset('gaussian-pulse', 'exp(-80*(t - 0.5)^2)', 'exp(-80*(t - 0.5)^2)', 'A localized pulse spread across many frequencies.', 0),
  {
    id: 'two-pulses',
    label: 'two pulses',
    tex: 'e^{-180(t-0.28)^2}+0.7e^{-220(t-0.68)^2}',
    description: 'Two narrow pulses with a clear time-domain shape.',
    defaultFrequency: 2,
    sample: (t) => Math.exp(-180 * (t - 0.28) ** 2) + 0.7 * Math.exp(-220 * (t - 0.68) ** 2),
  },
  {
    id: 'noisy-sine',
    label: 'noisy sine',
    tex: '\\sin(2\\pi t)+0.22\\eta_n',
    description: 'A sine wave with deterministic high-frequency noise.',
    defaultFrequency: 1,
    sample: (t, index) => Math.sin(2 * Math.PI * t) + 0.22 * seededNoise(index),
  },
]

export function compileFourierExpression(expression: string): CompiledExpression {
  return compileExpression(normalizeMathInput(expression), { variables: ['t'], aliases: { x: 't' } })
}

export function getFourierPreset(id: string): SignalPreset {
  return fourierPresets.find((preset) => preset.id === id) ?? fourierPresets[1]
}

export function sampleFourierPreset(presetId: string, sampleCount: number, normalize = true): number[] {
  const preset = getFourierPreset(presetId)
  const samples = generateTimeValues(sampleCount).map((t, index) => preset.sample(t, index, sampleCount))
  const clean = clampSamples(samples, -2.5, 2.5)
  return normalize ? normalizeSamples(clean) : clean
}

export function sampleFourierExpression(expression: string, sampleCount: number, normalize = true): number[] {
  const compiled = compileFourierExpression(expression)
  const samples = generateTimeValues(sampleCount).map((t) => compiled.evaluate({ t }) ?? 0)
  const clean = clampSamples(samples, -3, 3)
  return normalize ? normalizeSamples(clean) : clean
}

function expressionPreset(id: string, label: string, expression: string, description: string, defaultFrequency: number): SignalPreset {
  const compiled = compileFourierExpression(expression)
  return {
    id,
    label,
    tex: expressionToTex(expression),
    expression,
    description,
    defaultFrequency,
    sample: (t) => compiled.evaluate({ t }) ?? 0,
  }
}

function seededNoise(index: number): number {
  const value = Math.sin((index + 1) * 12.9898 + 78.233) * 43758.5453
  return (value - Math.floor(value)) * 2 - 1
}
