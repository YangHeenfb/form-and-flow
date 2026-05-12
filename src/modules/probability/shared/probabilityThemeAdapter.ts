export type ProbabilityTheme = {
  background: string
  surface: string
  border: string
  text: string
  muted: string
  grid: string
  axis: string
  eventA: string
  eventB: string
  intersection: string
  complement: string
  truePositive: string
  falsePositive: string
  trueNegative: string
  falseNegative: string
  distributionPrimary: string
  distributionSecondary: string
  simulationEmpirical: string
  theoreticalOverlay: string
  highlight: string
  fill: string
}

export function readProbabilityTheme(element: HTMLElement): ProbabilityTheme {
  const style = getComputedStyle(element)
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  const focus = read('--focus', '#7fd6c2')
  const secondary = read('--graph-function-secondary', '#b9a7ff')
  const warning = read('--graph-warning', '#c7dc8a')
  const axis = read('--axis-color', '#d7dde5')
  const muted = read('--text-muted', '#a7b1bd')
  return {
    background: read('--graph-canvas-background', '#101720'),
    surface: read('--panel-bg-soft', '#101720'),
    border: read('--panel-border', '#2b3642'),
    text: read('--text-main', '#eef3f8'),
    muted,
    grid: read('--grid-color', '#3f4a55'),
    axis,
    eventA: focus,
    eventB: secondary,
    intersection: warning,
    complement: withAlpha(muted, 0.52),
    truePositive: warning,
    falsePositive: secondary,
    trueNegative: withAlpha(axis, 0.55),
    falseNegative: focus,
    distributionPrimary: focus,
    distributionSecondary: secondary,
    simulationEmpirical: withAlpha(secondary, 0.64),
    theoreticalOverlay: warning,
    highlight: warning,
    fill: read('--graph-area-fill', withAlpha(focus, 0.24)),
  }
}

export function withAlpha(color: string, alpha: number): string {
  const hex = color.trim()
  if (!hex.startsWith('#')) return color
  const expanded = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
  if (expanded.length !== 7) return color
  const red = Number.parseInt(expanded.slice(1, 3), 16)
  const green = Number.parseInt(expanded.slice(3, 5), 16)
  const blue = Number.parseInt(expanded.slice(5, 7), 16)
  return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, alpha))})`
}
