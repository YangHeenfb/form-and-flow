import type { ModuleComponentProps } from '../../platform/moduleTypes.ts'
import { ProbabilityLesson } from './lessons/ProbabilityLesson.tsx'
import type { ProbabilityLessonId } from './probabilityTypes.ts'

export function ProbabilityModule({ activeExplorerId, mode }: ModuleComponentProps) {
  const explorerId = activeExplorerId ?? mode ?? 'conditional-probability'
  return <ProbabilityLesson lessonId={explorerId as ProbabilityLessonId} />
}
