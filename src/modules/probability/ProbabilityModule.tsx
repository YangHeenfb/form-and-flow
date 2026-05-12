import { ProbabilityHome } from './ProbabilityHome.tsx'
import { ProbabilityLesson } from './lessons/ProbabilityLesson.tsx'
import type { ProbabilityLessonId } from './probabilityTypes.ts'

type Props = {
  lessonId?: string
}

export function ProbabilityModule({ lessonId }: Props) {
  if (!lessonId) return <ProbabilityHome />
  return <ProbabilityLesson lessonId={lessonId as ProbabilityLessonId} />
}
