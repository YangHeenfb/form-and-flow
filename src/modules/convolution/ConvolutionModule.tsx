import type { ModuleComponentProps } from '../../platform/moduleTypes.ts'
import { ConvolutionLesson } from './ConvolutionLesson.tsx'
import type { ConvolutionLessonId } from './convolutionCopy.ts'

export function ConvolutionModule({ activeExplorerId, mode }: ModuleComponentProps) {
  return <ConvolutionLesson lessonId={(activeExplorerId ?? mode ?? 'discrete') as ConvolutionLessonId} />
}
