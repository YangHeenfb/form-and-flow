import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, Info, SlidersHorizontal } from 'lucide-react'
import { OverlayDrawer } from '../../platform/OverlayDrawer.tsx'
import { StandardReadoutActionProvider } from '../../platform/LessonStageActions.tsx'
import type { OverlayPanelSide } from '../../platform/visualizationLayoutTypes.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { ExplorerStageHeader } from './ExplorerChrome.tsx'

type LessonScaffoldProps = {
  className?: string
  controlsClassName?: string
  mainClassName?: string
  explanationClassName?: string
  isFocusMode?: boolean
  controls: ReactNode
  main?: ReactNode
  eyebrow?: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  stage?: ReactNode
  stageActions?: ReactNode
  transport?: ReactNode
  inspectorAction?: ReactNode
  explanation: ReactNode
  focusControls?: ReactNode
  focusReadout?: ReactNode
  focusTransport?: ReactNode
  autoHideToggle?: ReactNode
  focusControlsLabel?: string
  focusReadoutLabel?: string
  closeFocusPanelLabel?: string
  onFocusPanelActiveChange?: (active: boolean) => void
}

type LessonFocusPanelId = 'controls' | 'readout'

export function LessonScaffold({
  className,
  controlsClassName,
  mainClassName,
  explanationClassName,
  isFocusMode = false,
  controls,
  main,
  eyebrow,
  title,
  subtitle,
  stage,
  stageActions,
  transport,
  inspectorAction,
  explanation,
  focusControls,
  focusReadout,
  focusTransport,
  autoHideToggle,
  focusControlsLabel,
  focusReadoutLabel,
  closeFocusPanelLabel,
  onFocusPanelActiveChange,
}: LessonScaffoldProps) {
  const { locale } = usePlatformLocale()
  const labels = focusPanelLabels[locale]
  const [activePanelId, setActivePanelId] = useState<LessonFocusPanelId | null>(null)
  const [standardReadoutOpen, setStandardReadoutOpen] = useState(false)
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false)
  const [mobileReadoutOpen, setMobileReadoutOpen] = useState(false)
  const controlsId = useId()
  const readoutId = useId()
  const controlsContent = focusControls === undefined ? controls : focusControls
  const readoutContent = focusReadout === undefined ? explanation : focusReadout
  const focusPanels = useMemo(
    () =>
      [
        {
          id: 'controls' as const,
          title: focusControlsLabel ?? labels.controls,
          content: (
            <div className="lesson-focus-drawer-content lesson-focus-drawer-content-controls">
              {controlsContent}
            </div>
          ),
          enabled: controlsContent !== null && controlsContent !== undefined && controlsContent !== false,
          side: 'left' as OverlayPanelSide,
          icon: SlidersHorizontal,
        },
        {
          id: 'readout' as const,
          title: focusReadoutLabel ?? labels.readout,
          content: (
            <div className="lesson-focus-drawer-content lesson-focus-drawer-content-readout">
              {readoutContent}
            </div>
          ),
          enabled: readoutContent !== null && readoutContent !== undefined && readoutContent !== false,
          side: 'right' as OverlayPanelSide,
          icon: Info,
        },
      ].filter((panel) => panel.enabled),
    [controlsContent, focusControlsLabel, focusReadoutLabel, labels.controls, labels.readout, readoutContent],
  )
  const activePanel = focusPanels.find((panel) => panel.id === activePanelId) ?? null
  const hasActiveFocusPanel = isFocusMode && activePanel !== null

  useEffect(() => {
    if (!isFocusMode || !focusPanels.some((panel) => panel.id === activePanelId)) {
      setActivePanelId(null)
    }
    if (isFocusMode) setStandardReadoutOpen(false)
  }, [activePanelId, focusPanels, isFocusMode])

  useEffect(() => {
    onFocusPanelActiveChange?.(hasActiveFocusPanel)
  }, [hasActiveFocusPanel, onFocusPanelActiveChange])

  useEffect(() => () => onFocusPanelActiveChange?.(false), [onFocusPanelActiveChange])

  return (
    <StandardReadoutActionProvider
      value={{
        label: labels.readout,
        open: standardReadoutOpen,
        enabled: !isFocusMode,
        onToggle: () => setStandardReadoutOpen((open) => !open),
      }}
    >
      <section className={joinClassNames('lesson-shell', className)} data-focus-mode={isFocusMode ? 'focus' : 'standard'}>
        <aside className={joinClassNames('lesson-shell-controls platform-card', controlsClassName)} data-mobile-open={mobileControlsOpen ? 'true' : 'false'}>
          <header className="lesson-inspector-header">
            <SlidersHorizontal size={16} aria-hidden="true" />
            <span>{labels.controls}</span>
            {inspectorAction && <div className="lesson-inspector-action">{inspectorAction}</div>}
          </header>
          <div className="lesson-mobile-inspector-header">
            <button
              type="button"
              className="lesson-mobile-section-toggle"
              aria-expanded={mobileControlsOpen}
              aria-controls={controlsId}
              onClick={() => setMobileControlsOpen((open) => !open)}
            >
              <SlidersHorizontal size={17} />
              <span>{labels.controls}</span>
              <ChevronDown className="lesson-mobile-section-chevron" size={17} aria-hidden="true" />
            </button>
            {inspectorAction && <div className="lesson-mobile-inspector-action">{inspectorAction}</div>}
          </div>
          <div className="lesson-mobile-section-content" id={controlsId}>{controls}</div>
        </aside>
        <main className={joinClassNames('lesson-shell-main', mainClassName)}>
          {main ?? (
            <>
              <ExplorerStageHeader eyebrow={eyebrow} title={title} subtitle={subtitle} actions={stageActions} />
              <div className="lesson-visualization-stage">{stage}</div>
              {transport && <div className="lesson-standard-transport">{transport}</div>}
            </>
          )}
        </main>
        <aside className={joinClassNames('lesson-shell-explanation platform-card', explanationClassName)} data-mobile-open={mobileReadoutOpen ? 'true' : 'false'}>
          <button
            type="button"
            className="lesson-mobile-section-toggle"
            aria-expanded={mobileReadoutOpen}
            aria-controls={readoutId}
            onClick={() => setMobileReadoutOpen((open) => !open)}
          >
            <Info size={17} />
            <span>{labels.readout}</span>
            <ChevronDown className="lesson-mobile-section-chevron" size={17} aria-hidden="true" />
          </button>
          <div className="lesson-mobile-section-content" id={readoutId}>{explanation}</div>
        </aside>
        {!isFocusMode && standardReadoutOpen && (
          <OverlayDrawer
            className="lesson-standard-readout-drawer"
            title={labels.readout}
            side="right"
            closeLabel={closeFocusPanelLabel ?? labels.closePanel}
            onClose={() => setStandardReadoutOpen(false)}
          >
            <div className={joinClassNames('lesson-standard-readout-content', explanationClassName)}>{explanation}</div>
          </OverlayDrawer>
        )}
        {isFocusMode && (focusPanels.length > 0 || autoHideToggle) && (
          <div className="lesson-focus-panel-buttons" role="group" aria-label={labels.panelGroup}>
            {focusPanels.map((panel) => {
              const Icon = panel.icon
              const isActive = activePanelId === panel.id
              return (
                <button
                  key={panel.id}
                  type="button"
                  className={isActive ? 'active' : ''}
                  aria-pressed={isActive}
                  onClick={() => setActivePanelId((current) => (current === panel.id ? null : panel.id))}
                >
                  <Icon size={16} />
                  {panel.title}
                </button>
              )
            })}
            {autoHideToggle}
          </div>
        )}
        {isFocusMode && activePanel && (
          <OverlayDrawer
            title={activePanel.title}
            side={activePanel.side}
            closeLabel={closeFocusPanelLabel ?? labels.closePanel}
            onClose={() => setActivePanelId(null)}
          >
            {activePanel.content}
          </OverlayDrawer>
        )}
        {isFocusMode && focusTransport && <div className="lesson-focus-transport">{focusTransport}</div>}
      </section>
    </StandardReadoutActionProvider>
  )
}

const focusPanelLabels = {
  en: {
    controls: 'Parameters',
    readout: 'Readout',
    panelGroup: 'Focus panels',
    closePanel: 'Close panel',
  },
  zh: {
    controls: '参数',
    readout: '读数',
    panelGroup: '专注视图面板',
    closePanel: '关闭面板',
  },
}

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ')
}
