import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Download, Pause, Play, RotateCcw, Share2 } from 'lucide-react'
import { GraphCanvas, drawGrid, line, worldToScreen } from '../../core/graph2d/GraphCanvas.tsx'
import type { GraphTheme, GraphViewport } from '../../core/graph2d/GraphCanvas.tsx'
import { Formula } from '../../core/ui/Formula.tsx'
import { HelpTrigger, LearningDrawer, TermButton } from '../../core/ui/LearningHelp.tsx'
import { expressionToTex } from '../../core/ui/mathNotation.ts'
import { SelectMenu } from '../../core/ui/SelectMenu.tsx'
import type { Locale } from '../../i18n.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { compileCalculusExpression, calculusPresets, presetFunction } from './calculusPresets.ts'
import { calculusLearningCopy, conceptTopicForLesson, getCalculusHelpTopics } from './learningHelp.tsx'
import type { CalculusHelpTopicId } from './learningHelp.tsx'
import { calculusFunctionNames, completeBareFunctionInput, normalizeMathInput } from './shared/mathInput.ts'
import {
  approximateDerivative,
  buildTaylorCoefficientsForPreset,
  makeAccumulationFunction,
  referenceIntegral,
  riemannSum,
  taylorPolynomialValue,
} from './math/calculus.ts'
import type { RiemannMethod, RealFunction } from './math/calculus.ts'

type Props = {
  lessonId: string
}

type GraphViewState = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

type LessonCopy = {
  title: string
  what: string
  why: string
  formula: string
  formulaTex: string
  watch: string
}

type CalculusLocale = Locale

type ValueRow = {
  label: string
  labelTex?: string
  value: string
}

const calculusCopy: Record<CalculusLocale, {
  ui: {
    function: string
    preset: string
    customFunction: string
    commonFunctions: string
    formulaPreview: string
    inputHelp: string
    method: string
    play: string
    pause: string
    reset: string
    resetView: string
    lesson: string
    share: string
    exportPng: string
    seeing: string
    why: string
    formula: string
    values: string
    watch: string
    graphInstructions: string
    invalidExpression: string
    undefinedValue: string
    ranges: Record<string, string>
  }
  lessons: Record<string, LessonCopy>
}> = {
  en: {
    ui: {
      function: 'Function',
      preset: 'Preset',
      customFunction: 'Custom function',
      commonFunctions: 'Common functions',
      formulaPreview: 'Formula preview',
      inputHelp: 'Use x, pi, e, ^, and functions such as sin(x), ln(x), sqrt(x).',
      method: 'method',
      play: 'Play',
      pause: 'Pause',
      reset: 'Reset',
      resetView: 'Reset view',
      lesson: 'Lesson',
      share: 'Share',
      exportPng: 'Export PNG',
      seeing: 'What you are seeing',
      why: 'Why it matters',
      formula: 'Current formula',
      values: 'Current values',
      watch: 'Watch for',
      graphInstructions: 'Drag to pan, scroll to zoom.',
      invalidExpression: 'Invalid expression.',
      undefinedValue: 'undefined',
      ranges: {
        point: 'point',
        step: 'step',
        intervalStart: 'interval start',
        intervalEnd: 'interval end',
        rectangles: 'rectangles',
        areaStart: 'area start',
        current: 'current',
        animationEnd: 'animation end',
        center: 'center',
        degree: 'degree',
        speed: 'speed',
      },
    },
    lessons: {
      derivative: {
        title: 'Derivative',
        what: 'The secant line through two nearby points rotates toward the tangent line.',
        why: 'The derivative is the limiting slope of nearby secant lines.',
        formula: "f'(x0) ≈ (f(x0+h)-f(x0))/h",
        formulaTex: "f'(x_0) \\approx \\frac{f(x_0+h)-f(x_0)}{h}",
        watch: 'At corners or jumps, left and right slopes may disagree.',
      },
      integral: {
        title: 'Integral / Riemann Sums',
        what: 'Rectangles or trapezoids approximate the signed area under the curve.',
        why: 'A definite integral is the limiting value of many small area pieces.',
        formula: '∫[a,b] f(x) dx',
        formulaTex: '\\int_a^b f(x)\\,dx',
        watch: 'Areas below the x-axis contribute negative signed area.',
      },
      'fundamental-theorem': {
        title: 'Fundamental Theorem Connector',
        what: 'The upper graph shows height; the lower graph shows accumulated area.',
        why: 'The rate of change of accumulated area is the current function height.',
        formula: "A(x)=∫[a,x] f(t)dt, A'(x)≈f(x)",
        formulaTex: "A(x)=\\int_a^x f(t)\\,dt,\\quad A'(x)\\approx f(x)",
        watch: 'This is a numerical demonstration, not a formal proof.',
      },
      taylor: {
        title: 'Taylor Polynomial',
        what: 'A polynomial matches the function near the selected center.',
        why: 'Taylor approximation uses local derivative information to build a local model.',
        formula: 'Pₙ(x)=Σ f⁽ᵏ⁾(c)/k! · (x-c)ᵏ',
        formulaTex: 'P_n(x)=\\sum_{k=0}^{n}\\frac{f^{(k)}(c)}{k!}(x-c)^k',
        watch: 'Higher degree usually helps near the center, but can fail far away.',
      },
    },
  },
  zh: {
    ui: {
      function: '函数',
      preset: '预设',
      customFunction: '自定义函数',
      commonFunctions: '常用函数',
      formulaPreview: '公式预览',
      inputHelp: '可使用 x、pi、e、^，以及 sin(x)、ln(x)、sqrt(x) 等函数。',
      method: '方法',
      play: '播放',
      pause: '暂停',
      reset: '重置',
      resetView: '重置视图',
      lesson: '章节',
      share: '分享',
      exportPng: '导出 PNG',
      seeing: '你正在看到什么',
      why: '为什么重要',
      formula: '当前公式',
      values: '当前数值',
      watch: '注意观察',
      graphInstructions: '拖动可平移，滚轮可缩放。',
      invalidExpression: '表达式无效。',
      undefinedValue: '未定义',
      ranges: {
        point: '点',
        step: '步长',
        intervalStart: '区间起点',
        intervalEnd: '区间终点',
        rectangles: '矩形数',
        areaStart: '面积起点',
        current: '当前位置',
        animationEnd: '动画终点',
        center: '中心',
        degree: '阶数',
        speed: '速度',
      },
    },
    lessons: {
      derivative: {
        title: '导数',
        what: '穿过两个邻近点的割线会逐渐转向切线。',
        why: '导数就是邻近割线斜率趋近的极限。',
        formula: "f'(x0) ≈ (f(x0+h)-f(x0))/h",
        formulaTex: "f'(x_0) \\approx \\frac{f(x_0+h)-f(x_0)}{h}",
        watch: '在尖角或跳跃处，左右斜率可能不一致。',
      },
      integral: {
        title: '积分 / 黎曼和',
        what: '矩形或梯形正在近似曲线下方的有符号面积。',
        why: '定积分可以理解为很多小面积片段的极限。',
        formula: '∫[a,b] f(x) dx',
        formulaTex: '\\int_a^b f(x)\\,dx',
        watch: '函数在 x 轴下方时，有符号面积会贡献负值。',
      },
      'fundamental-theorem': {
        title: '微积分基本定理连接器',
        what: '上方图像显示当前高度，下方图像显示累积面积。',
        why: '累积面积的变化率等于当前位置的函数高度。',
        formula: "A(x)=∫[a,x] f(t)dt, A'(x)≈f(x)",
        formulaTex: "A(x)=\\int_a^x f(t)\\,dt,\\quad A'(x)\\approx f(x)",
        watch: '这里是数值演示，不是严格证明。',
      },
      taylor: {
        title: '泰勒多项式',
        what: '多项式会在选定中心附近尽量贴合原函数。',
        why: '泰勒近似用局部导数信息构造局部模型。',
        formula: 'Pₙ(x)=Σ f⁽ᵏ⁾(c)/k! · (x-c)ᵏ',
        formulaTex: 'P_n(x)=\\sum_{k=0}^{n}\\frac{f^{(k)}(c)}{k!}(x-c)^k',
        watch: '更高阶通常能改善中心附近的近似，但远离中心时可能失效。',
      },
    },
  },
}

export function CalculusLesson({ lessonId }: Props) {
  const { locale } = usePlatformLocale()
  const copy = calculusCopy[locale].lessons[lessonId] ?? calculusCopy[locale].lessons.derivative
  const ui = calculusCopy[locale].ui
  const learningCopy = calculusLearningCopy[locale]
  const [presetId, setPresetId] = useState(() => readPresetParam(lessonId))
  const selectedPreset = calculusPresets.find((preset) => preset.id === presetId) ?? calculusPresets.find((preset) => preset.id === defaultPresetForLesson(lessonId)) ?? calculusPresets[0]
  const [expression, setExpression] = useState(() => readParam('f') ?? selectedPreset.expression)
  const [x0, setX0] = useState(() => readNumberParam('x0', selectedPreset.defaultX0 ?? 1))
  const [h, setH] = useState(() => readNumberParam('h', 0.5))
  const [a, setA] = useState(() => readNumberParam('a', selectedPreset.defaultA ?? 0))
  const [b, setB] = useState(() => readNumberParam('b', selectedPreset.defaultB ?? 2))
  const [n, setN] = useState(() => readNumberParam('n', 12))
  const [degree, setDegree] = useState(() => readNumberParam('degree', 5))
  const [method, setMethod] = useState<RiemannMethod>(() => (readParam('method') as RiemannMethod) ?? 'midpoint')
  const [view, setView] = useState<GraphViewState>({ xMin: -5, xMax: 5, yMin: -3, yMax: 3 })
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [activeHelpTopicId, setActiveHelpTopicId] = useState<CalculusHelpTopicId | null>(null)
  const expressionTex = useMemo(() => expressionToTex(expression), [expression])
  const learningTopics = useMemo(() => getCalculusHelpTopics(locale, lessonId), [lessonId, locale])
  const activeHelpTopic = activeHelpTopicId ? learningTopics[activeHelpTopicId] : null
  const openHelpTopic = useCallback((topic: CalculusHelpTopicId) => setActiveHelpTopicId(topic), [])

  useEffect(() => {
    const preset = calculusPresets.find((candidate) => candidate.id === presetId)
    if (!preset) return
    setExpression(preset.expression)
    setX0(preset.defaultX0 ?? 1)
    setA(preset.defaultA ?? 0)
    setB(preset.defaultB ?? 2)
  }, [presetId])

  useEffect(() => {
    setView({ xMin: -5, xMax: 5, yMin: -3, yMax: 3 })
  }, [lessonId])

  const fn = useMemo<RealFunction>(() => {
    try {
      setError(null)
      const compiled = compileCalculusExpression(expression)
      return (x: number) => compiled.evaluate({ x })
    } catch (caught) {
      setError(caught instanceof Error ? translateCalculusError(caught.message, locale) : ui.invalidExpression)
      return presetFunction(selectedPreset)
    }
  }, [expression, locale, selectedPreset, ui.invalidExpression])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let previous = performance.now()
    const tick = (now: number) => {
      const delta = Math.min(80, now - previous)
      previous = now
      if (lessonId === 'derivative') setH((value) => Math.max(0.02, value * (1 - delta * 0.0006 * speed)))
      if (lessonId === 'integral') setN((value) => Math.min(80, value + delta * 0.01 * speed))
      if (lessonId === 'fundamental-theorem') setX0((value) => (value >= b ? a : value + delta * 0.001 * speed * Math.max(0.5, b - a)))
      if (lessonId === 'taylor') setDegree((value) => (value >= 10 ? 0 : value + delta * 0.004 * speed))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [a, b, lessonId, playing, speed])

  const values = getCurrentValues({ lessonId, fn, selectedPreset, x0, h, a, b, n, method, degree }, locale)

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme) => {
      drawCalculusScene(ctx, viewport, theme, { lessonId, locale, fn, selectedPreset, x0, h, a, b, n: Math.round(n), method, degree: Math.round(degree) })
    },
    [a, b, degree, fn, h, lessonId, locale, method, n, selectedPreset, x0],
  )

  const share = () => {
    const params = new URLSearchParams()
    params.set('preset', presetId)
    params.set('f', expression)
    params.set('x0', String(round(x0)))
    params.set('h', String(round(h)))
    params.set('a', String(round(a)))
    params.set('b', String(round(b)))
    params.set('n', String(Math.round(n)))
    params.set('degree', String(Math.round(degree)))
    params.set('method', method)
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
    void navigator.clipboard?.writeText(url)
  }

  const exportPng = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('.calculus-canvas')
    if (!canvas) return
    const anchor = document.createElement('a')
    anchor.href = canvas.toDataURL('image/png')
    anchor.download = `calculus-${lessonId}.png`
    anchor.click()
  }

  return (
    <>
    <section className="calculus-lesson">
      <aside className="calculus-controls platform-card">
        <div className="calculus-learning-entry">
          <div>
            <h2>{learningCopy.entryTitle}</h2>
            <p>{learningCopy.entryHint}</p>
          </div>
          <HelpTrigger ariaLabel={learningCopy.openOverview} onClick={() => openHelpTopic('overview')}>
            {learningCopy.openOverview}
          </HelpTrigger>
        </div>
        <h2>
          <TermButton onClick={() => openHelpTopic('function')}>{ui.function}</TermButton>
        </h2>
        <label>
          {ui.preset}
          <SelectMenu
            value={presetId}
            options={[
              { value: 'custom', textValue: ui.customFunction, label: <Formula tex="f(x)" label={ui.customFunction} /> },
              ...calculusPresets.map((preset) => ({
                value: preset.id,
                textValue: preset.label,
                label: <Formula tex={`f(x)=${expressionToTex(preset.expression)}`} label={preset.label} />,
              })),
            ]}
            onChange={setPresetId}
            ariaLabel={ui.preset}
          />
        </label>
        <label>
          <Formula tex="f(x)" />
          <input
            value={expression}
            placeholder="sin(x), ln(x), exp(-x^2)"
            onBlur={() => setExpression((current) => normalizeMathInput(current))}
            onChange={(event) => {
              setPresetId('custom')
              setExpression(completeBareFunctionInput(event.target.value))
            }}
          />
        </label>
        <div className="math-formula-preview" aria-label={ui.formulaPreview}>
          <span>{ui.formulaPreview}</span>
          <Formula tex={`f(x)=${expressionTex}`} label={`${ui.formulaPreview}: f(x)=${expression}`} />
        </div>
        <div className="math-input-toolbar" aria-label={ui.commonFunctions}>
          {calculusFunctionNames.map((name) => (
            <button type="button" key={name} onClick={() => {
              setPresetId('custom')
              setExpression(`${name}(x)`)
            }}>
              {name}
            </button>
          ))}
        </div>
        <p className="input-help">{ui.inputHelp}</p>
        {error && <p className="warning-text">{error}</p>}
        {lessonId === 'derivative' && (
          <>
            <Range label={`${ui.ranges.point} x0`} labelTex={`${locale === 'zh' ? '\\text{点}\\ ' : '\\text{point}\\ '}x_0`} value={x0} min={-4} max={4} step={0.05} onChange={setX0} />
            <Range label={`${ui.ranges.step} h`} labelTex={`${locale === 'zh' ? '\\text{步长}\\ ' : '\\text{step}\\ '}h`} value={h} min={0.02} max={2} step={0.02} onChange={setH} />
          </>
        )}
        {lessonId === 'integral' && (
          <>
            <Range label={`${ui.ranges.intervalStart} a`} labelTex={`${locale === 'zh' ? '\\text{区间起点}\\ ' : '\\text{interval start}\\ '}a`} value={a} min={-4} max={4} step={0.05} onChange={setA} />
            <Range label={`${ui.ranges.intervalEnd} b`} labelTex={`${locale === 'zh' ? '\\text{区间终点}\\ ' : '\\text{interval end}\\ '}b`} value={b} min={-4} max={4} step={0.05} onChange={setB} />
            <Range label={`${ui.ranges.rectangles} n`} labelTex={`${locale === 'zh' ? '\\text{矩形数}\\ ' : '\\text{rectangles}\\ '}n`} value={n} min={1} max={80} step={1} onChange={setN} />
            <label>
              {ui.method}
              <SelectMenu
                value={method}
                options={(['left', 'right', 'midpoint', 'trapezoid'] as RiemannMethod[]).map((nextMethod) => ({
                  value: nextMethod,
                  textValue: methodLabel(nextMethod, locale),
                  label: methodLabel(nextMethod, locale),
                }))}
                onChange={setMethod}
                ariaLabel={ui.method}
              />
            </label>
          </>
        )}
        {lessonId === 'fundamental-theorem' && (
          <>
            <Range label={`${ui.ranges.areaStart} a`} labelTex={`${locale === 'zh' ? '\\text{面积起点}\\ ' : '\\text{area start}\\ '}a`} value={a} min={-4} max={4} step={0.05} onChange={setA} />
            <Range label={`${ui.ranges.current} x`} labelTex={`${locale === 'zh' ? '\\text{当前位置}\\ ' : '\\text{current}\\ '}x`} value={x0} min={-4} max={4} step={0.05} onChange={setX0} />
            <Range label={`${ui.ranges.animationEnd} b`} labelTex={`${locale === 'zh' ? '\\text{动画终点}\\ ' : '\\text{animation end}\\ '}b`} value={b} min={-4} max={4} step={0.05} onChange={setB} />
          </>
        )}
        {lessonId === 'taylor' && (
          <>
            <Range label={`${ui.ranges.center} c`} labelTex={`${locale === 'zh' ? '\\text{中心}\\ ' : '\\text{center}\\ '}c`} value={x0} min={-4} max={4} step={0.05} onChange={setX0} />
            <Range label={ui.ranges.degree} labelTex={locale === 'zh' ? '\\text{阶数}' : '\\text{degree}'} value={degree} min={0} max={10} step={1} onChange={setDegree} />
          </>
        )}
      </aside>

      <main className="calculus-main">
        <div className="calculus-title-row">
          <div>
            <p className="eyebrow">{ui.lesson}</p>
            <h1>{copy.title}</h1>
          </div>
          <div className="calculus-actions">
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
        <div className="graph-help-stage calculus-graph-stage">
          <GraphCanvas
            className="graph-canvas calculus-canvas interactive-graph-canvas"
            ariaLabel={`${copy.title}. ${ui.graphInstructions}`}
            xMin={view.xMin}
            xMax={view.xMax}
            yMin={view.yMin}
            yMax={view.yMax}
            draw={draw}
            onViewportChange={setView}
          />
          <HelpTrigger variant="graph" ariaLabel={learningCopy.openGraph} onClick={() => openHelpTopic('graph')}>
            {learningCopy.openGraph}
          </HelpTrigger>
        </div>
        <div className="calculus-playback platform-card">
          <button type="button" onClick={() => setPlaying(true)}>
            <Play size={16} />
            {ui.play}
          </button>
          <button type="button" onClick={() => setPlaying(false)}>
            <Pause size={16} />
            {ui.pause}
          </button>
          <button type="button" onClick={() => resetLessonControls(lessonId, selectedPreset, setX0, setH, setA, setB, setN, setDegree)}>
            <RotateCcw size={16} />
            {ui.reset}
          </button>
          <button type="button" onClick={() => setView({ xMin: -5, xMax: 5, yMin: -3, yMax: 3 })}>
            {ui.resetView}
          </button>
          <Range label={ui.ranges.speed} labelTex={locale === 'zh' ? '\\text{速度}' : '\\text{speed}'} value={speed} min={0.25} max={3} step={0.25} onChange={setSpeed} />
        </div>
      </main>

      <aside className="calculus-explanation platform-card">
        <h2>
          <HelpLabel topic="graph" onOpenHelpTopic={openHelpTopic}>
            {ui.seeing}
          </HelpLabel>
        </h2>
        <p>{copy.what}</p>
        <h2>
          <HelpLabel topic={conceptTopicForLesson(lessonId)} onOpenHelpTopic={openHelpTopic}>
            {ui.why}
          </HelpLabel>
        </h2>
        <p>{copy.why}</p>
        <h2>
          <HelpLabel topic="formula" onOpenHelpTopic={openHelpTopic}>
            {ui.formula}
          </HelpLabel>
        </h2>
        <p className="formula-text formula-card">
          <Formula tex={copy.formulaTex} block label={copy.formula} />
        </p>
        <h2>
          <HelpLabel topic="values" onOpenHelpTopic={openHelpTopic}>
            {ui.values}
          </HelpLabel>
        </h2>
        <dl>
          {values.map(({ label, labelTex, value }) => (
            <div key={label}>
              <dt>{labelTex ? <Formula tex={labelTex} /> : label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <h2>
          <HelpLabel topic="approximation" onOpenHelpTopic={openHelpTopic}>
            {ui.watch}
          </HelpLabel>
        </h2>
        <p>{copy.watch}</p>
      </aside>
    </section>
    <LearningDrawer topic={activeHelpTopic} closeLabel={learningCopy.close} onClose={() => setActiveHelpTopicId(null)} />
    </>
  )
}

function HelpLabel({
  topic,
  onOpenHelpTopic,
  children,
}: {
  topic: CalculusHelpTopicId
  onOpenHelpTopic: (topic: CalculusHelpTopicId) => void
  children: ReactNode
}) {
  return <TermButton onClick={() => onOpenHelpTopic(topic)}>{children}</TermButton>
}

function Range({ label, labelTex, value, min, max, step, onChange }: { label: string; labelTex?: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <label>
      {labelTex ? <Formula tex={labelTex} /> : label}: <strong>{round(value)}</strong>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function drawCalculusScene(
  ctx: CanvasRenderingContext2D,
  viewport: GraphViewport,
  theme: GraphTheme,
  state: { lessonId: string; locale: CalculusLocale; fn: RealFunction; selectedPreset: { taylorId?: string }; x0: number; h: number; a: number; b: number; n: number; method: RiemannMethod; degree: number },
) {
  drawGrid(ctx, viewport, theme)
  if (state.lessonId === 'fundamental-theorem') {
    drawSplitFtc(ctx, viewport, theme, state)
    return
  }
  drawFunction(ctx, viewport, state.fn, theme.primary, 2)
  if (state.lessonId === 'derivative') drawDerivative(ctx, viewport, theme, state)
  if (state.lessonId === 'integral') drawIntegral(ctx, viewport, theme, state)
  if (state.lessonId === 'taylor') drawTaylor(ctx, viewport, theme, state)
}

function drawFunction(ctx: CanvasRenderingContext2D, viewport: GraphViewport, fn: RealFunction, color: string, width: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  let started = false
  for (let index = 0; index <= 500; index += 1) {
    const x = viewport.xMin + ((viewport.xMax - viewport.xMin) * index) / 500
    const y = fn(x)
    if (!isFiniteNumber(y) || Math.abs(y) > 1e4) {
      started = false
      continue
    }
    const point = worldToScreen(viewport, x, y)
    if (!started) {
      ctx.moveTo(point.x, point.y)
      started = true
    } else {
      ctx.lineTo(point.x, point.y)
    }
  }
  ctx.stroke()
}

function drawPoint(ctx: CanvasRenderingContext2D, viewport: GraphViewport, x: number, y: number, color: string) {
  const point = worldToScreen(viewport, x, y)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
  ctx.fill()
}

function drawDerivative(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: { fn: RealFunction; x0: number; h: number }) {
  const y0 = state.fn(state.x0)
  const y1 = state.fn(state.x0 + state.h)
  const derivative = approximateDerivative(state.fn, state.x0) ?? 0
  if (isFiniteNumber(y0)) drawPoint(ctx, viewport, state.x0, y0, theme.secondary)
  if (isFiniteNumber(y1)) drawPoint(ctx, viewport, state.x0 + state.h, y1, theme.accent)
  if (isFiniteNumber(y0) && isFiniteNumber(y1)) {
    ctx.strokeStyle = theme.secondary
    ctx.setLineDash([6, 4])
    line(ctx, viewport, state.x0 - 2, y0 - ((y1 - y0) / state.h) * 2, state.x0 + 2, y0 + ((y1 - y0) / state.h) * 2)
    ctx.setLineDash([])
  }
  if (isFiniteNumber(y0)) {
    ctx.strokeStyle = theme.warning
    line(ctx, viewport, state.x0 - 2, y0 - derivative * 2, state.x0 + 2, y0 + derivative * 2)
  }
}

function drawIntegral(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: { fn: RealFunction; a: number; b: number; n: number; method: RiemannMethod }) {
  const dx = (state.b - state.a) / Math.max(1, state.n)
  ctx.fillStyle = theme.fill
  ctx.strokeStyle = theme.accent
  for (let index = 0; index < state.n; index += 1) {
    const left = state.a + index * dx
    const right = left + dx
    const sample = state.method === 'left' ? left : state.method === 'right' ? right : (left + right) / 2
    const y = state.fn(sample)
    if (!isFiniteNumber(y)) continue
    const topLeft = worldToScreen(viewport, left, y)
    const bottom = worldToScreen(viewport, left, 0)
    const topRight = worldToScreen(viewport, right, y)
    ctx.beginPath()
    ctx.rect(topLeft.x, Math.min(topLeft.y, bottom.y), topRight.x - topLeft.x, Math.abs(bottom.y - topLeft.y))
    ctx.fill()
    ctx.stroke()
  }
}

function drawTaylor(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: { fn: RealFunction; selectedPreset: { taylorId?: string }; x0: number; degree: number }) {
  const presetId = state.selectedPreset.taylorId ?? 'sin'
  const coefficients = buildTaylorCoefficientsForPreset(presetId, state.x0, state.degree)
  drawFunction(ctx, viewport, (x) => taylorPolynomialValue(coefficients, state.x0, x), theme.warning, 2)
  const y = state.fn(state.x0)
  if (isFiniteNumber(y)) drawPoint(ctx, viewport, state.x0, y, theme.warning)
}

function drawSplitFtc(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: { locale: CalculusLocale; fn: RealFunction; a: number; x0: number }) {
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, viewport.width, viewport.height)
  const gap = 28
  const paneHeight = (viewport.height - gap) / 2
  const topViewport: GraphViewport = { ...viewport, height: paneHeight, yMin: -3, yMax: 3 }
  const bottomViewport: GraphViewport = { ...viewport, height: paneHeight, yMin: -3, yMax: 3 }
  const accumulation = makeAccumulationFunction(state.fn, state.a)

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, viewport.width, paneHeight)
  ctx.clip()
  drawGrid(ctx, topViewport, theme)
  drawFunction(ctx, topViewport, state.fn, theme.primary, 2)
  const y = state.fn(state.x0)
  if (isFiniteNumber(y)) drawPoint(ctx, topViewport, state.x0, y, theme.primary)
  drawPaneLabel(ctx, 'f(x)', theme)
  ctx.restore()

  ctx.save()
  ctx.translate(0, paneHeight + gap)
  ctx.beginPath()
  ctx.rect(0, 0, viewport.width, paneHeight)
  ctx.clip()
  drawGrid(ctx, bottomViewport, theme)
  drawFunction(ctx, bottomViewport, accumulation, theme.warning, 2)
  const area = accumulation(state.x0)
  if (isFiniteNumber(area)) drawPoint(ctx, bottomViewport, state.x0, area, theme.warning)
  drawPaneLabel(ctx, state.locale === 'zh' ? 'A(x) = 累积面积' : 'A(x) = accumulated area', theme)
  ctx.restore()

  ctx.strokeStyle = theme.gridMajor
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, paneHeight + gap / 2)
  ctx.lineTo(viewport.width, paneHeight + gap / 2)
  ctx.stroke()
}

function drawPaneLabel(ctx: CanvasRenderingContext2D, label: string, theme: GraphTheme) {
  ctx.fillStyle = theme.text
  ctx.font = '13px Inter, system-ui, sans-serif'
  ctx.fillText(label, 14, 22)
}

function getCurrentValues(state: { lessonId: string; fn: RealFunction; selectedPreset: { taylorId?: string }; x0: number; h: number; a: number; b: number; n: number; method: RiemannMethod; degree: number }, locale: CalculusLocale): ValueRow[] {
  if (state.lessonId === 'derivative') {
    return [
      { label: 'x0', labelTex: 'x_0', value: String(round(state.x0)) },
      { label: 'h', labelTex: 'h', value: String(round(state.h)) },
      { label: locale === 'zh' ? '导数' : 'derivative', labelTex: "f'(x_0)", value: format(approximateDerivative(state.fn, state.x0), locale) },
    ]
  }
  if (state.lessonId === 'integral') {
    return [
      { label: locale === 'zh' ? '近似面积' : 'approx area', labelTex: locale === 'zh' ? '\\text{面积}' : '\\text{area}', value: format(riemannSum(state.fn, state.a, state.b, state.n, state.method), locale) },
      { label: locale === 'zh' ? '参考值' : 'reference', value: format(referenceIntegral(state.fn, state.a, state.b), locale) },
      { label: locale === 'zh' ? '方法' : 'method', value: methodLabel(state.method, locale) },
    ]
  }
  if (state.lessonId === 'fundamental-theorem') {
    const accumulation = makeAccumulationFunction(state.fn, state.a)
    return [
      { label: 'A(x)', labelTex: 'A(x)', value: format(accumulation(state.x0), locale) },
      { label: "A'(x)", labelTex: "A'(x)", value: format(approximateDerivative(accumulation, state.x0), locale) },
      { label: 'f(x)', labelTex: 'f(x)', value: format(state.fn(state.x0), locale) },
    ]
  }
  const coefficients = buildTaylorCoefficientsForPreset(state.selectedPreset.taylorId ?? 'sin', state.x0, state.degree)
  const approximation = (x: number) => taylorPolynomialValue(coefficients, state.x0, x)
  return [
    { label: locale === 'zh' ? '中心' : 'center', labelTex: 'c', value: String(round(state.x0)) },
    { label: locale === 'zh' ? '阶数' : 'degree', labelTex: 'n', value: String(Math.round(state.degree)) },
    { label: locale === 'zh' ? '最大误差' : 'max error', labelTex: locale === 'zh' ? '\\text{最大误差}' : '\\text{max error}', value: format(Math.abs((state.fn(state.x0 + 1) ?? 0) - approximation(state.x0 + 1)), locale) },
  ]
}

function methodLabel(method: RiemannMethod, locale: CalculusLocale): string {
  if (locale === 'en') return method
  if (method === 'left') return '左端点'
  if (method === 'right') return '右端点'
  if (method === 'midpoint') return '中点'
  return '梯形'
}

function resetLessonControls(
  lessonId: string,
  preset: { defaultX0?: number; defaultA?: number; defaultB?: number },
  setX0: (value: number) => void,
  setH: (value: number) => void,
  setA: (value: number) => void,
  setB: (value: number) => void,
  setN: (value: number) => void,
  setDegree: (value: number) => void,
) {
  setX0(preset.defaultX0 ?? (lessonId === 'fundamental-theorem' ? preset.defaultA ?? 0 : 1))
  setH(0.5)
  setA(preset.defaultA ?? 0)
  setB(preset.defaultB ?? 2)
  setN(12)
  setDegree(5)
}

function defaultPresetForLesson(lessonId: string): string {
  if (lessonId === 'integral' || lessonId === 'fundamental-theorem') return 'gaussian'
  if (lessonId === 'taylor') return 'sin'
  return 'sin'
}

function readPresetParam(lessonId: string): string {
  const raw = readParam('preset')
  if (raw && (raw === 'custom' || calculusPresets.some((preset) => preset.id === raw))) return raw
  return defaultPresetForLesson(lessonId)
}

function readParam(name: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

function readNumberParam(name: string, fallback: number): number {
  const raw = readParam(name)
  const value = raw === null ? Number.NaN : Number(raw)
  return isFiniteNumber(value) ? value : fallback
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

function format(value: number | null, locale: CalculusLocale = 'en'): string {
  return isFiniteNumber(value) ? round(value).toString() : calculusCopy[locale].ui.undefinedValue
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function translateCalculusError(message: string, locale: CalculusLocale): string {
  if (locale === 'en') return message
  if (message === 'Invalid number.') return '数字无效。'
  if (message === 'Invalid identifier.') return '标识符无效。'
  if (message === 'Unexpected trailing token.') return '表达式末尾有多余内容。'
  if (message === 'Unexpected end of expression.') return '表达式意外结束。'
  if (message === 'Unexpected token.') return '出现意外符号。'
  const unsupported = message.match(/^Unsupported token "(.+)"\.$/)
  if (unsupported) return `不支持符号“${unsupported[1]}”。`
  const functionDenied = message.match(/^Function "(.+)" is not allowed\.$/)
  if (functionDenied) return `函数“${functionDenied[1]}”不可用。`
  const variableDenied = message.match(/^Variable "(.+)" is not allowed\.$/)
  if (variableDenied) return `变量“${variableDenied[1]}”不可用。`
  const expected = message.match(/^Expected "(.+)"\.$/)
  if (expected) return `应为“${expected[1]}”。`
  const missing = message.match(/^Missing variable "(.+)"\.$/)
  if (missing) return `缺少变量“${missing[1]}”。`
  return calculusCopy.zh.ui.invalidExpression
}
