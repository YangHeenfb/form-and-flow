import { createContext, useContext, type ReactNode } from 'react'
import { Download, Info } from 'lucide-react'
import { HelpTrigger } from '../core/ui/LearningHelp.tsx'

type StandardReadoutActionContextValue = {
  label: string
  open: boolean
  enabled: boolean
  onToggle: () => void
}

const StandardReadoutActionContext = createContext<StandardReadoutActionContextValue | null>(null)

export function StandardReadoutActionProvider({
  value,
  children,
}: {
  value: StandardReadoutActionContextValue
  children: ReactNode
}) {
  return <StandardReadoutActionContext.Provider value={value}>{children}</StandardReadoutActionContext.Provider>
}

type LessonStageActionsProps = {
  graphLabel: string
  graphAriaLabel?: string
  onGraphHelp: () => void
  focusButton: ReactNode
  exportLabel: string
  onExport: () => void
}

export function LessonStageActions({
  graphLabel,
  graphAriaLabel,
  onGraphHelp,
  focusButton,
  exportLabel,
  onExport,
}: LessonStageActionsProps) {
  const readoutAction = useContext(StandardReadoutActionContext)

  return (
    <div className="lesson-stage-actions">
      <HelpTrigger variant="graph" ariaLabel={graphAriaLabel ?? graphLabel} onClick={onGraphHelp}>
        {graphLabel}
      </HelpTrigger>
      {readoutAction?.enabled && (
        <button
          className="visualization-header-action lesson-stage-readout-action"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={readoutAction.open}
          onClick={readoutAction.onToggle}
        >
          <Info size={16} aria-hidden="true" />
          {readoutAction.label}
        </button>
      )}
      {focusButton}
      <button className="visualization-header-action" type="button" onClick={onExport}>
        <Download size={16} />
        {exportLabel}
      </button>
    </div>
  )
}
