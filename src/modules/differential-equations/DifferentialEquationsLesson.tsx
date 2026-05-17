import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LocateFixed, Pause, Play, RotateCcw } from 'lucide-react'
import { GraphCanvas, drawGrid, line, worldToScreen } from '../../core/graph2d/GraphCanvas.tsx'
import type { GraphTheme, GraphViewport } from '../../core/graph2d/GraphCanvas.tsx'
import { Formula } from '../../core/ui/Formula.tsx'
import { HelpTrigger, LearningDrawer, TermButton, type HelpTopic } from '../../core/ui/LearningHelp.tsx'
import { LessonScaffold } from '../../core/ui/LessonScaffold.tsx'
import { expressionToTex } from '../../core/ui/mathNotation.ts'
import { SelectMenu } from '../../core/ui/SelectMenu.tsx'
import type { Locale } from '../../i18n.ts'
import { LessonStageActions } from '../../platform/LessonStageActions.tsx'
import { ModuleFocusFrame } from '../../platform/ModuleFocusFrame.tsx'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import {
  compileScalarOdeExpression,
  normalizeDifferentialInput,
  phasePresets,
  scalarOdePresets,
  scalarPresetFunction,
} from './differentialPresets.ts'
import type { HeatShape, OdeMethod, PhasePoint, ScalarOde, System2D } from './math/differentialEquations.ts'
import {
  integrateScalarOde,
  integrateSystem,
  makeLotkaVolterraSystem,
  makePendulumSystem,
  sampleSlopeField,
  sampleVectorField,
  simulateHeatEquation,
  simulatePendulum,
  simulatePopulation,
} from './math/differentialEquations.ts'

type Props = {
  lessonId: string
}

type GraphViewState = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

type ValueRow = {
  label: string
  labelTex?: string
  value: string
  note?: ReactNode
  term?: DifferentialTermId
}

type LessonCopy = {
  title: string
  what: string
  why: string
  formulaTex: string
  formulaLabel: string
  watch: string
}

type DifferentialLocale = Locale
type DifferentialTermId =
  | 'y-prime'
  | 'ode'
  | 'initial-value'
  | 'slope-field'
  | 'euler'
  | 'midpoint'
  | 'rk4'
  | 'step-size'
  | 'heat-u'
  | 'heat-alpha'
  | 'heat-ut'
  | 'heat-uxx'
  | 'heat-boundary'
  | 'phase-state'
  | 'phase-arrow'
  | 'phase-time'
  | 'pendulum-theta'
  | 'pendulum-omega'
  | 'pendulum-damping'
  | 'pendulum-gravity'
  | 'population-prey-growth'
  | 'population-predation'
  | 'population-predator-death'
  | 'population-conversion'
  | 'population-equilibrium'
type DifferentialHelpMode = { kind: 'beginner' } | { kind: 'graph' } | { kind: 'term'; term: DifferentialTermId }

const methodOptions: OdeMethod[] = ['euler', 'midpoint', 'rk4']
const heatShapes: HeatShape[] = ['pulse', 'bar', 'two-peaks']

const differentialCopy: Record<DifferentialLocale, {
  ui: {
    equation: string
    preset: string
    customRule: string
    formulaPreview: string
    inputHelp: string
    method: string
    system: string
    initialConditions: string
    parameters: string
    play: string
    pause: string
    reset: string
    resetView: string
    lesson: string
    exportPng: string
    playbackProgress: string
    seeing: string
    why: string
    formula: string
    values: string
    watch: string
    beginnerHelp: string
    graphHelp: string
    closeHelp: string
    graphInstructions: string
    invalidExpression: string
    undefinedValue: string
    shape: string
    ranges: Record<string, string>
  }
  lessons: Record<string, LessonCopy>
}> = {
  en: {
    ui: {
      equation: 'Change rule',
      preset: 'Preset',
      customRule: 'Custom rule',
      formulaPreview: 'Formula preview',
      inputHelp: 'Use t and y with pi, e, ^, sin(t), exp(-t), sqrt(y), min(a,b), or max(a,b).',
      method: 'method',
      system: 'System',
      initialConditions: 'Initial conditions',
      parameters: 'Parameters',
      play: 'Play',
      pause: 'Pause',
      reset: 'Reset animation',
      resetView: 'Reset view',
      lesson: 'Lesson',
      exportPng: 'Export PNG',
      playbackProgress: 'Playback progress',
      seeing: 'What you are seeing',
      why: 'Why it matters',
      formula: 'Current model',
      values: 'Current values',
      watch: 'Watch for',
      beginnerHelp: 'Beginner Guide',
      graphHelp: 'Read the graph',
      closeHelp: 'Close explanation',
      graphInstructions: 'Drag to pan, scroll to zoom.',
      invalidExpression: 'Invalid differential equation.',
      undefinedValue: 'undefined',
      shape: 'initial heat',
      ranges: {
        t0: 'start t',
        y0: 'start y',
        x0: 'start x',
        duration: 'time',
        steps: 'steps',
        speed: 'speed',
        theta: 'angle',
        omega: 'angular velocity',
        damping: 'damping',
        gravity: 'gravity',
        prey: 'prey',
        predator: 'predator',
        preyGrowth: 'prey growth',
        predation: 'predation',
        predatorDeath: 'predator death',
        conversion: 'conversion',
        diffusivity: 'diffusivity',
        heatTime: 'time',
      },
    },
    lessons: {
      'slope-fields': {
        title: 'Slope Fields & Initial Value Problems',
        what: "Short line segments show the local slope y' at each point, and the highlighted curve follows the selected initial condition.",
        why: 'An ODE does not give y directly. It gives a local rule that a solution curve must obey everywhere it passes.',
        formulaTex: "\\frac{dy}{dt}=f(t,y),\\quad y(t_0)=y_0",
        formulaLabel: "dy/dt = f(t,y), y(t0)=y0",
        watch: 'Solutions can bend toward equilibria, away from unstable states, or follow periodic forcing.',
      },
      'numerical-methods': {
        title: 'Numerical Methods',
        what: 'Euler, midpoint, and RK4 step through the same ODE with different estimates of the next point.',
        why: 'Most differential equations are solved numerically, so step size and method choice control accuracy.',
        formulaTex: "y_{n+1}=y_n+h\\,\\Phi(t_n,y_n,h)",
        formulaLabel: 'one-step numerical update',
        watch: 'Euler tends to drift first; RK4 usually stays close with the same step count.',
      },
      'phase-portraits': {
        title: 'Phase Portraits & Vector Fields',
        what: 'Each point is a system state. Arrows point in the next-motion direction, and the highlighted curve shows the future from the chosen state.',
        why: 'A phase portrait shows the shape of all possible futures without plotting time on a separate axis.',
        formulaTex: "x'=F(x,y),\\quad y'=G(x,y)",
        formulaLabel: "x'=F(x,y), y'=G(x,y)",
        watch: 'Look for fixed points, spirals, saddles, centers, and stable directions. Arrow opacity hints speed; arrow length is normalized so the field stays readable.',
      },
      pendulum: {
        title: 'Pendulum & Oscillators',
        what: 'The main graph is phase space: horizontal is angle, vertical is angular velocity. The inset shows the real bob position.',
        why: 'A second-order equation becomes a first-order system by tracking position and velocity together.',
        formulaTex: "\\theta'=\\omega,\\quad \\omega'=-g\\sin(\\theta)-c\\omega",
        formulaLabel: "theta'=omega, omega'=-g sin(theta)-c omega",
        watch: 'With no damping, energy stays on one energy curve and small swings look like closed loops. Damping makes the path spiral inward.',
      },
      population: {
        title: 'Population Dynamics',
        what: 'Prey and predator populations move through phase space under the Lotka-Volterra interaction rule.',
        why: 'This simplified model turns prey-predator feedback into chase-like cycles; richer ecology needs carrying capacity, extinction, migration, and noise.',
        formulaTex: "x'=x(a-by),\\quad y'=y(cx-d)",
        formulaLabel: "prey'=prey(a-b predator), predator'=predator(c prey-d)",
        watch: 'Changing parameters moves the equilibrium and reshapes the loops around it. The initial point chooses which loop you start on.',
      },
      'heat-equation': {
        title: 'Heat Equation / Diffusion',
        what: 'The initial temperature profile smooths out over time while the heat strip shows the current rod state.',
        why: 'The heat equation turns local differences from nearby temperatures into diffusion from hotter regions toward cooler neighbors.',
        formulaTex: "u_t=\\alpha u_{xx}",
        formulaLabel: 'u_t = alpha u_xx',
        watch: 'Sharp peaks disappear quickly. The rod ends are fixed cold here, so average heat can fall as heat flows out through the ends.',
      },
    },
  },
  zh: {
    ui: {
      equation: '变化规则',
      preset: '预设',
      customRule: '自定义规则',
      formulaPreview: '公式预览',
      inputHelp: '可使用 t 和 y，以及 pi、e、^、sin(t)、exp(-t)、sqrt(y)、min(a,b)、max(a,b)。',
      method: '方法',
      system: '系统',
      initialConditions: '初始条件',
      parameters: '参数',
      play: '播放',
      pause: '暂停',
      reset: '重置动画',
      resetView: '重置视图',
      lesson: '章节',
      exportPng: '导出 PNG',
      playbackProgress: '播放进度',
      seeing: '你正在看到什么',
      why: '为什么重要',
      formula: '当前模型',
      values: '当前数值',
      watch: '注意观察',
      beginnerHelp: '新手解释',
      graphHelp: '怎么看图',
      closeHelp: '关闭解释',
      graphInstructions: '拖动可平移，滚轮可缩放。',
      invalidExpression: '微分方程表达式无效。',
      undefinedValue: '未定义',
      shape: '初始热量',
      ranges: {
        t0: '起点 t',
        y0: '起点 y',
        x0: '起点 x',
        duration: '时间',
        steps: '步数',
        speed: '速度',
        theta: '角度',
        omega: '角速度',
        damping: '阻尼',
        gravity: '重力',
        prey: '猎物',
        predator: '捕食者',
        preyGrowth: '猎物增长',
        predation: '捕食强度',
        predatorDeath: '捕食者死亡',
        conversion: '转化率',
        diffusivity: '扩散率',
        heatTime: '时间',
      },
    },
    lessons: {
      'slope-fields': {
        title: '斜率场与初值问题',
        what: "每个短线段表示该点的局部斜率 y'，高亮曲线从选定初值出发。",
        why: 'ODE 不直接给出 y，而是给出解曲线在每个经过位置必须遵守的局部变化规则。',
        formulaTex: "\\frac{dy}{dt}=f(t,y),\\quad y(t_0)=y_0",
        formulaLabel: "dy/dt = f(t,y), y(t0)=y0",
        watch: '解可能靠近平衡、远离不稳定状态，或跟随周期外力摆动。',
      },
      'numerical-methods': {
        title: '数值方法',
        what: 'Euler、中点法和 RK4 用不同方式估计下一步，并求解同一个 ODE。',
        why: '多数微分方程需要数值求解，因此步长和方法会直接影响精度。',
        formulaTex: "y_{n+1}=y_n+h\\,\\Phi(t_n,y_n,h)",
        formulaLabel: '单步数值更新',
        watch: 'Euler 通常最先漂移；同样步数下 RK4 往往更贴近。',
      },
      'phase-portraits': {
        title: '相图与向量场',
        what: '每个点都是一个系统状态。箭头指向下一步运动方向，高亮曲线显示从当前状态出发的未来。',
        why: '相图不用单独画时间轴，也能看出所有可能未来的形状。',
        formulaTex: "x'=F(x,y),\\quad y'=G(x,y)",
        formulaLabel: "x'=F(x,y), y'=G(x,y)",
        watch: '观察固定点、螺旋、鞍点、中心和稳定方向。箭头深浅提示速度大小；箭头长度做了归一化，方便读方向。',
      },
      pendulum: {
        title: '摆与振子',
        what: '主图是相空间：横轴是角度，纵轴是角速度。右上角小图显示真实摆锤位置。',
        why: '二阶方程可以通过同时追踪位置和速度，改写成一阶系统。',
        formulaTex: "\\theta'=\\omega,\\quad \\omega'=-g\\sin(\\theta)-c\\omega",
        formulaLabel: "theta'=omega, omega'=-g sin(theta)-c omega",
        watch: '没有阻尼时，能量基本保持，轨迹沿同一条能量线走；小摆动看起来像闭合环。加入阻尼后，轨迹会向稳定点收缩。',
      },
      population: {
        title: '种群动力学',
        what: '猎物和捕食者数量在 Lotka-Volterra 规则下沿相空间运动。',
        why: '这个简化模型展示追赶式反馈：猎物多了会养活更多捕食者，捕食者多了又会压低猎物。环境上限、灭绝、迁移等属于更复杂模型。',
        formulaTex: "x'=x(a-by),\\quad y'=y(cx-d)",
        formulaLabel: "prey'=prey(a-b predator), predator'=predator(c prey-d)",
        watch: '改变参数会移动平衡点，也会改变轨迹围绕平衡点的形状。初始位置决定从哪一条轨迹开始。',
      },
      'heat-equation': {
        title: '热方程 / 扩散',
        what: '初始温度曲线会随时间变平滑，热量色带显示当前杆上的状态。',
        why: '热方程把一个点和附近温度的差异转化为扩散：高处向低处流，低处被附近补热。',
        formulaTex: "u_t=\\alpha u_{xx}",
        formulaLabel: 'u_t = alpha u_xx',
        watch: '尖峰会很快变平。这里把杆两端固定为冷端，所以热量会从两端流走，平均温可能下降。',
      },
    },
  },
}

export function DifferentialEquationsLesson({ lessonId }: Props) {
  const { locale } = usePlatformLocale()
  const ui = differentialCopy[locale].ui
  const copy = differentialCopy[locale].lessons[lessonId] ?? differentialCopy[locale].lessons['slope-fields']
  const [scalarPresetId, setScalarPresetId] = useState(() => defaultScalarPresetId(lessonId))
  const scalarPreset = scalarOdePresets.find((preset) => preset.id === scalarPresetId) ?? scalarOdePresets[0]
  const [expression, setExpression] = useState(scalarPreset.expression)
  const [t0, setT0] = useState(scalarPreset.defaultT0)
  const [y0, setY0] = useState(scalarPreset.defaultY0)
  const [duration, setDuration] = useState(scalarPreset.defaultDuration)
  const [steps, setSteps] = useState(36)
  const [method, setMethod] = useState<OdeMethod>('rk4')
  const [systemId, setSystemId] = useState(phasePresets[0].id)
  const phasePreset = phasePresets.find((preset) => preset.id === systemId) ?? phasePresets[0]
  const [x0, setX0] = useState(phasePreset.defaultX0)
  const [phaseY0, setPhaseY0] = useState(phasePreset.defaultY0)
  const [theta0, setTheta0] = useState(1.25)
  const [omega0, setOmega0] = useState(0)
  const [damping, setDamping] = useState(0.22)
  const [gravity, setGravity] = useState(1)
  const [prey0, setPrey0] = useState(9)
  const [predator0, setPredator0] = useState(4)
  const [preyGrowth, setPreyGrowth] = useState(0.95)
  const [predation, setPredation] = useState(0.09)
  const [predatorDeath, setPredatorDeath] = useState(0.55)
  const [conversion, setConversion] = useState(0.055)
  const [heatShape, setHeatShape] = useState<HeatShape>('pulse')
  const [diffusivity, setDiffusivity] = useState(0.18)
  const [heatTime, setHeatTime] = useState(0.08)
  const [view, setView] = useState<GraphViewState>(() => defaultViewForLesson(lessonId, phasePreset))
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [helpMode, setHelpMode] = useState<DifferentialHelpMode | null>(null)
  const expressionTex = useMemo(() => expressionToTex(expression), [expression])
  const activeHelpTopic = helpMode ? getDifferentialHelpTopic(helpMode, lessonId, locale) : null

  useEffect(() => {
    const preset = scalarOdePresets.find((candidate) => candidate.id === scalarPresetId)
    if (!preset) return
    setExpression(preset.expression)
    setT0(preset.defaultT0)
    setY0(preset.defaultY0)
    setDuration(preset.defaultDuration)
  }, [scalarPresetId])

  useEffect(() => {
    setX0(phasePreset.defaultX0)
    setPhaseY0(phasePreset.defaultY0)
    if (lessonId === 'phase-portraits') setView(defaultViewForLesson(lessonId, phasePreset))
  }, [lessonId, phasePreset])

  useEffect(() => {
    setScalarPresetId(defaultScalarPresetId(lessonId))
    setView(defaultViewForLesson(lessonId, phasePreset))
    setPlaying(false)
  }, [lessonId])

  const scalarCompile = useMemo((): { fn: ScalarOde; error: string | null } => {
    try {
      return { fn: compileScalarOdeExpression(expression), error: null }
    } catch (caught) {
      return {
        fn: scalarPresetFunction(scalarPreset),
        error: caught instanceof Error ? translateExpressionError(caught.message, locale) : ui.invalidExpression,
      }
    }
  }, [expression, locale, scalarPreset, ui.invalidExpression])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let previous = performance.now()
    const tick = (now: number) => {
      const delta = Math.min(80, now - previous)
      previous = now
      if (lessonId === 'heat-equation') {
        setHeatTime((value) => (value >= 1.2 ? 0 : value + delta * 0.0006 * speed))
      } else {
        const maxTime = lessonId === 'population' ? 30 : lessonId === 'pendulum' ? 24 : lessonId === 'phase-portraits' ? 16 : 12
        setDuration((value) => (value >= maxTime ? 0.5 : value + delta * 0.0012 * speed))
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [lessonId, playing, speed])

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme) => {
      drawDifferentialScene(ctx, viewport, theme, {
        lessonId,
        locale,
        scalarFn: scalarCompile.fn,
        scalarPreset,
        t0,
        y0,
        duration,
        steps: Math.round(steps),
        method,
        phasePreset,
        x0,
        phaseY0,
        theta0,
        omega0,
        damping,
        gravity,
        prey0,
        predator0,
        preyGrowth,
        predation,
        predatorDeath,
        conversion,
        heatShape,
        diffusivity,
        heatTime,
      })
    },
    [
      conversion,
      damping,
      diffusivity,
      duration,
      gravity,
      heatShape,
      heatTime,
      lessonId,
      locale,
      method,
      omega0,
      phasePreset,
      phaseY0,
      predation,
      predator0,
      predatorDeath,
      prey0,
      preyGrowth,
      scalarCompile.fn,
      scalarPreset,
      steps,
      t0,
      theta0,
      x0,
      y0,
    ],
  )

  const values = getCurrentValues({
    lessonId,
    scalarFn: scalarCompile.fn,
    t0,
    y0,
    duration,
    steps: Math.round(steps),
    method,
    phasePreset,
    x0,
    phaseY0,
    theta0,
    omega0,
    damping,
    gravity,
    prey0,
    predator0,
    preyGrowth,
    predation,
    predatorDeath,
    conversion,
    heatShape,
    diffusivity,
    heatTime,
  }, locale)
  const playbackProgress = getDifferentialPlaybackProgress(lessonId, duration, heatTime)
  const seekPlaybackProgress = useCallback((progress: number) => {
    const next = clampProgress(progress)
    if (lessonId === 'heat-equation') {
      setHeatTime(next * 1.2)
    } else {
      const start = differentialPlaybackStartTime
      const end = maxPlaybackTimeForLesson(lessonId)
      setDuration(start + (end - start) * next)
    }
  }, [lessonId])

  const exportPng = () => {
    const canvas = document.querySelector<HTMLCanvasElement>('.diffeq-canvas')
    if (!canvas) return
    const anchor = document.createElement('a')
    anchor.href = canvas.toDataURL('image/png')
    anchor.download = `differential-equations-${lessonId}.png`
    anchor.click()
  }

  return (
    <>
    <ModuleFocusFrame>
      {({ focusButton }) => (
    <LessonScaffold
      className="calculus-lesson diffeq-lesson"
      controlsClassName="calculus-controls diffeq-controls"
      mainClassName="calculus-main diffeq-main"
      explanationClassName="calculus-explanation diffeq-explanation"
      controls={
        <>
        <div className="lesson-learning-entry learning-help-entry">
          <HelpTrigger onClick={() => setHelpMode({ kind: 'beginner' })} ariaLabel={ui.beginnerHelp}>
            {ui.beginnerHelp}
          </HelpTrigger>
        </div>
        {(lessonId === 'slope-fields' || lessonId === 'numerical-methods') && (
          <>
            <h2>{ui.equation}</h2>
            <label>
              {ui.preset}
              <SelectMenu
                value={scalarPresetId}
                options={[
                  { value: 'custom', textValue: ui.customRule, label: <Formula tex="f(t,y)" label={ui.customRule} /> },
                  ...scalarOdePresets.map((preset) => ({
                    value: preset.id,
                    textValue: preset.label,
                    label: <Formula tex={preset.formulaTex} />,
                  })),
                ]}
                onChange={setScalarPresetId}
                ariaLabel={ui.preset}
              />
            </label>
            <label>
              <Formula tex="f(t,y)" />
              <input
                value={expression}
                placeholder="sin(t)-0.35*y"
                onBlur={() => setExpression((current) => normalizeDifferentialInput(current))}
                onChange={(event) => {
                  setScalarPresetId('custom')
                  setExpression(event.target.value)
                }}
              />
            </label>
            <div className="math-formula-preview" aria-label={ui.formulaPreview}>
              <span>{ui.formulaPreview}</span>
              <Formula tex={`\\frac{dy}{dt}=${expressionTex}`} label={`${ui.formulaPreview}: dy/dt=${expression}`} />
            </div>
            <p className="input-help">{ui.inputHelp}</p>
            {scalarCompile.error && <p className="warning-text">{scalarCompile.error}</p>}
            <h2>{ui.initialConditions}</h2>
            <Range label={ui.ranges.t0} labelTex="t_0" value={t0} min={-4} max={4} step={0.05} onChange={setT0} />
            <Range label={ui.ranges.y0} labelTex="y_0" value={y0} min={-4} max={6} step={0.05} onChange={setY0} />
            <Range label={ui.ranges.duration} labelTex={locale === 'zh' ? '\\text{时间}' : '\\text{time}'} value={duration} min={0.5} max={12} step={0.1} onChange={setDuration} />
            <Range label={ui.ranges.steps} labelTex="n" value={steps} min={4} max={160} step={1} onChange={setSteps} />
            {lessonId === 'slope-fields' && (
              <label>
                {ui.method}
                <SelectMenu
                  value={method}
                  options={methodOptions.map((nextMethod) => ({ value: nextMethod, textValue: methodLabel(nextMethod, locale), label: methodLabel(nextMethod, locale) }))}
                  onChange={(value) => setMethod(value as OdeMethod)}
                  ariaLabel={ui.method}
                />
              </label>
            )}
          </>
        )}

        {lessonId === 'phase-portraits' && (
          <>
            <h2>{ui.system}</h2>
            <label>
              {ui.preset}
              <SelectMenu
                value={systemId}
                options={phasePresets.map((preset) => ({ value: preset.id, textValue: preset.label, label: <Formula tex={preset.formulaTex} label={preset.label} /> }))}
                onChange={setSystemId}
                ariaLabel={ui.system}
              />
            </label>
            <Formula tex={phasePreset.formulaTex} block />
            <h2>{ui.initialConditions}</h2>
            <Range label={ui.ranges.x0} labelTex="x_0" value={x0} min={phasePreset.xRange[0]} max={phasePreset.xRange[1]} step={0.05} onChange={setX0} />
            <Range label={ui.ranges.y0} labelTex="y_0" value={phaseY0} min={phasePreset.yRange[0]} max={phasePreset.yRange[1]} step={0.05} onChange={setPhaseY0} />
            <Range label={ui.ranges.duration} labelTex={locale === 'zh' ? '\\text{时间}' : '\\text{time}'} value={duration} min={1} max={16} step={0.1} onChange={setDuration} />
          </>
        )}

        {lessonId === 'pendulum' && (
          <>
            <h2>{ui.initialConditions}</h2>
            <Range label={ui.ranges.theta} labelTex="\\theta_0" value={theta0} min={-3.1} max={3.1} step={0.01} onChange={setTheta0} />
            <Range label={ui.ranges.omega} labelTex="\\omega_0" value={omega0} min={-3} max={3} step={0.05} onChange={setOmega0} />
            <h2>{ui.parameters}</h2>
            <Range label={ui.ranges.damping} labelTex="c" value={damping} min={0} max={1.2} step={0.01} onChange={setDamping} />
            <Range label={ui.ranges.gravity} labelTex="g" value={gravity} min={0.2} max={2.4} step={0.05} onChange={setGravity} />
            <Range label={ui.ranges.duration} labelTex={locale === 'zh' ? '\\text{时间}' : '\\text{time}'} value={duration} min={1} max={24} step={0.1} onChange={setDuration} />
          </>
        )}

        {lessonId === 'population' && (
          <>
            <h2>{ui.initialConditions}</h2>
            <Range label={ui.ranges.prey} labelTex="x_0" value={prey0} min={0.5} max={22} step={0.1} onChange={setPrey0} />
            <Range label={ui.ranges.predator} labelTex="y_0" value={predator0} min={0.5} max={16} step={0.1} onChange={setPredator0} />
            <h2>{ui.parameters}</h2>
            <Range label={ui.ranges.preyGrowth} labelTex="a" value={preyGrowth} min={0.2} max={1.8} step={0.05} onChange={setPreyGrowth} />
            <Range label={ui.ranges.predation} labelTex="b" value={predation} min={0.02} max={0.18} step={0.005} onChange={setPredation} />
            <Range label={ui.ranges.predatorDeath} labelTex="d" value={predatorDeath} min={0.15} max={1.2} step={0.05} onChange={setPredatorDeath} />
            <Range label={ui.ranges.conversion} labelTex="c" value={conversion} min={0.02} max={0.12} step={0.005} onChange={setConversion} />
            <Range label={ui.ranges.duration} labelTex={locale === 'zh' ? '\\text{时间}' : '\\text{time}'} value={duration} min={3} max={30} step={0.2} onChange={setDuration} />
          </>
        )}

        {lessonId === 'heat-equation' && (
          <>
            <h2>{ui.parameters}</h2>
            <label>
              {ui.shape}
              <SelectMenu
                value={heatShape}
                options={heatShapes.map((shape) => ({ value: shape, textValue: heatShapeLabel(shape, locale), label: heatShapeLabel(shape, locale) }))}
                onChange={(value) => setHeatShape(value as HeatShape)}
                ariaLabel={ui.shape}
              />
            </label>
            <Range label={ui.ranges.diffusivity} labelTex="\\alpha" value={diffusivity} min={0.02} max={0.8} step={0.01} onChange={setDiffusivity} />
            <Range label={ui.ranges.heatTime} labelTex="t" value={heatTime} min={0} max={1.2} step={0.01} onChange={setHeatTime} />
          </>
        )}
        </>
      }

      main={
        <>
        <div className="calculus-title-row diffeq-title-row">
          <div>
            <p className="eyebrow">{ui.lesson}</p>
            <h1>{copy.title}</h1>
          </div>
        </div>
        <div className="graph-help-stage">
          <GraphCanvas
            className="graph-canvas diffeq-canvas interactive-graph-canvas"
            ariaLabel={`${copy.title}. ${ui.graphInstructions}`}
            xMin={view.xMin}
            xMax={view.xMax}
            yMin={view.yMin}
            yMax={view.yMax}
            draw={draw}
            onViewportChange={setView}
          />
          <LessonStageActions
            graphLabel={ui.graphHelp}
            graphAriaLabel={ui.graphHelp}
            onGraphHelp={() => setHelpMode({ kind: 'graph' })}
            focusButton={focusButton}
            exportLabel={ui.exportPng}
            onExport={exportPng}
          />
        </div>
        <div className="calculus-playback diffeq-playback platform-card">
          <div className="transport-buttons">
            <button type="button" className="primary-button" aria-label={playing ? ui.pause : ui.play} onClick={() => setPlaying((current) => !current)}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
              {playing ? ui.pause : ui.play}
            </button>
            <button type="button" onClick={() => resetLesson()}>
              <RotateCcw size={16} />
              {ui.reset}
            </button>
            <button type="button" onClick={() => setView(defaultViewForLesson(lessonId, phasePreset))}>
              <LocateFixed size={16} />
              {ui.resetView}
            </button>
          </div>
          <PlaybackProgress label={ui.playbackProgress} value={playbackProgress} onChange={seekPlaybackProgress} />
          <Range label={ui.ranges.speed} labelTex={locale === 'zh' ? '\\text{速度}' : '\\text{speed}'} value={speed} min={0.25} max={3} step={0.05} valueSuffix="x" onChange={setSpeed} />
        </div>
        </>
      }

      explanation={
        <>
        <h2>{ui.seeing}</h2>
        <p>{renderDifferentialWhat(lessonId, locale, copy.what, (term) => setHelpMode({ kind: 'term', term }))}</p>
        <h2>{ui.why}</h2>
        <p>{copy.why}</p>
        <h2>{ui.formula}</h2>
        <p className="formula-text formula-card">
          <Formula tex={currentFormulaTex(lessonId, expressionTex, phasePreset, copy.formulaTex)} block label={copy.formulaLabel} />
        </p>
        <LessonTermLinks lessonId={lessonId} locale={locale} onTerm={(term) => setHelpMode({ kind: 'term', term })} />
        <Legend lessonId={lessonId} locale={locale} />
        <h2>{ui.values}</h2>
        <dl>
          {values.map((row) => (
            <div key={`${row.label}-${row.labelTex ?? ''}`}>
              <dt>{renderValueLabel(row, (term) => setHelpMode({ kind: 'term', term }))}</dt>
              <dd>
                <span>{row.value}</span>
                {row.note && <small className="diffeq-value-note">{row.note}</small>}
              </dd>
            </div>
          ))}
        </dl>
        <h2>{ui.watch}</h2>
        <p>{renderWatchText(lessonId, locale, scalarPresetId, copy.watch)}</p>
        </>
      }
    />
      )}
    </ModuleFocusFrame>
    <LearningDrawer topic={activeHelpTopic} closeLabel={ui.closeHelp} onClose={() => setHelpMode(null)} />
    </>
  )

  function resetLesson() {
    setPlaying(false)
    const preset = scalarOdePresets.find((candidate) => candidate.id === defaultScalarPresetId(lessonId)) ?? scalarOdePresets[0]
    setScalarPresetId(preset.id)
    setExpression(preset.expression)
    setT0(preset.defaultT0)
    setY0(preset.defaultY0)
    setDuration(lessonId === 'population' ? 18 : lessonId === 'pendulum' ? 10 : preset.defaultDuration)
    setSteps(36)
    setMethod('rk4')
    setX0(phasePreset.defaultX0)
    setPhaseY0(phasePreset.defaultY0)
    setTheta0(1.25)
    setOmega0(0)
    setDamping(0.22)
    setGravity(1)
    setPrey0(9)
    setPredator0(4)
    setPreyGrowth(0.95)
    setPredation(0.09)
    setPredatorDeath(0.55)
    setConversion(0.055)
    setHeatShape('pulse')
    setDiffusivity(0.18)
    setHeatTime(0.08)
    setView(defaultViewForLesson(lessonId, phasePreset))
  }
}

function Range({ label, labelTex, value, min, max, step, valueSuffix, onChange }: { label: string; labelTex?: string; value: number; min: number; max: number; step: number; valueSuffix?: string; onChange: (value: number) => void }) {
  if (valueSuffix) {
    return (
      <label className="speed-control">
        <span className="range-label">{labelTex ? <Formula tex={labelTex} /> : label}</span>
        <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <strong>{`${value.toFixed(2)}${valueSuffix}`}</strong>
      </label>
    )
  }

  return (
    <label>
      <span className="range-label">
        <span>{labelTex ? <Formula tex={labelTex} /> : label}:</span>
        <strong>{round(value)}</strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

const differentialPlaybackStartTime = 0.5

function PlaybackProgress({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const progress = clampProgress(value)
  return (
    <label className="playback-progress-control">
      <span>{label}</span>
      <input type="range" min={0} max={1} step={0.001} value={progress} aria-label={label} onChange={(event) => onChange(Number(event.target.value))} />
      <strong>{Math.round(progress * 100)}%</strong>
    </label>
  )
}

function getDifferentialPlaybackProgress(lessonId: string, duration: number, heatTime: number): number {
  if (lessonId === 'heat-equation') return progressFromValue(heatTime, 0, 1.2)
  return progressFromValue(duration, differentialPlaybackStartTime, maxPlaybackTimeForLesson(lessonId))
}

function maxPlaybackTimeForLesson(lessonId: string): number {
  if (lessonId === 'population') return 30
  if (lessonId === 'pendulum') return 24
  if (lessonId === 'phase-portraits') return 16
  return 12
}

function progressFromValue(value: number, start: number, end: number): number {
  const span = end - start
  if (Math.abs(span) < 1e-9) return 0
  return clampProgress((value - start) / span)
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function Legend({ lessonId, locale }: { lessonId: string; locale: DifferentialLocale }) {
  const rows = legendRows(lessonId, locale)
  if (!rows.length) return null
  return (
    <div className="diffeq-legend" aria-label={locale === 'zh' ? '图例' : 'Legend'}>
      {rows.map((row) => (
        <span key={row.label}>
          <i style={{ background: row.color }} />
          {row.label}
        </span>
      ))}
    </div>
  )
}

function LessonTermLinks({ lessonId, locale, onTerm }: { lessonId: string; locale: DifferentialLocale; onTerm: (term: DifferentialTermId) => void }) {
  const links = lessonTermLinks(lessonId, locale)
  if (!links.length) return null

  return (
    <div className="diffeq-variable-terms" aria-label={locale === 'zh' ? '术语解释' : 'Term explanations'}>
      <span>{termGroupLabel(lessonId, locale)}</span>
      {links.map((link) => (
        <TermButton key={link.term} onClick={() => onTerm(link.term)}>
          {link.tex ? <Formula tex={link.tex} /> : link.label}
        </TermButton>
      ))}
    </div>
  )
}

function lessonTermLinks(lessonId: string, locale: DifferentialLocale): { term: DifferentialTermId; label: string; tex?: string }[] {
  if (lessonId === 'numerical-methods') {
    return [
      { term: 'step-size', label: 'h', tex: 'h' },
      { term: 'euler', label: 'Euler' },
      { term: 'midpoint', label: locale === 'zh' ? '中点法' : 'midpoint' },
      { term: 'rk4', label: 'RK4' },
    ]
  }
  if (lessonId === 'phase-portraits') {
    return [
      { term: 'phase-state', label: locale === 'zh' ? '状态点' : 'state point' },
      { term: 'phase-arrow', label: locale === 'zh' ? '箭头' : 'arrows' },
      { term: 'phase-time', label: locale === 'zh' ? '时间方向' : 'time direction' },
    ]
  }
  if (lessonId === 'pendulum') {
    return [
      { term: 'pendulum-theta', label: 'theta', tex: '\\theta' },
      { term: 'pendulum-omega', label: 'omega', tex: '\\omega' },
      { term: 'pendulum-damping', label: 'c', tex: 'c' },
      { term: 'pendulum-gravity', label: 'g', tex: 'g' },
    ]
  }
  if (lessonId === 'population') {
    return [
      { term: 'population-prey-growth', label: 'a', tex: 'a' },
      { term: 'population-predation', label: 'b', tex: 'b' },
      { term: 'population-predator-death', label: 'd', tex: 'd' },
      { term: 'population-conversion', label: 'c', tex: 'c' },
      { term: 'population-equilibrium', label: locale === 'zh' ? '平衡点' : 'equilibrium' },
    ]
  }
  if (lessonId === 'heat-equation') {
    return [
      { term: 'heat-u', label: 'u', tex: 'u' },
      { term: 'heat-alpha', label: 'alpha', tex: '\\alpha' },
      { term: 'heat-ut', label: 'u_t', tex: 'u_t' },
      { term: 'heat-uxx', label: 'u_xx', tex: 'u_{xx}' },
      { term: 'heat-boundary', label: locale === 'zh' ? '冷端假设' : 'cold ends' },
    ]
  }
  return []
}

function termGroupLabel(lessonId: string, locale: DifferentialLocale): string {
  if (lessonId === 'heat-equation') return locale === 'zh' ? '变量 / 假设' : 'Variables / assumptions'
  if (lessonId === 'numerical-methods') return locale === 'zh' ? '方法 / 步长' : 'Methods / step'
  if (lessonId === 'phase-portraits') return locale === 'zh' ? '图像语言' : 'Graph language'
  return locale === 'zh' ? '参数' : 'Parameters'
}

function renderValueLabel(row: ValueRow, onTerm: (term: DifferentialTermId) => void) {
  const term = row.term
  return (
    <>
      {term ? (
        <TermButton onClick={() => onTerm(term)}>{row.label}</TermButton>
      ) : (
        <span>{row.label}</span>
      )}
      {row.labelTex && (
        <span className="diffeq-value-formula">
          <Formula tex={row.labelTex} />
        </span>
      )}
    </>
  )
}

function renderDifferentialWhat(lessonId: string, locale: DifferentialLocale, fallback: string, onTerm: (term: DifferentialTermId) => void): ReactNode {
  const term = (id: DifferentialTermId, labelText: string) => (
    <TermButton key={`${id}-${labelText}`} onClick={() => onTerm(id)}>
      {labelText}
    </TermButton>
  )

  if (lessonId === 'slope-fields') {
    return locale === 'zh' ? (
      <>
        每个短线段表示该点的局部斜率 {term('y-prime', "y'")}；整张 {term('slope-field', '斜率场')} 像一张方向地图，高亮曲线从选定的 {term('initial-value', '初值')} 出发并顺着这些方向前进。
      </>
    ) : (
      <>
        Each short segment shows the local slope {term('y-prime', "y'")}. The {term('slope-field', 'slope field')} works like a direction map, and the highlighted curve starts from the selected {term('initial-value', 'initial value')}.
      </>
    )
  }

  if (lessonId === 'numerical-methods') {
    return locale === 'zh' ? (
      <>
        {term('euler', 'Euler')}、{term('midpoint', '中点法')} 和 {term('rk4', 'RK4')} 都在求同一个 {term('ode', 'ODE')}，差别在于每一步怎样估计下一段曲线的方向。
      </>
    ) : (
      <>
        {term('euler', 'Euler')}, {term('midpoint', 'midpoint')}, and {term('rk4', 'RK4')} solve the same {term('ode', 'ODE')}; they differ in how each step estimates the curve direction.
      </>
    )
  }

  if (lessonId === 'phase-portraits') {
    return locale === 'zh' ? (
      <>
        主图里的点是 {term('phase-state', '状态')}，不是物体的真实空间位置。箭头给出 {term('phase-arrow', '下一步方向')}：长度做了归一化，深浅才提示速度大小。轨迹展示系统从一个初始状态出发后的运动。
      </>
    ) : (
      <>
        A point on the graph is a {term('phase-state', 'state')}, not a physical location. Arrows give the {term('phase-arrow', 'next-motion direction')}: length is normalized, while opacity hints speed. A trajectory shows the motion from one initial state.
      </>
    )
  }

  if (lessonId === 'pendulum') {
    return locale === 'zh' ? (
      <>
        主图横轴是角度 {term('pendulum-theta', 'θ')}，纵轴是角速度 {term('pendulum-omega', 'ω')}。一个点代表“现在摆到哪里、转得多快”；右上角小图才是摆锤在真实空间里的位置。
      </>
    ) : (
      <>
        The horizontal axis is angle {term('pendulum-theta', 'theta')}; the vertical axis is angular velocity {term('pendulum-omega', 'omega')}. One point means “where the pendulum is and how fast it is turning”; the inset shows the physical bob.
      </>
    )
  }

  if (lessonId === 'population') {
    return locale === 'zh' ? (
      <>
        横轴是猎物数量 {term('phase-state', 'x')}，纵轴是捕食者数量 {term('phase-state', 'y')}。轨迹不是地理路线，而是两个种群数量随时间变化时，在状态平面留下的路线。
      </>
    ) : (
      <>
        The horizontal axis is prey {term('phase-state', 'x')}; the vertical axis is predators {term('phase-state', 'y')}. The trajectory is not a map route; it is the path traced by the two population counts over time.
      </>
    )
  }

  if (lessonId === 'heat-equation') {
    return locale === 'zh' ? (
      <>
        每个位置的温度写作 {term('heat-u', 'u(x,t)')}。黄色曲线是当前温度，灰色曲线是初始温度；参数 {term('heat-alpha', 'α')} 控制扩散速度，两端采用 {term('heat-boundary', '冷端假设')}。
      </>
    ) : (
      <>
        The temperature at each position is {term('heat-u', 'u(x,t)')}. The yellow curve is current temperature; the gray curve is the initial temperature. The parameter {term('heat-alpha', 'alpha')} controls diffusion speed, with {term('heat-boundary', 'cold-end boundary conditions')}.
      </>
    )
  }

  return fallback
}

function renderWatchText(lessonId: string, locale: DifferentialLocale, scalarPresetId: string, fallback: string): ReactNode {
  if (lessonId === 'slope-fields' && scalarPresetId === 'logistic') {
    return locale === 'zh' ? (
      <>
        这个 logistic 例子里 {formula('y=0')} 和 {formula('y=4')} 是平衡位置。只要 {formula('0<y<4')}，曲线会往上走；超过 {formula('4')} 后，增长率变负，曲线会往下回落。
      </>
    ) : (
      <>
        In this logistic example, {formula('y=0')} and {formula('y=4')} are equilibria. When {formula('0<y<4')}, the curve moves upward; above {formula('4')}, growth becomes negative and the curve falls back.
      </>
    )
  }
  return fallback
}

function getDifferentialHelpTopic(mode: DifferentialHelpMode, lessonId: string, locale: DifferentialLocale): HelpTopic {
  if (mode.kind === 'term') return differentialTermTopic(mode.term, locale)
  if (mode.kind === 'graph') return differentialGraphTopic(lessonId, locale)
  return differentialBeginnerTopic(lessonId, locale)
}

function differentialBeginnerTopic(lessonId: string, locale: DifferentialLocale): HelpTopic {
  if (lessonId === 'numerical-methods') {
    return locale === 'zh'
      ? {
          eyebrow: '从零开始',
          title: 'Euler、中点法和 RK4 到底在做什么',
          summary: '它们都是“不会直接解出公式时，用很多小步把曲线走出来”的方法。',
          sections: [
            {
              title: '共同目标',
              body: (
                <>
                  微分方程给你的不是 y 的完整答案，而是每个位置的斜率 {formula("y'=f(t,y)")}。数值方法从初值出发，每次前进一小段 {formula('h')}，把这些小段连起来近似真正的解曲线。
                </>
              ),
            },
            {
              title: '三种方法的差别',
              items: [
                'Euler：只看当前位置的斜率，直接沿这个方向走一步；直觉最强，但容易越走越偏。',
                '中点法：先按当前斜率试走半步，在半步位置重新看斜率，再用这个更接近中间的斜率走完整一步。',
                'RK4：在一步里看 4 次斜率，把起点、中间、终点附近的信息加权平均，通常同样步数下更稳。',
              ],
            },
            {
              title: '不要把 RK4 当成真答案',
              body: '三条线都在猜同一条真正的解曲线。黄色 RK4 只是这里更可靠的参考，不是严格解析解。',
            },
            {
              title: '步数和 h 的关系',
              body: (
                <>
                  你设定总时间和步数，单步长度就是 {formula('h=\\Delta t/n')}。步数越多，{formula('h')} 越小；小步通常更准，但要计算更多次。
                </>
              ),
            },
            {
              title: '怎么探索',
              items: ['把步数调低，先看三条线明显分开。', '再逐渐增加步数，观察 Euler 和中点法如何靠近 RK4。', '换一个变化规则，看哪种曲线最容易漂移。'],
            },
          ],
        }
      : {
          eyebrow: 'Start from zero',
          title: 'What Euler, midpoint, and RK4 are doing',
          summary: 'They all approximate a curve by taking many small steps when the equation is hard to solve exactly.',
          sections: [
            {
              title: 'Shared goal',
              body: (
                <>
                  A differential equation gives local slope, not the full answer: {formula("y'=f(t,y)")}. A numerical method starts at the initial value, takes small steps {formula('h')}, and connects those steps into an approximate solution.
                </>
              ),
            },
            {
              title: 'How the methods differ',
              items: [
                'Euler uses only the slope at the current point, so it is simple but drifts easily.',
                'Midpoint takes a half-step guess, checks the slope there, then uses that middle slope for the full step.',
                'RK4 samples four slopes inside one step and blends them, so it is usually steadier for the same step count.',
              ],
            },
            {
              title: 'RK4 is not the exact answer',
              body: 'All three paths are approximating the same true solution curve. The yellow RK4 curve is just a more reliable reference here, not an analytic solution.',
            },
            {
              title: 'Steps and h',
              body: (
                <>
                  You set total time and step count, so one step has length {formula('h=\\Delta t/n')}. More steps make {formula('h')} smaller; smaller steps are usually more accurate but cost more computation.
                </>
              ),
            },
            {
              title: 'How to explore',
              items: ['Lower the step count first so the paths separate visibly.', 'Increase the step count and watch Euler and midpoint move closer to RK4.', 'Switch the change rule and notice which method drifts first.'],
            },
          ],
        }
  }

  if (lessonId === 'slope-fields') {
    return locale === 'zh'
      ? {
          eyebrow: '从零开始',
          title: "为什么斜率场要到处计算 y'",
          summary: "斜率场不是一条曲线，而是一张“如果曲线经过这里，它下一瞬间该往哪走”的地图。",
          sections: [
            {
              title: '微分方程给的是方向',
              body: (
                <>
                  公式 {formula("y'=f(t,y)")} 的意思是：只要你告诉我现在的位置 {formula('(t,y)')}，我就能算出这一点的斜率 {formula("y'")}。它没有直接告诉你完整的 {formula('y(t)')}。
                </>
              ),
            },
            {
              title: "为什么每个点都要算 y'",
              body: "因为一开始你还不知道真正的解曲线会经过哪里。把许多点的斜率都画出来后，任何一条解曲线只要经过其中某个区域，就应该顺着附近短线段的方向走。",
            },
            {
              title: '初值选择一条路',
              body: (
                <>
                  初值 {formula('y(t_0)=y_0')} 就像在地图上放下起点。高亮曲线从这个点出发，然后一直遵守斜率场给出的方向。
                </>
              ),
            },
          ],
        }
      : {
          eyebrow: 'Start from zero',
          title: "Why a slope field computes y' everywhere",
          summary: 'A slope field is a map of possible directions, not one single solution curve.',
          sections: [
            {
              title: 'The equation gives direction',
              body: (
                <>
                  The formula {formula("y'=f(t,y)")} means: if you give the current point {formula('(t,y)')}, the rule gives the local slope {formula("y'")}. It does not directly give the whole function {formula('y(t)')}.
                </>
              ),
            },
            {
              title: "Why compute y' at every point",
              body: 'Before choosing an initial value, the solution could pass through many places. Drawing many local slopes shows what any possible solution should do wherever it passes.',
            },
            {
              title: 'The initial value picks one path',
              body: (
                <>
                  The condition {formula('y(t_0)=y_0')} places the starting point on the map. The highlighted curve starts there and keeps following the local directions.
                </>
              ),
            },
          ],
        }
  }

  if (lessonId === 'phase-portraits') {
    return locale === 'zh'
      ? {
          eyebrow: '从零开始',
          title: '相图不是普通坐标图',
          summary: '相图把系统的状态放在平面上；时间没有单独画成横轴，而是藏在轨迹前进方向里。',
          sections: [
            {
              title: '点代表状态',
              body: (
                <>
                  图上的一个点 {formula('(x,y)')} 表示两个状态变量当前的数值。它通常不是物体在真实空间里的位置。
                </>
              ),
            },
            {
              title: '箭头代表下一步方向',
              body: (
                <>
                  规则 {formula("x'=F(x,y),\\ y'=G(x,y)")} 告诉你从这个状态下一瞬间会往哪里走。本图把箭头长度归一化，所以主要读方向；箭头越深，速度大小通常越大。
                </>
              ),
            },
            {
              title: '看长期趋势',
              body: '从初始点出发，轨迹会沿箭头移动。整张图让你看出会靠近固定点、绕圈、逃走，还是被某个方向拉开。',
            },
          ],
        }
      : {
          eyebrow: 'Start from zero',
          title: 'A phase portrait is not an ordinary coordinate plot',
          summary: 'A phase portrait places the system state in the plane. Time is not a separate horizontal axis; it is carried by the direction of motion.',
          sections: [
            {
              title: 'A point is a state',
              body: (
                <>
                  A point {formula('(x,y)')} means the current values of two state variables. It is usually not a physical location.
                </>
              ),
            },
            {
              title: 'Arrows show the next direction',
              body: (
                <>
                  The rule {formula("x'=F(x,y),\\ y'=G(x,y)")} tells which way the state moves next. This graph normalizes arrow length, so read direction first; darker arrows usually mean higher speed.
                </>
              ),
            },
            {
              title: 'Read the long-term behavior',
              body: 'Starting from the initial point, the trajectory follows the arrows. The whole field shows whether motion approaches a fixed point, loops, escapes, or stretches along a direction.',
            },
          ],
        }
  }

  if (lessonId === 'pendulum') {
    return locale === 'zh'
      ? {
          eyebrow: '从零开始',
          title: '摆图里为什么有两个坐标',
          summary: '摆的真实位置只靠角度还不够；要预测下一刻，还必须知道它正在往哪边转、转得多快。',
          sections: [
            {
              title: '两个状态变量',
              body: (
                <>
                  横轴 {formula('\\theta')} 是角度，纵轴 {formula('\\omega')} 是角速度。一个点代表“角度是多少、转得多快”。
                </>
              ),
            },
            {
              title: '公式的动作语言',
              body: (
                <>
                  {formula("\\theta'=\\omega")} 说角速度会改变角度；{formula("\\omega'=-g\\sin(\\theta)-c\\omega")} 说重力把摆拉回中间，阻尼 {formula('c')} 让速度逐渐损失。
                </>
              ),
            },
            {
              title: '能量图像',
              body: '没有阻尼时，轨迹沿着同一条能量线走；有阻尼时，能量不断减少，所以轨迹向稳定点缩进去。',
            },
          ],
        }
      : {
          eyebrow: 'Start from zero',
          title: 'Why the pendulum graph has two coordinates',
          summary: 'Angle alone is not enough to predict a pendulum. You also need to know which way it is turning and how fast.',
          sections: [
            {
              title: 'Two state variables',
              body: (
                <>
                  The horizontal axis {formula('\\theta')} is angle; the vertical axis {formula('\\omega')} is angular velocity. One point means “current angle and current turning speed.”
                </>
              ),
            },
            {
              title: 'The formula as motion',
              body: (
                <>
                  {formula("\\theta'=\\omega")} says angular velocity changes angle. {formula("\\omega'=-g\\sin(\\theta)-c\\omega")} says gravity pulls the pendulum back toward center while damping {formula('c')} removes speed.
                </>
              ),
            },
            {
              title: 'Energy picture',
              body: 'With no damping, the trajectory stays on one energy curve. With damping, energy keeps decreasing, so the path spirals toward the stable point.',
            },
          ],
        }
  }

  if (lessonId === 'population') {
    return locale === 'zh'
      ? {
          eyebrow: '从零开始',
          title: '猎物和捕食者为什么会绕圈',
          summary: '这个模型只保留一个反馈：猎物多会支持更多捕食者，捕食者多又会压低猎物。',
          sections: [
            {
              title: '坐标轴',
              body: (
                <>
                  横轴 {formula('x')} 是猎物数量，纵轴 {formula('y')} 是捕食者数量。轨迹表示这两个数量随时间一起变化。
                </>
              ),
            },
            {
              title: '参数怎么读',
              items: [
                'a：没有捕食者时，猎物自己增长的速度。',
                'b：捕食强度，越大猎物被压低得越快。',
                'd：捕食者死亡，越大捕食者越难维持。',
                'c：转化率，越大同样猎物能支持更多捕食者。',
              ],
            },
            {
              title: '平衡点',
              body: (
                <>
                  非零平衡点是 {formula('(d/c,\\ a/b)')}。改参数时，你其实在移动这个中心；初始位置决定你围绕它走哪一条轨迹。
                </>
              ),
            },
          ],
        }
      : {
          eyebrow: 'Start from zero',
          title: 'Why prey and predators cycle',
          summary: 'This model keeps one feedback loop: more prey can support more predators, and more predators push prey down.',
          sections: [
            {
              title: 'Axes',
              body: (
                <>
                  The horizontal axis {formula('x')} is prey; the vertical axis {formula('y')} is predators. The trajectory shows how both counts change together over time.
                </>
              ),
            },
            {
              title: 'Parameters',
              items: [
                'a: prey growth when predators are absent.',
                'b: predation strength; larger b pushes prey down faster.',
                'd: predator death; larger d makes predators harder to sustain.',
                'c: conversion; larger c lets the same prey support more predators.',
              ],
            },
            {
              title: 'Equilibrium',
              body: (
                <>
                  The nonzero equilibrium is {formula('(d/c,\\ a/b)')}. Changing parameters moves that center; the initial point decides which loop you start on.
                </>
              ),
            },
          ],
        }
  }

  if (lessonId === 'heat-equation') {
    return locale === 'zh'
      ? {
          eyebrow: '从零开始',
          title: '热方程在让曲线变平',
          summary: '这里是在看一根杆上的温度分布如何随时间扩散。',
          sections: [
            {
              title: '图上的对象',
              body: (
                <>
                  横轴 {formula('x')} 是杆上的位置，曲线高度 {formula('u(x,t)')} 是温度。灰色是初始温度，黄色是当前温度，下方色带是同一根杆的热度分布。
                </>
              ),
            },
            {
              title: 'uₓₓ 的直觉',
              body: (
                <>
                  {formula('u_{xx}')} 可以理解成“这个点和附近平均温度的差”。比邻居高很多时通常会降温；比邻居低时通常会升温；平坦区域变化很慢。
                </>
              ),
            },
            {
              title: '边界假设',
              body: '这个模拟把杆两端固定为冷端，所以热量可以从两端流走。平均温下降不是数值错误，而是边界条件造成的。',
            },
          ],
        }
      : {
          eyebrow: 'Start from zero',
          title: 'The heat equation smooths a curve',
          summary: 'This view is not an arrow trajectory. It shows how temperature along one rod diffuses over time.',
          sections: [
            {
              title: 'What is on the graph',
              body: (
                <>
                  The horizontal axis {formula('x')} is position on the rod, and curve height {formula('u(x,t)')} is temperature. Gray is the initial temperature, yellow is the current temperature, and the strip below is the same rod as a heat map.
                </>
              ),
            },
            {
              title: 'Intuition for uₓₓ',
              body: (
                <>
                  {formula('u_{xx}')} can be read as “how this point compares with nearby average temperature.” A point much hotter than neighbors usually cools; a point cooler than neighbors warms; flat regions change slowly.
                </>
              ),
            },
            {
              title: 'Boundary assumption',
              body: 'This simulation fixes both rod ends as cold. Heat can flow out through those ends, so falling average temperature is a boundary-condition effect, not a numerical bug.',
            },
          ],
        }
  }

  return locale === 'zh'
    ? {
        eyebrow: '从零开始',
        title: '这个实验在看什么',
        summary: '这里的核心想法是：局部的变化规则会生成整体运动。',
        sections: [
          { title: '先看局部', body: "箭头或短线段告诉你当前位置的瞬时变化方向，也就是类似 x'、y' 或 y' 的导数信息。" },
          { title: '再看整体', body: '轨迹是把很多局部方向连续接起来之后形成的路径。不同初始位置会选出不同路径。' },
        ],
      }
    : {
        eyebrow: 'Start from zero',
        title: 'What this experiment is showing',
        summary: 'The core idea is that local change rules generate global motion.',
        sections: [
          { title: 'Read the local rule first', body: "Arrows or small segments show the instantaneous direction of change, such as x', y', or y'." },
          { title: 'Then read the whole motion', body: 'A trajectory connects many local directions. Different starting points select different paths.' },
        ],
      }
}

function differentialGraphTopic(lessonId: string, locale: DifferentialLocale): HelpTopic {
  if (lessonId === 'numerical-methods') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '数值方法图像读法',
          summary: '这张图同时画出三种近似解，重点不是哪条线“好看”，而是哪条线在同样步数下更稳定。',
          sections: [
            { title: '颜色', items: ['紫色：Euler。', '绿色：中点法。', '黄色：RK4。'] },
            { title: '点和线', body: 'Euler 上的小点是它每一步落下的位置。步数越少，每一步越长，误差通常越明显。' },
            { title: '你应该观察什么', body: '把步数降低时，三条曲线会分开；把步数提高时，它们会靠近。若 Euler 很快偏离，说明这个变化规则对步长更敏感。黄色 RK4 只是更可靠的数值参考，不是严格真答案。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read the numerical methods graph',
          summary: 'The graph compares three approximate solutions. The key question is which path stays stable with the same number of steps.',
          sections: [
            { title: 'Colors', items: ['Purple: Euler.', 'Green: midpoint.', 'Yellow: RK4.'] },
            { title: 'Dots and lines', body: 'Small dots mark the points Euler lands on. Fewer steps mean longer steps, and errors usually become more visible.' },
            { title: 'What to watch', body: 'Lower the step count to make the paths separate, then raise it to see them converge. Early Euler drift means the rule is sensitive to step size. Yellow RK4 is a better numerical reference here, not the exact truth.' },
          ],
        }
  }

  if (lessonId === 'slope-fields') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '斜率场图像读法',
          summary: "把这张图当作方向地图：每个短线段都在回答“如果解曲线经过这里，它应该往哪个方向走”。",
          sections: [
            { title: '灰色短线段', body: "表示该点的 y'。向上倾斜代表 y 正在增加，向下倾斜代表 y 正在减少，越陡表示变化越快。" },
            { title: '黄色曲线', body: '这是从当前初值出发的解曲线。它不是随便画的，而是一路尽量贴着附近短线段的方向。' },
            { title: '黄色点', body: '这是初值点。移动 t0 或 y0，就相当于换一个起点，曲线会改走另一条路。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read a slope field',
          summary: 'Treat the graph as a direction map: each segment says where a solution would head if it passed through that point.',
          sections: [
            { title: 'Gray segments', body: "Each segment shows y' at that point. Upward tilt means y is increasing; downward tilt means y is decreasing; steeper means faster change." },
            { title: 'Yellow curve', body: 'This is the solution from the current initial value. It follows the nearby segment directions.' },
            { title: 'Yellow point', body: 'This is the initial value. Moving t0 or y0 changes the starting point and selects a different solution.' },
          ],
        }
  }

  if (lessonId === 'phase-portraits') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '相图图像读法',
          summary: '横轴和纵轴都是状态变量，时间藏在轨迹的前进方向里。',
          sections: [
            { title: '点', body: '一个点代表系统当前状态 (x,y)。移动初始 x0、y0，就是把系统放到另一个初始状态。' },
            { title: '箭头', body: '箭头主要表示方向。为了让图不乱，箭头长度做了归一化；箭头越深，速度大小通常越大。' },
            { title: '轨迹', body: '黄色轨迹是从当前初始状态出发的未来。浅色轨迹是其他起点，用来帮助你看整体结构。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read a phase portrait',
          summary: 'Both axes are state variables. Time is carried by the direction of travel along trajectories.',
          sections: [
            { title: 'Point', body: 'A point is the current state (x,y). Moving x0 or y0 places the system in a different initial state.' },
            { title: 'Arrows', body: 'Arrows mainly show direction. Length is normalized to keep the field readable; darker arrows usually indicate larger speed.' },
            { title: 'Trajectory', body: 'The yellow trajectory is the future from the current initial state. Muted trajectories from other seeds reveal the global structure.' },
          ],
        }
  }

  if (lessonId === 'pendulum') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '摆相图读法',
          summary: '主图不是摆锤的真实空间路线，而是角度和角速度组成的状态图。',
          sections: [
            { title: '横轴和纵轴', body: '横轴 θ 表示摆偏离竖直方向的角度；纵轴 ω 表示角度变化有多快。ω 为正和为负代表转动方向相反。' },
            { title: '右上角小图', body: '小图显示当前摆锤在真实空间里的位置。主图显示同一时刻的状态点在哪里。' },
            { title: '轨迹形状', body: '闭合或近似闭合表示能量基本守恒；向中心缩进去表示阻尼正在移除能量。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read the pendulum phase plot',
          summary: 'The main plot is not the bob route in real space. It is a state plot of angle and angular velocity.',
          sections: [
            { title: 'Axes', body: 'Horizontal θ is angle away from vertical; vertical ω is how quickly the angle changes. Positive and negative ω mean opposite turning directions.' },
            { title: 'Inset', body: 'The inset shows the current bob position in physical space. The main plot shows the state point at the same moment.' },
            { title: 'Trajectory shape', body: 'Closed or nearly closed loops mean energy is mostly conserved. Inward spiraling means damping is removing energy.' },
          ],
        }
  }

  if (lessonId === 'population') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '种群相图读法',
          summary: '横轴是猎物，纵轴是捕食者；轨迹方向表示两个种群随时间怎样互相追赶。',
          sections: [
            { title: '黄色点和线', body: '黄色点是当前初始种群；黄色轨迹是从这个初始状态开始后，猎物和捕食者数量一起变化的路径。' },
            { title: '蓝色点', body: '蓝色点是非零平衡点 (d/c, a/b)。在这个点附近，猎物和捕食者刚好互相抵消增长和减少。' },
            { title: '参数变化', body: '调大或调小参数会移动平衡点，也会改变环绕它的轨迹形状；初始点决定你从哪条轨迹开始。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read the population phase plot',
          summary: 'The horizontal axis is prey; the vertical axis is predators. Trajectory direction shows how the two counts chase each other over time.',
          sections: [
            { title: 'Yellow point and path', body: 'The yellow point is the current initial population. The yellow path shows how prey and predators change together from that state.' },
            { title: 'Blue point', body: 'The blue point is the nonzero equilibrium (d/c, a/b), where prey and predator growth effects balance.' },
            { title: 'Parameter changes', body: 'Changing parameters moves the equilibrium and reshapes the paths around it; the initial point chooses which path you start on.' },
          ],
        }
  }

  if (lessonId === 'heat-equation') {
    return locale === 'zh'
      ? {
          eyebrow: '怎么看图',
          title: '热方程图像读法',
          summary: '这里没有箭头或相轨迹；你看到的是同一根杆的温度曲线随时间变平。',
          sections: [
            { title: '曲线', body: '灰色曲线是初始温度。黄色曲线是当前温度。横轴是杆上的位置 x，曲线高度是温度 u。' },
            { title: '色带', body: '下方色带是同一根杆的热度分布：颜色越暖，表示那个位置越热。' },
            { title: '动画', body: '播放时，尖峰会被抹平，热量从高处向附近低处扩散。因为两端固定为冷端，平均温可能逐渐下降。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read the heat equation graph',
          summary: 'There are no arrows or phase trajectories here. You are watching one rod temperature curve smooth over time.',
          sections: [
            { title: 'Curves', body: 'Gray is the initial temperature. Yellow is the current temperature. The horizontal axis is position x, and curve height is temperature u.' },
            { title: 'Strip', body: 'The strip below is the same rod as a heat map: warmer color means hotter position.' },
            { title: 'Animation', body: 'When you play, peaks flatten as heat diffuses from high regions toward nearby low regions. Because both ends are fixed cold, average temperature can decrease.' },
          ],
        }
  }

  return locale === 'zh'
    ? {
        eyebrow: '怎么看图',
        title: '图像读法',
        summary: '先看每个位置的局部方向，再看从初值出发形成的整体轨迹。',
        sections: [
          { title: '箭头', body: '箭头表示当前位置的瞬时变化方向。' },
          { title: '轨迹', body: '高亮轨迹表示从当前初始状态出发后，系统会怎样运动。' },
        ],
      }
    : {
        eyebrow: 'Read the graph',
        title: 'How to read this graph',
        summary: 'Read the local direction first, then read the full trajectory selected by the initial condition.',
        sections: [
          { title: 'Arrows', body: 'Arrows show the instantaneous direction of change at each state.' },
          { title: 'Trajectory', body: 'The highlighted path shows the motion produced from the current initial state.' },
        ],
      }
}

function differentialTermTopic(term: DifferentialTermId, locale: DifferentialLocale): HelpTopic {
  const zh: Record<DifferentialTermId, HelpTopic> = {
    'y-prime': {
      eyebrow: '术语',
      title: "y' 是什么",
      summary: "y' 通常读作 y 撇，表示 y 对输入变量的导数，也就是 y 的瞬时变化率。",
      sections: [
        { title: '在这里的意思', body: "如果横轴是 t，那么 y' 就是 dy/dt：t 增加一点点时，y 会以多快的速度变化。" },
        { title: '和图像的关系', body: 'y 越快增加，线段越向上；y 越快减少，线段越向下。' },
      ],
    },
    ode: {
      eyebrow: '术语',
      title: 'ODE 是什么',
      summary: 'ODE 是 ordinary differential equation，中文是常微分方程。',
      sections: [{ title: '直觉理解', body: '它不直接告诉你 y 是多少，而是告诉你 y 如何变化。解微分方程，就是找一条处处遵守这个变化规则的曲线。' }],
    },
    'initial-value': {
      eyebrow: '术语',
      title: '初值是什么',
      summary: '初值就是解曲线的起点，例如 y(t0)=y0。',
      sections: [{ title: '为什么重要', body: '同一个变化规则可以有很多条解曲线。初值会从这些可能性里选出其中一条。' }],
    },
    'slope-field': {
      eyebrow: '术语',
      title: '斜率场是什么',
      summary: '斜率场是在很多点画出局部斜率的一张方向地图。',
      sections: [{ title: '怎么看', body: '短线段不是解本身，而是告诉你如果解曲线经过附近，应该朝哪个方向走。' }],
    },
    euler: {
      eyebrow: '术语',
      title: 'Euler 方法',
      summary: 'Euler 方法每一步只使用当前点的斜率。',
      sections: [{ title: '优点和风险', body: '它最容易理解：看当前方向，然后走一步。但如果步子太大，当前方向很快就会过时，所以误差会累积。' }],
    },
    midpoint: {
      eyebrow: '术语',
      title: '中点法',
      summary: '中点法先试探半步，再用半步处的斜率决定完整一步。',
      sections: [{ title: '为什么更准', body: '它不像 Euler 那样只相信起点方向，而是尝试估计这一整步中间附近的方向。' }],
    },
    rk4: {
      eyebrow: '术语',
      title: 'RK4',
      summary: 'RK4 是四阶 Runge-Kutta 方法，会在一步里综合 4 次斜率估计。',
      sections: [{ title: '为什么常用', body: '它在计算量和精度之间很平衡，很多基础数值求解器都会把它作为经典基准。' }],
    },
    'step-size': {
      eyebrow: '术语',
      title: '步长 h',
      summary: '步长是一次数值方法往前走的时间距离。',
      sections: [{ title: '影响', body: '步长越大，计算越快但误差越容易变大；步长越小，通常更准但需要更多计算。' }],
    },
    'heat-u': {
      eyebrow: '变量',
      title: 'u 是什么',
      summary: 'u(x,t) 表示位置 x 在时间 t 的温度或热量强度。',
      sections: [
        { title: '在图里怎么看', body: '横轴位置 x 上的曲线高度就是 u。曲线越高，说明那里越热。' },
        { title: '为什么写成 u(x,t)', body: '因为同一个位置的温度会随时间变化，所以 u 同时依赖位置 x 和时间 t。' },
      ],
    },
    'heat-alpha': {
      eyebrow: '变量',
      title: 'α 是什么',
      summary: 'α 是扩散率，控制热量从高处流向低处的快慢。',
      sections: [
        { title: '调大 α 会怎样', body: '曲线会更快变平，尖峰和边缘更快消失。' },
        { title: '调小 α 会怎样', body: '热量扩散更慢，初始形状会保留更久。' },
      ],
    },
    'heat-ut': {
      eyebrow: '变量',
      title: 'u_t 是什么',
      summary: 'u_t 表示温度对时间的变化率，也就是某个位置现在正在升温还是降温。',
      sections: [{ title: '和动画的关系', body: '如果某处 u_t 是负的，那里的温度正在下降；如果是正的，那里的温度正在上升。' }],
    },
    'heat-uxx': {
      eyebrow: '变量',
      title: 'uₓₓ 是什么',
      summary: 'uₓₓ 表示温度曲线对位置的二阶导数，可以理解成“这个点和附近平均温度的差”。',
      sections: [
        { title: '正负号', body: '如果一个点比邻居高很多，uₓₓ 通常为负，它会降温；如果一个点比邻居低，uₓₓ 通常为正，它会升温。' },
        { title: '和热方程的关系', body: '公式 u_t = αuₓₓ 的意思是：温度变化率由附近温度差决定。平坦区域变化很慢。' },
      ],
    },
    'heat-boundary': {
      eyebrow: '假设',
      title: '为什么两端是冷端',
      summary: '这个模拟把杆两端固定为 0 温度，热量可以从两端流走。',
      sections: [
        { title: '图上会发生什么', body: '即使热量是在杆内部扩散，平均温度也可能下降，因为边界不断把热量带走。' },
        { title: '这是什么假设', body: '它相当于杆的两端接在冷源上。换成绝热边界时，平均温度会有不同表现。' },
      ],
    },
    'phase-state': {
      eyebrow: '术语',
      title: '状态点是什么',
      summary: '状态点不是普通空间位置，而是一组变量当前的数值。',
      sections: [
        { title: '例子', body: '在摆模块里，一个点是 (角度, 角速度)。在种群模块里，一个点是 (猎物数量, 捕食者数量)。' },
        { title: '为什么有用', body: '只看一个点，就能知道系统当前处境；沿着轨迹走，就能看到状态如何随时间改变。' },
      ],
    },
    'phase-arrow': {
      eyebrow: '术语',
      title: '相图箭头怎么读',
      summary: "箭头来自 x' 和 y'，表示当前状态下一瞬间往哪里走。",
      sections: [
        { title: '本图的约定', body: '箭头长度已归一化，所以不要用长度判断速度。箭头深浅会提示速度大小，方向仍然是最重要的信息。' },
        { title: '和轨迹的关系', body: '轨迹应该一路顺着附近箭头方向前进。' },
      ],
    },
    'phase-time': {
      eyebrow: '术语',
      title: '时间藏在哪里',
      summary: '相图里没有单独的时间轴，时间体现在轨迹的前进方向上。',
      sections: [{ title: '怎么看', body: '从初始点开始，沿着箭头方向走，就是时间增加时系统状态的变化。图上不能直接读出“几点到达这里”，但能读出长期趋势。' }],
    },
    'pendulum-theta': {
      eyebrow: '变量',
      title: 'θ 是什么',
      summary: 'θ 是摆偏离竖直方向的角度。',
      sections: [{ title: '调 θ₀ 会怎样', body: 'θ₀ 越大，表示一开始把摆拉得越偏；初始能量也通常越大。' }],
    },
    'pendulum-omega': {
      eyebrow: '变量',
      title: 'ω 是什么',
      summary: 'ω 是角速度，表示角度正在变化得多快。',
      sections: [{ title: '调 ω₀ 会怎样', body: 'ω₀ 的绝对值越大，摆一开始转得越快；正负号表示起始转动方向。' }],
    },
    'pendulum-damping': {
      eyebrow: '参数',
      title: '阻尼 c 是什么',
      summary: 'c 表示摩擦或空气阻力这类能量损失。',
      sections: [
        { title: '调大 c', body: '能量流失更快，轨迹更快向稳定点收缩。' },
        { title: '调小 c', body: '系统更接近无摩擦摆，轨迹更接近能量守恒的闭合环。' },
      ],
    },
    'pendulum-gravity': {
      eyebrow: '参数',
      title: '重力 g 是什么',
      summary: 'g 控制摆被拉回竖直方向的强度。',
      sections: [{ title: '调大 g', body: '摆会更快被拉回中间，小幅摆动的节奏也会更快。' }],
    },
    'population-prey-growth': {
      eyebrow: '参数',
      title: 'a：猎物增长',
      summary: 'a 是没有捕食者时猎物自己增长的速度。',
      sections: [{ title: '调大 a', body: '猎物恢复更快，平衡捕食者数量 a/b 也会升高。' }],
    },
    'population-predation': {
      eyebrow: '参数',
      title: 'b：捕食强度',
      summary: 'b 表示捕食者遇到并吃掉猎物的效率。',
      sections: [{ title: '调大 b', body: '猎物被压低得更快，平衡捕食者数量 a/b 会降低。' }],
    },
    'population-predator-death': {
      eyebrow: '参数',
      title: 'd：捕食者死亡',
      summary: 'd 是没有猎物时捕食者减少的速度。',
      sections: [{ title: '调大 d', body: '捕食者更难维持数量，平衡猎物数量 d/c 会升高。' }],
    },
    'population-conversion': {
      eyebrow: '参数',
      title: 'c：转化率',
      summary: 'c 表示吃到猎物后转化为捕食者增长的效率。',
      sections: [{ title: '调大 c', body: '同样数量的猎物能支持更多捕食者，平衡猎物数量 d/c 会降低。' }],
    },
    'population-equilibrium': {
      eyebrow: '术语',
      title: '平衡点 (d/c, a/b)',
      summary: '在这个点，猎物和捕食者的瞬时变化率都为 0。',
      sections: [
        { title: '横坐标 d/c', body: '捕食者刚好不增不减时，需要的猎物数量。' },
        { title: '纵坐标 a/b', body: '猎物刚好不增不减时，对应的捕食者数量。' },
      ],
    },
  }

  const en: Record<DifferentialTermId, HelpTopic> = {
    'y-prime': {
      eyebrow: 'Term',
      title: "What y' means",
      summary: "y' is the derivative of y, or the instantaneous rate of change of y.",
      sections: [
        { title: 'In this app', body: "If the horizontal axis is t, then y' means dy/dt: how quickly y changes when t moves a tiny amount." },
        { title: 'On the graph', body: "Fast increase tilts a segment upward. Fast decrease tilts it downward." },
      ],
    },
    ode: {
      eyebrow: 'Term',
      title: 'What an ODE is',
      summary: 'ODE means ordinary differential equation.',
      sections: [{ title: 'Intuition', body: 'It does not directly tell you y. It tells you how y changes. Solving it means finding a curve that obeys that change rule everywhere.' }],
    },
    'initial-value': {
      eyebrow: 'Term',
      title: 'Initial value',
      summary: 'An initial value is the starting point of a solution, such as y(t0)=y0.',
      sections: [{ title: 'Why it matters', body: 'The same change rule can have many solution curves. The initial value selects one of them.' }],
    },
    'slope-field': {
      eyebrow: 'Term',
      title: 'Slope field',
      summary: 'A slope field draws local slopes at many points.',
      sections: [{ title: 'How to read it', body: 'The segments are not the solution. They show which direction a solution should move if it passes nearby.' }],
    },
    euler: {
      eyebrow: 'Term',
      title: 'Euler method',
      summary: 'Euler uses only the slope at the current point for each step.',
      sections: [{ title: 'Strength and risk', body: 'It is easy to understand: look at the current direction, then step. If the step is large, that direction becomes outdated quickly and error accumulates.' }],
    },
    midpoint: {
      eyebrow: 'Term',
      title: 'Midpoint method',
      summary: 'Midpoint makes a half-step guess, then uses the slope at that midpoint for the full step.',
      sections: [{ title: 'Why it helps', body: 'It does not trust only the starting direction. It estimates the direction near the middle of the step.' }],
    },
    rk4: {
      eyebrow: 'Term',
      title: 'RK4',
      summary: 'RK4 is the fourth-order Runge-Kutta method. It blends four slope estimates inside each step.',
      sections: [{ title: 'Why it is common', body: 'It has a strong balance between cost and accuracy, so it is a classic baseline for numerical ODE solvers.' }],
    },
    'step-size': {
      eyebrow: 'Term',
      title: 'Step size h',
      summary: 'Step size is the time distance covered by one numerical step.',
      sections: [{ title: 'Effect', body: 'A larger step is faster but less accurate. A smaller step is usually more accurate but takes more computation.' }],
    },
    'heat-u': {
      eyebrow: 'Variable',
      title: 'What u means',
      summary: 'u(x,t) is the temperature or heat intensity at position x and time t.',
      sections: [
        { title: 'On the graph', body: 'The curve height at a position x is u. Higher means hotter.' },
        { title: 'Why u(x,t)', body: 'Temperature changes over time, so u depends on both position x and time t.' },
      ],
    },
    'heat-alpha': {
      eyebrow: 'Variable',
      title: 'What alpha means',
      summary: 'Alpha is the diffusivity. It controls how quickly heat spreads from hot regions to cooler regions.',
      sections: [
        { title: 'Larger alpha', body: 'The curve smooths faster, so peaks and sharp edges disappear sooner.' },
        { title: 'Smaller alpha', body: 'Heat spreads more slowly, so the initial shape lasts longer.' },
      ],
    },
    'heat-ut': {
      eyebrow: 'Variable',
      title: 'What u_t means',
      summary: 'u_t is the rate of temperature change over time at one position.',
      sections: [{ title: 'In the animation', body: 'If u_t is negative, that point is cooling down. If it is positive, that point is warming up.' }],
    },
    'heat-uxx': {
      eyebrow: 'Variable',
      title: 'What uₓₓ means',
      summary: 'uₓₓ is the second derivative with respect to position. You can read it as how this point compares with the local average nearby.',
      sections: [
        { title: 'Sign', body: 'If a point is much hotter than its neighbors, uₓₓ is usually negative and it cools. If it is cooler than neighbors, uₓₓ is usually positive and it warms.' },
        { title: 'In the heat equation', body: 'uₜ = αuₓₓ says temperature change is driven by nearby temperature difference. Flat regions change slowly.' },
      ],
    },
    'heat-boundary': {
      eyebrow: 'Assumption',
      title: 'Why the ends are cold',
      summary: 'This simulation fixes both ends of the rod at temperature 0, so heat can flow out through the ends.',
      sections: [
        { title: 'What you see', body: 'Average temperature can decrease even though heat is diffusing inside the rod, because the boundary keeps removing heat.' },
        { title: 'Model assumption', body: 'It is like attaching both rod ends to cold reservoirs. Insulated ends would behave differently.' },
      ],
    },
    'phase-state': {
      eyebrow: 'Term',
      title: 'State point',
      summary: 'A state point is not a physical location. It is the current values of a set of variables.',
      sections: [
        { title: 'Examples', body: 'In the pendulum lesson, a point is (angle, angular velocity). In the population lesson, a point is (prey count, predator count).' },
        { title: 'Why it helps', body: 'One point tells the current situation. Following a trajectory shows how that situation changes over time.' },
      ],
    },
    'phase-arrow': {
      eyebrow: 'Term',
      title: 'How to read phase arrows',
      summary: "Arrows come from x' and y'. They show where the state moves next.",
      sections: [
        { title: 'This graph convention', body: 'Arrow length is normalized, so do not use length as speed. Opacity hints speed; direction is the main information.' },
        { title: 'Connection to paths', body: 'A trajectory should keep following nearby arrow directions.' },
      ],
    },
    'phase-time': {
      eyebrow: 'Term',
      title: 'Where time is',
      summary: 'A phase portrait has no separate time axis. Time appears as direction along trajectories.',
      sections: [{ title: 'How to read it', body: 'Start at the initial point and follow the arrows. That is how the state changes as time increases. You cannot read the exact arrival time directly, but you can read long-term behavior.' }],
    },
    'pendulum-theta': {
      eyebrow: 'Variable',
      title: 'What theta means',
      summary: 'Theta is the angle away from vertical.',
      sections: [{ title: 'Changing theta0', body: 'Larger theta0 means the pendulum starts farther from center, usually with more initial energy.' }],
    },
    'pendulum-omega': {
      eyebrow: 'Variable',
      title: 'What omega means',
      summary: 'Omega is angular velocity: how quickly the angle is changing.',
      sections: [{ title: 'Changing omega0', body: 'Larger absolute omega0 means the pendulum starts with more turning speed. The sign sets the starting direction.' }],
    },
    'pendulum-damping': {
      eyebrow: 'Parameter',
      title: 'What damping c means',
      summary: 'c represents energy loss from friction or air resistance.',
      sections: [
        { title: 'Larger c', body: 'Energy drains faster, so the trajectory shrinks toward the stable point sooner.' },
        { title: 'Smaller c', body: 'The system is closer to a frictionless pendulum, so paths look more like closed energy loops.' },
      ],
    },
    'pendulum-gravity': {
      eyebrow: 'Parameter',
      title: 'What gravity g means',
      summary: 'g controls how strongly the pendulum is pulled back toward vertical.',
      sections: [{ title: 'Larger g', body: 'The pendulum is pulled back faster, and small swings have a faster rhythm.' }],
    },
    'population-prey-growth': {
      eyebrow: 'Parameter',
      title: 'a: prey growth',
      summary: 'a is how quickly prey grow when predators are absent.',
      sections: [{ title: 'Larger a', body: 'Prey recover faster, and equilibrium predators a/b increases.' }],
    },
    'population-predation': {
      eyebrow: 'Parameter',
      title: 'b: predation strength',
      summary: 'b is how efficiently predators encounter and eat prey.',
      sections: [{ title: 'Larger b', body: 'Prey are pushed down faster, and equilibrium predators a/b decreases.' }],
    },
    'population-predator-death': {
      eyebrow: 'Parameter',
      title: 'd: predator death',
      summary: 'd is how quickly predators decline when prey are absent.',
      sections: [{ title: 'Larger d', body: 'Predators are harder to sustain, and equilibrium prey d/c increases.' }],
    },
    'population-conversion': {
      eyebrow: 'Parameter',
      title: 'c: conversion',
      summary: 'c is how efficiently eaten prey turns into predator growth.',
      sections: [{ title: 'Larger c', body: 'The same prey can support more predators, and equilibrium prey d/c decreases.' }],
    },
    'population-equilibrium': {
      eyebrow: 'Term',
      title: 'Equilibrium (d/c, a/b)',
      summary: 'At this point, both prey and predator instantaneous rates of change are 0.',
      sections: [
        { title: 'Horizontal coordinate d/c', body: 'The prey count needed for predators to be neither increasing nor decreasing.' },
        { title: 'Vertical coordinate a/b', body: 'The predator count that makes prey neither increasing nor decreasing.' },
      ],
    },
  }

  return locale === 'zh' ? zh[term] : en[term]
}

function formula(tex: string) {
  return <Formula tex={tex} />
}

function drawDifferentialScene(
  ctx: CanvasRenderingContext2D,
  viewport: GraphViewport,
  theme: GraphTheme,
  state: {
    lessonId: string
    locale: DifferentialLocale
    scalarFn: ScalarOde
    scalarPreset: { formulaTex: string }
    t0: number
    y0: number
    duration: number
    steps: number
    method: OdeMethod
    phasePreset: { xRange: [number, number]; yRange: [number, number]; system: System2D }
    x0: number
    phaseY0: number
    theta0: number
    omega0: number
    damping: number
    gravity: number
    prey0: number
    predator0: number
    preyGrowth: number
    predation: number
    predatorDeath: number
    conversion: number
    heatShape: HeatShape
    diffusivity: number
    heatTime: number
  },
) {
  drawGrid(ctx, viewport, theme)
  if (state.lessonId === 'slope-fields') drawSlopeFieldLesson(ctx, viewport, theme, state)
  if (state.lessonId === 'numerical-methods') drawNumericalMethodsLesson(ctx, viewport, theme, state)
  if (state.lessonId === 'phase-portraits') drawPhasePortraitLesson(ctx, viewport, theme, state.phasePreset.system, { x: state.x0, y: state.phaseY0 }, state.duration)
  if (state.lessonId === 'pendulum') drawPendulumLesson(ctx, viewport, theme, state)
  if (state.lessonId === 'population') drawPopulationLesson(ctx, viewport, theme, state)
  if (state.lessonId === 'heat-equation') drawHeatLesson(ctx, viewport, theme, state)
}

function drawSlopeFieldLesson(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: { scalarFn: ScalarOde; t0: number; y0: number; duration: number; steps: number; method: OdeMethod }) {
  drawSlopeSegments(ctx, viewport, theme, state.scalarFn)
  const step = state.duration / Math.max(1, state.steps)
  const forward = integrateScalarOde(state.scalarFn, { t0: state.t0, y0: state.y0, step, steps: state.steps, method: state.method })
  const backward = integrateScalarOde(state.scalarFn, { t0: state.t0, y0: state.y0, step: -step, steps: state.steps, method: state.method })
  drawScalarPath(ctx, viewport, [...backward.slice().reverse(), ...forward.slice(1)], theme.warning, 2.6)
  drawPoint(ctx, viewport, state.t0, state.y0, theme.warning)
}

function drawNumericalMethodsLesson(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: { scalarFn: ScalarOde; t0: number; y0: number; duration: number; steps: number }) {
  drawSlopeSegments(ctx, viewport, theme, state.scalarFn, 13, 9)
  const step = state.duration / Math.max(1, state.steps)
  const euler = integrateScalarOde(state.scalarFn, { t0: state.t0, y0: state.y0, step, steps: state.steps, method: 'euler' })
  const midpoint = integrateScalarOde(state.scalarFn, { t0: state.t0, y0: state.y0, step, steps: state.steps, method: 'midpoint' })
  const rk4 = integrateScalarOde(state.scalarFn, { t0: state.t0, y0: state.y0, step, steps: state.steps, method: 'rk4' })
  drawScalarPath(ctx, viewport, euler, theme.secondary, 2)
  drawScalarPath(ctx, viewport, midpoint, theme.accent, 2.2)
  drawScalarPath(ctx, viewport, rk4, theme.warning, 2.6)
  for (const point of euler) drawSmallPoint(ctx, viewport, point.t, point.y, theme.secondary)
}

function drawPhasePortraitLesson(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, system: System2D, initial: PhasePoint, duration: number) {
  drawVectorField(ctx, viewport, theme, system)
  const seeds = phaseSeeds(initial)
  for (const seed of seeds.slice(1)) {
    const path = integrateSystem(system, { x0: seed.x, y0: seed.y, step: 0.04, steps: Math.round(duration * 25), bounds: viewport })
    drawPhasePath(ctx, viewport, path, theme.muted, 1.1, 0.55)
  }
  const selected = integrateSystem(system, { x0: initial.x, y0: initial.y, step: 0.04, steps: Math.round(duration * 25), bounds: viewport })
  drawPhasePath(ctx, viewport, selected, theme.warning, 2.5, 1)
  drawPoint(ctx, viewport, initial.x, initial.y, theme.warning)
}

function drawPendulumLesson(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: { theta0: number; omega0: number; damping: number; gravity: number; duration: number }) {
  const system = makePendulumSystem({ damping: state.damping, gravity: state.gravity })
  drawVectorField(ctx, viewport, theme, system, 19, 13)
  const points = simulatePendulum({ theta0: state.theta0, omega0: state.omega0, damping: state.damping, gravity: state.gravity, step: 0.035, steps: Math.round(state.duration / 0.035) })
  drawPhasePath(ctx, viewport, points.map((point) => ({ x: point.theta, y: point.omega })), theme.warning, 2.5, 1)
  drawPoint(ctx, viewport, state.theta0, state.omega0, theme.warning)
  drawPendulumInset(ctx, viewport, theme, points.at(-1)?.theta ?? state.theta0)
}

function drawPopulationLesson(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: { prey0: number; predator0: number; preyGrowth: number; predation: number; predatorDeath: number; conversion: number; duration: number }) {
  const system = makeLotkaVolterraSystem({ preyGrowth: state.preyGrowth, predation: state.predation, predatorDeath: state.predatorDeath, conversion: state.conversion })
  drawVectorField(ctx, viewport, theme, system, 15, 12)
  const trajectory = simulatePopulation({ ...state, step: 0.035, steps: Math.round(state.duration / 0.035) })
  drawPhasePath(ctx, viewport, trajectory, theme.warning, 2.6, 1)
  drawPoint(ctx, viewport, state.prey0, state.predator0, theme.warning)
  const equilibrium = { x: state.predatorDeath / state.conversion, y: state.preyGrowth / state.predation }
  if (Number.isFinite(equilibrium.x) && Number.isFinite(equilibrium.y)) drawPoint(ctx, viewport, equilibrium.x, equilibrium.y, theme.secondary)
}

function drawHeatLesson(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, state: { heatShape: HeatShape; diffusivity: number; heatTime: number }) {
  const heat = simulateHeatEquation({ shape: state.heatShape, diffusivity: state.diffusivity, time: state.heatTime, points: 96 })
  drawHeatStrip(ctx, viewport, theme, heat.profile)
  drawHeatProfile(ctx, viewport, heat.initial, theme.muted, 1.4, 0.5)
  drawHeatProfile(ctx, viewport, heat.profile, theme.warning, 2.6, 1)
}

function drawSlopeSegments(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, fn: ScalarOde, columns = 21, rows = 13) {
  ctx.strokeStyle = colorWithAlpha(theme.muted, 0.65)
  ctx.lineWidth = 1.2
  const samples = sampleSlopeField(fn, { tMin: viewport.xMin, tMax: viewport.xMax, yMin: viewport.yMin, yMax: viewport.yMax }, columns, rows)
  const segmentLength = (viewport.xMax - viewport.xMin) / 48
  for (const sample of samples) {
    const scale = Math.sqrt(1 + sample.slope * sample.slope)
    const dx = segmentLength / scale
    const dy = (sample.slope * segmentLength) / scale
    line(ctx, viewport, sample.t - dx, sample.y - dy, sample.t + dx, sample.y + dy)
  }
}

function drawVectorField(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, system: System2D, columns = 17, rows = 13) {
  const samples = sampleVectorField(system, { xMin: viewport.xMin, xMax: viewport.xMax, yMin: viewport.yMin, yMax: viewport.yMax }, columns, rows)
  const speedReference = vectorSpeedReference(samples)
  for (const sample of samples) {
    const speed = Math.hypot(sample.dx, sample.dy)
    const alpha = speedReference > 0 ? 0.3 + 0.48 * Math.min(1, Math.sqrt(speed / speedReference)) : 0.54
    drawVectorArrow(ctx, viewport, sample.x, sample.y, sample.dx, sample.dy, colorWithAlpha(theme.muted, alpha))
  }
}

function vectorSpeedReference(samples: { dx: number; dy: number }[]): number {
  const speeds = samples
    .map((sample) => Math.hypot(sample.dx, sample.dy))
    .filter((speed) => Number.isFinite(speed) && speed > 0)
    .sort((a, b) => a - b)
  if (!speeds.length) return 0
  return speeds[Math.floor((speeds.length - 1) * 0.75)] || speeds.at(-1) || 1
}

function drawVectorArrow(ctx: CanvasRenderingContext2D, viewport: GraphViewport, x: number, y: number, dx: number, dy: number, color: string) {
  const magnitude = Math.hypot(dx, dy)
  if (!Number.isFinite(magnitude) || magnitude <= 1e-8) return
  const length = Math.min((viewport.xMax - viewport.xMin) / 42, (viewport.yMax - viewport.yMin) / 32)
  const ux = (dx / magnitude) * length
  const uy = (dy / magnitude) * length
  const start = worldToScreen(viewport, x - ux * 0.55, y - uy * 0.55)
  const end = worldToScreen(viewport, x + ux * 0.55, y + uy * 0.55)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)
  ctx.stroke()
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  ctx.beginPath()
  ctx.moveTo(end.x, end.y)
  ctx.lineTo(end.x - 6 * Math.cos(angle - Math.PI / 6), end.y - 6 * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(end.x - 6 * Math.cos(angle + Math.PI / 6), end.y - 6 * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
}

function drawScalarPath(ctx: CanvasRenderingContext2D, viewport: GraphViewport, points: { t: number; y: number }[], color: string, width: number) {
  drawPolyline(ctx, viewport, points, (point) => point.t, (point) => point.y, color, width)
}

function drawPhasePath(ctx: CanvasRenderingContext2D, viewport: GraphViewport, points: PhasePoint[], color: string, width: number, alpha: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  drawPolyline(ctx, viewport, points, (point) => point.x, (point) => point.y, color, width)
  ctx.restore()
}

function drawHeatProfile(ctx: CanvasRenderingContext2D, viewport: GraphViewport, points: { x: number; value: number }[], color: string, width: number, alpha: number) {
  ctx.save()
  ctx.globalAlpha = alpha
  drawPolyline(ctx, viewport, points, (point) => point.x, (point) => point.value, color, width)
  ctx.restore()
}

function drawPolyline<T>(ctx: CanvasRenderingContext2D, viewport: GraphViewport, points: T[], getX: (point: T) => number, getY: (point: T) => number, color: string, width: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  let started = false
  for (const point of points) {
    const x = getX(point)
    const y = getY(point)
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e5 || Math.abs(y) > 1e5) {
      started = false
      continue
    }
    const screen = worldToScreen(viewport, x, y)
    if (!started) {
      ctx.moveTo(screen.x, screen.y)
      started = true
    } else {
      ctx.lineTo(screen.x, screen.y)
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

function drawSmallPoint(ctx: CanvasRenderingContext2D, viewport: GraphViewport, x: number, y: number, color: string) {
  const point = worldToScreen(viewport, x, y)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(point.x, point.y, 2.4, 0, Math.PI * 2)
  ctx.fill()
}

function drawPendulumInset(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, theta: number) {
  const centerX = viewport.width - 78
  const centerY = 76
  const length = 50
  const bobX = centerX + Math.sin(theta) * length
  const bobY = centerY + Math.cos(theta) * length
  ctx.save()
  ctx.fillStyle = colorWithAlpha(theme.background, 0.76)
  ctx.strokeStyle = colorWithAlpha(theme.gridMajor, 0.9)
  roundRect(ctx, centerX - 64, centerY - 44, 128, 132, 8)
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = theme.muted
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(centerX, centerY)
  ctx.lineTo(bobX, bobY)
  ctx.stroke()
  ctx.fillStyle = theme.warning
  ctx.beginPath()
  ctx.arc(bobX, bobY, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = theme.text
  ctx.beginPath()
  ctx.arc(centerX, centerY, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawHeatStrip(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme, profile: { x: number; value: number }[]) {
  const yTop = worldToScreen(viewport, 0, -0.02).y
  const yBottom = worldToScreen(viewport, 0, -0.14).y
  for (let index = 0; index < profile.length - 1; index += 1) {
    const point = profile[index]
    const next = profile[index + 1]
    const left = worldToScreen(viewport, point.x, 0).x
    const right = worldToScreen(viewport, next.x, 0).x
    ctx.fillStyle = heatColor(point.value, theme)
    ctx.fillRect(left, yTop, right - left + 1, yBottom - yTop)
  }
  ctx.strokeStyle = theme.gridMajor
  ctx.strokeRect(worldToScreen(viewport, 0, 0).x, yTop, worldToScreen(viewport, 1, 0).x - worldToScreen(viewport, 0, 0).x, yBottom - yTop)
}

function getCurrentValues(
  state: {
    lessonId: string
    scalarFn: ScalarOde
    t0: number
    y0: number
    duration: number
    steps: number
    method: OdeMethod
    phasePreset: { system: System2D }
    x0: number
    phaseY0: number
    theta0: number
    omega0: number
    damping: number
    gravity: number
    prey0: number
    predator0: number
    preyGrowth: number
    predation: number
    predatorDeath: number
    conversion: number
    heatShape: HeatShape
    diffusivity: number
    heatTime: number
  },
  locale: DifferentialLocale,
): ValueRow[] {
  if (state.lessonId === 'slope-fields') {
    const step = state.duration / Math.max(1, state.steps)
    const path = integrateScalarOde(state.scalarFn, { t0: state.t0, y0: state.y0, step, steps: state.steps, method: state.method })
    const last = path.at(-1)
    return [
      { label: locale === 'zh' ? '起点斜率' : 'starting slope', labelTex: "y'(t_0)", value: format(state.scalarFn(state.t0, state.y0), locale) },
      { label: locale === 'zh' ? '结束时间' : 'end time', labelTex: 't_{end}', value: format(last?.t, locale) },
      { label: locale === 'zh' ? '结束高度' : 'end height', labelTex: 'y_{end}', value: format(last?.y, locale) },
    ]
  }
  if (state.lessonId === 'numerical-methods') {
    const step = state.duration / Math.max(1, state.steps)
    const euler = integrateScalarOde(state.scalarFn, { t0: state.t0, y0: state.y0, step, steps: state.steps, method: 'euler' }).at(-1)
    const rk4 = integrateScalarOde(state.scalarFn, { t0: state.t0, y0: state.y0, step, steps: state.steps, method: 'rk4' }).at(-1)
    return [
      {
        label: locale === 'zh' ? '每步长度' : 'step length',
        labelTex: 'h',
        value: format(step, locale),
        term: 'step-size',
        note: locale === 'zh' ? '总时间 / 步数；h 越小通常越准。' : 'Total time / steps; smaller h is usually more accurate.',
      },
      { label: locale === 'zh' ? 'Euler 结束值' : 'Euler end value', labelTex: 'y_E', value: format(euler?.y, locale), term: 'euler' },
      { label: locale === 'zh' ? 'RK4 结束值' : 'RK4 end value', labelTex: 'y_{RK4}', value: format(rk4?.y, locale), term: 'rk4' },
      {
        label: locale === 'zh' ? '两者差距' : 'difference',
        labelTex: '|y_E-y_{RK4}|',
        value: format(euler && rk4 ? Math.abs(euler.y - rk4.y) : null, locale),
        note: locale === 'zh' ? '不是严格误差，只比较 Euler 和 RK4。' : 'Not exact error; just Euler vs RK4.',
      },
    ]
  }
  if (state.lessonId === 'phase-portraits') {
    const vector = state.phasePreset.system(state.x0, state.phaseY0)
    return [
      { label: locale === 'zh' ? '当前 x 变化率' : 'current x rate', labelTex: "x'", value: format(vector?.dx, locale), term: 'phase-arrow' },
      { label: locale === 'zh' ? '当前 y 变化率' : 'current y rate', labelTex: "y'", value: format(vector?.dy, locale), term: 'phase-arrow' },
      {
        label: locale === 'zh' ? '速度大小' : 'speed magnitude',
        value: format(vector ? Math.hypot(vector.dx, vector.dy) : null, locale),
        term: 'phase-arrow',
        note: locale === 'zh' ? '图上箭头长度已归一化；深浅更接近速度提示。' : 'Arrow length is normalized in the plot; opacity is the speed cue.',
      },
    ]
  }
  if (state.lessonId === 'pendulum') {
    const points = simulatePendulum({ theta0: state.theta0, omega0: state.omega0, damping: state.damping, gravity: state.gravity, step: 0.035, steps: Math.round(state.duration / 0.035) })
    const last = points.at(-1)
    return [
      { label: locale === 'zh' ? '当前角度' : 'current angle', labelTex: '\\theta', value: format(last?.theta, locale), term: 'pendulum-theta' },
      { label: locale === 'zh' ? '当前角速度' : 'current angular velocity', labelTex: '\\omega', value: format(last?.omega, locale), term: 'pendulum-omega' },
      {
        label: locale === 'zh' ? '能量' : 'energy',
        labelTex: 'E',
        value: format(last?.energy, locale),
        note: locale === 'zh' ? '阻尼越大，能量通常流失越快。' : 'More damping usually removes energy faster.',
      },
    ]
  }
  if (state.lessonId === 'population') {
    const points = simulatePopulation({ ...state, step: 0.035, steps: Math.round(state.duration / 0.035) })
    const last = points.at(-1)
    return [
      { label: locale === 'zh' ? '猎物' : 'prey', labelTex: 'x', value: format(last?.x, locale) },
      { label: locale === 'zh' ? '捕食者' : 'predator', labelTex: 'y', value: format(last?.y, locale) },
      {
        label: locale === 'zh' ? '平衡猎物' : 'equilibrium prey',
        labelTex: 'd/c',
        value: format(state.predatorDeath / state.conversion, locale),
        term: 'population-equilibrium',
        note: locale === 'zh' ? '捕食者不增不减所需的猎物。' : 'Prey needed for predator balance.',
      },
      {
        label: locale === 'zh' ? '平衡捕食者' : 'equilibrium predators',
        labelTex: 'a/b',
        value: format(state.preyGrowth / state.predation, locale),
        term: 'population-equilibrium',
        note: locale === 'zh' ? '猎物不增不减对应的捕食者。' : 'Predators needed for prey balance.',
      },
    ]
  }
  const heat = simulateHeatEquation({ shape: state.heatShape, diffusivity: state.diffusivity, time: state.heatTime, points: 96 })
  return [
    { label: locale === 'zh' ? '最高温' : 'max heat', value: format(heat.max, locale) },
    {
      label: locale === 'zh' ? '平均温' : 'average heat',
      value: format(heat.average, locale),
      term: 'heat-boundary',
      note: locale === 'zh' ? '冷端会让热量流走。' : 'Cold ends let heat leave.',
    },
    { label: locale === 'zh' ? '扩散率' : 'diffusivity', labelTex: '\\alpha', value: format(state.diffusivity, locale), term: 'heat-alpha' },
  ]
}

function defaultScalarPresetId(lessonId: string): string {
  if (lessonId === 'numerical-methods') return 'growth'
  if (lessonId === 'slope-fields') return 'logistic'
  return 'logistic'
}

function defaultViewForLesson(lessonId: string, phasePreset = phasePresets[0]): GraphViewState {
  if (lessonId === 'phase-portraits') {
    return { xMin: phasePreset.xRange[0], xMax: phasePreset.xRange[1], yMin: phasePreset.yRange[0], yMax: phasePreset.yRange[1] }
  }
  if (lessonId === 'pendulum') return { xMin: -3.4, xMax: 3.4, yMin: -3.2, yMax: 3.2 }
  if (lessonId === 'population') return { xMin: 0, xMax: 24, yMin: 0, yMax: 18 }
  if (lessonId === 'heat-equation') return { xMin: 0, xMax: 1, yMin: -0.18, yMax: 1.15 }
  if (lessonId === 'numerical-methods') return { xMin: -0.2, xMax: 3.2, yMin: -0.2, yMax: 6 }
  return { xMin: -4, xMax: 8, yMin: -3, yMax: 6 }
}

function phaseSeeds(initial: PhasePoint): PhasePoint[] {
  return [
    initial,
    { x: -3, y: -2 },
    { x: -2, y: 2.5 },
    { x: 1.5, y: -2.8 },
    { x: 2.8, y: 2 },
  ]
}

function currentFormulaTex(lessonId: string, expressionTex: string, phasePreset: { formulaTex: string }, fallback: string): string {
  if (lessonId === 'slope-fields' || lessonId === 'numerical-methods') return `\\frac{dy}{dt}=${expressionTex}`
  if (lessonId === 'phase-portraits') return phasePreset.formulaTex
  return fallback
}

function methodLabel(method: OdeMethod, locale: DifferentialLocale): string {
  if (locale === 'en') {
    if (method === 'rk4') return 'Runge-Kutta 4'
    return method
  }
  if (method === 'euler') return 'Euler'
  if (method === 'midpoint') return '中点法'
  return '四阶 Runge-Kutta'
}

function heatShapeLabel(shape: HeatShape, locale: DifferentialLocale): string {
  if (locale === 'en') {
    if (shape === 'bar') return 'hot block'
    if (shape === 'two-peaks') return 'two peaks'
    return 'single pulse'
  }
  if (shape === 'bar') return '热块'
  if (shape === 'two-peaks') return '双峰'
  return '单峰脉冲'
}

function legendRows(lessonId: string, locale: DifferentialLocale): { label: string; color: string }[] {
  if (lessonId === 'numerical-methods') {
    return [
      { label: 'Euler', color: '#b9a7ff' },
      { label: locale === 'zh' ? '中点法' : 'midpoint', color: '#7fd6c2' },
      { label: 'RK4', color: '#c7dc8a' },
    ]
  }
  if (lessonId === 'heat-equation') {
    return [
      { label: locale === 'zh' ? '初始' : 'initial', color: '#a7b1bd' },
      { label: locale === 'zh' ? '当前' : 'current', color: '#c7dc8a' },
    ]
  }
  return []
}

function heatColor(value: number, theme: GraphTheme): string {
  const amount = Math.max(0, Math.min(1, value))
  if (amount < 0.35) return colorMix(theme.primary, theme.background, amount / 0.35)
  if (amount < 0.7) return colorMix(theme.warning, theme.primary, (amount - 0.35) / 0.35)
  return colorMix('#f09a64', theme.warning, (amount - 0.7) / 0.3)
}

function colorMix(a: string, b: string, amount: number): string {
  const ca = parseHexColor(a)
  const cb = parseHexColor(b)
  const mix = (start: number, end: number) => Math.round(start * amount + end * (1 - amount))
  return `rgb(${mix(ca.r, cb.r)}, ${mix(ca.g, cb.g)}, ${mix(ca.b, cb.b)})`
}

function colorWithAlpha(color: string, alpha: number): string {
  const parsed = parseHexColor(color)
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`
}

function parseHexColor(color: string): { r: number; g: number; b: number } {
  const trimmed = color.trim()
  const hex = trimmed.startsWith('#') ? trimmed.slice(1) : ''
  if (hex.length === 3) {
    return {
      r: Number.parseInt(hex[0] + hex[0], 16),
      g: Number.parseInt(hex[1] + hex[1], 16),
      b: Number.parseInt(hex[2] + hex[2], 16),
    }
  }
  if (hex.length === 6) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    }
  }
  return { r: 167, g: 177, b: 189 }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

function translateExpressionError(message: string, locale: DifferentialLocale): string {
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
  return differentialCopy.zh.ui.invalidExpression
}

function format(value: number | null | undefined, locale: DifferentialLocale): string {
  return typeof value === 'number' && Number.isFinite(value) ? round(value).toString() : differentialCopy[locale].ui.undefinedValue
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}
