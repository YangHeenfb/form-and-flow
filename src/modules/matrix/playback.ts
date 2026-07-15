import type { AnimationState, PlaybackMode } from '../../math/types.ts'

export const matrixPlaybackDurationMs = 1400
export const matrixPlaybackBaseSpeed = 0.75
export const matrixPlaybackUiSyncIntervalMs = 1000 / 30

export function advanceMatrixPlaybackProgress(progress: number, elapsedMs: number, speed: number): number {
  const safeProgress = clamp(progress)
  const safeElapsed = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0)
  const safeSpeed = Math.max(0, Number.isFinite(speed) ? speed : 0)
  return clamp(safeProgress + (safeElapsed / matrixPlaybackDurationMs) * safeSpeed * matrixPlaybackBaseSpeed)
}

export function shouldSyncMatrixPlaybackUi(now: number, lastSync: number): boolean {
  return now - lastSync >= matrixPlaybackUiSyncIntervalMs
}

export function resolveMatrixPlaybackBoundary(
  current: AnimationState,
  stepCount: number,
): { next: AnimationState; continues: boolean } {
  if (current.mode === 'step' && current.stepIndex < Math.max(0, stepCount - 1)) {
    return {
      next: { ...current, progress: 0, stepIndex: current.stepIndex + 1 },
      continues: true,
    }
  }
  return {
    next: { ...current, progress: 1, playing: false },
    continues: false,
  }
}

export function resolveMatrixTimelinePosition(
  timelineProgress: number,
  mode: PlaybackMode,
  stepCount: number,
): { progress: number; stepIndex: number } {
  const progress = clamp(timelineProgress)
  if (mode !== 'step') return { progress, stepIndex: 0 }
  const safeStepCount = Math.max(1, stepCount)
  const scaledProgress = progress * safeStepCount
  const stepIndex = Math.min(safeStepCount - 1, Math.floor(scaledProgress))
  const stepProgress = stepIndex === safeStepCount - 1 && progress === 1 ? 1 : scaledProgress - stepIndex
  return { progress: stepProgress, stepIndex }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}
