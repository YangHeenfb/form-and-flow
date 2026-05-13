import { BookOpen, Info, Settings2, SlidersHorizontal, Table2, VectorSquare } from 'lucide-react'
import type { OverlayPanelDefinition, OverlayPanelId } from './visualizationLayoutTypes.ts'

export type VisualizationLabels = {
  focus: string
  exitFocus: string
  autoHideHud: string
}

type VisualizationToolbarProps = {
  title: string
  subtitle?: string
  labels: VisualizationLabels
  panels: OverlayPanelDefinition[]
  activePanelId: OverlayPanelId | null
  isFocusMode: boolean
  autoHideHud: boolean
  onTogglePanel: (panelId: OverlayPanelId, trigger: HTMLButtonElement) => void
  onAutoHideHudChange: (enabled: boolean) => void
}

const panelIcons: Partial<Record<OverlayPanelId, typeof Table2>> = {
  matrices: Table2,
  vectors: VectorSquare,
  theme: Settings2,
  explanation: Info,
  controls: SlidersHorizontal,
  help: BookOpen,
}

export function VisualizationToolbar({
  title,
  subtitle,
  labels,
  panels,
  activePanelId,
  isFocusMode,
  autoHideHud,
  onTogglePanel,
  onAutoHideHudChange,
}: VisualizationToolbarProps) {
  return (
    <header className="visualization-stage-toolbar">
      <div className="visualization-toolbar-title">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="visualization-toolbar-actions">
        {isFocusMode && (
          <div className="visualization-panel-buttons" role="group" aria-label={title}>
            {panels.map((panel) => {
              const Icon = panelIcons[panel.id] ?? Info
              const isActive = activePanelId === panel.id
              return (
                <button
                  key={panel.id}
                  type="button"
                  className={isActive ? 'active' : ''}
                  aria-pressed={isActive}
                  onClick={(event) => onTogglePanel(panel.id, event.currentTarget)}
                >
                  <Icon size={16} />
                  {panel.title}
                </button>
              )
            })}
          </div>
        )}
        {isFocusMode && (
          <label className="visualization-autohide-toggle">
            <input type="checkbox" checked={autoHideHud} onChange={(event) => onAutoHideHudChange(event.target.checked)} />
            {labels.autoHideHud}
          </label>
        )}
      </div>
    </header>
  )
}
