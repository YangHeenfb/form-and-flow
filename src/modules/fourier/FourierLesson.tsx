import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CircleHelp, Pause, Play, RotateCcw } from 'lucide-react'
import { GraphCanvas } from '../../core/graph2d/GraphCanvas.tsx'
import type { GraphTheme, GraphViewport } from '../../core/graph2d/GraphCanvas.tsx'
import { Formula } from '../../core/ui/Formula.tsx'
import { HelpTrigger, LearningDrawer, TermButton, type HelpTopic } from '../../core/ui/LearningHelp.tsx'
import { expressionToTex } from '../../core/ui/mathNotation.ts'
import { SelectMenu } from '../../core/ui/SelectMenu.tsx'
import type { Locale } from '../../i18n.ts'
import { LessonStageActions } from '../../platform/LessonStageActions.tsx'
import { ModuleFocusFrame } from '../../platform/ModuleFocusFrame.tsx'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { calculusFunctionNames, completeBareFunctionInput, normalizeMathInput } from '../calculus/shared/mathInput.ts'
import type { FilterConfig, FilterType, FourierCoefficient, ReconstructionMode, Spectrum, WindingPoint } from './fourierTypes.ts'
import { compileFourierExpression, fourierPresets, getFourierPreset, sampleFourierExpression, sampleFourierPreset, type SignalPreset } from './fourierPresets.ts'
import { applyFilter } from './math/filters.ts'
import { computeCoefficientAtFrequency, computeIntegerSpectrum, computeSpectrum, computeWindingPoints, findDominantFrequencies, selectPairedFrequencyBlocks, selectTopCoefficients } from './math/fourier.ts'
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

type ValueRow = {
  label: string
  value: string
}

type SamplesResult = {
  samples: number[]
  error: string | null
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
  windingPoints: WindingPoint[]
  selectedFrequency: number
  selectedCoefficient: FourierCoefficient
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
    share: string
    exportPng: string
    play: string
    pause: string
    reset: string
    seeing: string
    why: string
    formula: string
    values: string
    watch: string
    beginnerHelp: string
    controlHelp: string
    graphHelp: string
    closeHelp: string
    display: string
    spectrum: string
    reconstruction: string
    filtering: string
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
      lesson: 'Lesson',
      share: 'Share',
      exportPng: 'Export PNG',
      play: 'Play',
      pause: 'Pause',
      reset: 'Reset animation',
      seeing: 'What you are seeing',
      why: 'Why it matters',
      formula: 'Current formula',
      values: 'Current values',
      watch: 'Watch for',
      beginnerHelp: 'Beginner explanation',
      controlHelp: 'Control help',
      graphHelp: 'Read the graph',
      closeHelp: 'Close explanation',
      display: 'Display',
      spectrum: 'Spectrum',
      reconstruction: 'Reconstruction',
      filtering: 'Filtering',
      controls: {
        frequency: 'frequency',
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
        what: 'A spectrum is the result of testing many frequencies and measuring how far each average point moves from the center.',
        why: 'Large peaks mean that frequency is strong. Real signals often show mirror peaks at +f and -f because those are two rotation directions.',
        formula: '|C(f)| = |1/N sum x[n]e^{-i2πfn/N}|',
        formulaTex: '|C(f)|=\\left|\\frac{1}{N}\\sum_{n=0}^{N-1}x[n]e^{-i2\\pi fn/N}\\right|',
        watch: 'For this signal, look for strong responses near 1 and 3. Because we observe one finite slice, peaks can spread around those values instead of appearing as only one bar.',
      },
      reconstruction: {
        title: 'Signal Reconstruction',
        what: 'Reconstruction adds selected frequency components back together. Each coefficient behaves like a small wave with strength and phase.',
        why: 'In this sampled experiment, a complete set of frequency coefficients can recover the original samples. Keeping only some coefficients gives an approximation.',
        formula: 'x̂(t)=Σ C(f)e^{i2πft}',
        formulaTex: '\\hat{x}(t)=\\sum_f C(f)e^{i2\\pi ft}',
        watch: 'Smooth signals usually need fewer frequencies. Sharp corners or jumps need many more.',
      },
      filtering: {
        title: 'Frequency Filtering',
        what: 'Filtering first keeps or weakens chosen parts of the spectrum, then rebuilds the signal from what remains.',
        why: 'Low-pass keeps slow changes and reduces fast detail, which often smooths noise. High-pass keeps fast detail and weakens slow trends.',
        formula: 'filtered x̂(t)=Σ H(f)C(f)e^{i2πft}',
        formulaTex: '\\hat{x}_{filtered}(t)=\\sum_f H(f)C(f)e^{i2\\pi ft}',
        watch: 'Move the cutoff and compare which frequencies remain in the lower spectrum.',
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
      lesson: '章节',
      share: '分享',
      exportPng: '导出 PNG',
      play: '播放',
      pause: '暂停',
      reset: '重置动画',
      seeing: '你正在看到什么',
      why: '为什么重要',
      formula: '当前公式',
      values: '当前数值',
      watch: '注意观察',
      beginnerHelp: '新手解释',
      controlHelp: '控件说明',
      graphHelp: '怎么看图',
      closeHelp: '关闭解释',
      display: '显示',
      spectrum: '频谱',
      reconstruction: '重建',
      filtering: '滤波',
      controls: {
        frequency: '频率',
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
        snap: '吸附整数',
        original: '原始信号',
        windingPath: '缠绕路径',
        vectors: '旋转向量',
        center: '平均点',
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
        what: '频谱是很多次“频率测试”的结果：每个频率都会产生一个平均点，柱子的高度表示平均点离中心有多远。',
        why: '柱子越高，说明这个频率在原信号里越明显。对真实信号，常常会同时看到 +f 和 -f 两个镜像峰，它们表示两个相反方向的旋转。',
        formula: '|C(f)| = |1/N Σ x[n]e^{-i2πfn/N}|',
        formulaTex: '|C(f)|=\\left|\\frac{1}{N}\\sum_{n=0}^{N-1}x[n]e^{-i2\\pi fn/N}\\right|',
        watch: '对这个信号，你会在 1 和 3 附近看到强响应。因为我们只观察有限长度的一段曲线，峰可能会在附近扩散，而不是只出现在一个柱子上。',
      },
      reconstruction: {
        title: '信号重建',
        what: '重建就是把选中的频率成分重新叠回去。每个傅里叶系数都像一个小波：大小决定它有多强，角度决定它从哪里开始。',
        why: '在这个离散采样的实验里，如果保留完整的一组频率系数，就可以恢复原来的样本。只保留一部分系数时，得到的是近似重建。',
        formula: 'x̂(t)=Σ C(f)e^{i2πft}',
        formulaTex: '\\hat{x}(t)=\\sum_f C(f)e^{i2\\pi ft}',
        watch: '平滑信号通常需要较少频率；尖角或跳跃需要更多频率。',
      },
      filtering: {
        title: '频率滤波',
        what: '滤波不是直接在时间曲线上擦掉东西，而是先在频谱里保留或削弱某些频率，再把剩下的频率叠回去。',
        why: '低通保留慢变化，削弱快变化，所以常用来平滑噪声。高通保留快变化，削弱慢趋势，所以常用来突出边缘或细节。',
        formula: '滤波后 x̂(t)=Σ H(f)C(f)e^{i2πft}',
        formulaTex: '\\hat{x}_{\\text{滤波}}(t)=\\sum_f H(f)C(f)e^{i2\\pi ft}',
        watch: '移动截止频率，观察下方频谱里哪些频率被保留，再看上方信号怎样变化。',
      },
    },
  },
}

export function FourierLesson({ lessonId }: Props) {
  const { locale } = usePlatformLocale()
  const lessonKey = isFourierLesson(lessonId) ? lessonId : 'spectrum'
  const copy = fourierCopy[locale].lessons[lessonKey]
  const ui = fourierCopy[locale].ui
  const [presetId, setPresetId] = useState(() => readInitialPresetParam(defaultPresetForLesson(lessonKey)))
  const selectedPreset = getFourierPreset(presetId === 'custom' ? defaultPresetForLesson(lessonKey) : presetId)
  const selectedPresetLabel = getFourierPresetLabel(selectedPreset, locale)
  const selectedPresetDescription = getFourierPresetDescription(selectedPreset, locale)
  const [expression, setExpression] = useState(() => readParam('f') ?? selectedPreset.expression ?? 'sin(2*pi*t)')
  const [sampleCount, setSampleCount] = useState(() => readNumberParam('samples', 512))
  const [selectedFrequency, setSelectedFrequency] = useState(() => readNumberParam('freq', selectedPreset.defaultFrequency))
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
  const activeHelpTopic = helpMode ? getFourierHelpTopic(helpMode, lessonKey, locale) : null

  useEffect(() => {
    if (presetId === 'custom') return
    const preset = getFourierPreset(presetId)
    setExpression(preset.expression ?? preset.label)
    setSelectedFrequency(preset.defaultFrequency)
  }, [presetId])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let previous = performance.now()
    const tick = (now: number) => {
      const delta = Math.min(80, now - previous)
      previous = now
      if (lessonKey === 'spectrum') {
        setSelectedFrequency((value) => {
          const span = Math.max(1, frequencyMax - frequencyMin)
          const next = value + delta * 0.0009 * playbackSpeed * span
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
  }, [frequencyMax, frequencyMin, lessonKey, maxHarmonic, playbackSpeed, playing, reconstructionMode])

  const roundedSampleCount = clampInteger(sampleCount, 64, 1024)
  const roundedMaxHarmonic = clampInteger(maxHarmonic, 1, 80)
  const reconstructionCountMax = reconstructionMode === 'paired-frequency-blocks' ? roundedMaxHarmonic + 1 : roundedMaxHarmonic * 2 + 1
  const reconstructionCount = clampInteger(coefficientCount, 1, reconstructionCountMax)
  const reconstructionCountLabel = reconstructionMode === 'paired-frequency-blocks' ? ui.controls.frequencyBlocks : ui.controls.coefficientCount
  const samplesResult = useMemo<SamplesResult>(() => {
    if (presetId !== 'custom') {
      return { samples: sampleFourierPreset(presetId, roundedSampleCount), error: null }
    }
    try {
      compileFourierExpression(expression)
      return { samples: sampleFourierExpression(expression, roundedSampleCount), error: null }
    } catch (caught) {
      return {
        samples: sampleFourierPreset(defaultPresetForLesson(lessonKey), roundedSampleCount),
        error: caught instanceof Error ? translateFourierError(caught.message, locale) : ui.invalidExpression,
      }
    }
  }, [expression, lessonKey, locale, presetId, roundedSampleCount, ui.invalidExpression])

  const safeFrequencyStep = clampSpectrumStep(frequencyMin, frequencyMax, frequencyStep)
  const spectrum = useMemo(() => computeSpectrum(samplesResult.samples, frequencyMin, frequencyMax, safeFrequencyStep), [frequencyMax, frequencyMin, safeFrequencyStep, samplesResult.samples])
  const integerSpectrum = useMemo(() => computeIntegerSpectrum(samplesResult.samples, roundedMaxHarmonic), [roundedMaxHarmonic, samplesResult.samples])
  const selectedCoefficient = useMemo(() => computeCoefficientAtFrequency(samplesResult.samples, selectedFrequency), [samplesResult.samples, selectedFrequency])
  const windingPoints = useMemo(() => computeWindingPoints(samplesResult.samples, selectedFrequency), [samplesResult.samples, selectedFrequency])
  const includedCoefficients = useMemo(
    () => selectReconstructionCoefficients(integerSpectrum.coefficients, reconstructionMode, reconstructionCount),
    [integerSpectrum.coefficients, reconstructionCount, reconstructionMode],
  )
  const reconstructedSamples = useMemo(() => reconstructSamples(includedCoefficients, roundedSampleCount), [includedCoefficients, roundedSampleCount])
  const filterConfig = useMemo<FilterConfig>(
    () => ({ type: filterType, cutoff, lowCutoff, highCutoff, threshold }),
    [cutoff, filterType, highCutoff, lowCutoff, threshold],
  )
  const filteredSpectrum = useMemo(() => applyFilter(integerSpectrum, filterConfig), [filterConfig, integerSpectrum])
  const filteredSamples = useMemo(() => reconstructSamples(filteredSpectrum.coefficients, roundedSampleCount), [filteredSpectrum.coefficients, roundedSampleCount])
  const displayedExpression = presetId !== 'custom' && !selectedPreset.expression ? selectedPresetLabel : expression
  const expressionTex = useMemo(
    () => (presetId !== 'custom' && !selectedPreset.expression ? selectedPreset.tex : expressionToTex(expression)),
    [expression, presetId, selectedPreset.expression, selectedPreset.tex],
  )
  const values = getValueRows({
    locale,
    lessonKey,
    selectedFrequency,
    selectedCoefficient,
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
  const spectrumClamped = Math.abs(safeFrequencyStep - Math.max(0.05, Math.abs(frequencyStep))) > 1e-9

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
        windingPoints,
        selectedFrequency,
        selectedCoefficient,
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
      includedCoefficients,
      integerSpectrum,
      lessonKey,
      locale,
      logMagnitude,
      playhead,
      positiveOnly,
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
      windingPoints,
    ],
  )

  const share = () => {
    const params = new URLSearchParams()
    params.set('preset', presetId)
    params.set('f', expression)
    params.set('freq', String(round(selectedFrequency)))
    params.set('samples', String(roundedSampleCount))
    params.set('snap', String(frequencySnap))
    params.set('fmin', String(round(frequencyMin)))
    params.set('fmax', String(round(frequencyMax)))
    params.set('fstep', String(round(frequencyStep)))
    params.set('harmonic', String(Math.round(maxHarmonic)))
    params.set('count', String(reconstructionCount))
    params.set('mode', reconstructionMode)
    params.set('filter', filterType)
    params.set('cutoff', String(round(cutoff)))
    params.set('low', String(round(lowCutoff)))
    params.set('high', String(round(highCutoff)))
    params.set('threshold', String(round(threshold)))
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
    void navigator.clipboard?.writeText(url)
  }

  const exportPng = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('.fourier-canvas')
    if (!canvas) return
    const anchor = document.createElement('a')
    anchor.href = canvas.toDataURL('image/png')
    anchor.download = `fourier-${lessonKey}.png`
    anchor.click()
  }
  const playback = getPlaybackLabels(lessonKey, playing, locale)

  return (
    <>
    <ModuleFocusFrame>
      {({ focusButton }) => (
    <section className="fourier-lesson">
      <aside className="fourier-controls platform-card">
        <div className="calculus-learning-entry learning-help-entry">
          <HelpTrigger onClick={() => setHelpMode({ kind: 'beginner' })} ariaLabel={ui.beginnerHelp}>
            {ui.beginnerHelp}
          </HelpTrigger>
        </div>
        <h2>{ui.signal}</h2>
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

        {lessonKey === 'spectrum' && (
          <ControlGroup title={ui.spectrum} onHelp={() => setHelpMode({ kind: 'control', group: 'spectrum' })} helpAriaLabel={controlHelpAria(ui.controlHelp, ui.spectrum)}>
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
          <Toggle label={ui.toggles.windingPath} checked={showWindingPath} onChange={setShowWindingPath} />
          <Toggle label={ui.toggles.vectors} checked={showWindingVectors} onChange={setShowWindingVectors} />
          <Toggle label={ui.toggles.center} checked={showCenterOfMass} onChange={setShowCenterOfMass} />
          <Toggle label={ui.toggles.spectrum} checked={showSpectrum} onChange={setShowSpectrum} />
          <Toggle label={ui.toggles.reconstruction} checked={showReconstruction} onChange={setShowReconstruction} />
          <Toggle label={ui.toggles.residual} checked={showResidual} onChange={setShowResidual} />
          <Toggle label={ui.toggles.labels} checked={showLabels} onChange={setShowLabels} />
        </ControlGroup>
      </aside>

      <main className="fourier-main">
        <div className="fourier-title-row">
          <div>
            <p className="eyebrow">{ui.lesson}</p>
            <h1>{copy.title}</h1>
          </div>
        </div>
        <div className="graph-help-stage">
          <GraphCanvas
            className="graph-canvas fourier-canvas"
            ariaLabel={`${copy.title}. ${copy.what}`}
            xMin={0}
            xMax={1}
            yMin={-1.25}
            yMax={1.25}
            draw={draw}
          />
          <LessonStageActions
            graphLabel={ui.graphHelp}
            graphAriaLabel={ui.graphHelp}
            onGraphHelp={() => setHelpMode({ kind: 'graph' })}
            focusButton={focusButton}
            shareLabel={ui.share}
            onShare={share}
            exportLabel={ui.exportPng}
            onExport={exportPng}
          />
        </div>
        <div className="fourier-playback platform-card">
          <div className="transport-buttons">
            <button type="button" className="primary-button" aria-label={playback.ariaLabel} onClick={() => setPlaying((current) => !current)}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
              {playback.label}
            </button>
            <button type="button" onClick={() => resetLesson(lessonKey, selectedPreset.defaultFrequency, setSelectedFrequency, setCoefficientCount, setCutoff, setPlayhead)}>
              <RotateCcw size={16} />
              {ui.reset}
            </button>
          </div>
          <Range label={ui.controls.speed} value={playbackSpeed} min={0.25} max={3} step={0.05} valueSuffix="x" onChange={setPlaybackSpeed} />
        </div>
      </main>

      <aside className="fourier-explanation platform-card">
        <h2>{ui.seeing}</h2>
        <p>{renderFourierWhat(lessonKey, locale, copy.what, (term) => setHelpMode({ kind: 'term', term }))}</p>
        <h2>{ui.why}</h2>
        <p>{copy.why}</p>
        <h2>{ui.formula}</h2>
        <p className="formula-text formula-card">
          <Formula tex={copy.formulaTex} block label={copy.formula} />
        </p>
        <p className="input-help">
          {locale === 'zh'
            ? '约定：t 在 [0,1]，N 是采样数，n 是采样点编号。f=1 表示整段信号绕一圈，f=3 表示绕三圈，f=-3 表示反方向绕三圈。公式里的负号规定分析时的旋转方向；重建时用相反方向加回来。'
            : 'Convention: t is in [0,1], N is the sample count, and n is the sample index. f=1 means one turn, f=3 means three turns, and f=-3 turns the opposite way. The minus sign sets the analysis rotation direction; reconstruction adds components back with the opposite sign.'}
        </p>
        <h2>{ui.values}</h2>
        <dl>
          {values.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        <h2>{ui.watch}</h2>
        <p>{getWatchCopy(lessonKey, locale, copy.watch, presetId, filterType)}</p>
      </aside>
    </section>
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="fourier-toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
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

function renderFourierWhat(lessonId: string, locale: FourierLocale, fallback: string, onTerm: (term: FourierTermId) => void): ReactNode {
  const term = (id: FourierTermId, labelText: string) => (
    <TermButton key={id} onClick={() => onTerm(id)}>
      {labelText}
    </TermButton>
  )

  if (lessonId === 'spectrum') {
    return locale === 'zh' ? (
      <>
        {term('spectrum', '频谱')} 是很多次“频率测试”的结果；每个测试 {term('frequency', '频率')} 都会产生一个 {term('coefficient', '系数')}，柱子越高代表平均点越偏离中心。
      </>
    ) : (
      <>
        The {term('spectrum', 'spectrum')} comes from many frequency tests. Each test {term('frequency', 'frequency')} creates a {term('coefficient', 'coefficient')}, and taller bars mean the average point moved farther from the center.
      </>
    )
  }

  if (lessonId === 'reconstruction') {
    return locale === 'zh' ? (
      <>
        {term('reconstruction', '重建')} 会把选中的傅里叶系数重新相加。默认模式会尽量成对保留 +f 和 -f，让真实信号的重建更自然。
      </>
    ) : (
      <>
        {term('reconstruction', 'Reconstruction')} adds selected Fourier coefficients back together. The default mode keeps +f and -f pairs together so real-signal reconstruction stays natural.
      </>
    )
  }

  if (lessonId === 'filtering') {
    return locale === 'zh' ? (
      <>
        {term('filtering', '滤波')} 会保留或移除某些频率成分。你看到的是改变 {term('spectrum', '频谱')} 后，时间信号怎样跟着改变。
      </>
    ) : (
      <>
        {term('filtering', 'Filtering')} keeps or removes frequency components. You are seeing how changing the {term('spectrum', 'spectrum')} changes the time signal.
      </>
    )
  }

  return fallback
}

function getFourierHelpTopic(mode: FourierHelpMode, lessonId: string, locale: FourierLocale): HelpTopic {
  if (mode.kind === 'term') return fourierTermTopic(mode.term, locale)
  if (mode.kind === 'control') return fourierControlTopic(mode.group, locale)
  if (mode.kind === 'graph') return fourierGraphTopic(lessonId, locale)
  return fourierBeginnerTopic(locale)
}

function fourierBeginnerTopic(locale: FourierLocale): HelpTopic {
  if (locale === 'zh') {
    return {
      eyebrow: '从零开始',
      title: '傅里叶想回答什么',
      summary: '傅里叶变换想回答：这条曲线可以看成哪些“节奏”叠出来？',
      sections: [
        {
          title: '测试一个频率',
          body: '先选一个测试频率 f，把每个时间点的信号高度当作从中心伸出的长度，再让这根长度按 f 的速度旋转。旋转后，所有点会形成一团点云。',
        },
        {
          title: '看平均点',
          body: '如果测试频率和信号里的某个节奏对得上，点云通常不会平均抵消，平均位置会离开中心。平均位置离中心越远，说明这个频率越明显。',
        },
        {
          title: '得到频谱',
          body: '对很多个 f 重复这个测试，就得到频谱。频谱上的峰值告诉你哪些频率最能解释这条曲线。',
        },
        {
          title: '负频率不是错误',
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
    eyebrow: 'Start from zero',
    title: 'What Fourier is asking',
    summary: 'Fourier analysis asks which rhythms can be added together to make this curve.',
    sections: [
      {
        title: 'Test one frequency',
        body: 'Pick a test frequency f. Treat each signal height as a length from the center, then rotate that length at speed f. The rotated points form a point cloud.',
      },
      {
        title: 'Watch the average point',
        body: 'If the test frequency matches a rhythm in the signal, the point cloud usually does not cancel evenly, so its average moves away from the center. Farther from the center means a clearer frequency.',
      },
      {
        title: 'Build the spectrum',
        body: 'Repeat the test for many values of f and you get a spectrum. Peaks show which frequencies explain the curve best.',
      },
      {
        title: 'Negative frequency is not an error',
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
        eyebrow: '控件说明',
        title: '采样数',
        summary: '采样数决定用多少个时间点代表这条连续曲线。',
        sections: [
          {
            title: '它改变什么',
            items: [
              '采样数越高，我们用来做频率测试的点越多，平均点、频谱和重建结果通常更稳定。',
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
        eyebrow: '控件说明',
        title: '频谱扫描',
        summary: '这里改变的是“怎么测试频率”和“怎么显示频谱”，不会改变原信号本身。',
        sections: [
          {
            title: '测试频率',
            items: [
              '频率是当前测试频率。它不会改变原信号，只改变我们用什么速度把信号绕起来。',
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
        eyebrow: '控件说明',
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
        eyebrow: '控件说明',
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
        eyebrow: '控件说明',
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
              '平均点显示当前测试频率的傅里叶系数。它离中心越远，说明当前测试频率越明显。',
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
      eyebrow: 'Control help',
      title: 'Samples',
      summary: 'Samples controls how many time points represent the curve.',
      sections: [
        {
          title: 'What it changes',
          items: [
            'Higher sample counts give the frequency test more points, so the average point, spectrum, and reconstruction are usually more stable.',
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
      eyebrow: 'Control help',
      title: 'Spectrum scan',
      summary: 'This group changes how frequencies are tested and displayed; it does not change the original signal.',
      sections: [
        {
          title: 'Test frequency',
          items: [
            'Frequency is the current test frequency. It does not change the original signal; it changes how fast we wind the signal.',
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
      eyebrow: 'Control help',
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
      eyebrow: 'Control help',
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
      eyebrow: 'Control help',
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
            'Center of mass shows the average point, which is the Fourier coefficient for the current test frequency.',
            'These winding toggles matter most on the spectrum page; on reconstruction and filtering pages, some toggles simply preserve the same display preferences.',
          ],
        },
      ],
    },
  }
  return topics[group]
}

function fourierGraphTopic(lessonId: string, locale: FourierLocale): HelpTopic {
  if (lessonId === 'reconstruction') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '重建图像读法',
          summary: '上方比较原信号和重建信号，下方显示当前用来重建的频率系数。',
          sections: [
            { title: '上方曲线', body: '原信号和重建信号越贴近，说明当前保留的频率越能解释原信号。残差打开后会显示两者差多少。' },
            { title: '下方柱子', body: '被选中的系数参与重建。保留更多系数通常更像原信号，但也更复杂。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read reconstruction',
          summary: 'The top compares the original and reconstructed signals; the bottom shows which coefficients are being used.',
          sections: [
            { title: 'Top curves', body: 'The closer the curves are, the more the selected frequencies explain the original. Turning on residual shows the difference.' },
            { title: 'Bottom bars', body: 'Selected coefficients are included in the reconstruction. More coefficients usually improve the match but add complexity.' },
          ],
        }
  }

  if (lessonId === 'filtering') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '滤波图像读法',
          summary: '上方显示滤波前后的信号，下方显示哪些频率被保留或削弱。',
          sections: [
            { title: '上方曲线', body: '如果高频被移除，尖角和噪声通常会变平滑；如果低频被移除，慢变化的趋势会变弱。' },
            { title: '下方频谱', body: '被保留的频率仍然有柱子；被滤掉的频率会变低或消失。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read filtering',
          summary: 'The top shows before/after signals; the bottom shows which frequencies remain or are reduced.',
          sections: [
            { title: 'Top curves', body: 'Removing high frequencies usually smooths corners and noise. Removing low frequencies weakens slow trends.' },
            { title: 'Bottom spectrum', body: 'Kept frequencies still have bars; removed frequencies shrink or disappear.' },
          ],
        }
  }

  return locale === 'zh'
    ? {
        eyebrow: '怎么看图',
        title: '频谱图像读法',
        summary: '先看原始信号，再看缠绕平面，最后看平均点或频谱峰值。',
        sections: [
          { title: '时间信号', body: '上方曲线是原始信号。频率滑块改变的是测试频率，不是原始信号本身。' },
          { title: '缠绕平面', body: '每个信号高度会变成一根从中心伸出的长度，再按测试频率旋转。高度会变，所以点不一定落在同一个圆上。点云如果明显偏向一边，说明当前测试频率和信号里的某个节奏对上了。' },
          { title: '平均点 / 频谱', body: '平均点离中心越远，当前频率越强。频谱把很多测试频率的结果排成柱状图，峰值就是主要频率。' },
        ],
      }
    : {
        eyebrow: 'Read the graph',
        title: 'How to read the spectrum',
        summary: 'Read the original signal first, then the winding plane, then the average point or spectrum peaks.',
        sections: [
          { title: 'Time signal', body: 'The top curve is the original signal. The frequency slider changes the test frequency, not the signal itself.' },
          { title: 'Winding plane', body: 'Each signal height becomes a length from the center and rotates at the test frequency. Because the height changes, the points do not have to sit on one circle. If the point cloud leans strongly to one side, the test frequency matches a rhythm in the signal.' },
          { title: 'Average point / spectrum', body: 'The farther the average point is from the center, the stronger that frequency is. A spectrum repeats this test for many frequencies and plots the results as bars.' },
        ],
      }
}

function fourierTermTopic(term: FourierTermId, locale: FourierLocale): HelpTopic {
  const zh: Record<FourierTermId, HelpTopic> = {
    winding: {
      eyebrow: '术语',
      title: '缠绕',
      summary: '缠绕就是：把每个时间点的信号高度当作从中心伸出的长度，再让这根长度按测试频率旋转。',
      sections: [{ title: '为什么不总在圆上', body: '如果 x(t) 不恒定，半径会跟着高度变化；如果 x(t) 是负数，长度会指向相反方向。所以缠绕后的图不一定落在同一个圆上。匹配的频率会让点云偏向一边，不匹配的频率通常会互相抵消。' }],
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
      summary: '傅里叶系数 C(f) 是某个频率 f 的平均点。',
      sections: [{ title: '读法', body: '系数的大小表示这个频率有多强；系数的角度表示相位。注意：这里画的是复数傅里叶系数的大小，不一定等于原波形上的峰值高度。对真实信号，一个频率常常分成 +f 和 -f 两个镜像部分；振幅为 1 的正弦波，在双边频谱里可能显示成两个高度约为 0.5 的峰。' }],
    },
    'center-of-mass': {
      eyebrow: '术语',
      title: '平均点',
      summary: '平均点是缠绕后所有点的平均位置。',
      sections: [{ title: '直觉', body: '如果点云围绕中心均匀分布，平均点接近原点；如果点云偏向一边，平均点会被拉过去。' }],
    },
    spectrum: {
      eyebrow: '术语',
      title: '频谱',
      summary: '频谱是把很多频率的系数大小排在一起的图。',
      sections: [{ title: '怎么看', body: '峰值表示强频率。多个峰值说明信号由多个主要频率混合而成。对真实信号，+f 和 -f 经常成对出现；只看正频率会让图更简单，但也隐藏一半镜像信息。' }],
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
      summary: '重建是把选中的频率成分加回去，合成一个近似原信号。',
      sections: [{ title: '为什么重要', body: '在这个离散采样实验里，如果保留完整的一组频率系数，就能恢复原来的样本；只保留一部分时，得到的是近似。如果只用少数频率就能重建得很好，说明原信号的主要结构可以被这些频率解释。' }],
    },
    filtering: {
      eyebrow: '术语',
      title: '滤波',
      summary: '滤波是有选择地保留或移除频率。',
      sections: [{ title: '例子', body: '低通保留慢变化、削弱快变化；高通保留快变化、削弱慢趋势。' }],
    },
  }

  const en: Record<FourierTermId, HelpTopic> = {
    winding: {
      eyebrow: 'Term',
      title: 'Winding',
      summary: 'Winding treats each signal height as a length from the center, then rotates that length at the test frequency.',
      sections: [{ title: 'Why it is not always one circle', body: 'If x(t) changes, the radius changes with it. If x(t) is negative, the length points the opposite way. A matching frequency pulls the point cloud to one side; a non-matching frequency tends to cancel around the center.' }],
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
      summary: 'The Fourier coefficient C(f) is the average point for frequency f.',
      sections: [{ title: 'How to read it', body: 'Its magnitude is frequency strength. Its angle is phase. This magnitude is not always the same as the peak height in the original waveform. For a real sine wave, the strength is often split between +f and -f; amplitude 1 can appear as two mirror peaks of about 0.5 each.' }],
    },
    'center-of-mass': {
      eyebrow: 'Term',
      title: 'Average point',
      summary: 'The average point is the mean position of all wound points.',
      sections: [{ title: 'Intuition', body: 'If the point cloud is balanced around the center, the average is near zero. If it leans to one side, the average is pulled away.' }],
    },
    spectrum: {
      eyebrow: 'Term',
      title: 'Spectrum',
      summary: 'A spectrum lines up the coefficient magnitudes for many frequencies.',
      sections: [{ title: 'How to read it', body: 'Peaks are strong frequencies. Multiple peaks mean the signal mixes multiple main frequencies. For real signals, +f and -f often appear as mirror peaks; positive-only view simplifies the graph but hides half of that mirror.' }],
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
      summary: 'Reconstruction adds selected frequency components back together to approximate the original signal.',
      sections: [{ title: 'Why it matters', body: 'In this sampled experiment, keeping the complete set of frequency coefficients can recover the original samples. Keeping only part of the set gives an approximation. If a few frequencies reconstruct the signal well, those frequencies explain most of its structure.' }],
    },
    filtering: {
      eyebrow: 'Term',
      title: 'Filtering',
      summary: 'Filtering selectively keeps or removes frequencies.',
      sections: [{ title: 'Examples', body: 'Low-pass keeps slow changes and reduces fast changes. High-pass keeps fast changes and reduces slow trends.' }],
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
  if (state.lessonId === 'spectrum') drawSpectrumLesson(ctx, viewport, theme, state)
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
  drawSignalPanel(ctx, signalRect, theme, state.samples, true, state.playhead, state.showLabels ? label(state.locale, 'Time signal', '时间信号') : '')
  if (state.showSpectrum) drawSpectrumPanel(ctx, spectrumRect, theme, state.spectrum, state.selectedFrequency, state.logMagnitude, state.positiveOnly, state.showPhase, state.showLabels ? label(state.locale, 'Magnitude spectrum', '幅值频谱') : '')
  drawWindingPanel(ctx, windingRect, theme, state)
}

function drawReconstructionLesson(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: DrawState) {
  const gap = 14
  const signalRect = { x: gap, y: gap, width: viewport.width - gap * 2, height: viewport.height * 0.6 }
  const spectrumRect = { x: gap, y: signalRect.y + signalRect.height + gap, width: viewport.width - gap * 2, height: viewport.height - signalRect.height - gap * 3 }
  drawComparisonPanel(ctx, signalRect, theme, state.samples, state.reconstructedSamples, state.showOriginalSignal, state.showReconstruction, state.showResidual, state.showLabels ? label(state.locale, 'Original vs reconstruction', '原始信号与重建') : '')
  if (state.showSpectrum) drawIntegerSpectrumPanel(ctx, spectrumRect, theme, state.integerSpectrum, state.includedCoefficients, state.showLabels ? label(state.locale, 'Selected coefficients', '选中的系数') : '')
}

function drawFilteringLesson(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: DrawState) {
  const gap = 14
  const signalRect = { x: gap, y: gap, width: viewport.width - gap * 2, height: viewport.height * 0.48 }
  const spectrumRect = { x: gap, y: signalRect.y + signalRect.height + gap, width: viewport.width - gap * 2, height: viewport.height - signalRect.height - gap * 3 }
  drawComparisonPanel(ctx, signalRect, theme, state.samples, state.filteredSamples, state.showOriginalSignal, true, state.showResidual, state.showLabels ? label(state.locale, 'Original vs filtered signal', '原始信号与滤波结果') : '')
  if (state.showSpectrum) drawFilteredSpectrumPanel(ctx, spectrumRect, theme, state.integerSpectrum, state.filteredSpectrum, state.showLabels ? label(state.locale, 'Original and filtered spectrum', '原始频谱与滤波后频谱') : '')
}

function drawSignalPanel(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, samples: number[], showSignal: boolean, cursor: number, title: string) {
  drawPanel(ctx, rect, theme, title)
  drawGridLines(ctx, rect, theme)
  if (showSignal) drawSamples(ctx, rect, samples, theme.primary, 2, false)
  const x = rect.x + cursor * rect.width
  ctx.strokeStyle = theme.accent
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(x, rect.y + 8)
  ctx.lineTo(x, rect.y + rect.height - 8)
  ctx.stroke()
}

function drawComparisonPanel(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, original: number[], comparison: number[], showOriginal: boolean, showComparison: boolean, showResidual: boolean, title: string) {
  drawPanel(ctx, rect, theme, title)
  drawGridLines(ctx, rect, theme)
  if (showOriginal) drawSamples(ctx, rect, original, theme.primary, 2, false)
  if (showComparison) drawSamples(ctx, rect, comparison, theme.warning, 2, false)
  if (showResidual) {
    const residual = original.map((value, index) => value - (comparison[index] ?? 0))
    drawSamples(ctx, rect, residual, theme.secondary, 1.6, true)
  }
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
  const current = state.windingPoints[Math.min(state.windingPoints.length - 1, Math.floor(state.playhead * state.windingPoints.length))] ?? state.windingPoints[0]
  if (state.showWindingVectors && current) {
    const tip = complexToScreen(center, scale, current.point)
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

function drawSpectrumPanel(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, spectrum: Spectrum, selectedFrequency: number, logMagnitude: boolean, positiveOnly: boolean, showPhase: boolean, title: string) {
  drawPanel(ctx, rect, theme, title)
  const phaseHeight = showPhase ? rect.height * 0.34 : 0
  const magnitudeRect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height - phaseHeight }
  const phaseRect = { x: rect.x, y: rect.y + magnitudeRect.height, width: rect.width, height: phaseHeight }
  const coefficients = spectrum.coefficients.filter((coefficient) => !positiveOnly || coefficient.frequency >= 0)
  const maxMagnitude = Math.max(...coefficients.map((coefficient) => displayMagnitude(coefficient.magnitude, logMagnitude)), 1e-9)
  drawSpectrumBars(ctx, magnitudeRect, theme, coefficients, maxMagnitude, logMagnitude, theme.accent)
  drawFrequencyMarker(ctx, magnitudeRect, theme, selectedFrequency, spectrum.frequencyMin, spectrum.frequencyMax)
  if (showPhase) {
    drawPhaseGraph(ctx, phaseRect, theme, coefficients, spectrum.frequencyMin, spectrum.frequencyMax)
  }
}

function drawIntegerSpectrumPanel(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, spectrum: Spectrum, selected: FourierCoefficient[], title: string) {
  drawPanel(ctx, rect, theme, title)
  const selectedKeys = new Set(selected.map((coefficient) => coefficient.frequency))
  const maxMagnitude = Math.max(...spectrum.coefficients.map((coefficient) => coefficient.magnitude), 1e-9)
  spectrum.coefficients.forEach((coefficient) => {
    const x = mapRange(coefficient.frequency, spectrum.frequencyMin, spectrum.frequencyMax, rect.x + 14, rect.x + rect.width - 14)
    const base = rect.y + rect.height - 18
    const barHeight = (coefficient.magnitude / maxMagnitude) * (rect.height - 42)
    ctx.strokeStyle = selectedKeys.has(coefficient.frequency) ? theme.warning : theme.gridMajor
    ctx.lineWidth = selectedKeys.has(coefficient.frequency) ? 3 : 2
    ctx.beginPath()
    ctx.moveTo(x, base)
    ctx.lineTo(x, base - barHeight)
    ctx.stroke()
  })
}

function drawFilteredSpectrumPanel(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, original: Spectrum, filtered: Spectrum, title: string) {
  drawPanel(ctx, rect, theme, title)
  const maxMagnitude = Math.max(...original.coefficients.map((coefficient) => coefficient.magnitude), 1e-9)
  original.coefficients.forEach((coefficient, index) => {
    const x = mapRange(coefficient.frequency, original.frequencyMin, original.frequencyMax, rect.x + 14, rect.x + rect.width - 14)
    const base = rect.y + rect.height - 18
    const originalHeight = (coefficient.magnitude / maxMagnitude) * (rect.height - 42)
    const filteredHeight = ((filtered.coefficients[index]?.magnitude ?? 0) / maxMagnitude) * (rect.height - 42)
    ctx.strokeStyle = theme.gridMajor
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, base)
    ctx.lineTo(x, base - originalHeight)
    ctx.stroke()
    ctx.strokeStyle = filteredHeight > 0 ? theme.accent : theme.gridMinor
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x + 3, base)
    ctx.lineTo(x + 3, base - filteredHeight)
    ctx.stroke()
  })
}

function drawSpectrumBars(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, coefficients: FourierCoefficient[], maxMagnitude: number, logMagnitude: boolean, color: string) {
  drawGridLines(ctx, rect, theme)
  coefficients.forEach((coefficient) => {
    const x = mapRange(coefficient.frequency, coefficients[0]?.frequency ?? -10, coefficients[coefficients.length - 1]?.frequency ?? 10, rect.x + 12, rect.x + rect.width - 12)
    const base = rect.y + rect.height - 18
    const value = displayMagnitude(coefficient.magnitude, logMagnitude)
    const barHeight = (value / maxMagnitude) * (rect.height - 42)
    ctx.strokeStyle = coefficient.magnitude > maxMagnitude * 0.35 ? color : theme.gridMajor
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, base)
    ctx.lineTo(x, base - barHeight)
    ctx.stroke()
  })
}

function drawPhaseGraph(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, coefficients: FourierCoefficient[], frequencyMin: number, frequencyMax: number) {
  drawPanel(ctx, rect, theme, '')
  ctx.strokeStyle = theme.secondary
  ctx.lineWidth = 1.5
  ctx.beginPath()
  coefficients.forEach((coefficient, index) => {
    const x = mapRange(coefficient.frequency, frequencyMin, frequencyMax, rect.x + 12, rect.x + rect.width - 12)
    const y = mapRange(coefficient.phase, -Math.PI, Math.PI, rect.y + rect.height - 10, rect.y + 10)
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
}

function drawFrequencyMarker(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme, frequency: number, frequencyMin: number, frequencyMax: number) {
  const x = mapRange(frequency, frequencyMin, frequencyMax, rect.x + 12, rect.x + rect.width - 12)
  ctx.strokeStyle = theme.warning
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(x, rect.y + 10)
  ctx.lineTo(x, rect.y + rect.height - 10)
  ctx.stroke()
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

function drawGridLines(ctx: CanvasRenderingContext2D, rect: Rect, theme: GraphTheme) {
  ctx.strokeStyle = theme.gridMinor
  ctx.lineWidth = 1
  for (let index = 1; index < 4; index += 1) {
    const x = rect.x + (rect.width * index) / 4
    ctx.beginPath()
    ctx.moveTo(x, rect.y + 8)
    ctx.lineTo(x, rect.y + rect.height - 8)
    ctx.stroke()
  }
  const midY = rect.y + rect.height / 2
  ctx.strokeStyle = theme.axis
  ctx.beginPath()
  ctx.moveTo(rect.x + 8, midY)
  ctx.lineTo(rect.x + rect.width - 8, midY)
  ctx.stroke()
}

function drawSamples(ctx: CanvasRenderingContext2D, rect: Rect, samples: number[], color: string, width: number, dashed: boolean) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.setLineDash(dashed ? [6, 4] : [])
  ctx.beginPath()
  samples.forEach((sample, index) => {
    const x = rect.x + 10 + (index / Math.max(1, samples.length - 1)) * (rect.width - 20)
    const y = mapRange(sample, -1.25, 1.25, rect.y + rect.height - 12, rect.y + 12)
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  ctx.setLineDash([])
}

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

function complexToScreen(center: { x: number; y: number }, scale: number, point: { re: number; im: number }) {
  return {
    x: center.x + point.re * scale,
    y: center.y - point.im * scale,
  }
}

function selectReconstructionCoefficients(coefficients: FourierCoefficient[], mode: ReconstructionMode, count: number): FourierCoefficient[] {
  if (mode === 'paired-frequency-blocks') return selectPairedFrequencyBlocks(coefficients, count)
  if (mode === 'first-harmonics') {
    const harmonic = Math.max(0, Math.floor(count / 2))
    return coefficients.filter((coefficient) => Math.abs(coefficient.frequency) <= harmonic)
  }
  return selectTopCoefficients(coefficients, count)
}

function getValueRows(state: {
  locale: FourierLocale
  lessonKey: string
  selectedFrequency: number
  selectedCoefficient: FourierCoefficient
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
}): ValueRow[] {
  const dominant = findDominantPeaks(state.spectrum, 4).map((coefficient) => formatPeakFrequency(coefficient.frequency, state.locale)).join(', ')
  const noValue = state.locale === 'zh' ? '无' : 'none'
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

function getPlaybackLabels(lessonKey: string, playing: boolean, locale: FourierLocale): { label: string; ariaLabel: string } {
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
      ? '试着调低截止频率：细小抖动会被削弱，主波形会留下来。'
      : 'Try lowering the cutoff: small jitter weakens while the main wave remains.'
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

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return String(round(value))
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
