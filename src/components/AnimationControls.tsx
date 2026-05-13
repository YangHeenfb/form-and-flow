import { LocateFixed, Pause, Play, RotateCcw } from 'lucide-react'
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
  onSpeedChange: (speed: number) => void
  onModeChange: (mode: PlaybackMode) => void
  onViewOptionChange: (key: keyof ViewOptions, value: boolean) => void
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
  onSpeedChange,
  onModeChange,
  onViewOptionChange,
}: Props) {
  return (
    <footer className="transport">
      <div className="transport-buttons">
        <button className="primary-button" type="button" aria-label={animation.playing ? copy.pause : copy.play} onClick={animation.playing ? onPause : onPlay}>
          {animation.playing ? <Pause size={17} /> : <Play size={17} />}
          {animation.playing ? copy.pause : copy.play}
        </button>
        <button type="button" onClick={onReset}>
          <RotateCcw size={17} />
          {copy.reset}
        </button>
        <button type="button" onClick={onResetView}>
          <LocateFixed size={17} />
          {copy.resetView}
        </button>
      </div>
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
      <div className="view-toggles">
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
    </footer>
  )
}
