import type { ReactNode } from 'react'
import { Download } from 'lucide-react'
import { HelpTrigger } from '../core/ui/LearningHelp.tsx'

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
  return (
    <div className="lesson-stage-actions">
      <HelpTrigger variant="graph" ariaLabel={graphAriaLabel ?? graphLabel} onClick={onGraphHelp}>
        {graphLabel}
      </HelpTrigger>
      {focusButton}
      <button className="visualization-header-action" type="button" onClick={onExport}>
        <Download size={16} />
        {exportLabel}
      </button>
    </div>
  )
}
