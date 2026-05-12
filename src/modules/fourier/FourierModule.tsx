import { FourierHome } from './FourierHome.tsx'
import { FourierLesson } from './FourierLesson.tsx'

type Props = {
  lessonId?: string
}

export function FourierModule({ lessonId }: Props) {
  if (!lessonId) {
    return <FourierHome />
  }
  return <FourierLesson lessonId={lessonId} />
}
