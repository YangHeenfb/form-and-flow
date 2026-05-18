import type { ModuleComponentProps } from '../../platform/moduleTypes.ts'
import { FourierLesson } from './FourierLesson.tsx'

export function FourierModule({ activeExplorerId, mode }: ModuleComponentProps) {
  return <FourierLesson lessonId={activeExplorerId ?? mode ?? 'spectrum'} />
}
