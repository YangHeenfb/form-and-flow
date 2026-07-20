import type { FilterConfig, FourierCoefficient, ReconstructionMode, Spectrum } from './fourierTypes.ts'
import { filterKeepsCoefficient } from './math/filters.ts'
import { selectPairedFrequencyBlocks, selectTopCoefficients } from './math/fourier.ts'

export type FourierLocale = 'en' | 'zh'
export type FourierLessonKey = 'spectrum' | 'reconstruction' | 'filtering'
export type SpectrumView = 'probe' | 'pair'

export type FourierExplanationStep = {
  title: string
  body: string
}

export type FourierExplanationModel = {
  coreLabel: string
  currentLabel: string
  continueLabel: string
  detailsLabel: string
  readingsLabel: string
  formulaLabel: string
  notesLabel: string
  termsLabel: string
  steps: FourierExplanationStep[]
  current: string
  nextAction: string
  nextHref: string
}

type ExplanationInput = {
  locale: FourierLocale
  lessonKey: FourierLessonKey
  spectrumView: SpectrumView
  selectedFrequency: number
  selectedMagnitude: number
  spectrum: Spectrum
  pairFrequency: number
  pairMagnitude: number
  pairHasNegative: boolean
  reconstructionMode: ReconstructionMode
  reconstructionCount: number
  includedCoefficients: FourierCoefficient[]
  currentContribution: FourierCoefficient[]
  reconstructionMse: number
  filterConfig: FilterConfig
  integerSpectrum: Spectrum
  presetId: string
  expression: string
  sampleCount: number
  normalizeAmplitude: boolean
}

export function createFourierExplanationModel(input: ExplanationInput): FourierExplanationModel {
  const labels = input.locale === 'zh'
    ? {
        core: '核心逻辑',
        current: '当前画面',
        explore: '继续探索',
        details: '精确读数与公式',
        readings: '精确读数',
        formula: '公式',
        notes: '符号与边界',
        terms: '相关术语',
      }
    : {
        core: 'Core idea',
        current: 'What is happening now',
        explore: 'Continue exploring',
        details: 'Exact readout and formula',
        readings: 'Exact readout',
        formula: 'Formula',
        notes: 'Conventions and limits',
        terms: 'Related terms',
      }

  const mode = explanationMode(input.lessonKey, input.spectrumView)
  const nextMode = input.lessonKey === 'spectrum' ? 'reconstruction' : input.lessonKey === 'reconstruction' ? 'filtering' : 'spectrum'

  return {
    coreLabel: labels.core,
    currentLabel: labels.current,
    continueLabel: labels.explore,
    detailsLabel: labels.details,
    readingsLabel: labels.readings,
    formulaLabel: labels.formula,
    notesLabel: labels.notes,
    termsLabel: labels.terms,
    steps: coreSteps(mode, input.locale),
    current: currentConclusion(input),
    nextAction: nextActionLabel(input.lessonKey, input.locale),
    nextHref: buildFourierModeHref({
      nextMode,
      presetId: input.presetId,
      expression: input.expression,
      sampleCount: input.sampleCount,
      normalizeAmplitude: input.normalizeAmplitude,
    }),
  }
}

export function selectReconstructionCoefficients(coefficients: FourierCoefficient[], mode: ReconstructionMode, count: number): FourierCoefficient[] {
  if (mode === 'paired-frequency-blocks') return selectPairedFrequencyBlocks(coefficients, count)
  if (mode === 'first-harmonics') {
    const harmonic = Math.max(0, Math.floor(count / 2))
    return coefficients.filter((coefficient) => Math.abs(coefficient.frequency) <= harmonic)
  }
  return selectTopCoefficients(coefficients, count)
}

export function selectCurrentContribution(coefficients: FourierCoefficient[], mode: ReconstructionMode, count: number): FourierCoefficient[] {
  const current = selectReconstructionCoefficients(coefficients, mode, count)
  const previous = count > 1 ? selectReconstructionCoefficients(coefficients, mode, count - 1) : []
  const previousFrequencies = new Set(previous.map((coefficient) => coefficient.frequency))
  return current.filter((coefficient) => !previousFrequencies.has(coefficient.frequency))
}

export function buildFourierModeHref({
  nextMode,
  presetId,
  expression,
  sampleCount,
  normalizeAmplitude,
}: {
  nextMode: FourierLessonKey
  presetId: string
  expression: string
  sampleCount: number
  normalizeAmplitude: boolean
}): string {
  const params = new URLSearchParams()
  params.set('mode', nextMode)
  params.set('preset', presetId === 'custom' ? 'custom' : presetId)
  if (presetId === 'custom') params.set('f', expression)
  params.set('samples', String(sampleCount))
  params.set('normalize', String(normalizeAmplitude))
  return `/modules/fourier?${params.toString()}`
}

export function probeResponseConclusion({
  locale,
  frequency,
  magnitude,
  peakMagnitude,
}: {
  locale: FourierLocale
  frequency: number
  magnitude: number
  peakMagnitude: number
}): string {
  const ratio = peakMagnitude > 1e-12 ? Math.min(1, Math.max(0, magnitude / peakMagnitude)) : 0
  const percentage = Math.round(ratio * 100)
  const response = ratio <= 0.2
    ? (locale === 'zh' ? '弱响应' : 'weak response')
    : ratio >= 0.6
      ? (locale === 'zh' ? '强响应' : 'strong response')
      : (locale === 'zh' ? '部分响应' : 'partial response')
  const continuous = isIntegerFrequency(frequency)
    ? ''
    : (locale === 'zh' ? '；这是一次连续缠绕测试' : '; this is a continuous winding test')

  return locale === 'zh'
    ? `缠绕频率 f = ${formatNumber(frequency)} 时，|C(f)| = ${formatNumber(magnitude)}，约为当前最高峰的 ${percentage}%：${response}${continuous}。`
    : `At winding frequency f = ${formatNumber(frequency)}, |C(f)| = ${formatNumber(magnitude)}, about ${percentage}% of the current tallest peak: ${response}${continuous}.`
}

export function reconstructionContributionLabel(coefficients: FourierCoefficient[], locale: FourierLocale): string {
  const frequencies = coefficients.map((coefficient) => normalizeZero(coefficient.frequency)).sort((a, b) => a - b)
  if (frequencies.length === 0) return locale === 'zh' ? '没有新增系数' : 'no new coefficient'
  if (frequencies.length === 1) return formatNumber(frequencies[0])
  if (frequencies.length === 2 && Math.abs(frequencies[0] + frequencies[1]) < 1e-9) return `±${formatNumber(Math.abs(frequencies[1]))}`
  return frequencies.map(formatNumber).join(', ')
}

export function pairSynthesisConclusion({
  locale,
  frequency,
  magnitude,
  hasNegative,
}: {
  locale: FourierLocale
  frequency: number
  magnitude: number
  hasNegative: boolean
}): string {
  const formattedFrequency = formatNumber(frequency)
  const formattedMagnitude = formatNumber(magnitude)
  if (!hasNegative) {
    return locale === 'zh'
      ? 'f = 0 时只有一个静止的 C(0)，不会重复相加；黄色曲线是直流贡献，不是完整原信号。'
      : 'At f = 0 there is one stationary C(0), never a doubled pair; the yellow curve is the DC contribution, not the full source signal.'
  }
  const continuous = isIntegerFrequency(frequency)
    ? ''
    : (locale === 'zh' ? '；这是连续测试结果，不是离散重建频率块' : '; this is a continuous test result, not a discrete reconstruction block')
  return locale === 'zh'
    ? `旋转频率 ±${formattedFrequency} 的两根箭头各取自 |C| = ${formattedMagnitude}；黄色曲线只表示这对箭头的贡献，不是完整原信号${continuous}。`
    : `The two arrows at rotation frequency ±${formattedFrequency} each come from |C| = ${formattedMagnitude}; the yellow curve is only this pair's contribution, not the full source signal${continuous}.`
}

export function filterSummary({
  locale,
  config,
  spectrum,
}: {
  locale: FourierLocale
  config: FilterConfig
  spectrum: Spectrum
}): string {
  const kept = spectrum.coefficients.filter((coefficient) => filterKeepsCoefficient(coefficient, config)).length
  const removed = Math.max(0, spectrum.coefficients.length - kept)
  const boundary = filterBoundary(config, locale)
  const name = filterName(config.type, locale)

  return locale === 'zh'
    ? `${name}把原频谱的柱子按${boundary}保留或压到零：当前保留 ${kept} 个整数频率，移除 ${removed} 个；随后用剩余系数重新相加。`
    : `${name} keeps or lowers the original spectrum bars to zero using ${boundary}: ${kept} integer ${kept === 1 ? 'frequency remains' : 'frequencies remain'} and ${removed} ${removed === 1 ? 'is' : 'are'} removed, then the remaining coefficients are added back together.`
}

function currentConclusion(input: ExplanationInput): string {
  if (input.lessonKey === 'spectrum' && input.spectrumView === 'probe') {
    const peakMagnitude = input.spectrum.coefficients.reduce((max, coefficient) => Math.max(max, coefficient.magnitude), 0)
    return probeResponseConclusion({
      locale: input.locale,
      frequency: input.selectedFrequency,
      magnitude: input.selectedMagnitude,
      peakMagnitude,
    })
  }

  if (input.lessonKey === 'spectrum') {
    return pairSynthesisConclusion({
      locale: input.locale,
      frequency: input.pairFrequency,
      magnitude: input.pairMagnitude,
      hasNegative: input.pairHasNegative,
    })
  }

  if (input.lessonKey === 'reconstruction') {
    const added = reconstructionContributionLabel(input.currentContribution, input.locale)
    const coefficientCount = input.includedCoefficients.length
    if (input.locale === 'zh') {
      const accumulated = input.reconstructionMode === 'paired-frequency-blocks'
        ? `${input.reconstructionCount} 个频率块（${coefficientCount} 个系数）`
        : `${coefficientCount} 个频率系数`
      return `本次强调的是 ${added} 的独立贡献；累计使用 ${accumulated}，逐点相加后的 MSE = ${formatNumber(input.reconstructionMse)}。`
    }
    const accumulated = input.reconstructionMode === 'paired-frequency-blocks'
      ? `${input.reconstructionCount} frequency ${input.reconstructionCount === 1 ? 'block' : 'blocks'} (${coefficientCount} coefficients)`
      : `${coefficientCount} frequency coefficients`
    return `The highlighted independent contribution is ${added}; the cumulative reconstruction now uses ${accumulated} and has MSE = ${formatNumber(input.reconstructionMse)}.`
  }

  return filterSummary({ locale: input.locale, config: input.filterConfig, spectrum: input.integerSpectrum })
}

function coreSteps(mode: ReturnType<typeof explanationMode>, locale: FourierLocale): FourierExplanationStep[] {
  if (locale === 'zh') {
    if (mode === 'probe') {
      return [
        { title: '缠绕', body: '把每个时刻的信号高度当作从中心伸出的长度，再用当前缠绕频率转动。滑块只改变测试转速，不会改变原信号。' },
        { title: '寻找失衡', body: '转速与信号中的节奏对上时，缠绕图不再均匀抵消，重心（平均点）会被拉离中心。' },
        { title: '排成频谱', body: '对许多 f 重复测试，把重心距离 |C(f)| 记在对应横坐标；峰值就是强频率，重心方向表示相位。' },
      ]
    }
    if (mode === 'pair') {
      return [
        { title: '取出两个系数', body: '从频谱的 +f 与 -f 位置读取 C(+f) 和 C(-f)，系数大小与角度决定箭头的初始长度和方向。' },
        { title: '让箭头反向旋转', body: '真实信号的两个系数互为镜像；两根箭头以相同转速向相反方向旋转。' },
        { title: '合成一条贡献波', body: '两根箭头的竖直部分始终抵消，横向部分相加，所以合向量留在实轴上并画出当前频率的一条贡献波。' },
      ]
    }
    if (mode === 'reconstruction') {
      return [
        { title: '系数变成旋转箭头', body: '频率决定箭头转多快；C(f) 的大小和角度决定它一开始有多长、朝哪里。' },
        { title: '每个频率块产生一条贡献', body: '真实信号通常把 +f 与 -f 一起加入；这对箭头相加后形成一条真实的贡献波。' },
        { title: '把贡献逐点相加', body: '在每个时间点把所有已选贡献相加，就得到黄色重建曲线；加入更多必要频率时，它会逐渐贴近原信号。' },
      ]
    }
    return [
      { title: '先得到原频谱', body: '先用同样的频率检测得到 C(f)，每根柱子代表一个可用于重建的系数。' },
      { title: '压低或删除频谱柱', body: '滤波器 H(f) 决定哪些柱子保留、哪些变为零，得到新的系数 H(f)C(f)。低通、高通等名称只是不同的保留规则。' },
      { title: '用同一套方法重建', body: '把滤波后剩下的旋转箭头重新逐点相加，就得到滤波后的时间信号；滤波不是另一套合成算法。' },
    ]
  }

  if (mode === 'probe') {
    return [
      { title: 'Wind the signal', body: 'Treat each signal height as a length from the center and rotate it at the current winding frequency. The slider changes only the test speed, not the source signal.' },
      { title: 'Look for imbalance', body: 'When the winding speed matches a rhythm in the signal, the wound graph stops cancelling evenly and its center of mass (average point) moves away from the center.' },
      { title: 'Build the spectrum', body: 'Repeat for many f values and plot the center-of-mass distance |C(f)| at each position. Peaks are strong frequencies; the center-of-mass direction is phase.' },
    ]
  }
  if (mode === 'pair') {
    return [
      { title: 'Take two coefficients', body: 'Read C(+f) and C(-f) from the two spectrum positions. Their magnitudes and angles set the arrows’ initial lengths and directions.' },
      { title: 'Rotate in opposite directions', body: 'For a real signal the coefficients are mirrors, and their arrows rotate at the same speed in opposite directions.' },
      { title: 'Make one contribution wave', body: 'The vertical parts always cancel while the horizontal parts add, so the sum stays on the real axis and traces one contribution wave.' },
    ]
  }
  if (mode === 'reconstruction') {
    return [
      { title: 'Coefficients become rotating arrows', body: 'Frequency controls rotation speed; the magnitude and angle of C(f) set each arrow’s initial length and direction.' },
      { title: 'Each block makes a contribution', body: 'For a real signal, +f and -f normally enter together. Their arrows add to one real contribution wave.' },
      { title: 'Add contributions point by point', body: 'At each time, add every selected contribution to get the yellow reconstruction. Necessary frequencies make it approach the source signal.' },
    ]
  }
  return [
    { title: 'Start with the source spectrum', body: 'Use the same frequency detection to obtain C(f); every bar is a coefficient available for reconstruction.' },
    { title: 'Lower or delete spectrum bars', body: 'The filter H(f) decides which bars remain and which become zero, producing H(f)C(f). Low-pass and high-pass are just different rules for keeping bars.' },
    { title: 'Reuse the same reconstruction', body: 'Add the remaining rotating arrows point by point to get the filtered time signal. Filtering does not use a different synthesis algorithm.' },
  ]
}

function explanationMode(lessonKey: FourierLessonKey, spectrumView: SpectrumView): 'probe' | 'pair' | 'reconstruction' | 'filtering' {
  if (lessonKey === 'spectrum') return spectrumView
  return lessonKey
}

function nextActionLabel(lessonKey: FourierLessonKey, locale: FourierLocale): string {
  if (locale === 'zh') {
    if (lessonKey === 'spectrum') return '用当前信号重建'
    if (lessonKey === 'reconstruction') return '用当前信号滤波'
    return '查看当前信号的频谱'
  }
  if (lessonKey === 'spectrum') return 'Reconstruct this signal'
  if (lessonKey === 'reconstruction') return 'Filter this signal'
  return 'View this signal’s spectrum'
}

function filterBoundary(config: FilterConfig, locale: FourierLocale): string {
  const cutoff = formatNumber(Math.abs(config.cutoff))
  const low = formatNumber(Math.min(Math.abs(config.lowCutoff), Math.abs(config.highCutoff)))
  const high = formatNumber(Math.max(Math.abs(config.lowCutoff), Math.abs(config.highCutoff)))
  const threshold = formatNumber(config.threshold)
  if (locale === 'zh') {
    if (config.type === 'low-pass') return `|f| ≤ ${cutoff} 的边界`
    if (config.type === 'high-pass') return `|f| ≥ ${cutoff} 的边界`
    if (config.type === 'band-pass') return `${low} ≤ |f| ≤ ${high} 的范围`
    if (config.type === 'band-stop') return `移除 ${low} ≤ |f| ≤ ${high} 的范围`
    return `|C(f)| ≥ ${threshold} 的阈值`
  }
  if (config.type === 'low-pass') return `the boundary |f| ≤ ${cutoff}`
  if (config.type === 'high-pass') return `the boundary |f| ≥ ${cutoff}`
  if (config.type === 'band-pass') return `the range ${low} ≤ |f| ≤ ${high}`
  if (config.type === 'band-stop') return `the removed range ${low} ≤ |f| ≤ ${high}`
  return `the threshold |C(f)| ≥ ${threshold}`
}

function filterName(type: FilterConfig['type'], locale: FourierLocale): string {
  if (locale === 'en') {
    if (type === 'magnitude-threshold') return 'Magnitude thresholding'
    return `${type[0].toUpperCase()}${type.slice(1)} filtering`
  }
  if (type === 'low-pass') return '低通滤波'
  if (type === 'high-pass') return '高通滤波'
  if (type === 'band-pass') return '带通滤波'
  if (type === 'band-stop') return '带阻滤波'
  return '幅值阈值滤波'
}

function isIntegerFrequency(value: number): boolean {
  return Math.abs(value - Math.round(value)) < 1e-9
}

function normalizeZero(value: number): number {
  return Math.abs(value) < 1e-9 ? 0 : value
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return String(Math.round(normalizeZero(value) * 1000) / 1000)
}
