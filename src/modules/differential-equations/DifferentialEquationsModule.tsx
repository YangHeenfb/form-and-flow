import { DifferentialEquationsHome } from './DifferentialEquationsHome.tsx'
import { DifferentialEquationsLesson } from './DifferentialEquationsLesson.tsx'

type Props = {
  lessonId?: string
}

export function DifferentialEquationsModule({ lessonId }: Props) {
  if (!lessonId) {
    return <DifferentialEquationsHome />
  }
  return <DifferentialEquationsLesson lessonId={lessonId} />
}
