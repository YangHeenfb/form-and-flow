import { compileExpression } from '../../core/math/expression.ts'
import type { CompiledExpression } from '../../core/math/expression.ts'
import { expressionToTex } from '../../core/ui/mathNotation.ts'
import { normalizeMathInput } from '../calculus/shared/mathInput.ts'
import { clampSamples, generateTimeValues, normalizeSamples } from './math/signal.ts'

export type SignalPreset = {
  id: string
  label: string
  labelZh?: string
  tex: string
  expression?: string
  description: string
  descriptionZh?: string
  defaultFrequency: number
  sample: (t: number, index: number, sampleCount: number) => number
}

export const fourierPresets: SignalPreset[] = [
  expressionPreset('constant', '1', '1', 'A steady offset lives at frequency 0.', '稳定偏移量只出现在频率 0。', 0),
  expressionPreset('sine-1', 'sin(2*pi*t)', 'sin(2*pi*t)', 'One cycle across the normalized domain.', '在归一化区间内完成 1 个周期。', 1),
  expressionPreset('sine-3', 'sin(2*pi*3*t)', 'sin(2*pi*3*t)', 'Three cycles across the normalized domain.', '在归一化区间内完成 3 个周期。', 3),
  expressionPreset('cosine-2', 'cos(2*pi*2*t)', 'cos(2*pi*2*t)', 'A cosine wave at frequency 2.', '频率为 2 的余弦波。', 2),
  expressionPreset('sum-of-sines', 'sin(2*pi*t) + 0.5*sin(2*pi*3*t)', 'sin(2*pi*t) + 0.5*sin(2*pi*3*t)', 'Two clean frequency components mixed together.', '两个清晰的频率成分叠在一起。', 1),
  expressionPreset(
    'mixed-signal',
    'sin(2*pi*t) + 0.4*cos(2*pi*4*t) + 0.25*sin(2*pi*7*t)',
    'sin(2*pi*t) + 0.4*cos(2*pi*4*t) + 0.25*sin(2*pi*7*t)',
    'Three visible components with different strengths.',
    '三个强度不同、能看出来的频率成分。',
    4,
  ),
  {
    id: 'square-wave',
    label: 'square wave',
    labelZh: '方波',
    tex: '\\operatorname{square}(t)',
    description: 'A jumpy signal with many high-frequency harmonics.',
    descriptionZh: '带有跳变的信号，包含许多高频谐波。',
    defaultFrequency: 1,
    sample: (t) => (Math.sin(2 * Math.PI * t) >= 0 ? 1 : -1),
  },
  {
    id: 'sawtooth',
    label: 'sawtooth',
    labelZh: '锯齿波',
    tex: '2t-1',
    description: 'A ramp with a hard reset at the boundary.',
    descriptionZh: '一条斜坡信号，在边界处突然重置。',
    defaultFrequency: 1,
    sample: (t) => 2 * t - 1,
  },
  {
    id: 'triangle-wave',
    label: 'triangle wave',
    labelZh: '三角波',
    tex: '1-4\\left|t-0.5\\right|',
    description: 'A sharp but continuous periodic wave.',
    descriptionZh: '有尖点但仍连续的周期波。',
    defaultFrequency: 1,
    sample: (t) => 1 - 4 * Math.abs(t - 0.5),
  },
  expressionPreset('gaussian-pulse', 'exp(-80*(t - 0.5)^2)', 'exp(-80*(t - 0.5)^2)', 'A localized pulse spread across many frequencies.', '局部脉冲会分散到许多频率上。', 0),
  {
    id: 'two-pulses',
    label: 'two pulses',
    labelZh: '两个脉冲',
    tex: 'e^{-180(t-0.28)^2}+0.7e^{-220(t-0.68)^2}',
    description: 'Two narrow pulses with a clear time-domain shape.',
    descriptionZh: '两个很窄的脉冲，时间域形状很清楚。',
    defaultFrequency: 2,
    sample: (t) => Math.exp(-180 * (t - 0.28) ** 2) + 0.7 * Math.exp(-220 * (t - 0.68) ** 2),
  },
  {
    id: 'noisy-sine',
    label: 'noisy sine',
    labelZh: '带噪正弦',
    tex: '\\sin(2\\pi t)+0.22\\eta_n',
    description: 'A sine wave with deterministic high-frequency noise.',
    descriptionZh: '带有确定性高频噪声的正弦波。',
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

export function sampleFourierPreset(presetId: string, sampleCount: number, normalize = false): number[] {
  const preset = getFourierPreset(presetId)
  const samples = generateTimeValues(sampleCount).map((t, index) => preset.sample(t, index, sampleCount))
  const clean = clampSamples(samples, -2.5, 2.5)
  return normalize ? normalizeSamples(clean) : clean
}

export function sampleFourierExpression(expression: string, sampleCount: number, normalize = false): number[] {
  const compiled = compileFourierExpression(expression)
  const samples = generateTimeValues(sampleCount).map((t) => compiled.evaluate({ t }) ?? 0)
  const clean = clampSamples(samples, -3, 3)
  return normalize ? normalizeSamples(clean) : clean
}

function expressionPreset(id: string, label: string, expression: string, description: string, descriptionZh: string, defaultFrequency: number): SignalPreset {
  const compiled = compileFourierExpression(expression)
  return {
    id,
    label,
    tex: expressionToTex(expression),
    expression,
    description,
    descriptionZh,
    defaultFrequency,
    sample: (t) => compiled.evaluate({ t }) ?? 0,
  }
}

function seededNoise(index: number): number {
  const value = Math.sin((index + 1) * 12.9898 + 78.233) * 43758.5453
  return (value - Math.floor(value)) * 2 - 1
}
