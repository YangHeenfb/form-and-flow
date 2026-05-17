import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import { OverlayDrawer } from './OverlayDrawer.tsx'
import { OverlayTransport } from './OverlayTransport.tsx'
import { VisualizationToolbar, type VisualizationLabels } from './VisualizationToolbar.tsx'
import { hudIdleDelayMs, loadAutoHideHud, saveAutoHideHud } from './autoHideHud.ts'
import {
  createOverlayPanelState,
  type OverlayPanelDefinition,
  type OverlayPanelId,
  type VisualizationLayoutState,
  type VisualizationWorkbenchStatus,
} from './visualizationLayoutTypes.ts'

export type VisualizationWorkbenchHandle = {
  enterFocus: () => void
  exitFocus: () => void
  toggleFocus: () => void
}

type VisualizationWorkbenchLabels = VisualizationLabels & {
  closePanel: string
}

type VisualizationWorkbenchProps = {
  title: string
  subtitle?: string
  labels: VisualizationWorkbenchLabels
  leftPanel: ReactNode
  stage: ReactNode
  rightPanel: ReactNode
  transport: ReactNode
  overlayPanels: OverlayPanelDefinition[]
  stageRef?: Ref<HTMLElement>
  shortcutActions?: {
    togglePlay?: () => void
    reset?: () => void
    openHelp?: () => void
  }
  onStatusChange?: (status: VisualizationWorkbenchStatus) => void
}

export const VisualizationWorkbench = forwardRef<VisualizationWorkbenchHandle, VisualizationWorkbenchProps>(
  function VisualizationWorkbench(
    {
      title,
      subtitle,
      labels,
      leftPanel,
      stage,
      rightPanel,
      transport,
      overlayPanels,
      stageRef,
      shortcutActions,
      onStatusChange,
    },
    ref,
  ) {
    const stageElementRef = useRef<HTMLElement | null>(null)
    const lastPanelTriggerRef = useRef<HTMLButtonElement | null>(null)
    const [mode, setMode] = useState<VisualizationLayoutState['mode']>('standard')
    const [activePanelId, setActivePanelId] = useState<OverlayPanelId | null>(null)
    const [autoHideHud, setAutoHideHud] = useState(loadAutoHideHud)
    const [hudVisible, setHudVisible] = useState(true)
    const [hudActivityCount, setHudActivityCount] = useState(0)

    const layoutState = useMemo<VisualizationLayoutState>(
      () => ({
        mode,
        overlayPanels: createOverlayPanelState(activePanelId),
        autoHideHud,
      }),
      [activePanelId, autoHideHud, mode],
    )

    const isExpanded = layoutState.mode === 'focus'
    const activePanel = activePanelId ? overlayPanels.find((panel) => panel.id === activePanelId) ?? null : null
    const isHudHidden = isExpanded && autoHideHud && !hudVisible && !activePanel

    useEffect(() => {
      saveAutoHideHud(autoHideHud)
    }, [autoHideHud])

    useEffect(() => {
      onStatusChange?.({ mode: layoutState.mode })
    }, [layoutState.mode, onStatusChange])

    const revealHud = useCallback(() => {
      setHudVisible(true)
      setHudActivityCount((count) => count + 1)
    }, [])

    useEffect(() => {
      if (!isExpanded || !autoHideHud || activePanel) {
        setHudVisible(true)
        return
      }
      const timer = window.setTimeout(() => setHudVisible(false), hudIdleDelayMs)
      return () => window.clearTimeout(timer)
    }, [activePanel, autoHideHud, hudActivityCount, isExpanded])

    const setStageNode = useCallback(
      (node: HTMLElement | null) => {
        stageElementRef.current = node
        assignRef(stageRef, node)
      },
      [stageRef],
    )

    const closePanel = useCallback(() => {
      setActivePanelId(null)
      window.requestAnimationFrame(() => lastPanelTriggerRef.current?.focus())
    }, [])

    const togglePanel = useCallback(
      (panelId: OverlayPanelId, trigger: HTMLButtonElement) => {
        revealHud()
        lastPanelTriggerRef.current = trigger
        setActivePanelId((current) => (current === panelId ? null : panelId))
      },
      [revealHud],
    )

    const enterFocus = useCallback(() => {
      setMode('focus')
      revealHud()
    }, [revealHud])

    const exitFocus = useCallback(() => {
      setMode('standard')
      setActivePanelId(null)
      revealHud()
    }, [revealHud])

    const toggleFocus = useCallback(() => {
      if (mode === 'focus') {
        exitFocus()
        return
      }
      enterFocus()
    }, [enterFocus, exitFocus, mode])

    useImperativeHandle(
      ref,
      () => ({
        enterFocus,
        exitFocus,
        toggleFocus,
      }),
      [enterFocus, exitFocus, toggleFocus],
    )

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (isEditableTarget(event.target)) {
          return
        }

        if (event.key === 'Escape') {
          if (activePanelId) {
            event.preventDefault()
            closePanel()
            return
          }
          if (mode === 'focus') {
            event.preventDefault()
            exitFocus()
          }
          return
        }

        if (event.key.toLowerCase() === 'f') {
          event.preventDefault()
          toggleFocus()
          return
        }

        if (event.key === ' ') {
          event.preventDefault()
          shortcutActions?.togglePlay?.()
          return
        }

        if (event.key.toLowerCase() === 'r') {
          event.preventDefault()
          shortcutActions?.reset?.()
          return
        }

        if (event.key === '?') {
          event.preventDefault()
          shortcutActions?.openHelp?.()
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }, [
      activePanelId,
      closePanel,
      exitFocus,
      mode,
      shortcutActions,
      toggleFocus,
    ])

    const className = [
      'visualization-workbench',
      isExpanded ? 'is-expanded' : '',
      mode === 'focus' ? 'is-focus' : '',
      isHudHidden ? 'visualization-hud-hidden' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        className={className}
        data-layout-mode={layoutState.mode}
        onPointerMove={isExpanded ? revealHud : undefined}
        onTouchStart={isExpanded ? revealHud : undefined}
        onFocusCapture={isExpanded ? revealHud : undefined}
      >
        {isExpanded && (
          <VisualizationToolbar
            title={title}
            subtitle={subtitle}
            labels={labels}
            panels={overlayPanels}
            activePanelId={activePanelId}
            isFocusMode={mode === 'focus'}
            autoHideHud={autoHideHud}
            onTogglePanel={togglePanel}
            onAutoHideHudChange={setAutoHideHud}
          />
        )}

        <div className="visualization-standard-layout">
          <aside className="left-panel visualization-standard-left">{leftPanel}</aside>
          <div className="visualization-center-column">
            <section className="center-stage visualization-stage" ref={setStageNode}>
              {stage}
            </section>
            {!isExpanded && <OverlayTransport>{transport}</OverlayTransport>}
          </div>
          <div className="visualization-standard-right">{rightPanel}</div>
        </div>

        {isExpanded && <OverlayTransport>{transport}</OverlayTransport>}

        {isExpanded && activePanel && (
          <OverlayDrawer title={activePanel.title} side={activePanel.side} closeLabel={labels.closePanel} onClose={closePanel}>
            {activePanel.content}
          </OverlayDrawer>
        )}

      </div>
    )
  },
)

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (!ref) {
    return
  }
  if (typeof ref === 'function') {
    ref(value)
    return
  }
  ref.current = value
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tagName = target.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable
}
