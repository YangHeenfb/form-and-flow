import { ConvolutionHome } from './ConvolutionHome.tsx'
import { ConvolutionLesson } from './ConvolutionLesson.tsx'
import type { ConvolutionLessonId } from './convolutionCopy.ts'

type Props = {
  lessonId?: string
}

export function ConvolutionModule({ lessonId }: Props) {
  if (!lessonId) return <ConvolutionHome />
  return <ConvolutionLesson lessonId={lessonId as ConvolutionLessonId} />
}
