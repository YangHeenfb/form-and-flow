import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Languages, Moon, Share2, Sun } from 'lucide-react'
import { AnimationControls } from '../../components/AnimationControls.tsx'
import { Canvas2DView } from '../../components/Canvas2DView.tsx'
import { ExplanationPanel } from '../../components/ExplanationPanel.tsx'
import { MatrixSequencePanel } from '../../components/MatrixSequencePanel.tsx'
import { ThemePanel } from '../../components/ThemePanel.tsx'
import { Three3DView } from '../../components/Three3DView.tsx'
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
import type { AnimationState, Matrix, PlaybackMode, ThreeCameraView, ViewOptions, ViewPan } from '../../math/types.ts'
import { platformLocaleEventName, platformLocaleStorageKey, platformSurfaceModeEventName, platformSurfaceStorageKey } from '../../platform/platformLocale.tsx'
import { useAppState } from '../../state/useAppState.ts'
import { useThemeState } from '../../state/useThemeState.ts'
import { decodeUrlState, updateBrowserUrl } from '../../state/urlState.ts'
import { getMatrixHelpTopics, matrixLearningCopy } from './learningHelp.tsx'
import type { MatrixHelpTopicId } from './learningHelp.tsx'

const initialAnimation: AnimationState = {
  playing: false,
  progress: 0,
  speed: 1,
  mode: 'combined',
  stepIndex: 0,
}

const basePlaybackSpeed = 0.75
const minViewZoom = 0.25
const maxViewZoom = 2.5
const matrixLocaleStorageKey = 'matrix-motion-lab-locale'

type MatrixMotionLabProps = {
  embedded?: boolean
}

export function MatrixMotionLab({ embedded = false }: MatrixMotionLabProps) {
  const loadedShare = useMemo(() => (typeof window === 'undefined' ? null : decodeUrlState(window.location.search)), [])
  const appState = useAppState()
  const themeState = useThemeState(loadedShare?.theme)
  const [locale, setLocale] = useState<Locale>(() => loadLocale())
  const [animation, setAnimation] = useState<AnimationState>(initialAnimation)
  const [threeCameraView, setThreeCameraView] = useState<ThreeCameraView>('free')
  const [viewZoom, setViewZoom] = useState(1)
  const [viewPan, setViewPan] = useState<ViewPan>({ x: 0, y: 0 })
  const [activeHelpTopicId, setActiveHelpTopicId] = useState<MatrixHelpTopicId | null>(null)
  const centerStageRef = useRef<HTMLElement | null>(null)
  const exporterRef = useRef<() => string | null>(() => null)
  const copy = appCopy[locale]
  const learningCopy = matrixLearningCopy[locale]

  useEffect(() => {
    localStorage.setItem(matrixLocaleStorageKey, locale)
    localStorage.setItem(platformLocaleStorageKey, locale)
    window.dispatchEvent(new CustomEvent(platformLocaleEventName, { detail: locale }))
  }, [locale])

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
    const storedSurfaceMode = localStorage.getItem(platformSurfaceStorageKey)
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

  useEffect(() => {
    if (!animation.playing) {
      return
    }
    let frame = 0
    let previous = performance.now()
    const tick = (now: number) => {
      const delta = now - previous
      previous = now
      setAnimation((current) => {
        if (!current.playing) {
          return current
        }
        const nextProgress = current.progress + (delta / 1400) * current.speed * basePlaybackSpeed
        if (nextProgress < 1) {
          return { ...current, progress: nextProgress }
        }
        if (current.mode === 'step' && current.stepIndex < Math.max(0, stepMaps.length - 1)) {
          return { ...current, progress: 0, stepIndex: current.stepIndex + 1 }
        }
        return { ...current, progress: 1, playing: false }
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [animation.playing, stepMaps.length])

  const activeTarget = animation.mode === 'step' ? stepMaps[animation.stepIndex] ?? composedMap : composedMap
  const previousStep = animation.mode === 'step' && animation.stepIndex > 0 ? stepMaps[animation.stepIndex - 1] : null
  const currentMatrix = useMemo(() => {
    if (!activeTarget) {
      return canonicalBridgeMatrix(appState.outputDim, appState.inputDim)
    }
    const start = getAnimationStartMatrix(activeTarget.matrix, activeTarget.outputDim, activeTarget.inputDim, previousStep?.matrix)
    return lerpMatrix(start, activeTarget.matrix, smoothstep(animation.progress))
  }, [activeTarget, animation.progress, appState.inputDim, appState.outputDim, previousStep])

  const activeInputDim = activeTarget?.inputDim ?? appState.inputDim
  const activeOutputDim = activeTarget?.outputDim ?? appState.outputDim
  const visualMatrix = useMemo(
    () =>
      getThreeVisualMatrix({
        currentMatrix,
        targetMatrix: activeTarget?.matrix ?? currentMatrix,
        previousMatrix: previousStep?.matrix,
        inputDim: activeInputDim,
        outputDim: activeOutputDim,
        progress: animation.progress,
      }),
    [activeInputDim, activeOutputDim, activeTarget?.matrix, animation.progress, currentMatrix, previousStep?.matrix],
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

  const share = useCallback(async () => {
    const url = updateBrowserUrl({
      maps: appState.maps,
      vectors: appState.vectors,
      theme: themeState.theme.includeThemeInShareLink ? themeState.theme : undefined,
    })
    await navigator.clipboard?.writeText(url)
  }, [appState.maps, appState.vectors, themeState.theme])

  const setPlaybackMode = useCallback((mode: PlaybackMode) => {
    setAnimation((current) => ({ ...current, mode, progress: 0, stepIndex: 0 }))
  }, [])

  const setClampedViewZoom = useCallback((zoom: number) => {
    setViewZoom(clampViewZoom(zoom))
  }, [])

  const openHelpTopic = useCallback((topic: MatrixHelpTopicId) => {
    setActiveHelpTopicId(topic)
  }, [])

  const renderGraphHelpAction = () => (
    <HelpTrigger ariaLabel={learningCopy.openGraph} onClick={() => openHelpTopic('graph')}>
      {learningCopy.openGraph}
    </HelpTrigger>
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
            <button className="share-button" type="button" onClick={share}>
              <Share2 size={17} />
              {copy.top.shareUrl}
            </button>
          </div>
        </header>
      )}

      <div className="workspace">
        <aside className="left-panel">
          <section className="panel-section matrix-learning-entry">
            <div className="section-heading">
              <h2>{learningCopy.entryTitle}</h2>
              <HelpTrigger ariaLabel={learningCopy.openOverview} onClick={() => openHelpTopic('overview')}>
                {learningCopy.openOverview}
              </HelpTrigger>
            </div>
            <p className="muted compact">{learningCopy.entryHint}</p>
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
          <VectorPanel
            copy={copy}
            vectors={appState.vectors}
            requiredDim={appState.inputDim}
            onAdd={appState.addVector}
            onUpdate={appState.updateVector}
            onDelete={appState.deleteVector}
          />
          <ThemePanel
            copy={copy.themePanel}
            theme={themeState.theme}
            onColorPresetChange={themeState.setColorPreset}
            onColorChange={themeState.setColor}
            onIncludeThemeChange={themeState.setIncludeThemeInShareLink}
          />
        </aside>

        <section className="center-stage" ref={centerStageRef}>
          {usesThree ? (
            <>
              <Three3DView
                {...renderPayload}
                visualMatrix={visualMatrix}
                copy={copy.threeView}
                title={copy.views.title(activeInputDim, activeOutputDim)}
                subtitle={copy.views.subtitle(activeInputDim, activeOutputDim)}
                cameraView={threeCameraView}
                onCameraViewChange={setThreeCameraView}
                registerExporter={registerExporter}
                headerAction={renderGraphHelpAction()}
              />
              {activeInputDim === 3 && activeOutputDim === 2 && (
                <Canvas2DView
                  {...renderPayload}
                  title={copy.views.trueR2Title}
                  subtitle={copy.views.trueR2Subtitle}
                  onViewPanChange={setViewPan}
                  registerExporter={() => undefined}
                  headerAction={renderGraphHelpAction()}
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
              headerAction={renderGraphHelpAction()}
            />
          )}
        </section>

        <ExplanationPanel
          locale={locale}
          maps={appState.maps}
          composedMap={composedMap}
          stepMaps={stepMaps}
          vectors={appState.vectors}
          validation={appState.validation}
          onOpenHelpTopic={openHelpTopic}
        />
      </div>

      <AnimationControls
        copy={copy.controls}
        animation={animation}
        viewOptions={appState.viewOptions}
        onPlay={() => setAnimation((current) => ({ ...current, playing: true }))}
        onPause={() => setAnimation((current) => ({ ...current, playing: false }))}
        onReset={() => setAnimation((current) => ({ ...current, playing: false, progress: 0, stepIndex: 0 }))}
        onSpeedChange={(speed) => setAnimation((current) => ({ ...current, speed }))}
        viewZoom={viewZoom}
        onViewZoomChange={setClampedViewZoom}
        onModeChange={setPlaybackMode}
        onViewOptionChange={setViewOption}
        onExport={exportPng}
      />
      <LearningDrawer topic={activeHelpTopic} closeLabel={learningCopy.close} onClose={() => setActiveHelpTopicId(null)} />
    </main>
  )
}

function clampViewZoom(zoom: number): number {
  return Math.max(minViewZoom, Math.min(maxViewZoom, zoom))
}

function loadLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en'
  }
  const globalLocale = localStorage.getItem(platformLocaleStorageKey)
  if (globalLocale === 'zh' || globalLocale === 'en') {
    return globalLocale
  }
  return localStorage.getItem(matrixLocaleStorageKey) === 'zh' ? 'zh' : 'en'
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
    const visualTarget = embeddedMatrixFor3D(targetMatrix, outputDim, inputDim)
    const previousShape = previousMatrix ? matrixShape(previousMatrix) : null
    const visualStart = previousMatrix && previousShape?.rows === 3 && previousShape.cols === 3 ? previousMatrix : identityMatrix(3)
    return lerpMatrix(visualStart, visualTarget, smoothstep(progress))
  }

  return embeddedMatrixFor3D(currentMatrix, outputDim, inputDim)
}
