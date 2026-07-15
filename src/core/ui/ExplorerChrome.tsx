import type { ReactNode } from 'react'

export type ExplorerTransportAction = {
  label: string
  icon?: ReactNode
  onClick: () => void
  disabled?: boolean
  pressed?: boolean
}

type ExplorerTransportSlider = {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
}

type ExplorerTransportProgress = {
  label: string
  value: number
  onChange: (value: number) => void
}

export function ExplorerStageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header className={joinClassNames('explorer-stage-header', className)}>
      <div className="explorer-stage-heading">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="explorer-stage-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="explorer-stage-header-actions">{actions}</div>}
    </header>
  )
}

export function InspectorSection({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={joinClassNames('inspector-section', className)}>
      {(title || action) && (
        <header className="inspector-section-header">
          {title && <h2>{title}</h2>}
          {action && <div className="inspector-section-action">{action}</div>}
        </header>
      )}
      <div className="inspector-section-content">{children}</div>
    </section>
  )
}

export function ExplorerTransport({
  primaryAction,
  secondaryActions = [],
  progress,
  speed,
  mode,
  extra,
  compact = false,
  className,
}: {
  primaryAction?: ExplorerTransportAction
  secondaryActions?: ExplorerTransportAction[]
  progress?: ExplorerTransportProgress
  speed?: ExplorerTransportSlider
  mode?: ReactNode
  extra?: ReactNode
  compact?: boolean
  className?: string
}) {
  const actions = primaryAction || secondaryActions.length > 0

  return (
    <footer
      className={joinClassNames('transport', 'explorer-transport', compact ? 'explorer-transport-compact' : undefined, className)}
      data-compact={compact ? 'true' : 'false'}
    >
      {actions && (
        <div className="explorer-transport-actions">
          {primaryAction && <TransportAction action={primaryAction} primary />}
          {secondaryActions.map((action) => (
            <TransportAction key={action.label} action={action} />
          ))}
        </div>
      )}
      {progress && (
        <label className="playback-progress-control explorer-transport-progress">
          <span>{progress.label}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={clamp(progress.value, 0, 1)}
            aria-label={progress.label}
            onChange={(event) => progress.onChange(Number(event.target.value))}
          />
          <strong>{Math.round(clamp(progress.value, 0, 1) * 100)}%</strong>
        </label>
      )}
      {(speed || mode) && (
        <div className="explorer-transport-secondary">
          {speed && (
            <label className="speed-control explorer-transport-speed">
              <span>{speed.label}</span>
              <input
                type="range"
                min={speed.min}
                max={speed.max}
                step={speed.step}
                value={speed.value}
                aria-label={speed.label}
                onChange={(event) => speed.onChange(Number(event.target.value))}
              />
              <strong>{speed.formatValue?.(speed.value) ?? `${Number(speed.value.toFixed(2))}x`}</strong>
            </label>
          )}
          {mode && <div className="explorer-transport-mode">{mode}</div>}
        </div>
      )}
      {extra && <div className="explorer-transport-extra">{extra}</div>}
    </footer>
  )
}

function TransportAction({ action, primary = false }: { action: ExplorerTransportAction; primary?: boolean }) {
  return (
    <button
      type="button"
      className={primary ? 'primary-button explorer-transport-primary' : 'explorer-transport-secondary-action'}
      aria-label={action.label}
      aria-pressed={action.pressed}
      title={action.label}
      disabled={action.disabled}
      onClick={action.onClick}
    >
      {action.icon}
      <span className="explorer-transport-action-label">{action.label}</span>
    </button>
  )
}

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ')
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
