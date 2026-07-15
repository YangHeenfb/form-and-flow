import { ChevronDown, Eye, LocateFixed, Pause, Play, RotateCcw } from 'lucide-react'
import { ExplorerTransport } from '../core/ui/ExplorerChrome.tsx'
import type { AppCopy } from '../i18n.ts'
import type { AnimationState, PlaybackMode, ViewOptions } from '../math/types.ts'

type Props = {
  copy: AppCopy['controls']
  animation: AnimationState
  viewOptions: ViewOptions
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onResetView: () => void
  onSeek: (progress: number) => void
  onSpeedChange: (speed: number) => void
  onModeChange: (mode: PlaybackMode) => void
  onViewOptionChange: (key: keyof ViewOptions, value: boolean) => void
  stepCount?: number
}

const viewOptionKeys: Array<keyof ViewOptions> = ['showGrid', 'showBasis', 'showUnitShape', 'showVectors', 'showTrails']

export function AnimationControls({
  copy,
  animation,
  viewOptions,
  onPlay,
  onPause,
  onReset,
  onResetView,
  onSeek,
  onSpeedChange,
  onModeChange,
  onViewOptionChange,
  stepCount = 1,
}: Props) {
  const timelineProgress = getTimelineProgress(animation, stepCount)

  return (
    <ExplorerTransport
      primaryAction={{
        label: animation.playing ? copy.pause : copy.play,
        icon: animation.playing ? <Pause size={17} /> : <Play size={17} />,
        onClick: animation.playing ? onPause : onPlay,
      }}
      secondaryActions={[
        { label: copy.reset, icon: <RotateCcw size={17} />, onClick: onReset },
        { label: copy.resetView, icon: <LocateFixed size={17} />, onClick: onResetView },
      ]}
      progress={{ label: copy.progress, value: timelineProgress, onChange: onSeek }}
      speed={{ label: copy.speed, value: animation.speed, min: 0.25, max: 2.5, step: 0.05, onChange: onSpeedChange, formatValue: (value) => `${value.toFixed(2)}x` }}
      mode={(
        <div className="segmented compact-segmented" role="group" aria-label={copy.playbackMode}>
          <button
            type="button"
            className={animation.mode === 'combined' ? 'active' : ''}
            aria-label={`${copy.combined}: ${copy.combinedHelp}`}
            title={copy.combinedHelp}
            onClick={() => onModeChange('combined')}
          >
            {copy.combined}
          </button>
          <button
            type="button"
            className={animation.mode === 'step' ? 'active' : ''}
            aria-label={`${copy.step}: ${copy.stepHelp}`}
            title={copy.stepHelp}
            onClick={() => onModeChange('step')}
          >
            {copy.step}
          </button>
        </div>
      )}
      extra={(
        <>
          <ViewToggles
            className="view-toggles view-toggles-desktop"
            copy={copy}
            viewOptions={viewOptions}
            onViewOptionChange={onViewOptionChange}
          />
          <details className="view-options-disclosure">
            <summary>
              <Eye size={17} aria-hidden="true" />
              <span>{copy.display}</span>
              <ChevronDown className="view-options-chevron" size={17} aria-hidden="true" />
            </summary>
            <ViewToggles
              className="view-toggles view-toggles-mobile"
              copy={copy}
              viewOptions={viewOptions}
              onViewOptionChange={onViewOptionChange}
            />
          </details>
        </>
      )}
    />
  )
}

function ViewToggles({
  className,
  copy,
  viewOptions,
  onViewOptionChange,
}: {
  className: string
  copy: AppCopy['controls']
  viewOptions: ViewOptions
  onViewOptionChange: (key: keyof ViewOptions, value: boolean) => void
}) {
  return (
    <div className={className}>
      {viewOptionKeys.map((key) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={viewOptions[key]}
            onChange={(event) => onViewOptionChange(key, event.target.checked)}
          />
          {copy.viewLabels[key]}
        </label>
      ))}
    </div>
  )
}

function getTimelineProgress(animation: AnimationState, stepCount: number): number {
  if (animation.mode !== 'step') {
    return clamp(animation.progress)
  }
  const safeStepCount = Math.max(1, stepCount)
  return clamp((Math.min(animation.stepIndex, safeStepCount - 1) + animation.progress) / safeStepCount)
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value))
}
