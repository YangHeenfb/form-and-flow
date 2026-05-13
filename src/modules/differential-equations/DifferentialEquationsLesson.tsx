import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LocateFixed, Pause, Play, RotateCcw } from 'lucide-react'
import { GraphCanvas, drawGrid, line, worldToScreen } from '../../core/graph2d/GraphCanvas.tsx'
import type { GraphTheme, GraphViewport } from '../../core/graph2d/GraphCanvas.tsx'
import { Formula } from '../../core/ui/Formula.tsx'
import { HelpTrigger, LearningDrawer, TermButton, type HelpTopic } from '../../core/ui/LearningHelp.tsx'
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
    share: string
    exportPng: string
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
      share: 'Share',
      exportPng: 'Export PNG',
      seeing: 'What you are seeing',
      why: 'Why it matters',
      formula: 'Current model',
      values: 'Current values',
      watch: 'Watch for',
      beginnerHelp: 'Beginner explanation',
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
        what: 'Each arrow gives a velocity vector, and trajectories reveal the global motion implied by the system.',
        why: 'A phase portrait shows the shape of all possible futures without plotting time on a separate axis.',
        formulaTex: "x'=F(x,y),\\quad y'=G(x,y)",
        formulaLabel: "x'=F(x,y), y'=G(x,y)",
        watch: 'Look for fixed points, spirals, saddles, centers, and stable directions.',
      },
      pendulum: {
        title: 'Pendulum & Oscillators',
        what: 'The pendulum is drawn as a phase portrait for angle and angular velocity, with the current bob shown in the inset.',
        why: 'A second-order equation becomes a first-order system by tracking position and velocity together.',
        formulaTex: "\\theta'=\\omega,\\quad \\omega'=-g\\sin(\\theta)-c\\omega",
        formulaLabel: "theta'=omega, omega'=-g sin(theta)-c omega",
        watch: 'Damping removes energy; without damping the trajectory follows nearly closed loops.',
      },
      population: {
        title: 'Population Dynamics',
        what: 'Prey and predator populations move through phase space under the Lotka-Volterra interaction rule.',
        why: 'Coupled ODEs turn feedback into cycles, equilibria, or collapse depending on parameters.',
        formulaTex: "x'=x(a-by),\\quad y'=y(cx-d)",
        formulaLabel: "prey'=prey(a-b predator), predator'=predator(c prey-d)",
        watch: 'Changing interaction strength moves the equilibrium and changes the cycle size.',
      },
      'heat-equation': {
        title: 'Heat Equation / Diffusion',
        what: 'The initial temperature profile smooths out over time while the heat strip shows the current rod state.',
        why: 'The heat equation turns local curvature into flow from hot regions toward cooler neighbors.',
        formulaTex: "u_t=\\alpha u_{xx}",
        formulaLabel: 'u_t = alpha u_xx',
        watch: 'Sharp corners disappear quickly; larger diffusivity smooths the profile faster.',
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
      share: '分享',
      exportPng: '导出 PNG',
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
        what: '每个箭头表示速度向量，轨迹展示系统规则推出的整体运动。',
        why: '相图不用单独画时间轴，也能看出所有可能未来的形状。',
        formulaTex: "x'=F(x,y),\\quad y'=G(x,y)",
        formulaLabel: "x'=F(x,y), y'=G(x,y)",
        watch: '观察固定点、螺旋、鞍点、中心和稳定方向。',
      },
      pendulum: {
        title: '摆与振子',
        what: '摆被画成角度和角速度的相图，右上角同时显示当前摆锤位置。',
        why: '二阶方程可以通过同时追踪位置和速度，改写成一阶系统。',
        formulaTex: "\\theta'=\\omega,\\quad \\omega'=-g\\sin(\\theta)-c\\omega",
        formulaLabel: "theta'=omega, omega'=-g sin(theta)-c omega",
        watch: '阻尼会移除能量；没有阻尼时，轨迹接近闭合环。',
      },
      population: {
        title: '种群动力学',
        what: '猎物和捕食者数量在 Lotka-Volterra 规则下沿相空间运动。',
        why: '耦合 ODE 会把反馈变成周期、平衡或崩塌，具体取决于参数。',
        formulaTex: "x'=x(a-by),\\quad y'=y(cx-d)",
        formulaLabel: "prey'=prey(a-b predator), predator'=predator(c prey-d)",
        watch: '改变交互强度会移动平衡点，也会改变循环幅度。',
      },
      'heat-equation': {
        title: '热方程 / 扩散',
        what: '初始温度曲线会随时间变平滑，热量色带显示当前杆上的状态。',
        why: '热方程把局部曲率转化为从热处流向冷处的扩散。',
        formulaTex: "u_t=\\alpha u_{xx}",
        formulaLabel: 'u_t = alpha u_xx',
        watch: '尖锐边缘会很快消失；扩散率越大，曲线越快变平。',
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

  const share = () => {
    const params = new URLSearchParams()
    params.set('preset', scalarPresetId)
    params.set('f', expression)
    params.set('duration', String(round(duration)))
    params.set('steps', String(Math.round(steps)))
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
    void navigator.clipboard?.writeText(url)
  }

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
    <section className="calculus-lesson diffeq-lesson">
      <aside className="calculus-controls diffeq-controls platform-card">
        <div className="calculus-learning-entry learning-help-entry">
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
      </aside>

      <main className="calculus-main diffeq-main">
        <div className="calculus-title-row">
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
            shareLabel={ui.share}
            onShare={share}
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
          <Range label={ui.ranges.speed} labelTex={locale === 'zh' ? '\\text{速度}' : '\\text{speed}'} value={speed} min={0.25} max={3} step={0.05} valueSuffix="x" onChange={setSpeed} />
        </div>
      </main>

      <aside className="calculus-explanation diffeq-explanation platform-card">
        <h2>{ui.seeing}</h2>
        <p>{renderDifferentialWhat(lessonId, locale, copy.what, (term) => setHelpMode({ kind: 'term', term }))}</p>
        <h2>{ui.why}</h2>
        <p>{copy.why}</p>
        <h2>{ui.formula}</h2>
        <p className="formula-text formula-card">
          <Formula tex={currentFormulaTex(lessonId, scalarPreset, phasePreset, copy.formulaTex)} block label={copy.formulaLabel} />
        </p>
        {lessonId === 'heat-equation' && <HeatVariableTerms locale={locale} onTerm={(term) => setHelpMode({ kind: 'term', term })} />}
        <Legend lessonId={lessonId} locale={locale} />
        <h2>{ui.values}</h2>
        <dl>
          {values.map(({ label, labelTex, value }) => (
            <div key={label}>
              <dt>{labelTex ? <Formula tex={labelTex} /> : label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <h2>{ui.watch}</h2>
        <p>{copy.watch}</p>
      </aside>
    </section>
      )}
    </ModuleFocusFrame>
    <LearningDrawer topic={activeHelpTopic} closeLabel={ui.closeHelp} onClose={() => setHelpMode(null)} />
    </>
  )

  function resetLesson() {
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

function HeatVariableTerms({ locale, onTerm }: { locale: DifferentialLocale; onTerm: (term: DifferentialTermId) => void }) {
  return (
    <div className="diffeq-variable-terms" aria-label={locale === 'zh' ? '热方程变量解释' : 'Heat equation variable explanations'}>
      <span>{locale === 'zh' ? '变量' : 'Variables'}</span>
      <TermButton onClick={() => onTerm('heat-u')}>
        <Formula tex="u" />
      </TermButton>
      <TermButton onClick={() => onTerm('heat-alpha')}>
        <Formula tex="\\alpha" />
      </TermButton>
      <TermButton onClick={() => onTerm('heat-ut')}>
        <Formula tex="u_t" />
      </TermButton>
      <TermButton onClick={() => onTerm('heat-uxx')}>
        <Formula tex="u_{xx}" />
      </TermButton>
    </div>
  )
}

function renderDifferentialWhat(lessonId: string, locale: DifferentialLocale, fallback: string, onTerm: (term: DifferentialTermId) => void): ReactNode {
  const term = (id: DifferentialTermId, labelText: string) => (
    <TermButton key={id} onClick={() => onTerm(id)}>
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
        每个箭头表示当前位置的速度向量，也就是同时给出 {term('y-prime', "x' 和 y'")}。轨迹展示系统从某个初始状态出发后的整体运动。
      </>
    ) : (
      <>
        Each arrow is a velocity vector, giving {term('y-prime', "x' and y'")} at that state. A trajectory shows the motion produced by one initial state.
      </>
    )
  }

  if (lessonId === 'heat-equation') {
    return locale === 'zh' ? (
      <>
        每个位置的温度写作 {term('heat-u', 'u(x,t)')}。参数 {term('heat-alpha', 'α')} 控制扩散速度，而公式里的 {term('heat-uxx', 'uₓₓ')} 表示曲线的局部弯曲程度。
      </>
    ) : (
      <>
        The temperature at each position is {term('heat-u', 'u(x,t)')}. The parameter {term('heat-alpha', 'alpha')} controls diffusion speed, and {term('heat-uxx', 'u_xx')} measures local curvature.
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
                'RK4：在一步里看 4 次斜率，把起点、中间、终点附近的信息加权平均，通常同样步数下更准。',
              ],
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
                'RK4 samples four slopes inside one step and blends them, so it is usually much more accurate for the same step count.',
              ],
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
            { title: '你应该观察什么', body: '把步数降低时，三条曲线会分开；把步数提高时，它们会靠近。若 Euler 很快偏离，说明这个变化规则对步长更敏感。' },
          ],
        }
      : {
          eyebrow: 'Read the graph',
          title: 'How to read the numerical methods graph',
          summary: 'The graph compares three approximate solutions. The key question is which path stays stable with the same number of steps.',
          sections: [
            { title: 'Colors', items: ['Purple: Euler.', 'Green: midpoint.', 'Yellow: RK4.'] },
            { title: 'Dots and lines', body: 'Small dots mark the points Euler lands on. Fewer steps mean longer steps, and errors usually become more visible.' },
            { title: 'What to watch', body: 'Lower the step count to make the paths separate, then raise it to see them converge. Early Euler drift means the rule is sensitive to step size.' },
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
      summary: 'uₓₓ 表示温度曲线对位置的二阶导数，可以理解为局部弯曲程度。',
      sections: [
        { title: '直觉', body: '尖峰附近弯曲大，所以变化快；平坦区域弯曲小，所以变化慢。' },
        { title: '和热方程的关系', body: '公式 u_t = αuₓₓ 的意思是：曲线哪里弯得厉害，哪里就更快发生温度变化。' },
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
      title: 'What u_xx means',
      summary: 'u_xx is the second derivative with respect to position, which measures local curvature.',
      sections: [
        { title: 'Intuition', body: 'Sharp peaks have high curvature and change quickly. Flat regions have low curvature and change slowly.' },
        { title: 'In the heat equation', body: 'u_t = alpha u_xx says that curved parts of the temperature profile change faster.' },
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
  for (const sample of samples) {
    drawVectorArrow(ctx, viewport, sample.x, sample.y, sample.dx, sample.dy, colorWithAlpha(theme.muted, 0.68))
  }
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
      { label: 'slope', labelTex: "y'(t_0)", value: format(state.scalarFn(state.t0, state.y0), locale) },
      { label: 'end t', labelTex: 't_{end}', value: format(last?.t, locale) },
      { label: 'end y', labelTex: 'y_{end}', value: format(last?.y, locale) },
    ]
  }
  if (state.lessonId === 'numerical-methods') {
    const step = state.duration / Math.max(1, state.steps)
    const euler = integrateScalarOde(state.scalarFn, { t0: state.t0, y0: state.y0, step, steps: state.steps, method: 'euler' }).at(-1)
    const rk4 = integrateScalarOde(state.scalarFn, { t0: state.t0, y0: state.y0, step, steps: state.steps, method: 'rk4' }).at(-1)
    return [
      { label: 'step h', labelTex: 'h', value: format(step, locale) },
      { label: 'Euler end', value: format(euler?.y, locale) },
      { label: 'RK4 end', value: format(rk4?.y, locale) },
      { label: 'gap', labelTex: '|y_E-y_{RK4}|', value: format(euler && rk4 ? Math.abs(euler.y - rk4.y) : null, locale) },
    ]
  }
  if (state.lessonId === 'phase-portraits') {
    const vector = state.phasePreset.system(state.x0, state.phaseY0)
    return [
      { label: "x'", labelTex: "x'", value: format(vector?.dx, locale) },
      { label: "y'", labelTex: "y'", value: format(vector?.dy, locale) },
      { label: locale === 'zh' ? '速度大小' : 'speed', value: format(vector ? Math.hypot(vector.dx, vector.dy) : null, locale) },
    ]
  }
  if (state.lessonId === 'pendulum') {
    const points = simulatePendulum({ theta0: state.theta0, omega0: state.omega0, damping: state.damping, gravity: state.gravity, step: 0.035, steps: Math.round(state.duration / 0.035) })
    const last = points.at(-1)
    return [
      { label: 'theta', labelTex: '\\theta', value: format(last?.theta, locale) },
      { label: 'omega', labelTex: '\\omega', value: format(last?.omega, locale) },
      { label: locale === 'zh' ? '能量' : 'energy', labelTex: 'E', value: format(last?.energy, locale) },
    ]
  }
  if (state.lessonId === 'population') {
    const points = simulatePopulation({ ...state, step: 0.035, steps: Math.round(state.duration / 0.035) })
    const last = points.at(-1)
    return [
      { label: locale === 'zh' ? '猎物' : 'prey', labelTex: 'x', value: format(last?.x, locale) },
      { label: locale === 'zh' ? '捕食者' : 'predator', labelTex: 'y', value: format(last?.y, locale) },
      { label: locale === 'zh' ? '平衡猎物' : 'equilibrium prey', labelTex: 'd/c', value: format(state.predatorDeath / state.conversion, locale) },
    ]
  }
  const heat = simulateHeatEquation({ shape: state.heatShape, diffusivity: state.diffusivity, time: state.heatTime, points: 96 })
  return [
    { label: locale === 'zh' ? '最高温' : 'max heat', value: format(heat.max, locale) },
    { label: locale === 'zh' ? '平均温' : 'average heat', value: format(heat.average, locale) },
    { label: locale === 'zh' ? '扩散率' : 'diffusivity', labelTex: '\\alpha', value: format(state.diffusivity, locale) },
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

function currentFormulaTex(lessonId: string, scalarPreset: { formulaTex: string }, phasePreset: { formulaTex: string }, fallback: string): string {
  if (lessonId === 'slope-fields' || lessonId === 'numerical-methods') return scalarPreset.formulaTex
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
