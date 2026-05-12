import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Download, Pause, Play, RotateCcw, Share2 } from 'lucide-react'
import { GraphCanvas } from '../../core/graph2d/GraphCanvas.tsx'
import type { GraphTheme, GraphViewport } from '../../core/graph2d/GraphCanvas.tsx'
import { Formula } from '../../core/ui/Formula.tsx'
import { HelpTrigger, LearningDrawer, TermButton, type HelpTopic } from '../../core/ui/LearningHelp.tsx'
import { expressionToTex } from '../../core/ui/mathNotation.ts'
import { SelectMenu } from '../../core/ui/SelectMenu.tsx'
import type { Locale } from '../../i18n.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { calculusFunctionNames, completeBareFunctionInput, normalizeMathInput } from '../calculus/shared/mathInput.ts'
import type { FilterConfig, FilterType, FourierCoefficient, ReconstructionMode, Spectrum, WindingPoint } from './fourierTypes.ts'
import { compileFourierExpression, fourierPresets, getFourierPreset, sampleFourierExpression, sampleFourierPreset } from './fourierPresets.ts'
import { applyFilter } from './math/filters.ts'
import { computeCoefficientAtFrequency, computeIntegerSpectrum, computeSpectrum, computeWindingPoints, findDominantFrequencies, selectTopCoefficients } from './math/fourier.ts'
import { maxAbsError, meanSquaredError, reconstructSamples } from './math/reconstruction.ts'

type Props = {
  lessonId: string
}

type FourierLocale = Locale
type FourierTermId = 'winding' | 'frequency' | 'coefficient' | 'center-of-mass' | 'spectrum' | 'phase' | 'reconstruction' | 'filtering'
type FourierHelpMode = { kind: 'beginner' } | { kind: 'graph' } | { kind: 'term'; term: FourierTermId }

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
      reset: 'Reset',
      seeing: 'What you are seeing',
      why: 'Why it matters',
      formula: 'Current formula',
      values: 'Current values',
      watch: 'Watch for',
      beginnerHelp: 'Beginner explanation',
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
        what: 'The spectrum is built by trying many winding frequencies and measuring the size of the average point.',
        why: 'Large peaks mean the signal contains a strong component at that frequency.',
        formula: '|C(f)| = |average of x(t)e^{-i2πft}|',
        formulaTex: '|C(f)|=\\left|\\operatorname{avg}\\left(x(t)e^{-i2\\pi ft}\\right)\\right|',
        watch: 'A signal made from sin(2πt) and sin(6πt) should create peaks near frequencies 1 and 3.',
      },
      reconstruction: {
        title: 'Signal Reconstruction',
        what: 'The reconstructed signal is built by adding rotating frequency components back together.',
        why: 'Fourier analysis is reversible when enough coefficients are kept.',
        formula: 'x̂(t)=Σ C(f)e^{i2πft}',
        formulaTex: '\\hat{x}(t)=\\sum_f C(f)e^{i2\\pi ft}',
        watch: 'Smooth signals usually need fewer frequencies. Sharp corners or jumps need many more.',
      },
      filtering: {
        title: 'Frequency Filtering',
        what: 'The filter keeps some frequency components and removes or reduces others.',
        why: 'Changing the spectrum changes the signal. Smooth filtering usually removes high-frequency detail; high-pass filtering removes slow trends.',
        formula: 'filtered x̂(t)=Σ H(f)C(f)e^{i2πft}',
        formulaTex: '\\hat{x}_{filtered}(t)=\\sum_f H(f)C(f)e^{i2\\pi ft}',
        watch: 'Low-pass filtering a square wave smooths the corners.',
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
      reset: '重置',
      seeing: '你正在看到什么',
      why: '为什么重要',
      formula: '当前公式',
      values: '当前数值',
      watch: '注意观察',
      beginnerHelp: '新手解释',
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
        what: '频谱来自不断尝试不同缠绕频率，并记录平均点的大小。',
        why: '峰值越大，说明信号在该频率上的成分越强。',
        formula: '|C(f)| = |average of x(t)e^{-i2πft}|',
        formulaTex: '|C(f)|=\\left|\\operatorname{avg}\\left(x(t)e^{-i2\\pi ft}\\right)\\right|',
        watch: '由 sin(2πt) 和 sin(6πt) 组成的信号，应该在 1 和 3 附近出现峰值。',
      },
      reconstruction: {
        title: '信号重建',
        what: '重建信号是把旋转的频率成分重新相加得到的。',
        why: '保留足够多的系数时，Fourier 分析可以反向合成原信号。',
        formula: 'x̂(t)=Σ C(f)e^{i2πft}',
        formulaTex: '\\hat{x}(t)=\\sum_f C(f)e^{i2\\pi ft}',
        watch: '平滑信号通常需要较少频率；尖角或跳跃需要更多频率。',
      },
      filtering: {
        title: '频率滤波',
        what: '滤波器会保留某些频率成分，并移除或削弱其它成分。',
        why: '改变频谱就会改变信号；低通通常移除高频细节，高通会移除缓慢趋势。',
        formula: 'filtered x̂(t)=Σ H(f)C(f)e^{i2πft}',
        formulaTex: '\\hat{x}_{filtered}(t)=\\sum_f H(f)C(f)e^{i2\\pi ft}',
        watch: '对方波做低通滤波时，尖角会变得更圆滑。',
      },
    },
  },
}

export function FourierLesson({ lessonId }: Props) {
  const { locale } = usePlatformLocale()
  const lessonKey = isFourierLesson(lessonId) ? lessonId : 'spectrum'
  const copy = fourierCopy[locale].lessons[lessonKey]
  const ui = fourierCopy[locale].ui
  const [presetId, setPresetId] = useState(() => readPresetParam(defaultPresetForLesson(lessonKey)))
  const selectedPreset = getFourierPreset(presetId === 'custom' ? defaultPresetForLesson(lessonKey) : presetId)
  const [expression, setExpression] = useState(() => readParam('f') ?? selectedPreset.expression ?? 'sin(2*pi*t)')
  const [sampleCount, setSampleCount] = useState(() => readNumberParam('samples', 512))
  const [selectedFrequency, setSelectedFrequency] = useState(() => readNumberParam('freq', selectedPreset.defaultFrequency))
  const [frequencySnap, setFrequencySnap] = useState(() => readBooleanParam('snap', false))
  const [frequencyMin, setFrequencyMin] = useState(() => readNumberParam('fmin', -10))
  const [frequencyMax, setFrequencyMax] = useState(() => readNumberParam('fmax', 10))
  const [frequencyStep, setFrequencyStep] = useState(() => readNumberParam('fstep', 0.1))
  const [maxHarmonic, setMaxHarmonic] = useState(() => readNumberParam('harmonic', lessonKey === 'filtering' ? 40 : 20))
  const [coefficientCount, setCoefficientCount] = useState(() => readNumberParam('count', 5))
  const [reconstructionMode, setReconstructionMode] = useState<ReconstructionMode>(() => (readParam('mode') as ReconstructionMode) ?? 'top-magnitudes')
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
          const next = value + delta * 0.012 * playbackSpeed
          return next > maxHarmonic * 2 + 1 ? 1 : next
        })
      }
      if (lessonKey === 'filtering') {
        setCutoff((value) => {
          const next = value + delta * 0.004 * playbackSpeed
          return next > maxHarmonic ? 0 : next
        })
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [frequencyMax, frequencyMin, lessonKey, maxHarmonic, playbackSpeed, playing])

  const roundedSampleCount = clampInteger(sampleCount, 64, 1024)
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
  const integerSpectrum = useMemo(() => computeIntegerSpectrum(samplesResult.samples, clampInteger(maxHarmonic, 1, 80)), [maxHarmonic, samplesResult.samples])
  const selectedCoefficient = useMemo(() => computeCoefficientAtFrequency(samplesResult.samples, selectedFrequency), [samplesResult.samples, selectedFrequency])
  const windingPoints = useMemo(() => computeWindingPoints(samplesResult.samples, selectedFrequency), [samplesResult.samples, selectedFrequency])
  const includedCoefficients = useMemo(
    () => selectReconstructionCoefficients(integerSpectrum.coefficients, reconstructionMode, Math.round(coefficientCount)),
    [coefficientCount, integerSpectrum.coefficients, reconstructionMode],
  )
  const reconstructedSamples = useMemo(() => reconstructSamples(includedCoefficients, roundedSampleCount), [includedCoefficients, roundedSampleCount])
  const filterConfig = useMemo<FilterConfig>(
    () => ({ type: filterType, cutoff, lowCutoff, highCutoff, threshold }),
    [cutoff, filterType, highCutoff, lowCutoff, threshold],
  )
  const filteredSpectrum = useMemo(() => applyFilter(integerSpectrum, filterConfig), [filterConfig, integerSpectrum])
  const filteredSamples = useMemo(() => reconstructSamples(filteredSpectrum.coefficients, roundedSampleCount), [filteredSpectrum.coefficients, roundedSampleCount])
  const expressionTex = useMemo(() => expressionToTex(expression), [expression])
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
    coefficientCount: Math.round(coefficientCount),
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
    params.set('count', String(Math.round(coefficientCount)))
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

  return (
    <>
    <section className="fourier-lesson">
      <aside className="fourier-controls platform-card">
        <h2>{ui.signal}</h2>
        <label>
          {ui.preset}
          <SelectMenu
            value={presetId}
            options={[
              { value: 'custom', textValue: ui.customSignal, label: <Formula tex="x(t)" label={ui.customSignal} /> },
              ...fourierPresets.map((preset) => ({
                value: preset.id,
                textValue: preset.label,
                label: <Formula tex={preset.tex} label={preset.label} />,
              })),
            ]}
            onChange={setPresetId}
            ariaLabel={ui.preset}
          />
        </label>
        <label>
          <Formula tex="x(t)" />
          <input
            value={expression}
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
          <Formula tex={`x(t)=${expressionTex}`} label={`${ui.formulaPreview}: x(t)=${expression}`} />
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
        {selectedPreset.description && presetId !== 'custom' && <p className="input-help">{selectedPreset.description}</p>}
        {samplesResult.error && <p className="warning-text">{samplesResult.error}</p>}
        <Range label={ui.controls.sampleCount} value={roundedSampleCount} min={64} max={1024} step={64} onChange={setSampleCount} />

        {lessonKey === 'spectrum' && (
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
          </>
        )}

        {lessonKey === 'spectrum' && (
          <ControlGroup title={ui.spectrum}>
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
          <ControlGroup title={ui.reconstruction}>
            <Range label={ui.controls.maxHarmonic} value={maxHarmonic} min={4} max={50} step={1} onChange={setMaxHarmonic} />
            <label>
              {ui.controls.mode}
              <SelectMenu<ReconstructionMode>
                value={reconstructionMode}
                options={[
                  { value: 'top-magnitudes', textValue: locale === 'zh' ? '最大幅值' : 'top magnitudes', label: locale === 'zh' ? '最大幅值' : 'top magnitudes' },
                  { value: 'first-harmonics', textValue: locale === 'zh' ? '前 N 个谐波' : 'first N harmonics', label: locale === 'zh' ? '前 N 个谐波' : 'first N harmonics' },
                ]}
                onChange={setReconstructionMode}
                ariaLabel={ui.controls.mode}
              />
            </label>
            <Range label={ui.controls.coefficientCount} value={coefficientCount} min={1} max={maxHarmonic * 2 + 1} step={1} onChange={setCoefficientCount} />
          </ControlGroup>
        )}

        {lessonKey === 'filtering' && (
          <ControlGroup title={ui.filtering}>
            <Range label={ui.controls.maxHarmonic} value={maxHarmonic} min={8} max={80} step={1} onChange={setMaxHarmonic} />
            <label>
              {ui.controls.filterType}
              <SelectMenu<FilterType>
                value={filterType}
                options={[
                  { value: 'low-pass', textValue: 'low-pass', label: locale === 'zh' ? '低通' : 'low-pass' },
                  { value: 'high-pass', textValue: 'high-pass', label: locale === 'zh' ? '高通' : 'high-pass' },
                  { value: 'band-pass', textValue: 'band-pass', label: locale === 'zh' ? '带通' : 'band-pass' },
                  { value: 'band-stop', textValue: 'band-stop', label: locale === 'zh' ? '带阻' : 'band-stop' },
                  { value: 'magnitude-threshold', textValue: 'magnitude threshold', label: locale === 'zh' ? '幅值阈值' : 'magnitude threshold' },
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

        <ControlGroup title={ui.display}>
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
          <div className="fourier-actions">
            <HelpTrigger onClick={() => setHelpMode({ kind: 'beginner' })} ariaLabel={ui.beginnerHelp}>
              {ui.beginnerHelp}
            </HelpTrigger>
            <button type="button" onClick={share}>
              <Share2 size={16} />
              {ui.share}
            </button>
            <button type="button" onClick={exportPng}>
              <Download size={16} />
              {ui.exportPng}
            </button>
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
          <HelpTrigger variant="graph" onClick={() => setHelpMode({ kind: 'graph' })} ariaLabel={ui.graphHelp}>
            {ui.graphHelp}
          </HelpTrigger>
        </div>
        <div className="fourier-playback platform-card">
          <button type="button" onClick={() => setPlaying(true)}>
            <Play size={16} />
            {ui.play}
          </button>
          <button type="button" onClick={() => setPlaying(false)}>
            <Pause size={16} />
            {ui.pause}
          </button>
          <button type="button" onClick={() => resetLesson(lessonKey, selectedPreset.defaultFrequency, setSelectedFrequency, setCoefficientCount, setCutoff, setPlayhead)}>
            <RotateCcw size={16} />
            {ui.reset}
          </button>
          <Range label={ui.controls.speed} value={playbackSpeed} min={0.25} max={3} step={0.25} onChange={setPlaybackSpeed} />
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
            ? '约定：t 在 [0,1]，f=1 表示整个区间绕一圈；负号只是 Fourier 变换的常用约定。'
            : 'Convention: t is in [0,1], f=1 means one turn across the domain, and the minus sign is a standard transform convention.'}
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
        <p>{copy.watch}</p>
      </aside>
    </section>
    <LearningDrawer topic={activeHelpTopic} closeLabel={ui.closeHelp} onClose={() => setHelpMode(null)} />
    </>
  )
}

function Range({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label>
      {label}: <strong>{round(value)}</strong>
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

function ControlGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="fourier-control-group">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

function renderFourierWhat(lessonId: string, locale: FourierLocale, fallback: string, onTerm: (term: FourierTermId) => void): ReactNode {
  const term = (id: FourierTermId, labelText: string) => (
    <TermButton key={id} onClick={() => onTerm(id)}>
      {labelText}
    </TermButton>
  )

  if (lessonId === 'winding') {
    return locale === 'zh' ? (
      <>
        这里把信号高度拿去做 {term('winding', '缠绕')}：测试某个 {term('frequency', '频率')} 时，信号会绕着原点旋转，{term('center-of-mass', '平均点')} 会告诉你这个频率有多明显。
      </>
    ) : (
      <>
        This view {term('winding', 'winds')} the signal: for a test {term('frequency', 'frequency')}, the signal rotates around the origin and the {term('center-of-mass', 'average point')} reveals how strongly that frequency appears.
      </>
    )
  }

  if (lessonId === 'spectrum') {
    return locale === 'zh' ? (
      <>
        {term('spectrum', '频谱')} 是通过尝试很多个缠绕频率得到的；每个频率都会产生一个 {term('coefficient', '系数')}，柱子越高代表这个频率越强。
      </>
    ) : (
      <>
        The {term('spectrum', 'spectrum')} comes from trying many winding frequencies. Each frequency creates a {term('coefficient', 'coefficient')}, and taller bars mean stronger frequency content.
      </>
    )
  }

  if (lessonId === 'reconstruction') {
    return locale === 'zh' ? (
      <>
        {term('reconstruction', '重建')} 会把选中的 Fourier 系数重新相加，观察只保留少数 {term('frequency', '频率')} 时还能多像原信号。
      </>
    ) : (
      <>
        {term('reconstruction', 'Reconstruction')} adds selected Fourier coefficients back together, showing how much of the original signal remains when you keep only some {term('frequency', 'frequencies')}.
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
  if (mode.kind === 'graph') return fourierGraphTopic(lessonId, locale)
  return fourierBeginnerTopic(locale)
}

function fourierBeginnerTopic(locale: FourierLocale): HelpTopic {
  if (locale === 'zh') {
    return {
      eyebrow: '从零开始',
      title: 'Fourier 为什么要把信号缠绕起来',
      summary: 'Fourier 变换想回答：一个信号里藏着哪些频率？缠绕是一种把“频率是否匹配”变成几何偏移的方法。',
      sections: [
        {
          title: '先把信号当作一串高度',
          body: (
            <>
              在时间轴上，信号是 {formula('x(t)')} 的高度变化。单看波形时，多个频率混在一起，不一定容易分辨。
            </>
          ),
        },
        {
          title: '为什么要缠绕',
          body: '选择一个测试频率 f，把信号绕着圆旋转。如果这个 f 和信号里的某个节奏对得上，绕出来的点会偏向某个方向；如果对不上，点通常会分散并互相抵消。',
        },
        {
          title: '平均点就是线索',
          body: (
            <>
              平均点对应 Fourier 系数 {formula('C(f)')}。它离原点越远，说明频率 f 越强；它的角度对应相位，也就是这个频率成分的时间偏移。
            </>
          ),
        },
        {
          title: '从缠绕到频谱',
          body: '对很多个 f 重复这个过程，就得到频谱。频谱上的峰值告诉你信号主要由哪些频率组成。',
        },
      ],
    }
  }

  return {
    eyebrow: 'Start from zero',
    title: 'Why Fourier winds a signal',
    summary: 'Fourier analysis asks which frequencies are hidden in a signal. Winding turns frequency matching into a visible geometric offset.',
    sections: [
      {
        title: 'Start with signal heights',
        body: (
          <>
            On the time axis, the signal is the changing height {formula('x(t)')}. When several frequencies are mixed, the waveform alone can be hard to read.
          </>
        ),
      },
      {
        title: 'Why wind it',
        body: 'Pick a test frequency f and rotate the signal around a circle. If f matches a rhythm inside the signal, the wound points lean toward one side. If it does not match, the points tend to spread out and cancel.',
      },
      {
        title: 'The average point is the clue',
        body: (
          <>
            The average point is the Fourier coefficient {formula('C(f)')}. Its distance from the origin is strength; its angle is phase, or timing offset.
          </>
        ),
      },
      {
        title: 'From winding to spectrum',
        body: 'Repeat this for many values of f and you get a spectrum. Peaks show the frequencies that dominate the signal.',
      },
    ],
  }
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
        title: lessonId === 'winding' ? '缠绕图像读法' : '频谱图像读法',
        summary: '先看原始信号，再看缠绕平面，最后看平均点或频谱峰值。',
        sections: [
          { title: '时间信号', body: '上方曲线是原始信号。频率滑块改变的是测试频率，不是原始信号本身。' },
          { title: '缠绕平面', body: '信号被绕到圆周附近。点云如果明显偏向一边，说明当前测试频率和信号里的某个节奏对上了。' },
          { title: '平均点 / 频谱', body: '平均点离中心越远，当前频率越强。频谱把很多测试频率的结果排成柱状图，峰值就是主要频率。' },
        ],
      }
    : {
        eyebrow: 'Read the graph',
        title: lessonId === 'winding' ? 'How to read winding' : 'How to read the spectrum',
        summary: 'Read the original signal first, then the winding plane, then the average point or spectrum peaks.',
        sections: [
          { title: 'Time signal', body: 'The top curve is the original signal. The frequency slider changes the test frequency, not the signal itself.' },
          { title: 'Winding plane', body: 'The signal is wrapped around the origin. If the point cloud leans strongly to one side, the test frequency matches a rhythm in the signal.' },
          { title: 'Average point / spectrum', body: 'The farther the average point is from the center, the stronger that frequency is. A spectrum repeats this test for many frequencies and plots the results as bars.' },
        ],
      }
}

function fourierTermTopic(term: FourierTermId, locale: FourierLocale): HelpTopic {
  const zh: Record<FourierTermId, HelpTopic> = {
    winding: {
      eyebrow: '术语',
      title: '缠绕',
      summary: '缠绕就是把时间轴上的信号按某个测试频率绕到圆上。',
      sections: [{ title: '为什么有用', body: '匹配的频率会让点云偏向一边，不匹配的频率通常会互相抵消。这让“有没有这个频率”变得可视化。' }],
    },
    frequency: {
      eyebrow: '术语',
      title: '频率',
      summary: '频率表示单位时间里重复多少次。',
      sections: [{ title: '在这个实验里', body: 't 在 [0,1] 时，f=1 表示整段信号绕一圈，f=3 表示绕三圈。' }],
    },
    coefficient: {
      eyebrow: '术语',
      title: 'Fourier 系数',
      summary: 'Fourier 系数 C(f) 是某个频率 f 的平均点。',
      sections: [{ title: '读法', body: '系数的大小表示这个频率有多强；系数的角度表示相位。' }],
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
      sections: [{ title: '怎么看', body: '峰值表示强频率。多个峰值说明信号由多个主要频率混合而成。' }],
    },
    phase: {
      eyebrow: '术语',
      title: '相位',
      summary: '相位描述一个频率成分在时间上错开了多少。',
      sections: [{ title: '直觉', body: '两个波频率相同但峰值出现得早晚不同，它们的相位就不同。' }],
    },
    reconstruction: {
      eyebrow: '术语',
      title: '重建',
      summary: '重建是把选中的频率成分加回去，合成一个近似原信号。',
      sections: [{ title: '为什么重要', body: '如果只用少数频率就能重建得很好，说明原信号的主要结构可以被这些频率解释。' }],
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
      summary: 'Winding wraps the signal around a circle at a test frequency.',
      sections: [{ title: 'Why it helps', body: 'A matching frequency pulls the point cloud to one side. A non-matching frequency tends to cancel out around the center.' }],
    },
    frequency: {
      eyebrow: 'Term',
      title: 'Frequency',
      summary: 'Frequency means how many times something repeats per unit of time.',
      sections: [{ title: 'In this lab', body: 'When t is in [0,1], f=1 means one turn across the signal and f=3 means three turns.' }],
    },
    coefficient: {
      eyebrow: 'Term',
      title: 'Fourier coefficient',
      summary: 'The Fourier coefficient C(f) is the average point for frequency f.',
      sections: [{ title: 'How to read it', body: 'Its magnitude is frequency strength. Its angle is phase.' }],
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
      sections: [{ title: 'How to read it', body: 'Peaks are strong frequencies. Multiple peaks mean the signal mixes multiple main frequencies.' }],
    },
    phase: {
      eyebrow: 'Term',
      title: 'Phase',
      summary: 'Phase describes the timing offset of a frequency component.',
      sections: [{ title: 'Intuition', body: 'Two waves can have the same frequency but reach their peaks at different times. That difference is phase.' }],
    },
    reconstruction: {
      eyebrow: 'Term',
      title: 'Reconstruction',
      summary: 'Reconstruction adds selected frequency components back together to approximate the original signal.',
      sections: [{ title: 'Why it matters', body: 'If a few frequencies reconstruct the signal well, those frequencies explain most of its structure.' }],
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
  filterType: FilterType
  cutoff: number
  lowCutoff: number
  highCutoff: number
  threshold: number
}): ValueRow[] {
  const dominant = findDominantFrequencies(state.spectrum, 4).map((coefficient) => formatFrequency(coefficient.frequency)).join(', ')
  if (state.lessonKey === 'spectrum') {
    return [
      { label: state.locale === 'zh' ? '频率范围' : 'frequency range', value: `${formatFrequency(state.spectrum.frequencyMin)} to ${formatFrequency(state.spectrum.frequencyMax)}` },
      { label: state.locale === 'zh' ? '频率步长' : 'frequency step', value: formatNumber(state.spectrum.frequencyStep) },
      { label: state.locale === 'zh' ? '选中频率' : 'selected frequency', value: formatFrequency(state.selectedFrequency) },
      { label: 'Re C(f)', value: formatNumber(state.selectedCoefficient.value.re) },
      { label: 'Im C(f)', value: formatNumber(state.selectedCoefficient.value.im) },
      { label: '|C(f)|', value: formatNumber(state.selectedCoefficient.magnitude) },
      { label: state.locale === 'zh' ? '相位' : 'phase', value: `${formatNumber(state.selectedCoefficient.phase)} rad` },
      { label: state.locale === 'zh' ? '主频率' : 'dominant frequencies', value: dominant || 'none' },
    ]
  }
  if (state.lessonKey === 'reconstruction') {
    const omitted = findDominantFrequencies({
      ...state.integerSpectrum,
      coefficients: state.integerSpectrum.coefficients.filter((coefficient) => !state.includedCoefficients.some((included) => included.frequency === coefficient.frequency)),
    }, 1)[0]
    return [
      { label: state.locale === 'zh' ? '系数数量' : 'coefficient count', value: String(state.coefficientCount) },
      { label: 'MSE', value: formatNumber(meanSquaredError(state.samples, state.reconstructedSamples)) },
      { label: state.locale === 'zh' ? '最大误差' : 'max error', value: formatNumber(maxAbsError(state.samples, state.reconstructedSamples)) },
      { label: state.locale === 'zh' ? '保留频率' : 'included frequencies', value: state.includedCoefficients.slice(0, 8).map((coefficient) => formatFrequency(coefficient.frequency)).join(', ') },
      { label: state.locale === 'zh' ? '最大遗漏频率' : 'dominant omitted', value: omitted ? formatFrequency(omitted.frequency) : 'none' },
    ]
  }
  return [
    { label: state.locale === 'zh' ? '滤波类型' : 'filter type', value: filterLabel(state.filterType, state.locale) },
    { label: state.locale === 'zh' ? '截止 / 范围' : 'cutoff / range', value: filterValue(state) },
    { label: 'MSE', value: formatNumber(meanSquaredError(state.samples, state.filteredSamples)) },
    { label: state.locale === 'zh' ? '最大残差' : 'max residual', value: formatNumber(maxAbsError(state.samples, state.filteredSamples)) },
  ]
}

function filterValue(state: { filterType: FilterType; cutoff: number; lowCutoff: number; highCutoff: number; threshold: number }): string {
  if (state.filterType === 'band-pass' || state.filterType === 'band-stop') return `${formatFrequency(state.lowCutoff)} to ${formatFrequency(state.highCutoff)}`
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

function readPresetParam(fallback: string): string {
  const raw = readParam('preset')
  if (raw && (raw === 'custom' || fourierPresets.some((preset) => preset.id === raw))) return raw
  return fallback
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
