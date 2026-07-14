import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Focus, Languages, Moon, Sun } from 'lucide-react'
import { AnimationControls } from '../../components/AnimationControls.tsx'
import { Canvas2DView } from '../../components/Canvas2DView.tsx'
import { ExplanationPanel } from '../../components/ExplanationPanel.tsx'
import { MatrixSequencePanel } from '../../components/MatrixSequencePanel.tsx'
import { ThemePanel } from '../../components/ThemePanel.tsx'
import { VectorPanel } from '../../components/VectorPanel.tsx'
import { HelpTrigger, LearningDrawer } from '../../core/ui/LearningHelp.tsx'
import { appCopy } from '../../i18n.ts'
import type { Locale } from '../../i18n.ts'
import {
  canonicalBridgeMatrix,
  composeLinearMapsInUserOrder,
  cumulativeLinearMapsInUserOrder,
  embeddedMatrixFor3D,
  identityMatrix,
  lerpMatrix,
  matrixShape,
  smoothstep,
} from '../../math/matrix.ts'
import type { AnimationState, LinearMap, Matrix, PlaybackMode, ThreeCameraView, ViewOptions, ViewPan } from '../../math/types.ts'
import { useModuleActions } from '../../platform/ModuleActionContext.tsx'
import { LessonStageActions } from '../../platform/LessonStageActions.tsx'
import {
  platformLocaleEventName,
  platformLocaleStorageKey,
  platformSurfaceModeEventName,
  readStoredPlatformLocaleValue,
  readStoredSurfaceModeValue,
} from '../../platform/platformLocale.tsx'
import { VisualizationWorkbench, type VisualizationWorkbenchHandle } from '../../platform/VisualizationWorkbench.tsx'
import type { OverlayPanelDefinition, VisualizationWorkbenchStatus } from '../../platform/visualizationLayoutTypes.ts'
import type { MatrixAnimationFrame } from '../../render/RendererAdapter.ts'
import { useAppState } from '../../state/useAppState.ts'
import { useThemeState } from '../../state/useThemeState.ts'
import { getMatrixHelpTopics, matrixLearningCopy } from './learningHelp.tsx'
import type { MatrixHelpTopicId } from './learningHelp.tsx'

const initialAnimation: AnimationState = {
  playing: false,
  progress: 0,
  speed: 1,
  mode: 'combined',
  stepIndex: 0,
}

const LazyThree3DView = lazy(() => import('../../components/Three3DView.tsx').then(({ Three3DView }) => ({ default: Three3DView })))

const basePlaybackSpeed = 0.75
const minViewZoom = 0.25
const maxViewZoom = 2.5
const matrixLocaleStorageKey = 'form-and-flow-matrix-locale'
const legacyMatrixLocaleStorageKey = 'matrix-motion-lab-locale'

type MatrixMotionLabProps = {
  embedded?: boolean
}

export function MatrixMotionLab({ embedded = false }: MatrixMotionLabProps) {
  const appState = useAppState()
  const themeState = useThemeState()
  const [locale, setLocale] = useState<Locale>(() => loadLocale())
  const [animation, setAnimation] = useState<AnimationState>(initialAnimation)
  const [threeCameraView, setThreeCameraView] = useState<ThreeCameraView>('free')
  const [viewZoom, setViewZoom] = useState(1)
  const [viewPan, setViewPan] = useState<ViewPan>({ x: 0, y: 0 })
  const [viewResetKey, setViewResetKey] = useState(0)
  const [activeHelpTopicId, setActiveHelpTopicId] = useState<MatrixHelpTopicId | null>(null)
  const centerStageRef = useRef<HTMLElement | null>(null)
  const workbenchRef = useRef<VisualizationWorkbenchHandle | null>(null)
  const exporterRef = useRef<() => string | null>(() => null)
  const animationRef = useRef<AnimationState>(initialAnimation)
  const animationProgressRef = useRef(initialAnimation.progress)
  const frameRenderersRef = useRef(new Set<(frame: MatrixAnimationFrame) => void>())
  const copy = appCopy[locale]
  const learningCopy = matrixLearningCopy[locale]
  const prefersReducedMotion = usePrefersReducedMotion()
  const matrixDraftSignature = useMemo(
    () => matrixPlaybackSignature(appState.maps, appState.validation.valid),
    [appState.maps, appState.validation.valid],
  )
  const [playbackSignature, setPlaybackSignature] = useState(() => matrixDraftSignature)
  const [workbenchStatus, setWorkbenchStatus] = useState<VisualizationWorkbenchStatus>({
    mode: 'standard',
  })
  const hasUnplayedMatrixEdit = playbackSignature !== matrixDraftSignature
  const displayedAnimation = useMemo(
    () => (hasUnplayedMatrixEdit ? { ...animation, playing: false, progress: 0, stepIndex: 0 } : animation),
    [animation, hasUnplayedMatrixEdit],
  )

  useEffect(() => {
    localStorage.setItem(matrixLocaleStorageKey, locale)
    localStorage.setItem(platformLocaleStorageKey, locale)
    window.dispatchEvent(new CustomEvent(platformLocaleEventName, { detail: locale }))
  }, [locale])

  useEffect(() => {
    animationRef.current = animation
  }, [animation])

  useEffect(() => {
    animationProgressRef.current = animation.progress
  }, [animation.progress])

  useEffect(() => {
    if (!hasUnplayedMatrixEdit) {
      return
    }
    animationProgressRef.current = 0
    setAnimation((current) =>
      current.playing || current.progress !== 0 || current.stepIndex !== 0 ? { ...current, playing: false, progress: 0, stepIndex: 0 } : current,
    )
  }, [hasUnplayedMatrixEdit])

  useEffect(() => {
    const syncLocale = (event: Event) => {
      const next = (event as CustomEvent<Locale>).detail
      if (next === 'en' || next === 'zh') setLocale(next)
    }
    const syncSurfaceMode = (event: Event) => {
      const next = (event as CustomEvent<'dark' | 'light'>).detail
      if (next === 'dark' || next === 'light') themeState.setSurfaceMode(next)
    }
    window.addEventListener(platformLocaleEventName, syncLocale)
    window.addEventListener(platformSurfaceModeEventName, syncSurfaceMode)
    const storedSurfaceMode = readStoredSurfaceModeValue()
    if (storedSurfaceMode === 'dark' || storedSurfaceMode === 'light') {
      themeState.setSurfaceMode(storedSurfaceMode)
    }
    return () => {
      window.removeEventListener(platformLocaleEventName, syncLocale)
      window.removeEventListener(platformSurfaceModeEventName, syncSurfaceMode)
    }
  }, [themeState.setSurfaceMode])

  const composedMap = useMemo(() => {
    if (!appState.validation.valid) {
      return null
    }
    return composeLinearMapsInUserOrder(appState.maps)
  }, [appState.maps, appState.validation.valid])

  const stepMaps = useMemo(() => {
    if (!appState.validation.valid) {
      return []
    }
    return cumulativeLinearMapsInUserOrder(appState.maps)
  }, [appState.maps, appState.validation.valid])

  useEffect(() => {
    setAnimation((current) => ({
      ...current,
      stepIndex: Math.min(current.stepIndex, Math.max(0, stepMaps.length - 1)),
    }))
  }, [stepMaps.length])

  const activeTarget = displayedAnimation.mode === 'step' ? stepMaps[displayedAnimation.stepIndex] ?? composedMap : composedMap
  const previousStep = displayedAnimation.mode === 'step' && displayedAnimation.stepIndex > 0 ? stepMaps[displayedAnimation.stepIndex - 1] : null
  const activeInputDim = activeTarget?.inputDim ?? appState.inputDim
  const activeOutputDim = activeTarget?.outputDim ?? appState.outputDim
  const animationStartMatrix = useMemo(() => {
    if (!activeTarget) {
      return canonicalBridgeMatrix(appState.outputDim, appState.inputDim)
    }
    return getAnimationStartMatrix(activeTarget.matrix, activeTarget.outputDim, activeTarget.inputDim, previousStep?.matrix)
  }, [activeTarget, appState.inputDim, appState.outputDim, previousStep?.matrix])
  const currentMatrix = useMemo(() => {
    if (!activeTarget) {
      return canonicalBridgeMatrix(appState.outputDim, appState.inputDim)
    }
    return lerpMatrix(animationStartMatrix, activeTarget.matrix, smoothstep(displayedAnimation.progress))
  }, [activeTarget, displayedAnimation.progress, animationStartMatrix, appState.inputDim, appState.outputDim])
  const visualMatrix = useMemo(
    () =>
      getThreeVisualMatrix({
        currentMatrix,
        targetMatrix: activeTarget?.matrix ?? currentMatrix,
        previousMatrix: previousStep?.matrix,
        inputDim: activeInputDim,
        outputDim: activeOutputDim,
        progress: displayedAnimation.progress,
      }),
    [activeInputDim, activeOutputDim, activeTarget?.matrix, displayedAnimation.progress, currentMatrix, previousStep?.matrix],
  )
  const usesThree = appState.maps.some((map) => map.inputDim === 3 || map.outputDim === 3) || activeInputDim === 3 || activeOutputDim === 3
  const learningTopics = useMemo(
    () => getMatrixHelpTopics(locale, activeInputDim, activeOutputDim, usesThree),
    [activeInputDim, activeOutputDim, locale, usesThree],
  )
  const activeHelpTopic = activeHelpTopicId ? learningTopics[activeHelpTopicId] : null
  const renderPayload = {
    matrix: currentMatrix,
    inputDim: activeInputDim,
    outputDim: activeOutputDim,
    vectors: appState.vectors,
    options: appState.viewOptions,
    theme: themeState.theme,
    viewZoom,
    viewPan,
  }

  const buildAnimationFrame = useCallback(
    (progress: number): MatrixAnimationFrame => {
      const targetMatrix = activeTarget?.matrix ?? currentMatrix
      const matrix = activeTarget ? lerpMatrix(animationStartMatrix, targetMatrix, smoothstep(progress)) : currentMatrix
      return {
        matrix,
        visualMatrix: getThreeVisualMatrix({
          currentMatrix: matrix,
          targetMatrix,
          previousMatrix: previousStep?.matrix,
          inputDim: activeInputDim,
          outputDim: activeOutputDim,
          progress,
        }),
        progress,
      }
    },
    [activeInputDim, activeOutputDim, activeTarget, animationStartMatrix, currentMatrix, previousStep?.matrix],
  )

  const emitAnimationFrame = useCallback(
    (progress: number) => {
      const frame = buildAnimationFrame(progress)
      frameRenderersRef.current.forEach((renderer) => renderer(frame))
    },
    [buildAnimationFrame],
  )

  const registerFrameRenderer = useCallback((renderer: (frame: MatrixAnimationFrame) => void) => {
    frameRenderersRef.current.add(renderer)
    return () => {
      frameRenderersRef.current.delete(renderer)
    }
  }, [])

  useEffect(() => {
    if (!animation.playing || hasUnplayedMatrixEdit) {
      return
    }
    let frame = 0
    let previous = performance.now()
    const tick = (now: number) => {
      const current = animationRef.current
      if (!current.playing) {
        return
      }
      const delta = now - previous
      previous = now
      const nextProgress = animationProgressRef.current + (delta / 1400) * current.speed * basePlaybackSpeed
      if (nextProgress < 1) {
        animationProgressRef.current = nextProgress
        emitAnimationFrame(nextProgress)
        setAnimation((latest) => (latest.playing ? { ...latest, progress: nextProgress } : latest))
        frame = requestAnimationFrame(tick)
        return
      }
      if (current.mode === 'step' && current.stepIndex < Math.max(0, stepMaps.length - 1)) {
        animationProgressRef.current = 0
        setAnimation((latest) => ({ ...latest, progress: 0, stepIndex: latest.stepIndex + 1 }))
        return
      }
      animationProgressRef.current = 1
      emitAnimationFrame(1)
      setAnimation((latest) => ({ ...latest, progress: 1, playing: false }))
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [animation.playing, emitAnimationFrame, hasUnplayedMatrixEdit, stepMaps.length])

  const registerExporter = useCallback((exporter: () => string | null) => {
    exporterRef.current = exporter
  }, [])

  const exportPng = useCallback(() => {
    const dataUrl = exporterRef.current()
    if (!dataUrl) {
      return
    }
    const anchor = document.createElement('a')
    anchor.href = dataUrl
    anchor.download = 'matrix-motion.png'
    anchor.click()
  }, [])

  const setPlaybackMode = useCallback((mode: PlaybackMode) => {
    animationProgressRef.current = 0
    setAnimation((current) => ({ ...current, mode, progress: 0, stepIndex: 0 }))
  }, [])

  const playAnimation = useCallback(() => {
    setPlaybackSignature(matrixDraftSignature)
    if (prefersReducedMotion) {
      animationProgressRef.current = 1
      emitAnimationFrame(1)
      setAnimation((current) => ({ ...current, playing: false, progress: 1 }))
      return
    }
    setAnimation((current) => {
      const shouldRestart = hasUnplayedMatrixEdit || animationProgressRef.current >= 1
      const progress = shouldRestart ? 0 : animationProgressRef.current
      animationProgressRef.current = progress
      return {
        ...current,
        playing: true,
        progress,
        stepIndex: shouldRestart ? 0 : current.stepIndex,
      }
    })
  }, [emitAnimationFrame, hasUnplayedMatrixEdit, matrixDraftSignature, prefersReducedMotion])

  const pauseAnimation = useCallback(() => {
    const progress = hasUnplayedMatrixEdit ? 0 : animationProgressRef.current
    emitAnimationFrame(progress)
    setAnimation((current) => ({ ...current, playing: false, progress }))
  }, [emitAnimationFrame, hasUnplayedMatrixEdit])

  const resetAnimation = useCallback(() => {
    setPlaybackSignature(matrixDraftSignature)
    animationProgressRef.current = 0
    setAnimation((current) => ({ ...current, playing: false, progress: 0, stepIndex: 0 }))
  }, [matrixDraftSignature])

  const seekAnimation = useCallback(
    (timelineProgress: number) => {
      setPlaybackSignature(matrixDraftSignature)
      const progress = clampTimelineProgress(timelineProgress)
      setAnimation((current) => {
        if (current.mode !== 'step') {
          animationProgressRef.current = progress
          return { ...current, progress }
        }
        const stepCount = Math.max(1, stepMaps.length)
        const scaledProgress = progress * stepCount
        const stepIndex = Math.min(stepCount - 1, Math.floor(scaledProgress))
        const stepProgress = stepIndex === stepCount - 1 && progress === 1 ? 1 : scaledProgress - stepIndex
        animationProgressRef.current = stepProgress
        return {
          ...current,
          progress: stepProgress,
          stepIndex,
        }
      })
    },
    [matrixDraftSignature, stepMaps.length],
  )

  const resetView = useCallback(() => {
    setViewZoom(1)
    setViewPan({ x: 0, y: 0 })
    setThreeCameraView('free')
    setViewResetKey((current) => current + 1)
  }, [])

  const openHelpTopic = useCallback((topic: MatrixHelpTopicId) => {
    setActiveHelpTopicId(topic)
  }, [])

  const platformActions = useMemo(
    () => ({
      isVisualizationExpanded: workbenchStatus.mode === 'focus',
    }),
    [workbenchStatus.mode],
  )
  useModuleActions(platformActions)

  const renderFocusAction = () => {
    const isFocusMode = workbenchStatus.mode === 'focus'
    const label = isFocusMode ? copy.visualization.exitFocus : copy.visualization.focus

    return (
      <button
        className="visualization-header-focus-toggle"
        type="button"
        aria-label={label}
        aria-pressed={isFocusMode}
        title={label}
        onClick={() => workbenchRef.current?.toggleFocus()}
      >
        <Focus size={16} />
        {label}
      </button>
    )
  }

  const renderStageActions = () => (
    <LessonStageActions
      graphLabel={learningCopy.openGraph}
      graphAriaLabel={learningCopy.openGraph}
      onGraphHelp={() => openHelpTopic('graph')}
      focusButton={renderFocusAction()}
      exportLabel={copy.visualization.exportPng}
      onExport={exportPng}
    />
  )

  const handleViewWheel = useCallback((event: WheelEvent) => {
    event.preventDefault()
    const boundedDelta = Math.max(-240, Math.min(240, event.deltaY))
    const factor = Math.exp(-boundedDelta * 0.0018)
    setViewZoom((current) => clampViewZoom(current * factor))
  }, [])

  useEffect(() => {
    const centerStage = centerStageRef.current
    if (!centerStage) {
      return
    }
    centerStage.addEventListener('wheel', handleViewWheel, { passive: false })
    return () => centerStage.removeEventListener('wheel', handleViewWheel)
  }, [handleViewWheel])

  const setViewOption = useCallback(
    (key: keyof ViewOptions, value: boolean) => {
      appState.setViewOption(key, value)
    },
    [appState],
  )

  const matrixPanel = (
    <>
      <section className="panel-section matrix-learning-entry learning-help-entry">
        <HelpTrigger ariaLabel={learningCopy.openOverview} onClick={() => openHelpTopic('overview')}>
          {learningCopy.openOverview}
        </HelpTrigger>
      </section>

      <MatrixSequencePanel
        copy={copy}
        locale={locale}
        maps={appState.maps}
        validation={appState.validation}
        onAdd={appState.addMap}
        onApplyPreset={appState.applyPreset}
        onUpdate={appState.updateMap}
        onDelete={appState.deleteMap}
        onMove={appState.moveMap}
      />
    </>
  )

  const vectorPanel = (
    <VectorPanel
      copy={copy}
      vectors={appState.vectors}
      requiredDim={appState.inputDim}
      onAdd={appState.addVector}
      onUpdate={appState.updateVector}
      onDelete={appState.deleteVector}
    />
  )

  const themePanel = (
    <ThemePanel
      copy={copy.themePanel}
      theme={themeState.theme}
      onColorPresetChange={themeState.setColorPreset}
      onColorChange={themeState.setColor}
    />
  )

  const explanationPanel = (
    <ExplanationPanel
      locale={locale}
      maps={appState.maps}
      composedMap={composedMap}
      stepMaps={stepMaps}
      vectors={appState.vectors}
      validation={appState.validation}
      onOpenHelpTopic={openHelpTopic}
    />
  )

  const stage = (
    <>
      {usesThree ? (
        <>
          <Suspense fallback={<div className="view-panel view-panel-loading" role="status">{locale === 'zh' ? '正在加载 3D 视图…' : 'Loading 3D view…'}</div>}>
            <LazyThree3DView
              {...renderPayload}
              visualMatrix={visualMatrix}
              copy={copy.threeView}
              title={copy.views.title(activeInputDim, activeOutputDim)}
              subtitle={copy.views.subtitle(activeInputDim, activeOutputDim)}
              cameraView={threeCameraView}
              onCameraViewChange={setThreeCameraView}
              viewResetKey={viewResetKey}
              registerExporter={registerExporter}
              registerFrameRenderer={registerFrameRenderer}
              stageAction={renderStageActions()}
            />
          </Suspense>
          {activeInputDim === 3 && activeOutputDim === 2 && (
            <Canvas2DView
              {...renderPayload}
              title={copy.views.trueR2Title}
              subtitle={copy.views.trueR2Subtitle}
              onViewPanChange={setViewPan}
              registerExporter={() => undefined}
              registerFrameRenderer={registerFrameRenderer}
            />
          )}
        </>
      ) : (
        <Canvas2DView
          {...renderPayload}
          title={copy.views.canvas2dTitle}
          subtitle={copy.views.canvas2dSubtitle}
          onViewPanChange={setViewPan}
          registerExporter={registerExporter}
          registerFrameRenderer={registerFrameRenderer}
          stageAction={renderStageActions()}
        />
      )}
    </>
  )

  const transport = (
    <AnimationControls
      copy={copy.controls}
      animation={displayedAnimation}
      viewOptions={appState.viewOptions}
      onPlay={playAnimation}
      onPause={pauseAnimation}
      onReset={resetAnimation}
      onResetView={resetView}
      onSeek={seekAnimation}
      onSpeedChange={(speed) => setAnimation((current) => ({ ...current, speed }))}
      onModeChange={setPlaybackMode}
      onViewOptionChange={setViewOption}
      stepCount={stepMaps.length}
    />
  )

  const overlayPanels: OverlayPanelDefinition[] = [
    { id: 'matrices', title: copy.visualization.matrices, content: matrixPanel, side: 'left' },
    { id: 'vectors', title: copy.visualization.vectors, content: vectorPanel, side: 'left' },
    { id: 'theme', title: copy.visualization.theme, content: themePanel, side: 'left' },
    { id: 'explanation', title: copy.visualization.explanation, content: explanationPanel, side: 'right' },
  ]

  const shortcutActions = useMemo(
    () => ({
      togglePlay: displayedAnimation.playing ? pauseAnimation : playAnimation,
      reset: resetAnimation,
      openHelp: () => openHelpTopic('overview'),
    }),
    [displayedAnimation.playing, openHelpTopic, pauseAnimation, playAnimation, resetAnimation],
  )

  return (
    <main className={`app-shell${embedded ? ' matrix-embedded-shell' : ''}`} style={themeState.cssVariables}>
      {!embedded && (
        <header className="top-bar">
          <div>
            <p className="eyebrow">{copy.top.eyebrow}</p>
            <h1>{copy.top.title}</h1>
          </div>
          <div className="top-actions">
            <button
              className="language-toggle"
              type="button"
              aria-label={copy.top.languageLabel}
              onClick={() => setLocale((current) => (current === 'en' ? 'zh' : 'en'))}
            >
              <Languages size={17} />
              {locale === 'en' ? copy.top.switchToChinese : copy.top.switchToEnglish}
            </button>
            <button
              className="background-toggle"
              type="button"
              onClick={() => themeState.setSurfaceMode(themeState.theme.surfaceMode === 'dark' ? 'light' : 'dark')}
            >
              {themeState.theme.surfaceMode === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
              {themeState.theme.surfaceMode === 'dark' ? copy.top.darkApp : copy.top.lightApp}
            </button>
          </div>
        </header>
      )}

      <VisualizationWorkbench
        ref={workbenchRef}
        title={copy.top.title}
        subtitle={copy.top.eyebrow}
        labels={copy.visualization}
        leftPanel={
          <>
            {matrixPanel}
            {vectorPanel}
            {themePanel}
          </>
        }
        stage={stage}
        rightPanel={explanationPanel}
        transport={transport}
        overlayPanels={overlayPanels}
        stageRef={centerStageRef}
        shortcutActions={shortcutActions}
        onStatusChange={setWorkbenchStatus}
      />
      <LearningDrawer topic={activeHelpTopic} closeLabel={learningCopy.close} onClose={() => setActiveHelpTopicId(null)} />
    </main>
  )
}

function clampViewZoom(zoom: number): number {
  return Math.max(minViewZoom, Math.min(maxViewZoom, zoom))
}

function clampTimelineProgress(progress: number): number {
  return Math.max(0, Math.min(1, progress))
}

function loadLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en'
  }
  const globalLocale = readStoredPlatformLocaleValue()
  if (globalLocale === 'zh' || globalLocale === 'en') {
    return globalLocale
  }
  return (localStorage.getItem(matrixLocaleStorageKey) ?? localStorage.getItem(legacyMatrixLocaleStorageKey)) === 'zh' ? 'zh' : 'en'
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(media.matches)
    const update = () => setPrefersReducedMotion(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return prefersReducedMotion
}

function matrixPlaybackSignature(maps: LinearMap[], valid: boolean): string {
  return JSON.stringify({
    valid,
    maps: maps.map((map) => ({
      id: map.id,
      inputDim: map.inputDim,
      outputDim: map.outputDim,
      matrix: map.matrix,
    })),
  })
}

function getAnimationStartMatrix(target: Matrix, outputDim: 2 | 3, inputDim: 2 | 3, previous?: Matrix): Matrix {
  if (previous) {
    const targetShape = matrixShape(target)
    const previousShape = matrixShape(previous)
    if (targetShape.rows === previousShape.rows && targetShape.cols === previousShape.cols) {
      return previous
    }
  }
  return canonicalBridgeMatrix(outputDim, inputDim)
}

function getThreeVisualMatrix({
  currentMatrix,
  targetMatrix,
  previousMatrix,
  inputDim,
  outputDim,
  progress,
}: {
  currentMatrix: Matrix
  targetMatrix: Matrix
  previousMatrix?: Matrix
  inputDim: 2 | 3
  outputDim: 2 | 3
  progress: number
}): Matrix {
  if (inputDim === 3 && outputDim === 2) {
    const visualStartMatrix = previousMatrix ? embeddedMatrixFor3D(previousMatrix, outputDim, inputDim) : identityMatrix(3)
    const visualTarget = embeddedMatrixFor3D(targetMatrix, outputDim, inputDim)
    return lerpMatrix(visualStartMatrix, visualTarget, smoothstep(progress))
  }

  return embeddedMatrixFor3D(currentMatrix, outputDim, inputDim)
}
