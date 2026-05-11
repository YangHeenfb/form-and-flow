import { CalculusHome } from './CalculusHome.tsx'
import { CalculusLesson } from './CalculusLesson.tsx'

type Props = {
  lessonId?: string
}

export function CalculusModule({ lessonId }: Props) {
  if (!lessonId) {
    return <CalculusHome />
  }
  return <CalculusLesson lessonId={lessonId} />
}
