import type { ModuleComponentProps } from '../../platform/moduleTypes.ts'
import { DifferentialEquationsLesson } from './DifferentialEquationsLesson.tsx'

export function DifferentialEquationsModule({ activeExplorerId, mode }: ModuleComponentProps) {
  return <DifferentialEquationsLesson lessonId={activeExplorerId ?? mode ?? 'slope-fields'} />
}
