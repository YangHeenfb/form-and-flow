import { ChevronDown, Eye, LocateFixed, Pause, Play, RotateCcw } from 'lucide-react'
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
    <footer className="transport">
      <div className="transport-buttons">
        <button className="primary-button" type="button" aria-label={animation.playing ? copy.pause : copy.play} onClick={animation.playing ? onPause : onPlay}>
          {animation.playing ? <Pause size={17} /> : <Play size={17} />}
          <span className="transport-button-label">{animation.playing ? copy.pause : copy.play}</span>
        </button>
        <button type="button" aria-label={copy.reset} title={copy.reset} onClick={onReset}>
          <RotateCcw size={17} />
          <span className="transport-button-label">{copy.reset}</span>
        </button>
        <button type="button" aria-label={copy.resetView} title={copy.resetView} onClick={onResetView}>
          <LocateFixed size={17} />
          <span className="transport-button-label">{copy.resetView}</span>
        </button>
      </div>
      <label className="playback-progress-control">
        <span>{copy.progress}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={timelineProgress}
          aria-label={copy.progress}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
        <strong>{Math.round(timelineProgress * 100)}%</strong>
      </label>
      <div className="transport-secondary-controls">
        <label className="speed-control">
          <span>{copy.speed}</span>
          <input
            type="range"
            min="0.25"
            max="2.5"
            step="0.05"
            value={animation.speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
          />
          <strong>{animation.speed.toFixed(2)}x</strong>
        </label>
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
      </div>
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
    </footer>
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
