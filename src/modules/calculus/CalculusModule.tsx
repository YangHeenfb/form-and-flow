import type { ModuleComponentProps } from '../../platform/moduleTypes.ts'
import { CalculusLesson } from './CalculusLesson.tsx'

export function CalculusModule({ activeExplorerId, mode }: ModuleComponentProps) {
  return <CalculusLesson lessonId={activeExplorerId ?? mode ?? 'derivative'} />
}
