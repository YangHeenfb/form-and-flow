import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CircleHelp, Pause, Play, RotateCcw } from 'lucide-react'
import { GraphCanvas } from '../../core/graph2d/GraphCanvas.tsx'
import type { GraphTheme, GraphViewport } from '../../core/graph2d/GraphCanvas.tsx'
import { ExplorerTransport, InspectorSection } from '../../core/ui/ExplorerChrome.tsx'
import { Formula } from '../../core/ui/Formula.tsx'
import { HelpTrigger, LearningDrawer, type HelpTopic } from '../../core/ui/LearningHelp.tsx'
import { LessonScaffold } from '../../core/ui/LessonScaffold.tsx'
import { expressionToTex } from '../../core/ui/mathNotation.ts'
import { SelectMenu } from '../../core/ui/SelectMenu.tsx'
import type { Locale } from '../../i18n.ts'
import { LessonStageActions } from '../../platform/LessonStageActions.tsx'
import { ModuleFocusFrame } from '../../platform/ModuleFocusFrame.tsx'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { calculusFunctionNames, completeBareFunctionInput, normalizeMathInput } from '../calculus/shared/mathInput.ts'
import { FourierExplanation, type FourierValueRow } from './FourierExplanation.tsx'
import { createFourierExplanationModel, selectCurrentContribution, selectReconstructionCoefficients, type SpectrumView } from './fourierExplanation.ts'
import type { FilterConfig, FilterType, FourierCoefficient, ReconstructionMode, Spectrum, WindingPoint } from './fourierTypes.ts'
import { compileFourierExpression, fourierPresets, getFourierPreset, sampleFourierExpression, sampleFourierPreset, type SignalPreset } from './fourierPresets.ts'
import { axisContains, axisValueToPosition, frequencyAxisTicks, frequencyDisplayDomain, integerMinorTicks, type AxisDomain } from './math/axisTicks.ts'
import { applyFilter } from './math/filters.ts'
import { computeFrequencyPair, computeFrequencyPairFrame, synthesizeFrequencyPair, type FrequencyPair } from './math/frequencyPair.ts'
import { computeCoefficientAtFrequency, computeIntegerSpectrum, computeSpectrum, computeWindingPoints, findDominantFrequencies, interpolateWindingPoint } from './math/fourier.ts'
import { maxAbsError, meanSquaredError, reconstructSamples } from './math/reconstruction.ts'

type Props = {
  lessonId: string
}

type FourierLocale = Locale
type FourierTermId = 'winding' | 'frequency' | 'coefficient' | 'center-of-mass' | 'spectrum' | 'phase' | 'reconstruction' | 'filtering'
type FourierControlGroupId = 'samples' | 'spectrum' | 'reconstruction' | 'filtering' | 'display'
type FourierHelpMode = { kind: 'beginner' } | { kind: 'control'; group: FourierControlGroupId } | { kind: 'graph' } | { kind: 'term'; term: FourierTermId }

type LessonCopy = {
  title: string
  what: string
  why: string
  formula: string
  formulaTex: string
  watch: string
}

type SamplesResult = {
  samples: number[]
  error: string | null
}

function emptySpectrum(sampleCount: number, frequencyMin: number, frequencyMax: number, frequencyStep: number): Spectrum {
  return { coefficients: [], frequencyMin, frequencyMax, frequencyStep, sampleCount }
}

type DrawState = {
  lessonId: string
  locale: FourierLocale
  samples: number[]
  spectrum: Spectrum
  integerSpectrum: Spectrum
  filteredSpectrum: Spectrum
  reconstructedSamples: number[]
  filteredSamples: number[]
  includedCoefficients: FourierCoefficient[]
  currentContributionCoefficients: FourierCoefficient[]
  currentContributionSamples: number[]
  filterConfig: FilterConfig
  windingPoints: WindingPoint[]
  spectrumView: SpectrumView
  selectedFrequency: number
  selectedCoefficient: FourierCoefficient
  frequencyPair: FrequencyPair
  frequencyPairSamples: number[]
  playhead: number
  showOriginalSignal: boolean
  showWindingPath: boolean
  showWindingVectors: boolean
  showCenterOfMass: boolean
  showSpectrum: boolean
  showPhase: boolean
  showReconstruction: boolean
  showResidual: boolean
  showLabels: boolean
  logMagnitude: boolean
  positiveOnly: boolean
}

const fourierCopy: Record<FourierLocale, {
  ui: {
    signal: string
    preset: string
    customSignal: string
    expression: string
    formulaPreview: string
    commonFunctions: string
    inputHelp: string
    invalidExpression: string
    lesson: string
    exportPng: string
    play: string
    pause: string
    reset: string
    playbackProgress: string
    seeing: string
    why: string
    formula: string
    values: string
    intuition: string
    watch: string
    beginnerHelp: string
    controlHelp: string
    graphHelp: string
    closeHelp: string
    display: string
    spectrum: string
    reconstruction: string
    filtering: string
    probeView: string
    pairView: string
    spectrumViewLabel: string
    pairPlaybackProgress: string
    controls: Record<string, string>
    toggles: Record<string, string>
  }
  lessons: Record<string, LessonCopy>
}> = {
  en: {
    ui: {
      signal: 'Signal',
      preset: 'Preset',
      customSignal: 'Custom signal',
      expression: 'Expression',
      formulaPreview: 'Formula preview',
      commonFunctions: 'Common functions',
      inputHelp: 'Use t on [0, 1]. x is also accepted as an alias for t.',
      invalidExpression: 'Invalid expression.',
      lesson: 'Module',
      exportPng: 'Export PNG',
      play: 'Play',
      pause: 'Pause',
      reset: 'Reset animation',
      playbackProgress: 'Playback progress',
      seeing: 'Observation',
      why: 'Notes',
      formula: 'Formula',
      values: 'Readout',
      intuition: 'Intuition',
      watch: 'Notes',
      beginnerHelp: 'Notes',
      controlHelp: 'Parameter notes',
      graphHelp: 'Visual notes',
      closeHelp: 'Close notes',
      display: 'Display',
      spectrum: 'Spectrum',
      reconstruction: 'Reconstruction',
      filtering: 'Filtering',
      probeView: 'Frequency probe',
      pairView: '± frequency synthesis',
      spectrumViewLabel: 'Spectrum view',
      pairPlaybackProgress: 'Time in one cycle',
      controls: {
        frequency: 'winding frequency',
        pairFrequency: 'rotation frequency ±f',
        sampleCount: 'samples',
        speed: 'speed',
        frequencyMin: 'frequency min',
        frequencyMax: 'frequency max',
        frequencyStep: 'frequency step',
        maxHarmonic: 'max harmonic',
        frequencyBlocks: 'frequency blocks',
        coefficientCount: 'coefficient count',
        mode: 'mode',
        filterType: 'filter type',
        cutoff: 'cutoff',
        lowCutoff: 'low cutoff',
        highCutoff: 'high cutoff',
        threshold: 'threshold',
      },
      toggles: {
        normalizeAmplitude: 'normalize amplitude',
        snap: 'snap to integer',
        original: 'original',
        windingPath: 'winding path',
        vectors: 'rotating vector',
        center: 'center of mass',
        spectrum: 'spectrum',
        phase: 'phase',
        reconstruction: 'reconstruction',
        residual: 'residual',
        labels: 'labels',
        logMagnitude: 'log magnitude',
        positiveOnly: 'positive only',
      },
    },
    lessons: {
      spectrum: {
        title: 'Frequency Spectrum',
        what: 'Wind the same signal at many test speeds. A matching speed makes the wound graph unbalanced, so its center of mass moves away from the center; plotting those distances produces the spectrum.',
        why: 'The bar height is the full complex length |C(f)|. Its direction is phase, and real signals often create mirror peaks at +f and -f.',
        formula: '|C(f)| = |1/N sum x[n]e^{-i2πfn/N}|',
        formulaTex: '|C(f)|=\\left|\\frac{1}{N}\\sum_{n=0}^{N-1}x[n]e^{-i2\\pi fn/N}\\right|',
        watch: 'For this signal, look for strong responses near 1 and 3. Because we observe one finite slice, peaks can spread around those values instead of appearing as only one bar.',
      },
      'spectrum-pair': {
        title: 'Positive and Negative Frequency Synthesis',
        what: 'Read C(+f) and C(-f) from the spectrum and turn them into two mirror arrows rotating in opposite directions. Their vertical parts cancel and their sum stays real.',
        why: 'The yellow curve is one real contribution made by this pair of arrows, not the complete source signal.',
        formula: 'x±f(t)=C(f)e^{i2πft}+C(-f)e^{-i2πft}=2 Re(C(f)e^{i2πft})',
        formulaTex: 'x_{\\pm f}(t)=C(f)e^{i2\\pi ft}+C(-f)e^{-i2\\pi ft}=2\\operatorname{Re}\\!\\left(C(f)e^{i2\\pi ft}\\right)',
        watch: 'Choose a spectrum peak first. At a weak frequency the arrows and reconstructed contribution remain small because this view does not normalize them for display.',
      },
      reconstruction: {
        title: 'Signal Reconstruction',
        what: 'Frequency sets an arrow’s rotation speed, while the coefficient sets its length and initial direction. Each selected block makes one contribution, and the contributions add point by point.',
        why: 'The highlighted dashed curve is the newest contribution. The yellow curve is the cumulative sum of every selected contribution.',
        formula: 'x̂(t)=Σ C(f)e^{i2πft}',
        formulaTex: '\\hat{x}(t)=\\sum_f C(f)e^{i2\\pi ft}',
        watch: 'Smooth signals usually need fewer frequencies. Sharp corners or jumps need many more.',
      },
      filtering: {
        title: 'Frequency Filtering',
        what: 'Filtering changes the spectrum bars from C(f) to H(f)C(f), then reuses exactly the same point-by-point reconstruction.',
        why: 'Low-pass, high-pass, band filters, and magnitude thresholds are different rules for deciding which bars stay and which become zero.',
        formula: 'filtered x̂(t)=Σ H(f)C(f)e^{i2πft}',
        formulaTex: '\\hat{x}_{filtered}(t)=\\sum_f H(f)C(f)e^{i2\\pi ft}',
        watch: 'The cutoff is the shared boundary between the retained spectrum below and the reconstructed signal above.',
      },
    },
  },
  zh: {
    ui: {
      signal: '信号',
      preset: '预设',
      customSignal: '自定义信号',
      expression: '表达式',
      formulaPreview: '公式预览',
      commonFunctions: '常用函数',
      inputHelp: '使用归一化时间 t ∈ [0, 1]；也可以用 x 作为 t 的别名。',
      invalidExpression: '表达式无效。',
      lesson: '模块',
      exportPng: '导出 PNG',
      play: '播放',
      pause: '暂停',
      reset: '重置动画',
      playbackProgress: '播放进度',
      seeing: '观察',
      why: '说明',
      formula: '公式',
      values: '读数',
      intuition: '直觉解释',
      watch: '笔记',
      beginnerHelp: '笔记',
      controlHelp: '参数说明',
      graphHelp: '视觉笔记',
      closeHelp: '关闭笔记',
      display: '显示',
      spectrum: '频谱',
      reconstruction: '重建',
      filtering: '滤波',
      probeView: '频率检测',
      pairView: '正负频率合成',
      spectrumViewLabel: '频谱观察方式',
      pairPlaybackProgress: '单周期时间',
      controls: {
        frequency: '缠绕频率',
        pairFrequency: '旋转频率 ±f',
        sampleCount: '采样数',
        speed: '速度',
        frequencyMin: '最小频率',
        frequencyMax: '最大频率',
        frequencyStep: '频率步长',
        maxHarmonic: '最大谐波',
        frequencyBlocks: '频率块数量',
        coefficientCount: '系数数量',
        mode: '模式',
        filterType: '滤波类型',
        cutoff: '截止频率',
        lowCutoff: '低截止',
        highCutoff: '高截止',
        threshold: '幅值阈值',
      },
      toggles: {
        normalizeAmplitude: '幅值归一化',
        snap: '吸附整数',
        original: '原始信号',
        windingPath: '缠绕路径',
        vectors: '旋转向量',
        center: '重心',
        spectrum: '频谱',
        phase: '相位',
        reconstruction: '重建',
        residual: '残差',
        labels: '标签',
        logMagnitude: '对数幅值',
        positiveOnly: '只看正频率',
      },
    },
    lessons: {
      spectrum: {
        title: '频率频谱',
        what: '用许多测试转速反复缠绕同一条信号。转速对上时缠绕图会失衡，重心离开中心；把每次重心距离排起来就得到频谱。',
        why: '柱高是完整复系数的长度 |C(f)|，方向表示相位。真实信号常在 +f 与 -f 产生镜像峰。',
        formula: '|C(f)| = |1/N Σ x[n]e^{-i2πfn/N}|',
        formulaTex: '|C(f)|=\\left|\\frac{1}{N}\\sum_{n=0}^{N-1}x[n]e^{-i2\\pi fn/N}\\right|',
        watch: '对这个信号，你会在 1 和 3 附近看到强响应。因为我们只观察有限长度的一段曲线，峰可能会在附近扩散，而不是只出现在一个柱子上。',
      },
      'spectrum-pair': {
        title: '正负频率合成',
        what: '从频谱取出 C(+f) 和 C(-f)，把它们变成两根互为镜像、反向旋转的箭头；纵向部分抵消，合成结果留在实轴上。',
        why: '黄色曲线只是这对箭头形成的一条真实贡献波，不是完整原信号。',
        formula: 'x±f(t)=C(f)e^{i2πft}+C(-f)e^{-i2πft}=2 Re(C(f)e^{i2πft})',
        formulaTex: 'x_{\\pm f}(t)=C(f)e^{i2\\pi ft}+C(-f)e^{-i2\\pi ft}=2\\operatorname{Re}\\!\\left(C(f)e^{i2\\pi ft}\\right)',
        watch: '先选择一个频谱峰值最容易看清。弱频率处的箭头和合成波会保持很小，因为这里不会为了显示效果偷偷归一化。',
      },
      reconstruction: {
        title: '信号重建',
        what: '频率决定箭头转多快，系数决定箭头长度与初始方向；每个频率块产生一条贡献波，所有贡献逐点相加。',
        why: '强调色虚线是本次新增贡献，黄色曲线是所有已选贡献的累计结果。',
        formula: 'x̂(t)=Σ C(f)e^{i2πft}',
        formulaTex: '\\hat{x}(t)=\\sum_f C(f)e^{i2\\pi ft}',
        watch: '平滑信号通常需要较少频率；尖角或跳跃需要更多频率。',
      },
      filtering: {
        title: '频率滤波',
        what: '滤波先把频谱从 C(f) 改成 H(f)C(f)，再原样复用逐点相加的重建过程。',
        why: '低通、高通、带通、带阻和幅值阈值，只是决定哪些柱子保留、哪些变为零的不同规则。',
        formula: '滤波后 x̂(t)=Σ H(f)C(f)e^{i2πft}',
        formulaTex: '\\hat{x}_{\\text{滤波}}(t)=\\sum_f H(f)C(f)e^{i2\\pi ft}',
        watch: '截止频率是下方保留频谱与上方重建信号之间共用的边界。',
      },
    },
  },
}

export function FourierLesson({ lessonId }: Props) {
  const { locale } = usePlatformLocale()
  const lessonKey = isFourierLesson(lessonId) ? lessonId : 'spectrum'
  const defaultCopy = fourierCopy[locale].lessons[lessonKey]
  const ui = fourierCopy[locale].ui
  const [presetId, setPresetId] = useState(() => readInitialPresetParam(defaultPresetForLesson(lessonKey)))
  const selectedPreset = getFourierPreset(presetId === 'custom' ? defaultPresetForLesson(lessonKey) : presetId)
  const selectedPresetLabel = getFourierPresetLabel(selectedPreset, locale)
  const selectedPresetDescription = getFourierPresetDescription(selectedPreset, locale)
  const [expression, setExpression] = useState(() => readParam('f') ?? selectedPreset.expression ?? 'sin(2*pi*t)')
  const [sampleCount, setSampleCount] = useState(() => readNumberParam('samples', 512))
  const [normalizeAmplitude, setNormalizeAmplitude] = useState(() => readBooleanParam('normalize', false))
  const [selectedFrequency, setSelectedFrequency] = useState(() => readNumberParam('freq', selectedPreset.defaultFrequency))
  const [spectrumView, setSpectrumView] = useState<SpectrumView>(() => lessonKey === 'spectrum' ? readSpectrumViewParam() : 'probe')
  const [pairFrequency, setPairFrequency] = useState(() => clampPairFrequency(Math.abs(readNumberParam('freq', selectedPreset.defaultFrequency))))
  const [frequencySnap, setFrequencySnap] = useState(() => readBooleanParam('snap', false))
  const [frequencyMin, setFrequencyMin] = useState(() => readNumberParam('fmin', -10))
  const [frequencyMax, setFrequencyMax] = useState(() => readNumberParam('fmax', 10))
  const [frequencyStep, setFrequencyStep] = useState(() => readNumberParam('fstep', 0.1))
  const [maxHarmonic, setMaxHarmonic] = useState(() => readNumberParam('harmonic', lessonKey === 'filtering' ? 40 : 20))
  const [coefficientCount, setCoefficientCount] = useState(() => readNumberParam('count', 5))
  const [reconstructionMode, setReconstructionMode] = useState<ReconstructionMode>(() => readReconstructionModeParam('paired-frequency-blocks'))
  const [filterType, setFilterType] = useState<FilterType>(() => (readParam('filter') as FilterType) ?? 'low-pass')
  const [cutoff, setCutoff] = useState(() => readNumberParam('cutoff', 5))
  const [lowCutoff, setLowCutoff] = useState(() => readNumberParam('low', 2))
  const [highCutoff, setHighCutoff] = useState(() => readNumberParam('high', 8))
  const [threshold, setThreshold] = useState(() => readNumberParam('threshold', 0.08))
  const [playing, setPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [playhead, setPlayhead] = useState(0)
  const [showOriginalSignal, setShowOriginalSignal] = useState(true)
  const [showWindingPath, setShowWindingPath] = useState(true)
  const [showWindingVectors, setShowWindingVectors] = useState(true)
  const [showCenterOfMass, setShowCenterOfMass] = useState(true)
  const [showSpectrum, setShowSpectrum] = useState(true)
  const [showPhase, setShowPhase] = useState(false)
  const [showReconstruction, setShowReconstruction] = useState(true)
  const [showResidual, setShowResidual] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [logMagnitude, setLogMagnitude] = useState(false)
  const [positiveOnly, setPositiveOnly] = useState(false)
  const [helpMode, setHelpMode] = useState<FourierHelpMode | null>(null)
  const didInitializePreset = useRef(false)
  const copy = lessonKey === 'spectrum' && spectrumView === 'pair'
    ? fourierCopy[locale].lessons['spectrum-pair']
    : defaultCopy
  const activeHelpTopic = helpMode ? getFourierHelpTopic(helpMode, lessonKey, locale, spectrumView) : null

  const changeSpectrumView = useCallback((nextView: SpectrumView) => {
    if (nextView === spectrumView) return
    setPlaying(false)
    setPlayhead(0)
    if (nextView === 'pair') setPairFrequency(clampPairFrequency(Math.abs(selectedFrequency)))
    setSpectrumView(nextView)
    replaceSpectrumViewParam(nextView)
  }, [selectedFrequency, spectrumView])

  useEffect(() => {
    if (!didInitializePreset.current) {
      didInitializePreset.current = true
      return
    }
    if (presetId === 'custom') return
    const preset = getFourierPreset(presetId)
    setExpression(preset.expression ?? preset.label)
    setSelectedFrequency(preset.defaultFrequency)
    setPairFrequency(clampPairFrequency(Math.abs(preset.defaultFrequency)))
  }, [presetId])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let previous = performance.now()
    const tick = (now: number) => {
      const delta = Math.min(80, now - previous)
      previous = now
      if (lessonKey === 'spectrum' && spectrumView === 'probe') {
        setSelectedFrequency((value) => {
          const span = Math.max(1, frequencyMax - frequencyMin)
          const next = value + delta * 0.000225 * playbackSpeed * span
          return next > frequencyMax ? frequencyMin : next
        })
      }
      if (lessonKey === 'reconstruction') {
        setCoefficientCount((value) => {
          const limit = reconstructionMode === 'paired-frequency-blocks' ? maxHarmonic + 1 : maxHarmonic * 2 + 1
          const next = value + delta * 0.012 * playbackSpeed
          return next > limit ? 1 : next
        })
      }
      if (lessonKey === 'filtering') {
        setCutoff((value) => {
          const next = value + delta * 0.004 * playbackSpeed
          return next > maxHarmonic ? 0 : next
        })
      }
      setPlayhead((value) => (value + delta * 0.0002 * playbackSpeed) % 1)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [frequencyMax, frequencyMin, lessonKey, maxHarmonic, playbackSpeed, playing, reconstructionMode, spectrumView])

  const roundedSampleCount = clampInteger(sampleCount, 64, 1024)
  const roundedMaxHarmonic = clampInteger(maxHarmonic, 1, 80)
  const reconstructionCountMax = reconstructionMode === 'paired-frequency-blocks' ? roundedMaxHarmonic + 1 : roundedMaxHarmonic * 2 + 1
  const reconstructionCount = clampInteger(coefficientCount, 1, reconstructionCountMax)
  const reconstructionCountLabel = reconstructionMode === 'paired-frequency-blocks' ? ui.controls.frequencyBlocks : ui.controls.coefficientCount
  const samplesResult = useMemo<SamplesResult>(() => {
    if (presetId !== 'custom') {
      return { samples: sampleFourierPreset(presetId, roundedSampleCount, normalizeAmplitude), error: null }
    }
    try {
      compileFourierExpression(expression)
      return { samples: sampleFourierExpression(expression, roundedSampleCount, normalizeAmplitude), error: null }
    } catch (caught) {
      return {
        samples: sampleFourierPreset(defaultPresetForLesson(lessonKey), roundedSampleCount, normalizeAmplitude),
        error: caught instanceof Error ? translateFourierError(caught.message, locale) : ui.invalidExpression,
      }
    }
  }, [expression, lessonKey, locale, normalizeAmplitude, presetId, roundedSampleCount, ui.invalidExpression])

  const safeFrequencyStep = clampSpectrumStep(frequencyMin, frequencyMax, frequencyStep)
  const spectrum = useMemo(
    () => lessonKey === 'spectrum'
      ? computeSpectrum(samplesResult.samples, frequencyMin, frequencyMax, safeFrequencyStep)
      : emptySpectrum(samplesResult.samples.length, frequencyMin, frequencyMax, safeFrequencyStep),
    [frequencyMax, frequencyMin, lessonKey, safeFrequencyStep, samplesResult.samples],
  )
  const integerSpectrum = useMemo(
    () => lessonKey === 'spectrum'
      ? emptySpectrum(samplesResult.samples.length, -roundedMaxHarmonic, roundedMaxHarmonic, 1)
      : computeIntegerSpectrum(samplesResult.samples, roundedMaxHarmonic),
    [lessonKey, roundedMaxHarmonic, samplesResult.samples],
  )
  const selectedCoefficient = useMemo<FourierCoefficient>(
    () => lessonKey === 'spectrum'
      ? computeCoefficientAtFrequency(samplesResult.samples, selectedFrequency)
      : { frequency: selectedFrequency, value: { re: 0, im: 0 }, magnitude: 0, phase: 0 },
    [lessonKey, samplesResult.samples, selectedFrequency],
  )
  const frequencyPair = useMemo(
    () => computeFrequencyPair(samplesResult.samples, lessonKey === 'spectrum' ? pairFrequency : 0),
    [lessonKey, pairFrequency, samplesResult.samples],
  )
  const frequencyPairSamples = useMemo(
    () => lessonKey === 'spectrum' ? synthesizeFrequencyPair(frequencyPair, roundedSampleCount) : [],
    [frequencyPair, lessonKey, roundedSampleCount],
  )
  const windingPoints = useMemo(
    () => lessonKey === 'spectrum' ? computeWindingPoints(samplesResult.samples, selectedFrequency) : [],
    [lessonKey, samplesResult.samples, selectedFrequency],
  )
  const includedCoefficients = useMemo(
    () => lessonKey === 'reconstruction'
      ? selectReconstructionCoefficients(integerSpectrum.coefficients, reconstructionMode, reconstructionCount)
      : [],
    [integerSpectrum.coefficients, lessonKey, reconstructionCount, reconstructionMode],
  )
  const currentContributionCoefficients = useMemo(
    () => lessonKey === 'reconstruction'
      ? selectCurrentContribution(integerSpectrum.coefficients, reconstructionMode, reconstructionCount)
      : [],
    [integerSpectrum.coefficients, lessonKey, reconstructionCount, reconstructionMode],
  )
  const reconstructedSamples = useMemo(
    () => lessonKey === 'reconstruction' ? reconstructSamples(includedCoefficients, roundedSampleCount) : [],
    [includedCoefficients, lessonKey, roundedSampleCount],
  )
  const currentContributionSamples = useMemo(
    () => lessonKey === 'reconstruction' ? reconstructSamples(currentContributionCoefficients, roundedSampleCount) : [],
    [currentContributionCoefficients, lessonKey, roundedSampleCount],
  )
  const filterConfig = useMemo<FilterConfig>(
    () => ({ type: filterType, cutoff, lowCutoff, highCutoff, threshold }),
    [cutoff, filterType, highCutoff, lowCutoff, threshold],
  )
  const filteredSpectrum = useMemo(
    () => lessonKey === 'filtering'
      ? applyFilter(integerSpectrum, filterConfig)
      : emptySpectrum(samplesResult.samples.length, -roundedMaxHarmonic, roundedMaxHarmonic, 1),
    [filterConfig, integerSpectrum, lessonKey, roundedMaxHarmonic, samplesResult.samples.length],
  )
  const filteredSamples = useMemo(
    () => lessonKey === 'filtering' ? reconstructSamples(filteredSpectrum.coefficients, roundedSampleCount) : [],
    [filteredSpectrum.coefficients, lessonKey, roundedSampleCount],
  )
  const displayedExpression = presetId !== 'custom' && !selectedPreset.expression ? selectedPresetLabel : expression
  const expressionTex = useMemo(
    () => (presetId !== 'custom' && !selectedPreset.expression ? selectedPreset.tex : expressionToTex(expression)),
    [expression, presetId, selectedPreset.expression, selectedPreset.tex],
  )
  const values = getValueRows({
    locale,
    lessonKey,
    spectrumView,
    selectedFrequency,
    selectedCoefficient,
    frequencyPair,
    playhead,
    spectrum,
    integerSpectrum,
    samples: samplesResult.samples,
    reconstructedSamples,
    filteredSamples,
    includedCoefficients,
    coefficientCount: reconstructionCount,
    reconstructionMode,
    filterType,
    cutoff,
    lowCutoff,
    highCutoff,
    threshold,
  })
  const explanationModel = createFourierExplanationModel({
    locale,
    lessonKey,
    spectrumView,
    selectedFrequency,
    selectedMagnitude: selectedCoefficient.magnitude,
    spectrum,
    pairFrequency: frequencyPair.frequency,
    pairMagnitude: frequencyPair.positive.magnitude,
    pairHasNegative: frequencyPair.negative !== null,
    reconstructionMode,
    reconstructionCount,
    includedCoefficients,
    currentContribution: currentContributionCoefficients,
    reconstructionMse: meanSquaredError(samplesResult.samples, reconstructedSamples),
    filterConfig,
    integerSpectrum,
    presetId,
    expression,
    sampleCount: roundedSampleCount,
    normalizeAmplitude,
  })
  const spectrumClamped = Math.abs(safeFrequencyStep - Math.max(0.05, Math.abs(frequencyStep))) > 1e-9
  const playbackProgress = getFourierPlaybackProgress({
    lessonKey,
    spectrumView,
    playhead,
    selectedFrequency,
    frequencyMin,
    frequencyMax,
    coefficientCount,
    maxHarmonic,
    cutoff,
  })
  const seekPlaybackProgress = useCallback(
    (progress: number) => {
      const next = clampProgress(progress)
      if (lessonKey === 'spectrum' && spectrumView === 'pair') {
        setPlayhead(next)
      } else if (lessonKey === 'spectrum') {
        setSelectedFrequency(valueFromProgress(next, frequencyMin, frequencyMax))
      } else if (lessonKey === 'reconstruction') {
        setCoefficientCount(valueFromProgress(next, 1, maxHarmonic * 2 + 1))
      } else if (lessonKey === 'filtering') {
        setCutoff(valueFromProgress(next, 0, maxHarmonic))
      }
    },
    [frequencyMax, frequencyMin, lessonKey, maxHarmonic, spectrumView],
  )

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme) => {
      drawFourierScene(ctx, viewport, theme, {
        lessonId: lessonKey,
        locale,
        samples: samplesResult.samples,
        spectrum,
        integerSpectrum,
        filteredSpectrum,
        reconstructedSamples,
        filteredSamples,
        includedCoefficients,
        currentContributionCoefficients,
        currentContributionSamples,
        filterConfig,
        windingPoints,
        spectrumView,
        selectedFrequency,
        selectedCoefficient,
        frequencyPair,
        frequencyPairSamples,
        playhead,
        showOriginalSignal,
        showWindingPath,
        showWindingVectors,
        showCenterOfMass,
        showSpectrum,
        showPhase,
        showReconstruction,
        showResidual,
        showLabels,
        logMagnitude,
        positiveOnly,
      })
    },
    [
      filteredSamples,
      filteredSpectrum,
      filterConfig,
      includedCoefficients,
      integerSpectrum,
      lessonKey,
      locale,
      logMagnitude,
      playhead,
      positiveOnly,
      currentContributionCoefficients,
      currentContributionSamples,
      reconstructedSamples,
      samplesResult.samples,
      selectedCoefficient,
      selectedFrequency,
      showCenterOfMass,
      showLabels,
      showOriginalSignal,
      showPhase,
      showReconstruction,
      showResidual,
      showSpectrum,
      showWindingPath,
      showWindingVectors,
      spectrum,
      spectrumView,
      windingPoints,
      frequencyPair,
      frequencyPairSamples,
    ],
  )

  const exportPng = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('.fourier-canvas')
    if (!canvas) return
    const anchor = document.createElement('a')
    anchor.href = canvas.toDataURL('image/png')
    anchor.download = `fourier-${lessonKey}${lessonKey === 'spectrum' && spectrumView === 'pair' ? '-pair' : ''}.png`
    anchor.click()
  }
  const playback = getPlaybackLabels(lessonKey, playing, locale, spectrumView)

  return (
    <>
    <ModuleFocusFrame>
      {({ focusButton, isFocusMode, autoHideToggle, onFocusPanelActiveChange }) => (
    <LessonScaffold
      className="fourier-lesson"
      controlsClassName="fourier-controls"
      mainClassName="fourier-main"
      explanationClassName="fourier-explanation"
      readoutLabel={ui.intuition}
      isFocusMode={isFocusMode}
      autoHideToggle={autoHideToggle}
      onFocusPanelActiveChange={onFocusPanelActiveChange}
      eyebrow={ui.lesson}
      title={copy.title}
      inspectorAction={(
        <HelpTrigger onClick={() => setHelpMode({ kind: 'beginner' })} ariaLabel={ui.beginnerHelp}>
          {ui.beginnerHelp}
        </HelpTrigger>
      )}
      controls={
        <InspectorSection title={ui.signal}>
        <label>
          {ui.preset}
          <SelectMenu
            value={presetId}
            options={[
              { value: 'custom', textValue: ui.customSignal, label: <Formula tex="x(t)" label={ui.customSignal} /> },
              ...fourierPresets.map((preset) => ({
                value: preset.id,
                textValue: getFourierPresetLabel(preset, locale),
                label: <Formula tex={preset.tex} label={getFourierPresetLabel(preset, locale)} />,
              })),
            ]}
            onChange={setPresetId}
            ariaLabel={ui.preset}
          />
        </label>
        <label>
          <Formula tex="x(t)" />
          <input
            value={displayedExpression}
            placeholder="sin(2*pi*t) + 0.5*sin(2*pi*3*t)"
            onBlur={() => setExpression((current) => normalizeMathInput(current))}
            onChange={(event) => {
              setPresetId('custom')
              setExpression(completeBareFunctionInput(event.target.value, 't'))
            }}
          />
        </label>
        <div className="math-formula-preview" aria-label={ui.formulaPreview}>
          <span>{ui.formulaPreview}</span>
          <Formula tex={`x(t)=${expressionTex}`} label={`${ui.formulaPreview}: x(t)=${displayedExpression}`} />
        </div>
        <div className="math-input-toolbar" aria-label={ui.commonFunctions}>
          {calculusFunctionNames.map((name) => (
            <button
              type="button"
              key={name}
              onClick={() => {
                setPresetId('custom')
                setExpression(`${name}(t)`)
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <p className="input-help">{ui.inputHelp}</p>
        {selectedPresetDescription && presetId !== 'custom' && <p className="input-help">{selectedPresetDescription}</p>}
        {samplesResult.error && <p className="warning-text">{samplesResult.error}</p>}
        <Range
          label={ui.controls.sampleCount}
          value={roundedSampleCount}
          min={64}
          max={1024}
          step={64}
          onChange={setSampleCount}
          onHelp={() => setHelpMode({ kind: 'control', group: 'samples' })}
          helpAriaLabel={controlHelpAria(ui.controlHelp, ui.controls.sampleCount)}
        />
        <Toggle label={ui.toggles.normalizeAmplitude} checked={normalizeAmplitude} onChange={setNormalizeAmplitude} />

        {lessonKey === 'spectrum' && (
          <ControlGroup title={ui.spectrum} onHelp={() => setHelpMode({ kind: 'control', group: 'spectrum' })} helpAriaLabel={controlHelpAria(ui.controlHelp, ui.spectrum)}>
            {spectrumView === 'pair' ? (
              <>
                <Range
                  label={ui.controls.pairFrequency}
                  value={pairFrequency}
                  min={0}
                  max={30}
                  step={frequencySnap ? 1 : 0.05}
                  onChange={(value) => setPairFrequency(clampPairFrequency(frequencySnap ? Math.round(value) : value))}
                />
                <Toggle label={ui.toggles.snap} checked={frequencySnap} onChange={setFrequencySnap} />
                <p className="input-help">
                  {locale === 'zh'
                    ? '这里直接计算当前真实信号的 C(+f) 与 C(-f)。非整数 f 是一次连续频率测试；整数 f 才直接对应离散重建中的频率块。'
                    : 'This directly computes C(+f) and C(-f) for the current real signal. Non-integer f is a continuous frequency test; integer f directly matches a discrete reconstruction block.'}
                </p>
              </>
            ) : (
              <>
                <Range
                  label={ui.controls.frequency}
                  value={selectedFrequency}
                  min={frequencyMin}
                  max={frequencyMax}
                  step={frequencySnap ? 1 : 0.05}
                  onChange={(value) => setSelectedFrequency(frequencySnap ? Math.round(value) : value)}
                />
                <Toggle label={ui.toggles.snap} checked={frequencySnap} onChange={setFrequencySnap} />
                <Range label={ui.controls.frequencyMin} value={frequencyMin} min={-30} max={0} step={1} onChange={setFrequencyMin} />
                <Range label={ui.controls.frequencyMax} value={frequencyMax} min={1} max={30} step={1} onChange={setFrequencyMax} />
                <Range label={ui.controls.frequencyStep} value={frequencyStep} min={0.05} max={1} step={0.05} onChange={setFrequencyStep} />
                {spectrumClamped && <p className="warning-text">{locale === 'zh' ? '频谱点数已限制在 401 以内。' : 'Spectrum points are limited to 401.'}</p>}
                <Toggle label={ui.toggles.logMagnitude} checked={logMagnitude} onChange={setLogMagnitude} />
                <Toggle label={ui.toggles.positiveOnly} checked={positiveOnly} onChange={setPositiveOnly} />
                <Toggle label={ui.toggles.phase} checked={showPhase} onChange={setShowPhase} />
              </>
            )}
          </ControlGroup>
        )}

        {lessonKey === 'reconstruction' && (
          <ControlGroup title={ui.reconstruction} onHelp={() => setHelpMode({ kind: 'control', group: 'reconstruction' })} helpAriaLabel={controlHelpAria(ui.controlHelp, ui.reconstruction)}>
            <Range label={ui.controls.maxHarmonic} value={maxHarmonic} min={4} max={50} step={1} onChange={setMaxHarmonic} />
            <label>
              {ui.controls.mode}
              <SelectMenu<ReconstructionMode>
                value={reconstructionMode}
                options={[
                  { value: 'paired-frequency-blocks', textValue: locale === 'zh' ? '成对频率块' : 'paired frequency blocks', label: locale === 'zh' ? '成对频率块' : 'paired frequency blocks' },
                  { value: 'top-magnitudes', textValue: locale === 'zh' ? '单个最大幅值' : 'single top magnitudes', label: locale === 'zh' ? '单个最大幅值' : 'single top magnitudes' },
                  { value: 'first-harmonics', textValue: locale === 'zh' ? '前 N 个谐波' : 'first N harmonics', label: locale === 'zh' ? '前 N 个谐波' : 'first N harmonics' },
                ]}
                onChange={setReconstructionMode}
                ariaLabel={ui.controls.mode}
              />
            </label>
            <Range label={reconstructionCountLabel} value={reconstructionCount} min={1} max={reconstructionCountMax} step={1} onChange={setCoefficientCount} />
          </ControlGroup>
        )}

        {lessonKey === 'filtering' && (
          <ControlGroup title={ui.filtering} onHelp={() => setHelpMode({ kind: 'control', group: 'filtering' })} helpAriaLabel={controlHelpAria(ui.controlHelp, ui.filtering)}>
            <Range label={ui.controls.maxHarmonic} value={maxHarmonic} min={8} max={80} step={1} onChange={setMaxHarmonic} />
            <label>
              {ui.controls.filterType}
              <SelectMenu<FilterType>
                value={filterType}
                options={[
                  { value: 'low-pass', textValue: locale === 'zh' ? '低通' : 'low-pass', label: locale === 'zh' ? '低通' : 'low-pass' },
                  { value: 'high-pass', textValue: locale === 'zh' ? '高通' : 'high-pass', label: locale === 'zh' ? '高通' : 'high-pass' },
                  { value: 'band-pass', textValue: locale === 'zh' ? '带通' : 'band-pass', label: locale === 'zh' ? '带通' : 'band-pass' },
                  { value: 'band-stop', textValue: locale === 'zh' ? '带阻' : 'band-stop', label: locale === 'zh' ? '带阻' : 'band-stop' },
                  { value: 'magnitude-threshold', textValue: locale === 'zh' ? '幅值阈值' : 'magnitude threshold', label: locale === 'zh' ? '幅值阈值' : 'magnitude threshold' },
                ]}
                onChange={setFilterType}
                ariaLabel={ui.controls.filterType}
              />
            </label>
            {(filterType === 'low-pass' || filterType === 'high-pass') && <Range label={ui.controls.cutoff} value={cutoff} min={0} max={maxHarmonic} step={0.25} onChange={setCutoff} />}
            {(filterType === 'band-pass' || filterType === 'band-stop') && (
              <>
                <Range label={ui.controls.lowCutoff} value={lowCutoff} min={0} max={maxHarmonic} step={0.25} onChange={setLowCutoff} />
                <Range label={ui.controls.highCutoff} value={highCutoff} min={0} max={maxHarmonic} step={0.25} onChange={setHighCutoff} />
              </>
            )}
            {filterType === 'magnitude-threshold' && <Range label={ui.controls.threshold} value={threshold} min={0} max={0.6} step={0.01} onChange={setThreshold} />}
          </ControlGroup>
        )}

        <ControlGroup title={ui.display} onHelp={() => setHelpMode({ kind: 'control', group: 'display' })} helpAriaLabel={controlHelpAria(ui.controlHelp, ui.display)}>
          <Toggle label={ui.toggles.original} checked={showOriginalSignal} onChange={setShowOriginalSignal} />
          {!(lessonKey === 'spectrum' && spectrumView === 'pair') && (
            <>
              <Toggle label={ui.toggles.windingPath} checked={showWindingPath} onChange={setShowWindingPath} />
              <Toggle label={ui.toggles.vectors} checked={showWindingVectors} onChange={setShowWindingVectors} />
              <Toggle label={ui.toggles.center} checked={showCenterOfMass} onChange={setShowCenterOfMass} />
              <Toggle label={ui.toggles.spectrum} checked={showSpectrum} onChange={setShowSpectrum} />
              <Toggle label={ui.toggles.reconstruction} checked={showReconstruction} onChange={setShowReconstruction} />
              <Toggle label={ui.toggles.residual} checked={showResidual} onChange={setShowResidual} />
            </>
          )}
          <Toggle label={ui.toggles.labels} checked={showLabels} onChange={setShowLabels} />
        </ControlGroup>
        </InspectorSection>
      }
      stage={
        <div className={`graph-help-stage fourier-graph-stage${lessonKey === 'spectrum' ? ' has-spectrum-view-switch' : ''}`}>
          {lessonKey === 'spectrum' && (
            <SpectrumViewSwitch
              value={spectrumView}
              label={ui.spectrumViewLabel}
              probeLabel={ui.probeView}
              pairLabel={ui.pairView}
              onChange={changeSpectrumView}
            />
          )}
          <GraphCanvas
            className="graph-canvas fourier-canvas"
            ariaLabel={getFourierCanvasAriaLabel(copy, locale, spectrumView, frequencyPair)}
            xMin={0}
            xMax={1}
            yMin={-1.25}
            yMax={1.25}
            draw={draw}
          />
        </div>
      }
      stageActions={(
        <LessonStageActions
          graphLabel={ui.graphHelp}
          graphAriaLabel={ui.graphHelp}
          onGraphHelp={() => setHelpMode({ kind: 'graph' })}
          focusButton={focusButton}
          exportLabel={ui.exportPng}
          onExport={exportPng}
        />
      )}
      transport={(
        <ExplorerTransport
          className="fourier-playback"
          primaryAction={{
            label: playback.label,
            icon: playing ? <Pause size={16} /> : <Play size={16} />,
            onClick: () => setPlaying((current) => !current),
          }}
          secondaryActions={[
            { label: ui.reset, icon: <RotateCcw size={16} />, onClick: () => {
              setPlaying(false)
              resetLesson(lessonKey, selectedPreset.defaultFrequency, setSelectedFrequency, setCoefficientCount, setCutoff, setPlayhead)
              if (lessonKey === 'spectrum' && spectrumView === 'pair') setPairFrequency(clampPairFrequency(Math.abs(selectedPreset.defaultFrequency)))
            } },
          ]}
          progress={{ label: lessonKey === 'spectrum' && spectrumView === 'pair' ? ui.pairPlaybackProgress : ui.playbackProgress, value: playbackProgress, onChange: seekPlaybackProgress }}
          speed={{ label: ui.controls.speed, value: playbackSpeed, min: 0.25, max: 3, step: 0.05, onChange: setPlaybackSpeed }}
        />
      )}

      explanation={
        <FourierExplanation
          model={explanationModel}
          values={values}
          formulaTex={copy.formulaTex}
          formulaLabel={copy.formula}
          notes={[
            getFourierConventionCopy(lessonKey, spectrumView, locale),
            getWatchCopy(lessonKey, locale, copy.watch, presetId, filterType),
          ]}
          terms={getFourierTermLinks(lessonKey, spectrumView, locale)}
          onTerm={(term) => setHelpMode({ kind: 'term', term: term as FourierTermId })}
        />
      }
    />
      )}
    </ModuleFocusFrame>
    <LearningDrawer topic={activeHelpTopic} closeLabel={ui.closeHelp} onClose={() => setHelpMode(null)} />
    </>
  )
}

function Range({
  label,
  value,
  min,
  max,
  step,
  valueSuffix,
  onChange,
  onHelp,
  helpAriaLabel,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  valueSuffix?: string
  onChange: (value: number) => void
  onHelp?: () => void
  helpAriaLabel?: string
}) {
  if (onHelp) {
    return (
      <div className="fourier-range-control">
        <div className="fourier-range-heading">
          <span className="range-label">
            {label}: <strong>{round(value)}</strong>
          </span>
          <ControlHelpButton ariaLabel={helpAriaLabel ?? label} onClick={onHelp} />
        </div>
        <input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      </div>
    )
  }

  if (valueSuffix) {
    return (
      <label className="speed-control">
        <span className="range-label">{label}</span>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <strong>{`${value.toFixed(2)}${valueSuffix}`}</strong>
      </label>
    )
  }

  return (
    <label>
      <span className="range-label">
        {label}: <strong>{round(value)}</strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function getFourierPlaybackProgress({
  lessonKey,
  spectrumView,
  playhead,
  selectedFrequency,
  frequencyMin,
  frequencyMax,
  coefficientCount,
  maxHarmonic,
  cutoff,
}: {
  lessonKey: 'spectrum' | 'reconstruction' | 'filtering'
  spectrumView: SpectrumView
  playhead: number
  selectedFrequency: number
  frequencyMin: number
  frequencyMax: number
  coefficientCount: number
  maxHarmonic: number
  cutoff: number
}): number {
  if (lessonKey === 'spectrum' && spectrumView === 'pair') return clampProgress(playhead)
  if (lessonKey === 'spectrum') return progressFromValue(selectedFrequency, frequencyMin, frequencyMax)
  if (lessonKey === 'reconstruction') return progressFromValue(coefficientCount, 1, maxHarmonic * 2 + 1)
  if (lessonKey === 'filtering') return progressFromValue(cutoff, 0, maxHarmonic)
  return 0
}

function progressFromValue(value: number, start: number, end: number): number {
  const span = end - start
  if (Math.abs(span) < 1e-9) return 0
  return clampProgress((value - start) / span)
}

function valueFromProgress(progress: number, start: number, end: number): number {
  return start + (end - start) * clampProgress(progress)
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="fourier-toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  )
}

function SpectrumViewSwitch({
  value,
  label,
  probeLabel,
  pairLabel,
  onChange,
}: {
  value: SpectrumView
  label: string
  probeLabel: string
  pairLabel: string
  onChange: (view: SpectrumView) => void
}) {
  const options: Array<{ value: SpectrumView; label: string }> = [
    { value: 'probe', label: probeLabel },
    { value: 'pair', label: pairLabel },
  ]
  return (
    <div className="fourier-spectrum-view-switch" role="group" aria-label={label} data-view={value}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          className={value === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function ControlGroup({ title, children, onHelp, helpAriaLabel }: { title: string; children: ReactNode; onHelp?: () => void; helpAriaLabel?: string }) {
  return (
    <div className="fourier-control-group">
      <div className="fourier-control-heading">
        <h3>{title}</h3>
        {onHelp && <ControlHelpButton ariaLabel={helpAriaLabel ?? title} onClick={onHelp} />}
      </div>
      {children}
    </div>
  )
}

function ControlHelpButton({ ariaLabel, onClick }: { ariaLabel: string; onClick: () => void }) {
  return (
    <button className="fourier-control-help-button" type="button" aria-label={ariaLabel} title={ariaLabel} onClick={onClick}>
      <CircleHelp size={15} />
    </button>
  )
}

function controlHelpAria(prefix: string, title: string): string {
  return `${prefix}: ${title}`
}

function getFourierHelpTopic(mode: FourierHelpMode, lessonId: string, locale: FourierLocale, spectrumView: SpectrumView): HelpTopic {
  if (mode.kind === 'term') return fourierTermTopic(mode.term, locale)
  if (mode.kind === 'control') {
    if (lessonId === 'spectrum' && spectrumView === 'pair') return fourierPairControlTopic(mode.group, locale)
    return fourierControlTopic(mode.group, locale)
  }
  if (mode.kind === 'graph') return fourierGraphTopic(lessonId, locale, spectrumView)
  if (lessonId === 'spectrum' && spectrumView === 'pair') return fourierPairBeginnerTopic(locale)
  return fourierBeginnerTopic(locale)
}

function getFourierTermLinks(lessonId: string, spectrumView: SpectrumView, locale: FourierLocale): Array<{ id: FourierTermId; label: string }> {
  if (lessonId === 'spectrum' && spectrumView === 'probe') {
    return locale === 'zh'
      ? [
          { id: 'winding', label: '缠绕' },
          { id: 'center-of-mass', label: '重心' },
          { id: 'spectrum', label: '频谱' },
          { id: 'phase', label: '相位' },
        ]
      : [
          { id: 'winding', label: 'winding' },
          { id: 'center-of-mass', label: 'center of mass' },
          { id: 'spectrum', label: 'spectrum' },
          { id: 'phase', label: 'phase' },
        ]
  }
  if (lessonId === 'spectrum') {
    return locale === 'zh'
      ? [{ id: 'frequency', label: '正负频率' }, { id: 'coefficient', label: '傅里叶系数' }, { id: 'reconstruction', label: '贡献波' }]
      : [{ id: 'frequency', label: 'signed frequency' }, { id: 'coefficient', label: 'Fourier coefficient' }, { id: 'reconstruction', label: 'contribution wave' }]
  }
  if (lessonId === 'reconstruction') {
    return locale === 'zh'
      ? [{ id: 'coefficient', label: '傅里叶系数' }, { id: 'reconstruction', label: '重建' }]
      : [{ id: 'coefficient', label: 'Fourier coefficient' }, { id: 'reconstruction', label: 'reconstruction' }]
  }
  return locale === 'zh'
    ? [{ id: 'filtering', label: '滤波' }, { id: 'spectrum', label: '频谱' }, { id: 'reconstruction', label: '重建' }]
    : [{ id: 'filtering', label: 'filtering' }, { id: 'spectrum', label: 'spectrum' }, { id: 'reconstruction', label: 'reconstruction' }]
}

function fourierPairBeginnerTopic(locale: FourierLocale): HelpTopic {
  return locale === 'zh'
    ? {
        eyebrow: '笔记',
        title: '两根反向箭头如何变成一条波',
        summary: '先从频谱取出 C(+f) 和 C(-f)，再让两根镜像箭头反向旋转并相加。',
        sections: [
          { title: '频谱给出箭头', body: '系数大小决定箭头长度，系数角度决定初始方向。真实信号满足 C(-f)=C(f)*，所以两根箭头互为镜像。' },
          { title: '反向旋转并相加', body: '两根箭头的纵向虚数部分始终抵消，黄色合向量留在实轴；它的横坐标随时间画出上方黄色贡献波。' },
          { title: '只是一条贡献', body: '青色是完整原信号，黄色只来自当前 ±f 两个系数。要恢复完整信号，还要把其它频率块的贡献继续加上。' },
          { title: '非整数频率', body: '非整数 f 是连续频率扫描得到的一次测试结果；整数 f 才直接对应离散 Fourier 重建中的一个频率块。' },
        ],
      }
    : {
        eyebrow: 'Notes',
        title: 'How two opposite arrows make one wave',
        summary: 'Take C(+f) and C(-f) from the spectrum, rotate the mirror arrows in opposite directions, and add them.',
        sections: [
          { title: 'The spectrum sets the arrows', body: 'Coefficient magnitude sets arrow length and coefficient angle sets its initial direction. A real signal satisfies C(-f)=C(f)*, so the arrows are mirrors.' },
          { title: 'Rotate oppositely and add', body: 'Their vertical imaginary parts always cancel, leaving the yellow resultant on the real axis. Its horizontal coordinate traces the yellow contribution wave above.' },
          { title: 'Only one contribution', body: 'Cyan is the full source signal; yellow comes only from the current ±f coefficients. Reconstructing the full signal requires adding the other frequency-block contributions.' },
          { title: 'Non-integer frequencies', body: 'A non-integer f is one continuous frequency test. Integer f directly matches a frequency block in the discrete Fourier reconstruction.' },
        ],
      }
}

function fourierPairControlTopic(group: FourierControlGroupId, locale: FourierLocale): HelpTopic {
  if (group !== 'spectrum' && group !== 'display') return fourierControlTopic(group, locale)
  if (group === 'display') {
    return locale === 'zh'
      ? { eyebrow: '参数说明', title: '合成显示', summary: '显示开关只改变画面，不改变 C(+f)、C(-f) 或合成结果。', sections: [{ title: '曲线与标签', body: '原始信号可以隐藏，以便单独观察黄色贡献波；标签开关控制画布标题、箭头与频谱柱标注。' }] }
      : { eyebrow: 'Parameter notes', title: 'Synthesis display', summary: 'Display toggles do not change C(+f), C(-f), or the synthesized result.', sections: [{ title: 'Curves and labels', body: 'The source signal can be hidden to isolate the yellow pair contribution. Labels controls panel, arrow, and spectrum-bar annotations.' }] }
  }
  return locale === 'zh'
    ? {
        eyebrow: '参数说明',
        title: '旋转频率 ±f',
        summary: '这里选择一个非负旋转速度 f，并始终同时计算当前真实信号的 C(+f) 与 C(-f)。',
        sections: [
          { title: '频率', body: 'f=1 表示单位区间内转一圈。吸附整数便于连接离散重建；关闭后可以观察连续频率测试。' },
          { title: '真实大小', body: '箭头和柱子直接使用系数大小，不会因为频率很弱而单独放大。' },
          { title: '直流项', body: 'f=0 与自身镜像重合，因此只显示一个静止的 C(0)，不会重复相加。' },
        ],
      }
    : {
        eyebrow: 'Parameter notes',
        title: 'Rotation frequency ±f',
        summary: 'Choose a non-negative rotation speed f; the view always computes both C(+f) and C(-f) from the current real signal.',
        sections: [
          { title: 'Frequency', body: 'f=1 makes one turn over the unit interval. Integer snap connects directly to discrete reconstruction; disabling it explores the continuous frequency test.' },
          { title: 'True magnitude', body: 'Arrow and bar lengths use the actual coefficient magnitude and are not enlarged just because the frequency is weak.' },
          { title: 'DC', body: 'At f=0 the mirror is the same coefficient, so the view shows one stationary C(0) and never doubles it.' },
        ],
      }
}

function fourierBeginnerTopic(locale: FourierLocale): HelpTopic {
  if (locale === 'zh') {
    return {
      eyebrow: '笔记',
      title: '从缠绕到频谱',
      summary: '不断改变缠绕转速，观察缠绕图是否失衡，再把重心距离记录到对应频率上。',
      sections: [
        {
          title: '1. 用一个转速缠绕',
          body: '缠绕频率 f 把每个信号高度变成从中心伸出的长度，并让它按 f 的速度旋转。滑块改变的是测试转速，不是原信号。',
        },
        {
          title: '2. 看图形是否失衡',
          body: '如果转速与信号节奏对上，缠绕点不会均匀抵消，重心（平均点）会离开中心；距离就是 |C(f)|，方向就是相位。',
        },
        {
          title: '3. 把距离排成频谱',
          body: '对很多个 f 重复测试，把每次 |C(f)| 记到频率横轴上。峰值就是让缠绕图最明显失衡的转速，也就是信号中的强频率。',
        },
        {
          title: '正负频率',
          body: (
            <>
              正频率和负频率可以理解成两个旋转方向。对真实信号，很多峰会成对出现在 {formula('+f')} 和 {formula('-f')}。
            </>
          ),
        },
      ],
    }
  }

  return {
    eyebrow: 'Notes',
    title: 'From winding to the spectrum',
    summary: 'Change the winding speed, watch whether the wound graph becomes unbalanced, and record the center-of-mass distance at that frequency.',
    sections: [
      {
        title: '1. Wind at one speed',
        body: 'Winding frequency f turns each signal height into a length from the center and rotates it at speed f. The slider changes the test speed, not the source signal.',
      },
      {
        title: '2. Look for imbalance',
        body: 'If the speed matches a rhythm in the signal, the wound points stop cancelling evenly and the center of mass (average point) moves away. Distance is |C(f)| and direction is phase.',
      },
      {
        title: '3. Line up the distances',
        body: 'Repeat for many f values and place each |C(f)| on the frequency axis. Peaks are the winding speeds that create the strongest imbalance, hence strong signal frequencies.',
      },
      {
        title: 'Signed frequency',
        body: (
          <>
            Positive and negative frequencies are two rotation directions. For real signals, many peaks appear as mirror pairs at {formula('+f')} and {formula('-f')}.
          </>
        ),
      },
    ],
  }
}

function fourierControlTopic(group: FourierControlGroupId, locale: FourierLocale): HelpTopic {
  if (locale === 'zh') {
    const topics: Record<FourierControlGroupId, HelpTopic> = {
      samples: {
        eyebrow: '参数说明',
        title: '采样数',
        summary: '采样数决定用多少个时间点代表这条连续曲线。',
        sections: [
          {
            title: '它改变什么',
            items: [
              '采样数越高，我们用来做缠绕测试的点越多，重心、频谱和重建结果通常更稳定。',
              '采样数越低，计算更轻，但细节可能变粗，尤其是高频、尖角和噪声附近。',
            ],
          },
          {
            title: '不要误会',
            items: [
              '采样数不是信号里的频率数量，也不是重建时保留的系数数量。',
              '它只是把这条曲线离散成多少个点；频率成分要看频谱和系数。',
            ],
          },
        ],
      },
      spectrum: {
        eyebrow: '参数说明',
        title: '缠绕频率扫描',
        summary: '这里改变的是“用什么转速缠绕”和“怎么显示频谱”，不会改变原信号本身。',
        sections: [
          {
            title: '缠绕频率',
            items: [
              '缠绕频率是当前测试转速。它不会改变原信号，只改变我们用什么速度把信号绕起来。',
              '吸附整数打开后只测试整数频率。对刚好在 [0,1] 内完成整圈的信号，整数频率最容易看清。',
            ],
          },
          {
            title: '扫描范围',
            items: [
              '最小频率 / 最大频率决定频谱横轴的扫描范围。范围越宽，能看到的候选频率越多。',
              '频率步长表示扫描频谱时每隔多少测一次。步长越小，频谱越细；步长越大，计算更快但可能错过细节。',
            ],
          },
          {
            title: '显示方式',
            items: [
              '对数幅值只是把很高的柱子压低，让小柱子也看得见。它不会改变真正的傅里叶系数。',
              '只看正频率会只显示正频率。真实信号的频谱常常左右对称，+f 和 -f 都会出现；这个选项会隐藏一半镜像信息。',
              '相位显示傅里叶系数的角度，也就是这个频率成分在时间上错开了多少。柱子很矮时，相位通常没有太大意义。',
            ],
          },
        ],
      },
      reconstruction: {
        eyebrow: '参数说明',
        title: '重建参数',
        summary: '这里决定保留哪些傅里叶系数，再把它们叠回时间信号。',
        sections: [
          {
            title: '频率候选',
            items: [
              '最大谐波表示最多考虑到第几个整数频率。数值越大，能使用的高频越多。',
              '高频越多，尖角和细节越容易被重建出来，但图也更复杂。',
            ],
          },
          {
            title: '挑选模式',
            items: [
              '模式决定怎么挑选频率。默认的成对频率块会尽量同时保留 +f 和 -f，让真实信号的重建更自然。',
              '频率块数量表示参与重建的频率组数。1 个块通常会保留一对 +f / -f；直流项 f=0 单独算一块。',
              '单个最大幅值模式会直接按系数大小挑单个系数，适合已经学过复系数的人观察细节。',
            ],
          },
          {
            title: '误差读法',
            items: [
              '均方误差 MSE 是“平均误差平方”，用一个数字概括两条曲线差多大，越小表示越接近。',
              '残差是原信号减去重建结果。残差越小，说明保留下来的频率越能解释原信号。',
            ],
          },
        ],
      },
      filtering: {
        eyebrow: '参数说明',
        title: '滤波参数',
        summary: '这里决定在频谱里保留或削弱哪些频率，再把剩下的频率叠回去。',
        sections: [
          {
            title: '可用频率',
            items: [
              '最大谐波表示滤波前最多保留到第几个整数频率。数值越大，参与滤波的高频越多。',
              '如果最大谐波太低，高频噪声或尖角一开始就不会进入滤波计算。',
            ],
          },
          {
            title: '滤波类型',
            items: [
              '低通保留慢变化，高通保留快变化。',
              '带通只保留中间一段频率，带阻会移除中间一段频率。',
              '幅值阈值按傅里叶系数大小保留频率，低于阈值的频率会被削弱。',
            ],
          },
          {
            title: '边界值',
            items: [
              '截止频率是保留和移除频率的分界线。低通保留低于截止频率的频率；高通保留高于截止频率的频率。',
              '低截止 / 高截止是带通或带阻的频率范围边界。',
              '均方误差 MSE 和残差用来观察滤波后信号和原信号差多少。滤掉噪声时，误差不一定为零，但形状可能更清楚。',
            ],
          },
        ],
      },
      display: {
        eyebrow: '参数说明',
        title: '显示开关',
        summary: '这些开关只改变画面显示，不改变 Fourier 计算结果。',
        sections: [
          {
            title: '曲线和频谱',
            items: [
              '原始信号控制是否显示输入曲线。关闭它可以更专注地看重建或滤波结果。',
              '频谱、重建和残差开关控制下方频谱、重建曲线和误差曲线是否显示。',
              '残差是原信号减去重建或滤波后的结果，用来看还有哪些部分没有被当前频率解释。',
            ],
          },
          {
            title: '缠绕视图',
            items: [
              '缠绕路径显示信号绕起来后的点云路径；旋转向量显示当前时间点对应的旋转长度。',
              '重心显示当前缠绕频率的傅里叶系数。它离中心越远，说明当前频率响应越强。',
              '这些缠绕开关主要在频谱页最有用；在重建和滤波页里，有些开关只是保留同一套显示偏好。',
            ],
          },
        ],
      },
    }
    return topics[group]
  }

  const topics: Record<FourierControlGroupId, HelpTopic> = {
    samples: {
      eyebrow: 'Parameter notes',
      title: 'Samples',
      summary: 'Samples controls how many time points represent the curve.',
      sections: [
        {
          title: 'What it changes',
          items: [
            'Higher sample counts give the winding test more points, so the center of mass, spectrum, and reconstruction are usually more stable.',
            'Lower sample counts are lighter to compute, but details can get rougher, especially near high frequencies, corners, and noise.',
          ],
        },
        {
          title: 'Do not confuse it with',
          items: [
            'Samples are not the number of frequencies in the signal and not the number of coefficients kept for reconstruction.',
            'They only say how many discrete points represent the curve; frequency content is read from the spectrum and coefficients.',
          ],
        },
      ],
    },
    spectrum: {
      eyebrow: 'Parameter notes',
      title: 'Winding-frequency scan',
      summary: 'This group changes the winding speed and spectrum display; it does not change the source signal.',
      sections: [
        {
          title: 'Winding frequency',
          items: [
            'Winding frequency is the current test speed. It does not change the source signal; it changes how fast the signal is wound.',
            'Snap to integer tests only integer frequencies. For signals that complete whole cycles on [0,1], integer frequencies are usually easiest to read.',
          ],
        },
        {
          title: 'Scan range',
          items: [
            'Frequency min / max set the horizontal scan range. A wider range shows more candidate frequencies.',
            'Frequency step is how far the scan jumps between tests. Smaller steps show finer detail; larger steps are faster but can miss detail.',
          ],
        },
        {
          title: 'Display options',
          items: [
            'Log magnitude compresses tall bars so small bars are visible. It changes only the display, not the Fourier coefficients.',
            'Positive only shows only positive frequencies. Real signals often have mirrored +f and -f peaks, so this hides half of that mirror structure.',
            'Phase is the coefficient angle, or timing offset. If a frequency bar is tiny, its phase usually is not meaningful.',
          ],
        },
      ],
    },
    reconstruction: {
      eyebrow: 'Parameter notes',
      title: 'Reconstruction parameters',
      summary: 'This group decides which Fourier coefficients are kept and added back into the time signal.',
      sections: [
        {
          title: 'Frequency candidates',
          items: [
            'Max harmonic is the highest integer frequency considered. Higher values allow more high-frequency detail.',
            'More high frequencies can rebuild corners and fine details, but they also make the view more complex.',
          ],
        },
        {
          title: 'Selection mode',
          items: [
            'Mode controls how frequencies are chosen. The default paired frequency blocks mode keeps +f and -f together so real-signal reconstruction stays natural.',
            'Frequency blocks is how many frequency groups are used. One block usually keeps a +f / -f pair; DC at f=0 is one block by itself.',
            'Single top magnitudes picks individual coefficients by size, which is useful after you already understand complex coefficients.',
          ],
        },
        {
          title: 'Error readout',
          items: [
            'MSE means mean squared error. It summarizes how far two curves are from each other; smaller is closer.',
            'Residual is original minus reconstruction. A smaller residual means the kept frequencies explain more of the signal.',
          ],
        },
      ],
    },
    filtering: {
      eyebrow: 'Parameter notes',
      title: 'Filtering parameters',
      summary: 'This group decides which frequencies are kept or weakened before the signal is rebuilt.',
      sections: [
        {
          title: 'Available frequencies',
          items: [
            'Max harmonic is the highest integer frequency included before filtering.',
            'If max harmonic is too low, high-frequency noise or sharp corners never enter the filtering step.',
          ],
        },
        {
          title: 'Filter type',
          items: [
            'Low-pass keeps slow changes; high-pass keeps fast changes.',
            'Band-pass keeps a middle range, and band-stop removes a middle range.',
            'Magnitude threshold keeps frequencies by coefficient size. Frequencies below the threshold are weakened.',
          ],
        },
        {
          title: 'Boundaries',
          items: [
            'Cutoff is the boundary between kept and removed frequencies. Low-pass keeps below cutoff; high-pass keeps above cutoff.',
            'Low cutoff / high cutoff are the range edges for band-pass and band-stop filters.',
            'MSE and residual show how far the filtered signal is from the original. Removing noise may still leave nonzero error while making the shape easier to read.',
          ],
        },
      ],
    },
    display: {
      eyebrow: 'Parameter notes',
      title: 'Display toggles',
      summary: 'These toggles change only what is drawn; they do not change the Fourier calculation.',
      sections: [
        {
          title: 'Curves and spectrum',
          items: [
            'Original signal controls whether the input curve is visible. Turning it off can help you focus on reconstruction or filtering.',
            'Spectrum, reconstruction, and residual control whether the lower spectrum, reconstructed curve, and error curve are visible.',
            'Residual is original minus the reconstructed or filtered result, showing what the current frequencies do not explain.',
          ],
        },
        {
          title: 'Winding view',
          items: [
            'Winding path shows the wound point cloud; rotating vector shows the current time point as a rotating length.',
            'Center of mass is the Fourier coefficient for the current winding frequency. Farther from the center means a stronger response.',
            'These winding toggles matter most on the spectrum page; on reconstruction and filtering pages, some toggles simply preserve the same display preferences.',
          ],
        },
      ],
    },
  }
  return topics[group]
}

function fourierGraphTopic(lessonId: string, locale: FourierLocale, spectrumView: SpectrumView): HelpTopic {
  if (lessonId === 'reconstruction') {
    return locale === 'zh'
      ? {
          eyebrow: '视觉笔记',
          title: '重建视图',
          summary: '上方把本次新增贡献与累计重建分开画出；下方用同一强调色指出产生这条贡献的系数。',
          sections: [
            { title: '上方曲线', body: '青色是原信号，强调色虚线是当前新增频率块单独产生的贡献，黄色是全部已选贡献逐点相加后的结果；紫色残差是原信号减去累计重建。' },
            { title: '下方柱子', body: '强调色柱与上方强调色虚线是同一组系数；黄色柱此前已加入，灰色柱尚未参与。成对模式会一起高亮 -f 与 +f，DC 只高亮一次。' },
          ],
        }
      : {
          eyebrow: 'Visual notes',
          title: 'Reconstruction view',
          summary: 'The top separates the newest contribution from the cumulative reconstruction; the same highlight color marks its coefficients below.',
          sections: [
            { title: 'Top curves', body: 'Cyan is the source, the highlighted dashed curve is the newest block alone, yellow is the point-by-point sum of all selected contributions, and purple residual is source minus reconstruction.' },
            { title: 'Bottom bars', body: 'Highlighted bars produce the highlighted dashed curve. Yellow bars were already included; gray bars are still omitted. Pair mode highlights -f and +f together, while DC appears once.' },
          ],
        }
  }

  if (lessonId === 'filtering') {
    return locale === 'zh'
      ? {
          eyebrow: '视觉笔记',
          title: '滤波视图',
          summary: '下方先显示哪些频谱柱被保留或压到零，上方再显示用剩余柱重建出的信号。',
          sections: [
            { title: '下方频谱', body: '淡黄色区域表示保留范围，虚线表示实际边界；幅值阈值模式改用水平阈值线。原始柱是 C(f)，黄色柱是 H(f)C(f)。' },
            { title: '上方曲线', body: '黄色滤波结果不是另一种算法，而是把下方剩余系数用重建页同样的逐点相加方法合成。' },
          ],
        }
      : {
          eyebrow: 'Visual notes',
          title: 'Filtering view',
          summary: 'The bottom first shows which spectrum bars remain or become zero; the top is reconstructed from those remaining bars.',
          sections: [
            { title: 'Bottom spectrum', body: 'The pale yellow region is retained and dashed lines mark the actual boundaries; magnitude threshold mode uses a horizontal line. Original bars are C(f), yellow bars are H(f)C(f).' },
            { title: 'Top curves', body: 'The yellow result is not made by another algorithm. It uses the same point-by-point reconstruction as the reconstruction view, now with only the remaining coefficients.' },
          ],
        }
  }

  if (spectrumView === 'pair') {
    return locale === 'zh'
      ? {
          eyebrow: '视觉笔记',
          title: '正负频率合成视图',
          summary: '上方比较完整原信号与当前两根反向箭头的贡献；下方把同两个系数画成箭头和镜像柱。',
          sections: [
            { title: '上方曲线', body: '青色是完整原信号，黄色只由 C(+f) 和 C(-f) 合成，是一条贡献波而不是完整信号。移动时间进度时，它与下方黄色合向量的横坐标同步。' },
            { title: '双箭头', body: '青色 +f 箭头和紫色 -f 箭头反向旋转。虚线平行四边形显示向量相加；两者纵向部分抵消，黄色合向量留在实轴。' },
            { title: '镜像柱', body: '右下两根柱子使用真实 |C(-f)| 与 |C(+f)|。对真实信号两者相等；f=0 时只显示一个直流柱。' },
          ],
        }
      : {
          eyebrow: 'Visual notes',
          title: 'Positive and negative frequency synthesis',
          summary: 'The top compares the full source signal with the selected ±f pair contribution; below, the same coefficients appear as arrows and mirror spectrum bars.',
          sections: [
            { title: 'Top curves', body: 'Cyan is the full source signal; yellow is synthesized only from C(+f) and C(-f). The yellow cursor value matches the horizontal coordinate of the yellow resultant below.' },
            { title: 'Two arrows', body: 'The cyan +f and purple -f arrows rotate in opposite directions. A dashed parallelogram shows vector addition; their vertical parts cancel, leaving the yellow result on the real axis.' },
            { title: 'Mirror bars', body: 'The lower-right bars use the true |C(-f)| and |C(+f)| values. They match for a real signal; f=0 shows one DC bar.' },
          ],
        }
  }

  return locale === 'zh'
    ? {
        eyebrow: '视觉笔记',
        title: '频谱视图',
        summary: '时间曲线、缠绕平面、重心和频谱柱是同一次缠绕频率测试的连续结果。',
        sections: [
          { title: '时间信号', body: '上方曲线是原始信号。缠绕频率滑块只改变测试转速，不会改变原始信号。' },
          { title: '缠绕平面', body: '每个信号高度会变成一根从中心伸出的长度，再按缠绕频率旋转。高度会变，所以点不一定落在同一个圆上。图形如果明显向一边失衡，说明当前转速和信号里的某个节奏对上了。' },
          { title: '重心 / 频谱', body: '重心离中心的距离就是 |C(f)|，方向是相位。频谱把很多缠绕转速得到的距离排起来，峰值就是强频率。' },
        ],
      }
    : {
        eyebrow: 'Visual notes',
        title: 'Spectrum view',
        summary: 'The time curve, winding plane, center of mass, and spectrum bar are consecutive results of the same winding-frequency test.',
        sections: [
          { title: 'Time signal', body: 'The top curve is the source signal. The winding-frequency slider changes only the test speed, never the source signal.' },
          { title: 'Winding plane', body: 'Each signal height becomes a length from the center and rotates at the test frequency. Because the height changes, the points do not have to sit on one circle. If the point cloud leans strongly to one side, the test frequency matches a rhythm in the signal.' },
          { title: 'Center of mass / spectrum', body: 'The center-of-mass distance is |C(f)| and its direction is phase. The spectrum lines up those distances from many winding speeds; peaks are strong frequencies.' },
        ],
      }
}

function fourierTermTopic(term: FourierTermId, locale: FourierLocale): HelpTopic {
  const zh: Record<FourierTermId, HelpTopic> = {
    winding: {
      eyebrow: '术语',
      title: '缠绕',
      summary: '缠绕把时间 t 映射成旋转角度，把信号高度 x(t) 当作从中心伸出的有符号长度。',
      sections: [{ title: '它为什么能检测频率', body: '缠绕频率对上信号节奏时，相似位置会反复落在相似方向，图形不再均匀平衡；对不上时，各方向更容易互相抵消。x(t) 为负时长度会翻向相反方向，所以路径不必落在同一个圆上。' }],
    },
    frequency: {
      eyebrow: '术语',
      title: '频率',
      summary: '频率表示单位时间里重复多少次；在这个实验里，它也是缠绕的旋转速度。',
      sections: [{ title: '正负号', body: 't 在 [0,1] 时，f=1 表示整段信号绕一圈，f=3 表示绕三圈，f=-3 表示反方向绕三圈。正频率和负频率可以理解成顺时针和逆时针两个旋转方向。' }],
    },
    coefficient: {
      eyebrow: '术语',
      title: '傅里叶系数',
      summary: '傅里叶系数 C(f) 就是用缠绕频率 f 得到的重心位置。',
      sections: [{ title: '分析与重建的两种读法', body: '检测时，系数长度 |C(f)| 是重心离中心的距离，角度是相位；重建时，同一个复数变成一根初始长度与方向已确定的旋转箭头。它不一定等于原波形峰值；振幅为 1 的真实正弦常分成 ±f 两个高度约 0.5 的镜像系数。' }],
    },
    'center-of-mass': {
      eyebrow: '术语',
      title: '重心（平均点）',
      summary: '重心是缠绕后所有点的平均位置，也就是当前测试频率的 C(f)。',
      sections: [{ title: '直觉', body: '图形围绕中心平衡时，各方向互相抵消，重心接近原点；图形向一侧失衡时，重心被拉远。离中心的距离写进幅值频谱，方向写进相位。' }],
    },
    spectrum: {
      eyebrow: '术语',
      title: '频谱',
      summary: '频谱是把很多频率的系数大小排在一起的图。',
      sections: [{ title: '频谱峰值', body: '峰值表示强频率。多个峰值说明信号由多个主要频率混合而成。对真实信号，+f 和 -f 经常成对出现；只看正频率会让图更简单，但也隐藏一半镜像信息。' }],
    },
    phase: {
      eyebrow: '术语',
      title: '相位',
      summary: '相位描述一个频率成分在时间上错开了多少。',
      sections: [{ title: '直觉', body: '两个波频率相同但峰值出现得早晚不同，它们的相位就不同。注意：如果某个频率的柱子很矮，它的相位通常没有太大意义。' }],
    },
    reconstruction: {
      eyebrow: '术语',
      title: '重建',
      summary: '重建把每个 C(f) 变成按 f 旋转的箭头，再把所有箭头在每个时间点的实部相加。',
      sections: [{ title: '贡献与累计结果', body: '一对 ±f 箭头先形成一条真实贡献波；所有频率块的贡献逐点相加就是累计重建。完整离散系数可以恢复样本，只保留一部分时得到近似。' }],
    },
    filtering: {
      eyebrow: '术语',
      title: '滤波',
      summary: '滤波先把 C(f) 的某些柱子保留或压到零，再用完全相同的重建方法相加。',
      sections: [{ title: '频谱规则', body: 'H(f) 表示每个频率保留多少，得到 H(f)C(f)。低通、高通、带通、带阻和幅值阈值只是不同的 H(f) 规则；真正生成时间信号的仍是重建。' }],
    },
  }

  const en: Record<FourierTermId, HelpTopic> = {
    winding: {
      eyebrow: 'Term',
      title: 'Winding',
      summary: 'Winding maps time t to rotation angle and treats signal height x(t) as a signed length from the center.',
      sections: [{ title: 'Why it detects frequency', body: 'At a matching winding speed, repeated parts of the signal land in similar directions and the graph becomes unbalanced. At a mismatch, directions tend to cancel. Negative x(t) flips the length, so the path need not lie on one circle.' }],
    },
    frequency: {
      eyebrow: 'Term',
      title: 'Frequency',
      summary: 'Frequency means how many times something repeats per unit of time; here it is also the winding speed.',
      sections: [{ title: 'Positive and negative', body: 'When t is in [0,1], f=1 means one turn, f=3 means three turns, and f=-3 means three turns in the opposite direction. Positive and negative frequencies are two rotation directions.' }],
    },
    coefficient: {
      eyebrow: 'Term',
      title: 'Fourier coefficient',
      summary: 'The Fourier coefficient C(f) is the center-of-mass position produced by winding frequency f.',
      sections: [{ title: 'Analysis and reconstruction', body: 'During detection, |C(f)| is center-of-mass distance and its angle is phase. During reconstruction, the same complex number sets a rotating arrow’s initial length and direction. It need not equal waveform peak height; a real sine of amplitude 1 often splits into two mirror coefficients near 0.5.' }],
    },
    'center-of-mass': {
      eyebrow: 'Term',
      title: 'Center of mass (average point)',
      summary: 'The center of mass is the mean position of all wound points and equals C(f) for the current test frequency.',
      sections: [{ title: 'Intuition', body: 'A balanced wound graph cancels in every direction, keeping the center of mass near zero. An unbalanced graph pulls it away. Distance goes into the magnitude spectrum and direction becomes phase.' }],
    },
    spectrum: {
      eyebrow: 'Term',
      title: 'Spectrum',
      summary: 'A spectrum lines up the coefficient magnitudes for many frequencies.',
      sections: [{ title: 'Spectrum peaks', body: 'Peaks are strong frequencies. Multiple peaks mean the signal mixes multiple main frequencies. For real signals, +f and -f often appear as mirror peaks; positive-only view simplifies the graph but hides half of that mirror.' }],
    },
    phase: {
      eyebrow: 'Term',
      title: 'Phase',
      summary: 'Phase describes the timing offset of a frequency component.',
      sections: [{ title: 'Intuition', body: 'Two waves can have the same frequency but reach their peaks at different times. That difference is phase. If a frequency bar is tiny, its phase usually is not meaningful.' }],
    },
    reconstruction: {
      eyebrow: 'Term',
      title: 'Reconstruction',
      summary: 'Reconstruction turns each C(f) into an arrow rotating at f, then adds every arrow’s real part at each time.',
      sections: [{ title: 'Contribution and cumulative result', body: 'A ±f pair first makes one real contribution wave. Adding every frequency-block contribution point by point gives the cumulative reconstruction. A complete discrete set recovers the samples; a partial set gives an approximation.' }],
    },
    filtering: {
      eyebrow: 'Term',
      title: 'Filtering',
      summary: 'Filtering keeps or lowers selected C(f) bars to zero, then uses exactly the same reconstruction.',
      sections: [{ title: 'Spectrum rule', body: 'H(f) says how much of each frequency remains, producing H(f)C(f). Low-pass, high-pass, band-pass, band-stop, and magnitude threshold are different H(f) rules; reconstruction still makes the time signal.' }],
    },
  }

  return locale === 'zh' ? zh[term] : en[term]
}

function formula(tex: string) {
  return <Formula tex={tex} />
}

function drawFourierScene(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: DrawState) {
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, viewport.width, viewport.height)
  if (state.lessonId === 'spectrum' && state.spectrumView === 'pair') drawFrequencyPairLesson(ctx, viewport, theme, state)
  else if (state.lessonId === 'spectrum') drawSpectrumLesson(ctx, viewport, theme, state)
  if (state.lessonId === 'reconstruction') drawReconstructionLesson(ctx, viewport, theme, state)
  if (state.lessonId === 'filtering') drawFilteringLesson(ctx, viewport, theme, state)
}

type Rect = { x: number; y: number; width: number; height: number }

function drawSpectrumLesson(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: DrawState) {
  const gap = 14
  const signalRect = { x: gap, y: gap, width: viewport.width - gap * 2, height: viewport.height * 0.25 }
  const lowerY = signalRect.y + signalRect.height + gap
  const spectrumRect = { x: gap, y: lowerY, width: viewport.width * 0.62 - gap * 1.5, height: viewport.height - lowerY - gap }
  const windingRect = { x: spectrumRect.x + spectrumRect.width + gap, y: lowerY, width: viewport.width - spectrumRect.width - gap * 3, height: spectrumRect.height }
  drawSignalPanel(ctx, signalRect, theme, state.samples, true, state.playhead, state.showLabels ? label(state.locale, 'Time signal', '时间信号') : '', state.showLabels)
  if (state.showSpectrum) drawSpectrumPanel(ctx, spectrumRect, theme, state.spectrum, state.selectedFrequency, state.logMagnitude, state.positiveOnly, state.showPhase, state.showLabels ? label(state.locale, 'Magnitude spectrum', '幅值频谱') : '', state.showLabels)
  drawWindingPanel(ctx, windingRect, theme, state)
}

function drawFrequencyPairLesson(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: DrawState) {
  const pairTheme = getFrequencyPairTheme(theme)
  const compact = viewport.width < 720
  const gap = compact ? 10 : 14
  const signalHeight = viewport.height * (compact ? 0.28 : 0.3)
  const signalRect = { x: gap, y: gap, width: viewport.width - gap * 2, height: signalHeight }
  const lowerY = signalRect.y + signalRect.height + gap
  let pairRect: Rect
  let spectrumRect: Rect

  if (compact) {
    const remaining = viewport.height - lowerY - gap * 2
    const pairHeight = remaining * 0.68
    pairRect = { x: gap, y: lowerY, width: viewport.width - gap * 2, height: pairHeight }
    spectrumRect = { x: gap, y: lowerY + pairHeight + gap, width: viewport.width - gap * 2, height: remaining - pairHeight }
  } else {
    pairRect = { x: gap, y: lowerY, width: viewport.width * 0.62 - gap * 1.5, height: viewport.height - lowerY - gap }
    spectrumRect = { x: pairRect.x + pairRect.width + gap, y: lowerY, width: viewport.width - pairRect.width - gap * 3, height: pairRect.height }
  }

  drawPairSignalPanel(ctx, signalRect, pairTheme, state)
  drawFrequencyPairPlane(ctx, pairRect, pairTheme, state)
  drawFrequencyPairSpectrum(ctx, spectrumRect, pairTheme, state)
}

function getFrequencyPairTheme(theme: GraphTheme): GraphTheme {
  if (theme.background.toLowerCase() !== '#fbfcfd') return theme
  return {
    ...theme,
    primary: '#0b7a70',
    secondary: '#6c4fc0',
    warning: '#716f00',
  }
}

function drawPairSignalPanel(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, state: DrawState) {
  drawPanel(ctx, rect, theme, state.showLabels ? label(state.locale, 'Source and current contribution', '原信号与当前贡献') : '')
  const legend = state.showLabels
    ? [
        ...(state.showOriginalSignal ? [{ label: label(state.locale, 'source', '原信号'), color: theme.primary }] : []),
        { label: label(state.locale, 'current ±f contribution', '当前 ±f 贡献'), color: theme.warning },
      ]
    : []
  const plotTopInset = legend.length > 0 ? 32 + countLegendRows(rect, legend, ctx) * 14 : 28
  drawSignalGrid(ctx, rect, theme, plotTopInset)
  const displayedSamples = [
    ...(state.showOriginalSignal ? state.samples : []),
    ...state.frequencyPairSamples,
  ]
  const amplitudeRange = signalAmplitudeRange(displayedSamples)
  drawAmplitudeScale(ctx, rect, theme, amplitudeRange)
  if (state.showOriginalSignal) drawSamples(ctx, rect, state.samples, theme.primary, 1.8, false, amplitudeRange, plotTopInset)
  drawSamples(ctx, rect, state.frequencyPairSamples, theme.warning, 2.4, false, amplitudeRange, plotTopInset)
  drawTimeCursor(ctx, rect, theme, state.playhead, 1.3, plotTopInset)
  drawFourierLegend(ctx, rect, theme, legend)
  drawTimeAxisLabels(ctx, rect, theme, state.showLabels, plotTopInset)
}

function drawFrequencyPairPlane(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, state: DrawState) {
  drawPanel(ctx, rect, theme, state.showLabels ? label(state.locale, 'Opposite rotations and their sum', '反向旋转与合向量') : '')
  const frame = computeFrequencyPairFrame(state.frequencyPair, state.playhead)
  const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 + (rect.height < 150 ? 4 : 10) }
  const sourceRange = state.samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0)
  const vectorRange = Math.max(
    1.25,
    sourceRange,
    Math.hypot(frame.sum.re, frame.sum.im),
    Math.hypot(frame.positive.re, frame.positive.im) + (frame.negative ? Math.hypot(frame.negative.re, frame.negative.im) : 0),
  ) * 1.12
  const scale = Math.max(1, Math.min(rect.width, rect.height) * 0.4 / vectorRange)

  ctx.strokeStyle = theme.gridMinor
  ctx.lineWidth = 1
  for (const fraction of [0.25, 0.5, 0.75, 1]) {
    ctx.beginPath()
    ctx.arc(center.x, center.y, vectorRange * fraction * scale, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.strokeStyle = theme.axis
  ctx.beginPath()
  ctx.moveTo(rect.x + 12, center.y)
  ctx.lineTo(rect.x + rect.width - 12, center.y)
  ctx.moveTo(center.x, rect.y + 28)
  ctx.lineTo(center.x, rect.y + rect.height - 12)
  ctx.stroke()

  const positiveTip = complexToScreen(center, scale, frame.positive)
  const sumTip = complexToScreen(center, scale, frame.sum)

  if (frame.negative) {
    const negativeTip = complexToScreen(center, scale, frame.negative)
    drawArrow(ctx, center, positiveTip, theme.primary, 2.5)
    drawArrow(ctx, center, negativeTip, theme.secondary, 2.5)
    drawDashedSegment(ctx, positiveTip, sumTip, theme.secondary)
    drawDashedSegment(ctx, negativeTip, sumTip, theme.primary)
    drawDashedSegment(ctx, positiveTip, { x: positiveTip.x, y: center.y }, theme.primary)
    drawDashedSegment(ctx, negativeTip, { x: negativeTip.x, y: center.y }, theme.secondary)
    if (state.showLabels && rect.height >= 145) {
      drawCanvasLabel(ctx, `+${formatFrequency(state.frequencyPair.frequency)}`, positiveTip, theme.primary, rect)
      drawCanvasLabel(ctx, `-${formatFrequency(state.frequencyPair.frequency)}`, negativeTip, theme.secondary, rect)
    }
    drawArrow(ctx, center, sumTip, theme.warning, 3.2)
    drawDot(ctx, sumTip.x, sumTip.y, theme.warning, 4)
    if (state.showLabels) drawCanvasLabel(ctx, label(state.locale, 'real sum', '实数合成'), sumTip, theme.warning, rect, true)
  } else {
    drawArrow(ctx, center, sumTip, theme.warning, 3.2)
    drawDot(ctx, sumTip.x, sumTip.y, theme.warning, 4)
    if (state.showLabels) drawCanvasLabel(ctx, label(state.locale, 'C(0) = real sum', 'C(0) = 实数合成'), sumTip, theme.warning, rect, true)
  }

  if (state.showLabels) {
    ctx.fillStyle = theme.muted
    ctx.font = '11px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(
      state.frequencyPair.frequency === 0
        ? label(state.locale, 'DC is its own mirror', 'DC 与自身镜像重合')
        : label(state.locale, 'vertical parts cancel', '纵向分量相消'),
      rect.x + 10,
      rect.y + rect.height - 10,
    )
  }
}

function drawFrequencyPairSpectrum(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, state: DrawState) {
  drawPanel(ctx, rect, theme, state.showLabels ? label(state.locale, 'Mirror coefficients', '镜像频率系数') : '')
  const base = rect.y + rect.height - Math.min(28, rect.height * 0.24)
  const top = rect.y + Math.min(36, rect.height * 0.32)
  const height = Math.max(4, base - top)
  const sourceRange = Math.max(1.25, ...state.samples.map((value) => Math.abs(value)))
  ctx.strokeStyle = theme.axis
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(rect.x + 12, base)
  ctx.lineTo(rect.x + rect.width - 12, base)
  ctx.stroke()

  if (state.frequencyPair.frequency === 0 || !state.frequencyPair.negative) {
    const barTop = drawPairSpectrumBar(ctx, rect.x + rect.width / 2, base, height, state.frequencyPair.positive.magnitude, sourceRange, theme.primary)
    if (state.showLabels) drawPairSpectrumLabel(ctx, rect.x + rect.width / 2, base, barTop, '0', state.frequencyPair.positive.magnitude, theme)
    return
  }

  const negativeX = rect.x + rect.width * 0.3
  const positiveX = rect.x + rect.width * 0.7
  const negativeTop = drawPairSpectrumBar(ctx, negativeX, base, height, state.frequencyPair.negative.magnitude, sourceRange, theme.secondary)
  const positiveTop = drawPairSpectrumBar(ctx, positiveX, base, height, state.frequencyPair.positive.magnitude, sourceRange, theme.primary)
  if (state.showLabels) {
    drawPairSpectrumLabel(ctx, negativeX, base, negativeTop, `-${formatFrequency(state.frequencyPair.frequency)}`, state.frequencyPair.negative.magnitude, theme)
    drawPairSpectrumLabel(ctx, positiveX, base, positiveTop, `+${formatFrequency(state.frequencyPair.frequency)}`, state.frequencyPair.positive.magnitude, theme)
  }
}

function drawPairSpectrumBar(ctx: CanvasRenderingContext2D, x: number, base: number, availableHeight: number, magnitude: number, scaleRange: number, color: string): number {
  const barHeight = Math.min(availableHeight, magnitude / Math.max(1e-9, scaleRange) * availableHeight)
  ctx.strokeStyle = color
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.moveTo(x, base)
  ctx.lineTo(x, base - barHeight)
  ctx.stroke()
  drawDot(ctx, x, base - barHeight, color, 3)
  return base - barHeight
}

function drawPairSpectrumLabel(ctx: CanvasRenderingContext2D, x: number, base: number, barTop: number, frequency: string, magnitude: number, theme: GraphTheme) {
  ctx.fillStyle = theme.muted
  ctx.font = '10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(frequency, x, base + 13)
  ctx.fillText(`|C| ${formatNumber(magnitude)}`, x, barTop - 7)
  ctx.textAlign = 'left'
}

function drawReconstructionLesson(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: DrawState) {
  const gap = 14
  const signalRect = { x: gap, y: gap, width: viewport.width - gap * 2, height: viewport.height * 0.6 }
  const spectrumRect = { x: gap, y: signalRect.y + signalRect.height + gap, width: viewport.width - gap * 2, height: viewport.height - signalRect.height - gap * 3 }
  drawComparisonPanel(
    ctx,
    signalRect,
    theme,
    state.samples,
    state.reconstructedSamples,
    state.showOriginalSignal,
    state.showReconstruction,
    state.showResidual,
    state.showLabels ? label(state.locale, 'Original vs reconstruction', '原始信号与重建') : '',
    state.showLabels
      ? [
          ...(state.showOriginalSignal ? [{ label: label(state.locale, 'original', '原始'), color: theme.primary }] : []),
          ...(state.showReconstruction ? [{ label: label(state.locale, 'reconstruction', '累计重建'), color: theme.warning }] : []),
          ...(state.currentContributionCoefficients.length > 0 ? [{ label: label(state.locale, 'current contribution', '当前新增贡献'), color: theme.highlight, dashed: true }] : []),
          ...(state.showResidual ? [{ label: label(state.locale, 'residual', '残差'), color: theme.secondary, dashed: true }] : []),
        ]
      : [],
    state.showLabels,
    state.currentContributionCoefficients.length > 0
      ? [{ samples: state.currentContributionSamples, color: theme.highlight, width: 2.2, dashed: true }]
      : [],
  )
  if (state.showSpectrum) {
    drawIntegerSpectrumPanel(
      ctx,
      spectrumRect,
      theme,
      state.integerSpectrum,
      state.includedCoefficients,
      state.currentContributionCoefficients,
      state.showLabels ? label(state.locale, 'Coefficients used for reconstruction', '参与重建的系数') : '',
      state.showLabels,
      state.showLabels
        ? [
            ...(state.currentContributionCoefficients.length > 0 ? [{ label: label(state.locale, 'current block', '当前新增'), color: theme.highlight }] : []),
            ...(state.includedCoefficients.length > state.currentContributionCoefficients.length ? [{ label: label(state.locale, 'already included', '此前已加入'), color: theme.warning }] : []),
            { label: label(state.locale, 'not included', '未加入'), color: theme.gridMajor },
          ]
        : [],
    )
  }
}

function drawFilteringLesson(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: DrawState) {
  const gap = 14
  const signalRect = { x: gap, y: gap, width: viewport.width - gap * 2, height: viewport.height * 0.48 }
  const spectrumRect = { x: gap, y: signalRect.y + signalRect.height + gap, width: viewport.width - gap * 2, height: viewport.height - signalRect.height - gap * 3 }
  const comparisonLegend = state.showLabels
    ? [
        ...(state.showOriginalSignal ? [{ label: label(state.locale, 'original', '原始'), color: theme.primary }] : []),
        { label: label(state.locale, 'filtered', '滤波后'), color: theme.warning },
        ...(state.showResidual ? [{ label: label(state.locale, 'residual', '残差'), color: theme.secondary, dashed: true }] : []),
      ]
    : []
  drawComparisonPanel(ctx, signalRect, theme, state.samples, state.filteredSamples, state.showOriginalSignal, true, state.showResidual, state.showLabels ? label(state.locale, 'Original vs filtered signal', '原始信号与滤波结果') : '', comparisonLegend, state.showLabels)
  if (state.showSpectrum) {
    drawFilteredSpectrumPanel(
      ctx,
      spectrumRect,
      theme,
      state.integerSpectrum,
      state.filteredSpectrum,
      state.filterConfig,
      state.showLabels ? label(state.locale, 'Original and filtered spectrum', '原始频谱与滤波后频谱') : '',
      state.showLabels
        ? [
            { label: label(state.locale, 'original', '原始'), color: theme.primary },
            { label: label(state.locale, 'filtered', '滤波后'), color: theme.warning },
          ]
        : [],
      state.showLabels,
    )
  }
}

function drawSignalPanel(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, samples: number[], showSignal: boolean, cursor: number, title: string, showLabels: boolean) {
  drawPanel(ctx, rect, theme, title)
  drawSignalGrid(ctx, rect, theme)
  const amplitudeRange = signalAmplitudeRange(samples)
  drawAmplitudeScale(ctx, rect, theme, amplitudeRange)
  if (showSignal) drawSamples(ctx, rect, samples, theme.primary, 2, false, amplitudeRange)
  drawTimeCursor(ctx, rect, theme, cursor, 1.5)
  drawTimeAxisLabels(ctx, rect, theme, showLabels)
}

type FourierCurve = { samples: number[]; color: string; width: number; dashed: boolean }

function drawComparisonPanel(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, original: number[], comparison: number[], showOriginal: boolean, showComparison: boolean, showResidual: boolean, title: string, legend: FourierLegendItem[] = [], showLabels = true, extraCurves: FourierCurve[] = []) {
  drawPanel(ctx, rect, theme, title)
  const plotTopInset = legend.length > 0 ? 32 + countLegendRows(rect, legend, ctx) * 14 : 28
  drawSignalGrid(ctx, rect, theme, plotTopInset)
  const residual = original.map((value, index) => value - (comparison[index] ?? 0))
  const amplitudeRange = signalAmplitudeRange([
    ...(showOriginal ? original : []),
    ...(showComparison ? comparison : []),
    ...(showResidual ? residual : []),
    ...extraCurves.flatMap((curve) => curve.samples),
  ])
  drawAmplitudeScale(ctx, rect, theme, amplitudeRange)
  if (showOriginal) drawSamples(ctx, rect, original, theme.primary, 2, false, amplitudeRange, plotTopInset)
  if (showComparison) drawSamples(ctx, rect, comparison, theme.warning, 2, false, amplitudeRange, plotTopInset)
  if (showResidual) {
    drawSamples(ctx, rect, residual, theme.secondary, 1.6, true, amplitudeRange, plotTopInset)
  }
  extraCurves.forEach((curve) => drawSamples(ctx, rect, curve.samples, curve.color, curve.width, curve.dashed, amplitudeRange, plotTopInset))
  drawFourierLegend(ctx, rect, theme, legend)
  drawTimeAxisLabels(ctx, rect, theme, showLabels, plotTopInset)
}

function drawWindingPanel(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, state: DrawState) {
  drawPanel(ctx, rect, theme, state.showLabels ? label(state.locale, 'Winding plane', '缠绕平面') : '')
  const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
  const range = Math.max(1.1, ...state.windingPoints.map((point) => Math.hypot(point.point.re, point.point.im))) * 1.18
  const scale = (Math.min(rect.width, rect.height) * 0.42) / range
  ctx.strokeStyle = theme.gridMinor
  ctx.lineWidth = 1
  for (let radius = 0.25; radius <= range; radius += 0.25) {
    ctx.beginPath()
    ctx.arc(center.x, center.y, radius * scale, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.strokeStyle = theme.axis
  ctx.beginPath()
  ctx.moveTo(rect.x + 12, center.y)
  ctx.lineTo(rect.x + rect.width - 12, center.y)
  ctx.moveTo(center.x, rect.y + 12)
  ctx.lineTo(center.x, rect.y + rect.height - 12)
  ctx.stroke()
  if (state.showWindingPath) {
    ctx.strokeStyle = theme.secondary
    ctx.lineWidth = 2
    ctx.beginPath()
    state.windingPoints.forEach((point, index) => {
      const screen = complexToScreen(center, scale, point.point)
      if (index === 0) ctx.moveTo(screen.x, screen.y)
      else ctx.lineTo(screen.x, screen.y)
    })
    ctx.stroke()
  }
  const currentPoint = interpolateWindingPoint(state.windingPoints, state.playhead)
  if (state.showWindingVectors && currentPoint) {
    const tip = complexToScreen(center, scale, currentPoint)
    ctx.strokeStyle = theme.accent
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(center.x, center.y)
    ctx.lineTo(tip.x, tip.y)
    ctx.stroke()
    drawDot(ctx, tip.x, tip.y, theme.accent, 4)
  }
  if (state.showCenterOfMass) {
    const centerOfMass = complexToScreen(center, scale, state.selectedCoefficient.value)
    drawDot(ctx, centerOfMass.x, centerOfMass.y, theme.warning, 6)
    ctx.strokeStyle = theme.warning
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(center.x, center.y)
    ctx.lineTo(centerOfMass.x, centerOfMass.y)
    ctx.stroke()
  }
}

function drawSpectrumPanel(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, spectrum: Spectrum, selectedFrequency: number, logMagnitude: boolean, positiveOnly: boolean, showPhase: boolean, title: string, showLabels: boolean) {
  drawPanel(ctx, rect, theme, title)
  const phaseHeight = showPhase ? rect.height * 0.34 : 0
  const magnitudeRect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height - phaseHeight }
  const phaseRect = { x: rect.x, y: rect.y + magnitudeRect.height, width: rect.width, height: phaseHeight }
  const domain = frequencyDisplayDomain(spectrum.frequencyMin, spectrum.frequencyMax, positiveOnly)
  const coefficients = spectrum.coefficients.filter((coefficient) => axisContains(domain, coefficient.frequency))
  const maxMagnitude = Math.max(...coefficients.map((coefficient) => displayMagnitude(coefficient.magnitude, logMagnitude)), 1e-9)
  const magnitudeLayout = getFrequencyPlotLayout(magnitudeRect, true)
  drawFrequencyGrid(ctx, magnitudeLayout, theme)
  drawSpectrumBars(ctx, magnitudeLayout, theme, coefficients, domain, maxMagnitude, logMagnitude, theme.accent)
  drawFrequencyAxis(ctx, magnitudeLayout, theme, domain, showLabels && !showPhase)
  drawFrequencyMarker(ctx, magnitudeLayout, theme, selectedFrequency, domain, showLabels)
  if (showPhase) {
    drawPhaseGraph(ctx, phaseRect, theme, coefficients, domain, showLabels)
  }
}

function drawIntegerSpectrumPanel(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, spectrum: Spectrum, selected: FourierCoefficient[], current: FourierCoefficient[], title: string, showLabels: boolean, legend: FourierLegendItem[] = []) {
  drawPanel(ctx, rect, theme, title)
  const domain = frequencyDisplayDomain(spectrum.frequencyMin, spectrum.frequencyMax, false)
  const layout = getFrequencyPlotLayout(rect, true)
  if (legend.length > 0) reserveLegendRows(layout, rect, legend, ctx)
  drawFrequencyGrid(ctx, layout, theme)
  const selectedKeys = new Set(selected.map((coefficient) => coefficient.frequency))
  const currentKeys = new Set(current.map((coefficient) => coefficient.frequency))
  const maxMagnitude = Math.max(...spectrum.coefficients.map((coefficient) => coefficient.magnitude), 1e-9)
  spectrum.coefficients.forEach((coefficient) => {
    const x = axisValueToPosition(coefficient.frequency, domain, layout.left, layout.right)
    const barHeight = (coefficient.magnitude / maxMagnitude) * layout.height
    const isCurrent = currentKeys.has(coefficient.frequency)
    const isSelected = selectedKeys.has(coefficient.frequency)
    ctx.strokeStyle = isCurrent ? theme.highlight : isSelected ? theme.warning : theme.gridMajor
    ctx.lineWidth = isCurrent ? 4.5 : isSelected ? 3 : 2
    ctx.beginPath()
    ctx.moveTo(x, layout.base)
    ctx.lineTo(x, layout.base - barHeight)
    ctx.stroke()
  })
  drawFourierLegend(ctx, rect, theme, legend)
  drawFrequencyAxis(ctx, layout, theme, domain, showLabels)
}

function drawFilteredSpectrumPanel(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, original: Spectrum, filtered: Spectrum, filterConfig: FilterConfig, title: string, legend: FourierLegendItem[] = [], showLabels = true) {
  drawPanel(ctx, rect, theme, title)
  const domain = frequencyDisplayDomain(original.frequencyMin, original.frequencyMax, false)
  const layout = getFrequencyPlotLayout(rect, true)
  if (legend.length > 0) reserveLegendRows(layout, rect, legend, ctx)
  drawFrequencyGrid(ctx, layout, theme)
  const maxMagnitude = Math.max(...original.coefficients.map((coefficient) => coefficient.magnitude), 1e-9)
  drawFilterGuide(ctx, layout, theme, domain, filterConfig, maxMagnitude)
  original.coefficients.forEach((coefficient, index) => {
    const x = axisValueToPosition(coefficient.frequency, domain, layout.left, layout.right)
    const originalHeight = (coefficient.magnitude / maxMagnitude) * layout.height
    const filteredHeight = ((filtered.coefficients[index]?.magnitude ?? 0) / maxMagnitude) * layout.height
    ctx.strokeStyle = theme.primary
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, layout.base)
    ctx.lineTo(x, layout.base - originalHeight)
    ctx.stroke()
    ctx.strokeStyle = filteredHeight > 0 ? theme.warning : theme.gridMinor
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x + 3, layout.base)
    ctx.lineTo(x + 3, layout.base - filteredHeight)
    ctx.stroke()
  })
  drawFourierLegend(ctx, rect, theme, legend)
  drawFrequencyAxis(ctx, layout, theme, domain, showLabels)
}

function drawFilterGuide(ctx: CanvasRenderingContext2D, layout: FrequencyPlotLayout, theme: GraphTheme, domain: AxisDomain, config: FilterConfig, maxMagnitude: number) {
  ctx.save()
  ctx.fillStyle = theme.warning
  ctx.globalAlpha = 0.08

  if (config.type === 'magnitude-threshold') {
    const thresholdY = layout.base - Math.min(1, Math.max(0, config.threshold / Math.max(1e-9, maxMagnitude))) * layout.height
    ctx.fillRect(layout.left, layout.top, layout.width, Math.max(0, thresholdY - layout.top))
    ctx.globalAlpha = 0.72
    ctx.strokeStyle = theme.warning
    ctx.lineWidth = 1.3
    ctx.setLineDash([5, 4])
    ctx.beginPath()
    ctx.moveTo(layout.left, thresholdY)
    ctx.lineTo(layout.right, thresholdY)
    ctx.stroke()
    ctx.restore()
    return
  }

  const cutoff = Math.abs(config.cutoff)
  const low = Math.min(Math.abs(config.lowCutoff), Math.abs(config.highCutoff))
  const high = Math.max(Math.abs(config.lowCutoff), Math.abs(config.highCutoff))
  const keptIntervals = config.type === 'low-pass'
    ? [[-cutoff, cutoff]]
    : config.type === 'high-pass'
      ? [[domain.min, -cutoff], [cutoff, domain.max]]
      : config.type === 'band-pass'
        ? [[-high, -low], [low, high]]
        : [[domain.min, -high], [-low, low], [high, domain.max]]

  keptIntervals.forEach(([start, end]) => {
    const clampedStart = Math.max(domain.min, Math.min(domain.max, start))
    const clampedEnd = Math.max(domain.min, Math.min(domain.max, end))
    if (clampedEnd <= clampedStart) return
    const x1 = axisValueToPosition(clampedStart, domain, layout.left, layout.right)
    const x2 = axisValueToPosition(clampedEnd, domain, layout.left, layout.right)
    ctx.fillRect(x1, layout.top, x2 - x1, layout.height)
  })

  const boundaries = config.type === 'low-pass' || config.type === 'high-pass'
    ? [-cutoff, cutoff]
    : [-high, -low, low, high]
  ctx.globalAlpha = 0.68
  ctx.strokeStyle = theme.warning
  ctx.lineWidth = 1.2
  ctx.setLineDash([5, 4])
  ;[...new Set(boundaries.map((value) => Math.abs(value) < 1e-9 ? 0 : value))].forEach((boundary) => {
    if (!axisContains(domain, boundary)) return
    const x = axisValueToPosition(boundary, domain, layout.left, layout.right)
    ctx.beginPath()
    ctx.moveTo(x, layout.top)
    ctx.lineTo(x, layout.base)
    ctx.stroke()
  })
  ctx.restore()
}

type FourierLegendItem = { label: string; color: string; dashed?: boolean }

function reserveLegendRows(layout: FrequencyPlotLayout, rect: Rect, items: FourierLegendItem[], ctx: CanvasRenderingContext2D) {
  const rows = countLegendRows(rect, items, ctx)
  layout.top = Math.min(layout.base - 4, rect.y + 34 + rows * 14)
  layout.height = Math.max(4, layout.base - layout.top)
}

function countLegendRows(rect: Rect, items: FourierLegendItem[], ctx: CanvasRenderingContext2D): number {
  if (items.length === 0) return 0
  ctx.save()
  ctx.font = '10px Inter, system-ui, sans-serif'
  const availableWidth = Math.max(1, rect.width - 20)
  let rows = 1
  let usedWidth = 0
  items.forEach((item) => {
    const itemWidth = 22 + ctx.measureText(item.label).width + 10
    if (usedWidth > 0 && usedWidth + itemWidth > availableWidth) {
      rows += 1
      usedWidth = itemWidth
    } else {
      usedWidth += itemWidth
    }
  })
  ctx.restore()
  return rows
}

function drawFourierLegend(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, items: FourierLegendItem[]) {
  if (!items.length) return
  ctx.save()
  ctx.font = '10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  let x = rect.x + 10
  let y = rect.y + 34
  const right = rect.x + rect.width - 10
  for (const item of items) {
    const itemWidth = 22 + ctx.measureText(item.label).width + 10
    if (x + itemWidth > right && x > rect.x + 10) {
      x = rect.x + 10
      y += 14
    }
    ctx.strokeStyle = item.color
    ctx.lineWidth = 2
    ctx.setLineDash(item.dashed ? [4, 3] : [])
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 14, y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = theme.muted
    ctx.fillText(item.label, x + 18, y)
    x += itemWidth
  }
  ctx.restore()
}

function drawSpectrumBars(ctx: CanvasRenderingContext2D, layout: FrequencyPlotLayout, theme: GraphTheme, coefficients: FourierCoefficient[], domain: AxisDomain, maxMagnitude: number, logMagnitude: boolean, color: string) {
  coefficients.forEach((coefficient) => {
    const x = axisValueToPosition(coefficient.frequency, domain, layout.left, layout.right)
    const value = displayMagnitude(coefficient.magnitude, logMagnitude)
    const barHeight = (value / maxMagnitude) * layout.height
    ctx.strokeStyle = value > maxMagnitude * 0.35 ? color : theme.gridMajor
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, layout.base)
    ctx.lineTo(x, layout.base - barHeight)
    ctx.stroke()
  })
}

function drawPhaseGraph(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, coefficients: FourierCoefficient[], domain: AxisDomain, showLabels: boolean) {
  drawPanel(ctx, rect, theme, '')
  const layout = getFrequencyPlotLayout(rect, false)
  drawFrequencyGrid(ctx, layout, theme)
  ctx.strokeStyle = theme.secondary
  ctx.lineWidth = 1.5
  ctx.beginPath()
  coefficients.forEach((coefficient, index) => {
    const x = axisValueToPosition(coefficient.frequency, domain, layout.left, layout.right)
    const y = mapRange(coefficient.phase, -Math.PI, Math.PI, layout.base, layout.top)
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  drawFrequencyAxis(ctx, layout, theme, domain, showLabels)
}

function drawFrequencyMarker(ctx: CanvasRenderingContext2D, layout: FrequencyPlotLayout, theme: GraphTheme, frequency: number, domain: AxisDomain, showLabel: boolean) {
  if (!axisContains(domain, frequency)) return
  const x = axisValueToPosition(frequency, domain, layout.left, layout.right)
  ctx.strokeStyle = theme.warning
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(x, layout.top)
  ctx.lineTo(x, layout.base)
  ctx.stroke()
  if (!showLabel) return

  const text = `f = ${formatFrequency(frequency)}`
  ctx.save()
  ctx.font = '10px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const paddingX = 5
  const boxHeight = 16
  const boxWidth = ctx.measureText(text).width + paddingX * 2
  const centerX = Math.max(layout.left + boxWidth / 2, Math.min(layout.right - boxWidth / 2, x))
  const boxY = layout.top + 2
  ctx.fillStyle = theme.background
  ctx.fillRect(centerX - boxWidth / 2, boxY, boxWidth, boxHeight)
  ctx.strokeStyle = theme.warning
  ctx.lineWidth = 1
  ctx.strokeRect(centerX - boxWidth / 2, boxY, boxWidth, boxHeight)
  ctx.fillStyle = theme.warning
  ctx.fillText(text, centerX, boxY + boxHeight / 2)
  ctx.restore()
}

function drawPanel(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, title: string) {
  ctx.fillStyle = theme.background
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
  ctx.strokeStyle = theme.gridMajor
  ctx.lineWidth = 1
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
  if (title) {
    ctx.fillStyle = theme.muted
    ctx.font = '12px Inter, system-ui, sans-serif'
    ctx.fillText(title, rect.x + 10, rect.y + 18)
  }
}

type FrequencyPlotLayout = {
  left: number
  right: number
  top: number
  base: number
  width: number
  height: number
}

function getSignalPlotRect(rect: Rect, topInset = 28): Rect {
  const x = rect.x + 10
  const y = rect.y + topInset
  const right = rect.x + rect.width - 10
  const bottom = rect.y + rect.height - 20
  return {
    x,
    y,
    width: Math.max(1, right - x),
    height: Math.max(4, bottom - y),
  }
}

function drawSignalGrid(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, topInset = 28) {
  const plot = getSignalPlotRect(rect, topInset)
  ctx.strokeStyle = theme.gridMinor
  ctx.lineWidth = 1
  for (let index = 1; index < 4; index += 1) {
    const x = plot.x + (plot.width * index) / 4
    ctx.beginPath()
    ctx.moveTo(x, plot.y)
    ctx.lineTo(x, plot.y + plot.height)
    ctx.stroke()
  }
  const midY = plot.y + plot.height / 2
  ctx.strokeStyle = theme.axis
  ctx.beginPath()
  ctx.moveTo(plot.x, midY)
  ctx.lineTo(plot.x + plot.width, midY)
  ctx.stroke()
}

function drawTimeCursor(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, progress: number, width: number, topInset = 28) {
  const plot = getSignalPlotRect(rect, topInset)
  const x = plot.x + clampProgress(progress) * plot.width
  ctx.strokeStyle = theme.accent
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x, plot.y)
  ctx.lineTo(x, plot.y + plot.height)
  ctx.stroke()
}

function drawTimeAxisLabels(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, showLabels: boolean, topInset = 28) {
  if (!showLabels) return
  const plot = getSignalPlotRect(rect, topInset)
  const y = rect.y + rect.height - 5
  const ticks = [
    { value: 0, label: '0', align: 'left' as const },
    { value: 0.5, label: '0.5', align: 'center' as const },
    { value: 1, label: '1', align: 'right' as const },
  ]
  ctx.save()
  ctx.fillStyle = theme.muted
  ctx.font = '10px Inter, system-ui, sans-serif'
  ctx.textBaseline = 'alphabetic'
  ticks.forEach((tick) => {
    ctx.textAlign = tick.align
    ctx.fillText(tick.label, plot.x + tick.value * plot.width, y)
  })
  ctx.restore()
}

function drawSamples(ctx: CanvasRenderingContext2D, rect: Rect, samples: number[], color: string, width: number, dashed: boolean, amplitudeRange: number, topInset = 28) {
  const plot = getSignalPlotRect(rect, topInset)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.setLineDash(dashed ? [6, 4] : [])
  ctx.beginPath()
  samples.forEach((sample, index) => {
    const x = plot.x + (index / Math.max(1, samples.length - 1)) * plot.width
    const y = mapRange(sample, -amplitudeRange, amplitudeRange, plot.y + plot.height, plot.y)
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  ctx.setLineDash([])
}

function getFrequencyPlotLayout(rect: Rect, hasTitle: boolean): FrequencyPlotLayout {
  const left = rect.x + 12
  const right = rect.x + rect.width - 12
  const base = rect.y + rect.height - 18
  const requestedTop = rect.y + (hasTitle ? 28 : 10)
  const top = Math.min(requestedTop, base - 4)
  return {
    left,
    right,
    top,
    base,
    width: Math.max(1, right - left),
    height: Math.max(4, base - top),
  }
}

function drawFrequencyGrid(ctx: CanvasRenderingContext2D, layout: FrequencyPlotLayout, theme: GraphTheme) {
  ctx.strokeStyle = theme.gridMinor
  ctx.lineWidth = 1
  for (let index = 1; index < 4; index += 1) {
    const x = layout.left + (layout.width * index) / 4
    ctx.beginPath()
    ctx.moveTo(x, layout.top)
    ctx.lineTo(x, layout.base)
    ctx.stroke()
  }
  const midY = layout.top + layout.height / 2
  ctx.beginPath()
  ctx.moveTo(layout.left, midY)
  ctx.lineTo(layout.right, midY)
  ctx.stroke()
}

function drawFrequencyAxis(ctx: CanvasRenderingContext2D, layout: FrequencyPlotLayout, theme: GraphTheme, domain: AxisDomain, showLabels: boolean) {
  ctx.save()
  ctx.font = '10px Inter, system-ui, sans-serif'
  const majorTicks = frequencyAxisTicks(domain, layout.width)
  const minorTicks = integerMinorTicks(domain)

  ctx.strokeStyle = theme.axis
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(layout.left, layout.base)
  ctx.lineTo(layout.right, layout.base)
  ctx.stroke()

  ctx.strokeStyle = theme.gridMajor
  minorTicks.forEach((value) => {
    const x = axisValueToPosition(value, domain, layout.left, layout.right)
    ctx.beginPath()
    ctx.moveTo(x, layout.base)
    ctx.lineTo(x, layout.base + 3)
    ctx.stroke()
  })

  ctx.strokeStyle = theme.axis
  majorTicks.forEach((tick) => {
    const x = axisValueToPosition(tick.value, domain, layout.left, layout.right)
    ctx.beginPath()
    ctx.moveTo(x, layout.base)
    ctx.lineTo(x, layout.base + 5)
    ctx.stroke()
  })

  if (showLabels) {
    ctx.fillStyle = theme.muted
    ctx.textBaseline = 'alphabetic'
    majorTicks.forEach((tick) => {
      const x = axisValueToPosition(tick.value, domain, layout.left, layout.right)
      const labelWidth = ctx.measureText(tick.label).width
      ctx.textAlign = x - labelWidth / 2 < layout.left ? 'left' : x + labelWidth / 2 > layout.right ? 'right' : 'center'
      ctx.fillText(tick.label, x, layout.base + 13)
    })
  }
  ctx.restore()
}

function signalAmplitudeRange(samples: number[]): number {
  const maxAbs = samples.reduce((current, sample) => Math.max(current, Math.abs(sample)), 0)
  return Math.min(3, Math.max(1.25, Math.ceil(maxAbs * 4) / 4))
}

function drawAmplitudeScale(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, amplitudeRange: number) {
  ctx.fillStyle = theme.muted
  ctx.font = '11px Inter, system-ui, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`±${formatNumber(amplitudeRange)}`, rect.x + rect.width - 10, rect.y + 18)
  ctx.textAlign = 'left'
}

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

function drawArrow(ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, color: string, width: number) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const length = Math.hypot(to.x - from.x, to.y - from.y)
  const head = Math.min(10, Math.max(5, length * 0.22))
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = width
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  if (length < 2) {
    drawDot(ctx, to.x, to.y, color, Math.max(2.5, width))
    return
  }
  ctx.beginPath()
  ctx.moveTo(to.x, to.y)
  ctx.lineTo(to.x - head * Math.cos(angle - Math.PI / 6), to.y - head * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(to.x - head * Math.cos(angle + Math.PI / 6), to.y - head * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
}

function drawDashedSegment(ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, color: string) {
  ctx.strokeStyle = color
  ctx.lineWidth = 1.1
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawCanvasLabel(ctx: CanvasRenderingContext2D, text: string, point: { x: number; y: number }, color: string, rect: Rect, preferBelow = false) {
  ctx.font = '11px Inter, system-ui, sans-serif'
  const width = ctx.measureText(text).width
  const x = Math.max(rect.x + 6, Math.min(rect.x + rect.width - width - 6, point.x + 7))
  const proposedY = point.y + (preferBelow ? 17 : -9)
  const y = Math.max(rect.y + 34, Math.min(rect.y + rect.height - 20, proposedY))
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.fillText(text, x, y)
}

function complexToScreen(center: { x: number; y: number }, scale: number, point: { re: number; im: number }) {
  return {
    x: center.x + point.re * scale,
    y: center.y - point.im * scale,
  }
}

function getValueRows(state: {
  locale: FourierLocale
  lessonKey: string
  spectrumView: SpectrumView
  selectedFrequency: number
  selectedCoefficient: FourierCoefficient
  frequencyPair: FrequencyPair
  playhead: number
  spectrum: Spectrum
  integerSpectrum: Spectrum
  samples: number[]
  reconstructedSamples: number[]
  filteredSamples: number[]
  includedCoefficients: FourierCoefficient[]
  coefficientCount: number
  reconstructionMode: ReconstructionMode
  filterType: FilterType
  cutoff: number
  lowCutoff: number
  highCutoff: number
  threshold: number
}): FourierValueRow[] {
  const dominant = findDominantPeaks(state.spectrum, 4).map((coefficient) => formatPeakFrequency(coefficient.frequency, state.locale)).join(', ')
  const noValue = state.locale === 'zh' ? '无' : 'none'
  if (state.lessonKey === 'spectrum' && state.spectrumView === 'pair') {
    const frame = computeFrequencyPairFrame(state.frequencyPair, state.playhead)
    const isDc = state.frequencyPair.frequency === 0 || !state.frequencyPair.negative
    return [
      { label: state.locale === 'zh' ? '旋转频率' : 'rotation frequency', value: isDc ? '0' : `±${formatFrequency(state.frequencyPair.frequency)}` },
      { label: 'C(+f)', value: formatComplexValue(state.frequencyPair.positive.value) },
      { label: 'C(-f)', value: state.frequencyPair.negative ? formatComplexValue(state.frequencyPair.negative.value) : (state.locale === 'zh' ? '与 C(0) 重合' : 'same as C(0)') },
      { label: '|C(+f)|', value: formatNumber(state.frequencyPair.positive.magnitude) },
      { label: '|C(-f)|', value: state.frequencyPair.negative ? formatNumber(state.frequencyPair.negative.magnitude) : '—' },
      { label: 't', value: formatNumber(state.playhead) },
      { label: state.locale === 'zh' ? '合成实部' : 'pair real sum', value: formatNumber(frame.sum.re) },
      { label: state.locale === 'zh' ? '剩余虚部' : 'remaining imaginary', value: formatNumber(frame.sum.im) },
    ]
  }
  if (state.lessonKey === 'spectrum') {
    return [
      { label: state.locale === 'zh' ? '频率范围' : 'frequency range', value: formatFrequencyRange(state.spectrum.frequencyMin, state.spectrum.frequencyMax, state.locale) },
      { label: state.locale === 'zh' ? '频率步长' : 'frequency step', value: formatNumber(state.spectrum.frequencyStep) },
      { label: state.locale === 'zh' ? '选中频率' : 'selected frequency', value: formatFrequency(state.selectedFrequency) },
      { label: state.locale === 'zh' ? 'C(f) 实部' : 'Re C(f)', value: formatNumber(state.selectedCoefficient.value.re) },
      { label: state.locale === 'zh' ? 'C(f) 虚部' : 'Im C(f)', value: formatNumber(state.selectedCoefficient.value.im) },
      { label: '|C(f)|', value: formatNumber(state.selectedCoefficient.magnitude) },
      { label: state.locale === 'zh' ? '相位' : 'phase', value: state.locale === 'zh' ? `${formatNumber(state.selectedCoefficient.phase)} 弧度` : `${formatNumber(state.selectedCoefficient.phase)} rad` },
      { label: state.locale === 'zh' ? '主频率' : 'dominant frequencies', value: dominant || noValue },
    ]
  }
  if (state.lessonKey === 'reconstruction') {
    const omitted = findDominantFrequencies({
      ...state.integerSpectrum,
      coefficients: state.integerSpectrum.coefficients.filter((coefficient) => !state.includedCoefficients.some((included) => included.frequency === coefficient.frequency)),
    }, 1)[0]
    return [
      { label: state.reconstructionMode === 'paired-frequency-blocks' ? (state.locale === 'zh' ? '频率块数量' : 'frequency blocks') : (state.locale === 'zh' ? '系数数量' : 'coefficient count'), value: String(state.coefficientCount) },
      { label: state.locale === 'zh' ? '均方误差 MSE' : 'MSE', value: formatNumber(meanSquaredError(state.samples, state.reconstructedSamples)) },
      { label: state.locale === 'zh' ? '最大误差' : 'max error', value: formatNumber(maxAbsError(state.samples, state.reconstructedSamples)) },
      { label: state.locale === 'zh' ? '保留频率' : 'included frequencies', value: state.includedCoefficients.slice(0, 8).map((coefficient) => formatFrequency(coefficient.frequency)).join(', ') || noValue },
      { label: state.locale === 'zh' ? '最大遗漏频率' : 'dominant omitted', value: omitted ? formatFrequency(omitted.frequency) : noValue },
    ]
  }
  return [
    { label: state.locale === 'zh' ? '滤波类型' : 'filter type', value: filterLabel(state.filterType, state.locale) },
    { label: state.locale === 'zh' ? '截止 / 范围' : 'cutoff / range', value: filterValue(state, state.locale) },
    { label: state.locale === 'zh' ? '均方误差 MSE' : 'MSE', value: formatNumber(meanSquaredError(state.samples, state.filteredSamples)) },
    { label: state.locale === 'zh' ? '最大残差' : 'max residual', value: formatNumber(maxAbsError(state.samples, state.filteredSamples)) },
  ]
}

function filterValue(state: { filterType: FilterType; cutoff: number; lowCutoff: number; highCutoff: number; threshold: number }, locale: FourierLocale): string {
  if (state.filterType === 'band-pass' || state.filterType === 'band-stop') return formatFrequencyRange(state.lowCutoff, state.highCutoff, locale)
  if (state.filterType === 'magnitude-threshold') return formatNumber(state.threshold)
  return formatFrequency(state.cutoff)
}

function filterLabel(filterType: FilterType, locale: FourierLocale): string {
  if (locale === 'en') return filterType
  if (filterType === 'low-pass') return '低通'
  if (filterType === 'high-pass') return '高通'
  if (filterType === 'band-pass') return '带通'
  if (filterType === 'band-stop') return '带阻'
  return '幅值阈值'
}

function findDominantPeaks(spectrum: Spectrum, count: number): FourierCoefficient[] {
  const coefficients = spectrum.coefficients.filter((coefficient) => Math.abs(coefficient.frequency) > 1e-9)
  const peaks = coefficients.filter((coefficient, index) => {
    const previous = coefficients[index - 1]?.magnitude ?? -Infinity
    const next = coefficients[index + 1]?.magnitude ?? -Infinity
    return coefficient.magnitude >= previous && coefficient.magnitude >= next
  })
  return [...peaks].sort((a, b) => b.magnitude - a.magnitude).slice(0, Math.max(0, count))
}

function clampSpectrumStep(frequencyMin: number, frequencyMax: number, frequencyStep: number): number {
  const baseStep = Math.max(0.05, Math.abs(frequencyStep))
  const span = Math.abs(frequencyMax - frequencyMin)
  const maxPointsStep = span / 400
  return Math.max(baseStep, maxPointsStep || baseStep)
}

function displayMagnitude(magnitude: number, logMagnitude: boolean): number {
  return logMagnitude ? Math.log10(1 + magnitude * 20) : magnitude
}

function mapRange(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
  const ratio = (value - fromMin) / Math.max(1e-9, fromMax - fromMin)
  return toMin + ratio * (toMax - toMin)
}

function getFourierPresetLabel(preset: SignalPreset, locale: FourierLocale): string {
  return locale === 'zh' ? preset.labelZh ?? preset.label : preset.label
}

function getFourierPresetDescription(preset: SignalPreset, locale: FourierLocale): string {
  return locale === 'zh' ? preset.descriptionZh ?? preset.description : preset.description
}

function getPlaybackLabels(lessonKey: string, playing: boolean, locale: FourierLocale, spectrumView: SpectrumView = 'probe'): { label: string; ariaLabel: string } {
  if (playing) {
    const labelText = locale === 'zh' ? '暂停' : 'Pause'
    return { label: labelText, ariaLabel: labelText }
  }
  if (lessonKey === 'reconstruction') {
    const labelText = locale === 'zh' ? '增加系数' : 'Add coefficients'
    return { label: labelText, ariaLabel: labelText }
  }
  if (lessonKey === 'filtering') {
    const labelText = locale === 'zh' ? '扫过截止频率' : 'Sweep cutoff'
    return { label: labelText, ariaLabel: labelText }
  }
  if (lessonKey === 'spectrum' && spectrumView === 'pair') {
    const labelText = locale === 'zh' ? '播放旋转' : 'Play rotation'
    return { label: labelText, ariaLabel: labelText }
  }
  const labelText = locale === 'zh' ? '扫描频率' : 'Scan frequencies'
  return { label: labelText, ariaLabel: labelText }
}

function getWatchCopy(lessonKey: string, locale: FourierLocale, fallback: string, presetId: string, filterType: FilterType): string {
  if (lessonKey !== 'filtering') return fallback
  if (filterType === 'high-pass') {
    return locale === 'zh'
      ? '高通会削弱慢变化的主体，留下更快的细节和噪声。'
      : 'High-pass filtering weakens slow trends and leaves faster details and noise.'
  }
  if (presetId === 'square-wave') {
    return locale === 'zh'
      ? '低通会让方波的尖角变圆滑，但也可能产生一些波纹。'
      : 'Low-pass filtering rounds the square wave corners, but it can also create ripples.'
  }
  if (presetId === 'noisy-sine') {
    return locale === 'zh'
      ? '较低的截止频率会削弱细小抖动，同时保留主波形。'
      : 'Lower cutoffs weaken small jitter while the main wave remains.'
  }
  return fallback
}

function resetLesson(lessonKey: string, defaultFrequency: number, setSelectedFrequency: (value: number) => void, setCoefficientCount: (value: number) => void, setCutoff: (value: number) => void, setPlayhead: (value: number) => void) {
  setSelectedFrequency(defaultFrequency)
  setCoefficientCount(lessonKey === 'reconstruction' ? 5 : 1)
  setCutoff(lessonKey === 'filtering' ? 5 : 1)
  setPlayhead(0)
}

function defaultPresetForLesson(lessonId: string): string {
  if (lessonId === 'filtering') return 'noisy-sine'
  if (lessonId === 'reconstruction') return 'square-wave'
  return 'sum-of-sines'
}

function isFourierLesson(lessonId: string): lessonId is 'spectrum' | 'reconstruction' | 'filtering' {
  return lessonId === 'spectrum' || lessonId === 'reconstruction' || lessonId === 'filtering'
}

function readInitialPresetParam(fallback: string): string {
  const presetId = readPresetParam(fallback)
  const expression = readParam('f')
  if (!expression || presetId === 'custom') return presetId
  const preset = getFourierPreset(presetId)
  return preset.expression && expression.trim() === preset.expression.trim() ? presetId : 'custom'
}

function readPresetParam(fallback: string): string {
  const raw = readParam('preset')
  if (raw && (raw === 'custom' || fourierPresets.some((preset) => preset.id === raw))) return raw
  return fallback
}

function readReconstructionModeParam(fallback: ReconstructionMode): ReconstructionMode {
  const raw = readParam('mode')
  return isReconstructionMode(raw) ? raw : fallback
}

function isReconstructionMode(value: string | null): value is ReconstructionMode {
  return value === 'paired-frequency-blocks' || value === 'first-harmonics' || value === 'top-magnitudes'
}

function readSpectrumViewParam(): SpectrumView {
  return readParam('view') === 'pair' ? 'pair' : 'probe'
}

function replaceSpectrumViewParam(view: SpectrumView) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (view === 'pair') url.searchParams.set('view', 'pair')
  else url.searchParams.delete('view')
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

function readParam(name: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

function readNumberParam(name: string, fallback: number): number {
  const raw = readParam(name)
  const value = raw === null ? Number.NaN : Number(raw)
  return Number.isFinite(value) ? value : fallback
}

function readBooleanParam(name: string, fallback: boolean): boolean {
  const raw = readParam(name)
  if (raw === 'true') return true
  if (raw === 'false') return false
  return fallback
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function clampPairFrequency(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(30, value))
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return String(round(value))
}

function formatComplexValue(value: { re: number; im: number }): string {
  const sign = value.im < 0 ? '-' : '+'
  return `${formatNumber(value.re)} ${sign} ${formatNumber(Math.abs(value.im))}i`
}

function formatFrequency(value: number): string {
  return String(round(value))
}

function formatFrequencyRange(start: number, end: number, locale: FourierLocale): string {
  return locale === 'zh' ? `${formatFrequency(start)} 到 ${formatFrequency(end)}` : `${formatFrequency(start)} to ${formatFrequency(end)}`
}

function formatPeakFrequency(value: number, locale: FourierLocale): string {
  const nearestInteger = Math.round(value)
  if (nearestInteger !== 0 && Math.abs(value - nearestInteger) <= 0.25) {
    return locale === 'zh' ? `约 ${nearestInteger}` : `near ${nearestInteger}`
  }
  return formatFrequency(value)
}

function label(locale: FourierLocale, en: string, zh: string): string {
  return locale === 'zh' ? zh : en
}

function getFourierCanvasAriaLabel(copy: LessonCopy, locale: FourierLocale, spectrumView: SpectrumView, pair: FrequencyPair): string {
  if (spectrumView !== 'pair') return `${copy.title}. ${copy.what}`
  const pairLabel = pair.frequency === 0 ? '0' : `±${formatFrequency(pair.frequency)}`
  const negativeMagnitude = pair.negative?.magnitude ?? pair.positive.magnitude
  return locale === 'zh'
    ? `${copy.title}。当前两根反向箭头的旋转频率 ${pairLabel}；正频率幅值 ${formatNumber(pair.positive.magnitude)}，负频率幅值 ${formatNumber(negativeMagnitude)}。${copy.what}`
    : `${copy.title}. The two opposite arrows currently rotate at ${pairLabel}; positive magnitude ${formatNumber(pair.positive.magnitude)}, negative magnitude ${formatNumber(negativeMagnitude)}. ${copy.what}`
}

function getFourierConventionCopy(lessonKey: string, spectrumView: SpectrumView, locale: FourierLocale): string {
  if (lessonKey === 'spectrum' && spectrumView === 'pair') {
    return locale === 'zh'
      ? '约定：分析时 C(f) 使用负指数；这里重建时用正指数加回来。对真实信号 C(-f)=C(f)*，因此两根箭头的虚部相消。非整数 f 只表示当前连续频率测试得到的一对系数。'
      : 'Convention: analysis uses a negative exponent in C(f), while this reconstruction adds components back with a positive exponent. For a real signal C(-f)=C(f)*, so the arrows cancel in the imaginary direction. Non-integer f denotes one pair from the continuous frequency test.'
  }
  return locale === 'zh'
    ? '约定：t 在 [0,1]，N 是采样数，n 是采样点编号。f=1 表示整段信号绕一圈，f=3 表示绕三圈，f=-3 表示反方向绕三圈。公式里的负号规定分析时的旋转方向；重建时用相反方向加回来。'
    : 'Convention: t is in [0,1], N is the sample count, and n is the sample index. f=1 means one turn, f=3 means three turns, and f=-3 turns the opposite way. The minus sign sets the analysis rotation direction; reconstruction adds components back with the opposite sign.'
}

function translateFourierError(message: string, locale: FourierLocale): string {
  if (locale === 'en') return message
  const functionDenied = message.match(/^Function "(.+)" is not allowed\.$/)
  if (functionDenied) return `函数“${functionDenied[1]}”不可用。`
  const variableDenied = message.match(/^Variable "(.+)" is not allowed\.$/)
  if (variableDenied) return `变量“${variableDenied[1]}”不可用。`
  const unsupported = message.match(/^Unsupported token "(.+)"\.$/)
  if (unsupported) return `不支持符号“${unsupported[1]}”。`
  return fourierCopy.zh.ui.invalidExpression
}
