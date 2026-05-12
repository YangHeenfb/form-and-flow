import type { ContinuousDistributionSpec, HistogramBin } from '../math/continuous.ts'
import type { SourceDistribution } from '../math/clt.ts'
import { normalPdf } from '../math/clt.ts'
import type { PairMass } from '../math/convolution.ts'
import type { DiscreteDistribution } from '../math/probability.ts'
import { normalizeDistribution } from '../math/probability.ts'
import type { ProbabilityCanvasSize } from './ProbabilityCanvas.tsx'
import type { ProbabilityTheme } from './probabilityThemeAdapter.ts'
import { withAlpha } from './probabilityThemeAdapter.ts'

type Category = {
  label: string
  probability: number
  color: string
  highlight?: boolean
}

type Rect = {
  x: number
  y: number
  width: number
  height: number
}

type VennRegions = {
  intersection: Category
  leftOnly: Category
  rightOnly: Category
  neither: Category
}

export type ProbabilityDrawingCopy = {
  universe: string
  countPrefix: string
  notDefined: string
  theory: string
  originalDistribution: string
  standardizedSampleMeans: string
  sampleMeans: string
  successesK: string
  probability: string
  density: string
  pairsWithSum: (sum: number) => string
}

const defaultDrawingCopy: ProbabilityDrawingCopy = {
  universe: 'Universe',
  countPrefix: 'n=',
  notDefined: 'not defined',
  theory: 'theory',
  originalDistribution: 'original distribution',
  standardizedSampleMeans: 'standardized sample means',
  sampleMeans: 'sample means',
  successesK: 'successes k',
  probability: 'probability',
  density: 'density',
  pairsWithSum: (sum) => `pairs with x + y = ${sum}`,
}

export function drawConditionalScene(ctx: CanvasRenderingContext2D, size: ProbabilityCanvasSize, theme: ProbabilityTheme, args: {
  title: string
  categories: Category[]
  population: number
  table: string[][]
  focusLabel: string
  labels: ProbabilityDrawingCopy
}) {
  clear(ctx, size, theme)
  const regions = conditionalVennRegions(args.categories)
  if (size.width < 640) {
    const venn = { x: 18, y: 54, width: size.width - 36, height: Math.min(size.height * 0.58, 300) }
    drawHeading(ctx, args.title, 18, 30, theme)
    drawVennDiagram(ctx, venn, theme, { leftLabel: 'A', rightLabel: 'B', regions, population: args.population, labels: args.labels })
    const tableY = venn.y + venn.height + 18
    const tableHeight = Math.min(116, Math.max(92, size.height - tableY - 66))
    const table = { x: 18, y: tableY, width: size.width - 36, height: tableHeight }
    drawTable(ctx, table, args.table, theme)
    drawCallout(ctx, 18, table.y + table.height + 12, size.width - 36, args.focusLabel, theme)
    return
  }
  const left = { x: 22, y: 54, width: size.width * 0.58 - 34, height: size.height - 104 }
  const right = { x: size.width * 0.6, y: 54, width: size.width * 0.38 - 22, height: size.height - 96 }
  drawHeading(ctx, args.title, 22, 30, theme)
  drawVennDiagram(ctx, left, theme, { leftLabel: 'A', rightLabel: 'B', regions, population: args.population, labels: args.labels })
  drawTable(ctx, right, args.table, theme)
  drawCallout(ctx, right.x, size.height - 72, right.width, args.focusLabel, theme)
}

export function drawBayesScene(ctx: CanvasRenderingContext2D, size: ProbabilityCanvasSize, theme: ProbabilityTheme, args: {
  title: string
  categories: Category[]
  population: number
  posterior: number | null
  note?: string
  labels: ProbabilityDrawingCopy
}) {
  clear(ctx, size, theme)
  const regions = bayesVennRegions(args.categories)
  drawHeading(ctx, args.title, 22, 30, theme)
  if (size.width < 640) {
    const venn = { x: 18, y: 56, width: size.width - 36, height: Math.min(size.height * 0.58, 300) }
    drawVennDiagram(ctx, venn, theme, { leftLabel: 'H', rightLabel: 'E', regions, population: args.population, note: args.note, labels: args.labels })
    const panelY = venn.y + venn.height + 18
    const panel = { x: 18, y: panelY, width: size.width - 36, height: Math.max(112, size.height - panelY - 14) }
    drawMeter(ctx, panel, theme, args.posterior ?? 0, 'P(H | E)', args.posterior === null, args.labels)
    return
  }
  const grid = { x: 22, y: 56, width: size.width * 0.62 - 36, height: size.height - 102 }
  const panel = { x: size.width * 0.65, y: 56, width: size.width * 0.32, height: size.height - 102 }
  drawVennDiagram(ctx, grid, theme, { leftLabel: 'H', rightLabel: 'E', regions, population: args.population, note: args.note, labels: args.labels })
  drawMeter(ctx, panel, theme, args.posterior ?? 0, 'P(H | E)', args.posterior === null, args.labels)
}

export function drawMedicalScene(ctx: CanvasRenderingContext2D, size: ProbabilityCanvasSize, theme: ProbabilityTheme, args: {
  title: string
  categories: Category[]
  population: number
  selected: 'positive' | 'negative'
  predictiveValue: number | null
  eventLabels: {
    disease: string
    noDisease: string
    positiveTest: string
    negativeTest: string
    trueAmongPositive: string
    noDiseaseAmongNegative: string
  }
  labels: ProbabilityDrawingCopy
}) {
  clear(ctx, size, theme)
  const regions = medicalVennRegions(args.categories, args.selected)
  const leftLabel = args.selected === 'positive' ? args.eventLabels.disease : args.eventLabels.noDisease
  const rightLabel = args.selected === 'positive' ? args.eventLabels.positiveTest : args.eventLabels.negativeTest
  drawHeading(ctx, args.title, 22, 30, theme)
  if (size.width < 640) {
    const venn = { x: 18, y: 56, width: size.width - 36, height: Math.min(size.height * 0.58, 300) }
    drawVennDiagram(ctx, venn, theme, { leftLabel, rightLabel, regions, population: args.population, labels: args.labels })
    const panelY = venn.y + venn.height + 18
    const panel = { x: 18, y: panelY, width: size.width - 36, height: Math.max(112, size.height - panelY - 14) }
    drawMeter(ctx, panel, theme, args.predictiveValue ?? 0, args.selected === 'positive' ? args.eventLabels.trueAmongPositive : args.eventLabels.noDiseaseAmongNegative, args.predictiveValue === null, args.labels)
    return
  }
  const grid = { x: 22, y: 56, width: size.width * 0.62 - 36, height: size.height - 102 }
  const panel = { x: size.width * 0.65, y: 56, width: size.width * 0.32, height: size.height - 102 }
  drawVennDiagram(ctx, grid, theme, { leftLabel, rightLabel, regions, population: args.population, labels: args.labels })
  drawMeter(ctx, panel, theme, args.predictiveValue ?? 0, args.selected === 'positive' ? args.eventLabels.trueAmongPositive : args.eventLabels.noDiseaseAmongNegative, args.predictiveValue === null, args.labels)
}

export function drawBinomialScene(ctx: CanvasRenderingContext2D, size: ProbabilityCanvasSize, theme: ProbabilityTheme, args: {
  distribution: DiscreteDistribution
  simulation: DiscreteDistribution
  selectedRange: (value: number) => boolean
  title: string
  labels: ProbabilityDrawingCopy
}) {
  clear(ctx, size, theme)
  drawHeading(ctx, args.title, 22, 30, theme)
  drawBarChart(ctx, { x: 26, y: 58, width: size.width - 52, height: size.height - 92 }, theme, args.distribution, {
    overlay: args.simulation,
    highlight: args.selectedRange,
    xLabel: args.labels.successesK,
    yLabel: args.labels.probability,
  })
}

export function drawContinuousScene(ctx: CanvasRenderingContext2D, size: ProbabilityCanvasSize, theme: ProbabilityTheme, args: {
  distribution: ContinuousDistributionSpec
  interval: [number, number]
  samples: HistogramBin[]
  showHistogram: boolean
  showCdf: boolean
  pointMode: boolean
  title: string
  labels: ProbabilityDrawingCopy
}) {
  clear(ctx, size, theme)
  drawHeading(ctx, args.title, 22, 30, theme)
  const rect = { x: 48, y: 60, width: size.width - 82, height: size.height - 104 }
  drawAxes(ctx, rect, theme)
  const [domainMin, domainMax] = args.distribution.domain
  const samples = sampleCurve(args.distribution.pdf, domainMin, domainMax, 260)
  const maxY = Math.max(...samples.map((point) => point.y), ...args.samples.map((bin) => bin.density), 0.01) * 1.12
  if (args.showHistogram) drawDensityHistogram(ctx, rect, theme, args.samples, domainMin, domainMax, maxY)
  drawIntervalArea(ctx, rect, theme, args.distribution.pdf, domainMin, domainMax, maxY, args.interval)
  drawCurve(ctx, rect, theme, samples, domainMin, domainMax, maxY, theme.distributionPrimary, 2.2, args.labels)
  if (args.showCdf) {
    const cdfSamples = sampleCurve((x) => args.distribution.cdf?.(x) ?? 0, domainMin, domainMax, 260)
    drawCurve(ctx, rect, theme, cdfSamples, domainMin, domainMax, 1, theme.distributionSecondary, 1.6, args.labels)
  }
  if (args.pointMode) drawPointMarker(ctx, rect, theme, (args.interval[0] + args.interval[1]) / 2, args.distribution.pdf((args.interval[0] + args.interval[1]) / 2), domainMin, domainMax, maxY)
}

export function drawCltScene(ctx: CanvasRenderingContext2D, size: ProbabilityCanvasSize, theme: ProbabilityTheme, args: {
  source: SourceDistribution
  meansHistogram: HistogramBin[]
  meanDomain: [number, number]
  standardized: boolean
  showNormal: boolean
  sampleSize: number
  title: string
  sourceLabel: string
  labels: ProbabilityDrawingCopy
}) {
  clear(ctx, size, theme)
  drawHeading(ctx, args.title, 22, 30, theme)
  const top = { x: 42, y: 58, width: size.width - 74, height: (size.height - 112) * 0.34 }
  const bottom = { x: 42, y: top.y + top.height + 48, width: size.width - 74, height: (size.height - 112) * 0.54 }
  drawSourceDistribution(ctx, top, theme, args.source, args.sourceLabel, args.labels)
  label(ctx, `${args.labels.originalDistribution} · ${args.labels.sampleMeans} n=${args.sampleSize}`, top.x, top.y - 10, theme.muted, 12)
  drawAxes(ctx, bottom, theme)
  const maxDensity = Math.max(...args.meansHistogram.map((bin) => bin.density), 0.01) * 1.14
  drawDensityHistogram(ctx, bottom, theme, args.meansHistogram, args.meanDomain[0], args.meanDomain[1], maxDensity)
  if (args.showNormal) {
    const mean = args.standardized ? 0 : args.source.mean
    const sd = args.standardized ? 1 : Math.sqrt(args.source.variance) / Math.sqrt(Math.max(1, args.sampleSize))
    const curve = sampleCurve((x) => normalPdf(x, mean, sd), args.meanDomain[0], args.meanDomain[1], 260)
    drawCurve(ctx, bottom, theme, curve, args.meanDomain[0], args.meanDomain[1], maxDensity, theme.theoreticalOverlay, 2, args.labels)
  }
  label(ctx, args.standardized ? args.labels.standardizedSampleMeans : args.labels.sampleMeans, bottom.x, bottom.y - 10, theme.muted, 12)
}

export function drawRandomVariableSumScene(ctx: CanvasRenderingContext2D, size: ProbabilityCanvasSize, theme: ProbabilityTheme, args: {
  x: DiscreteDistribution
  y: DiscreteDistribution
  sum: DiscreteDistribution
  grid: PairMass[]
  selectedSum: number
  showPairGrid: boolean
  title: string
  labels: ProbabilityDrawingCopy
}) {
  clear(ctx, size, theme)
  drawHeading(ctx, args.title, 22, 30, theme)
  const topWidth = (size.width - 72) / 2
  drawBarChart(ctx, { x: 26, y: 58, width: topWidth, height: size.height * 0.27 }, theme, args.x, { xLabel: 'X', yLabel: 'P' })
  drawBarChart(ctx, { x: 46 + topWidth, y: 58, width: topWidth, height: size.height * 0.27 }, theme, args.y, { xLabel: 'Y', yLabel: 'P' })
  const bottom = { x: 26, y: size.height * 0.42, width: args.showPairGrid ? size.width * 0.56 : size.width - 52, height: size.height * 0.5 }
  drawBarChart(ctx, bottom, theme, args.sum, { highlight: (value) => value === args.selectedSum, xLabel: 'X + Y', yLabel: 'P' })
  if (args.showPairGrid) {
    drawPairGrid(ctx, { x: size.width * 0.64, y: size.height * 0.42, width: size.width * 0.32, height: size.height * 0.5 }, theme, args.grid, args.selectedSum, args.labels)
  }
}

function clear(ctx: CanvasRenderingContext2D, size: ProbabilityCanvasSize, theme: ProbabilityTheme) {
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, size.width, size.height)
  ctx.lineWidth = 1
}

function drawHeading(ctx: CanvasRenderingContext2D, title: string, x: number, y: number, theme: ProbabilityTheme) {
  ctx.fillStyle = theme.text
  ctx.font = '700 16px Inter, system-ui, sans-serif'
  ctx.fillText(title, x, y)
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 11) {
  ctx.fillStyle = color
  ctx.font = `${size}px Inter, system-ui, sans-serif`
  ctx.fillText(text, x, y)
}

function drawVennDiagram(ctx: CanvasRenderingContext2D, rect: Rect, theme: ProbabilityTheme, args: {
  leftLabel: string
  rightLabel: string
  regions: VennRegions
  population: number
  labels: ProbabilityDrawingCopy
  note?: string
}) {
  ctx.fillStyle = theme.surface
  ctx.strokeStyle = theme.border
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 10)
  ctx.fill()
  ctx.stroke()

  const keyHeight = rect.width < 340 ? 96 : 56
  const diagram = {
    x: rect.x + 16,
    y: rect.y + 40,
    width: rect.width - 32,
    height: Math.max(110, rect.height - keyHeight - 58),
  }
  const pLeft = clamp01(args.regions.intersection.probability + args.regions.leftOnly.probability)
  const pRight = clamp01(args.regions.intersection.probability + args.regions.rightOnly.probability)
  const pIntersection = Math.min(pLeft, pRight, clamp01(args.regions.intersection.probability))
  const layout = vennLayout(diagram, pLeft, pRight, pIntersection)
  const leftColor = args.regions.leftOnly.color
  const rightColor = args.regions.rightOnly.color
  const intersectionColor = args.regions.intersection.color

  label(ctx, args.labels.universe, rect.x + 14, rect.y + 22, theme.muted, 11)
  label(ctx, `${args.labels.countPrefix}${formatCompactCount(args.population)}`, rect.x + rect.width - 88, rect.y + 22, theme.muted, 11)

  ctx.save()
  circlePath(ctx, layout.left.x, layout.left.y, layout.left.r)
  ctx.fillStyle = withAlpha(leftColor, args.regions.leftOnly.highlight ? 0.54 : 0.36)
  ctx.fill()
  ctx.restore()

  ctx.save()
  circlePath(ctx, layout.right.x, layout.right.y, layout.right.r)
  ctx.fillStyle = withAlpha(rightColor, args.regions.rightOnly.highlight ? 0.54 : 0.36)
  ctx.fill()
  ctx.restore()

  if (layout.left.r > 0 && layout.right.r > 0 && pIntersection > 0) {
    ctx.save()
    circlePath(ctx, layout.left.x, layout.left.y, layout.left.r)
    ctx.clip()
    circlePath(ctx, layout.right.x, layout.right.y, layout.right.r)
    ctx.fillStyle = withAlpha(intersectionColor, args.regions.intersection.highlight ? 0.82 : 0.68)
    ctx.fill()
    ctx.restore()
  }

  strokeCircle(ctx, layout.left.x, layout.left.y, layout.left.r, leftColor, 1.6)
  strokeCircle(ctx, layout.right.x, layout.right.y, layout.right.r, rightColor, 1.6)
  drawVennConditionOutline(ctx, rect, layout, args.regions, theme)

  drawVennEventLabels(ctx, diagram, layout, args.leftLabel, args.rightLabel, theme)
  if (pIntersection > 0 && Math.min(layout.left.r, layout.right.r) > 24) {
    centerLabel(ctx, formatDrawingPercent(args.regions.intersection.probability), (layout.left.x + layout.right.x) / 2, layout.left.y + 4, theme.text, 13)
  }
  const innerLabelThreshold = rect.width < 340 ? 30 : 44
  if (args.regions.leftOnly.probability > 0.015 && layout.left.r > innerLabelThreshold) {
    centerLabel(ctx, formatDrawingPercent(args.regions.leftOnly.probability), layout.left.x - layout.left.r * 0.42, layout.left.y + layout.left.r * 0.22, theme.text, 11)
  }
  if (args.regions.rightOnly.probability > 0.015 && layout.right.r > innerLabelThreshold) {
    centerLabel(ctx, formatDrawingPercent(args.regions.rightOnly.probability), layout.right.x + layout.right.r * 0.42, layout.right.y + layout.right.r * 0.22, theme.text, 11)
  }

  const keyY = rect.y + rect.height - keyHeight + 8
  drawVennKey(ctx, args.regions, rect.x + 16, keyY, rect.width - 32, theme)
  if (args.note && rect.width > 360) {
    label(ctx, args.note, rect.x + 18, rect.y + rect.height - 10, theme.muted, 11)
  }
}

function drawVennConditionOutline(ctx: CanvasRenderingContext2D, rect: Rect, layout: ReturnType<typeof vennLayout>, regions: VennRegions, theme: ProbabilityTheme) {
  const highlightLeft = Boolean(regions.intersection.highlight && regions.leftOnly.highlight)
  const highlightRight = Boolean(regions.intersection.highlight && regions.rightOnly.highlight)
  const highlightNotLeft = Boolean(regions.rightOnly.highlight && regions.neither.highlight)
  const highlightNotRight = Boolean(regions.leftOnly.highlight && regions.neither.highlight)

  ctx.save()
  ctx.strokeStyle = theme.highlight
  ctx.lineWidth = 3
  if (highlightLeft) strokeCirclePath(ctx, layout.left.x, layout.left.y, layout.left.r)
  if (highlightRight) strokeCirclePath(ctx, layout.right.x, layout.right.y, layout.right.r)
  if (highlightNotLeft || highlightNotRight) {
    ctx.setLineDash([7, 5])
    roundRect(ctx, rect.x + 7, rect.y + 7, rect.width - 14, rect.height - 14, 9)
    ctx.stroke()
    if (highlightNotLeft) strokeCirclePath(ctx, layout.left.x, layout.left.y, layout.left.r)
    if (highlightNotRight) strokeCirclePath(ctx, layout.right.x, layout.right.y, layout.right.r)
  }
  ctx.restore()
}

function drawVennEventLabels(ctx: CanvasRenderingContext2D, diagram: Rect, layout: ReturnType<typeof vennLayout>, leftLabel: string, rightLabel: string, theme: ProbabilityTheme) {
  const topY = Math.max(diagram.y + 14, Math.min(layout.left.y - layout.left.r, layout.right.y - layout.right.r) - 10)
  if (Math.abs(layout.left.x - layout.right.x) < 72) {
    const midX = (layout.left.x + layout.right.x) / 2
    centerLabel(ctx, leftLabel, midX, topY, theme.text, 12)
    centerLabel(ctx, rightLabel, midX, topY + 16, theme.text, 12)
    return
  }
  centerLabel(ctx, leftLabel, layout.left.x, Math.max(diagram.y + 14, layout.left.y - layout.left.r - 10), theme.text, 12)
  centerLabel(ctx, rightLabel, layout.right.x, Math.max(diagram.y + 14, layout.right.y - layout.right.r - 10), theme.text, 12)
}

function drawVennKey(ctx: CanvasRenderingContext2D, regions: VennRegions, x: number, y: number, width: number, theme: ProbabilityTheme) {
  const items = [regions.intersection, regions.leftOnly, regions.rightOnly, regions.neither]
  const columns = width < 340 ? 1 : 2
  const colWidth = width / columns
  const rowHeight = 22
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index] ?? regions.neither
    const col = index % columns
    const row = Math.floor(index / columns)
    const itemX = x + col * colWidth
    const itemY = y + row * rowHeight
    ctx.fillStyle = item.color
    ctx.fillRect(itemX, itemY - 9, 10, 10)
    label(ctx, item.label, itemX + 15, itemY, item.highlight ? theme.text : theme.muted, 11)
    const percent = formatDrawingPercent(item.probability)
    ctx.fillStyle = item.highlight ? theme.text : theme.muted
    ctx.font = '11px Inter, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(percent, itemX + colWidth - 4, itemY)
    ctx.textAlign = 'left'
  }
}

function conditionalVennRegions(categories: Category[]): VennRegions {
  return {
    intersection: categoryAt(categories, 0, 'A and B'),
    leftOnly: categoryAt(categories, 1, 'A only'),
    rightOnly: categoryAt(categories, 2, 'B only'),
    neither: categoryAt(categories, 3, 'neither'),
  }
}

function bayesVennRegions(categories: Category[]): VennRegions {
  return {
    intersection: categoryAt(categories, 0, 'H and E'),
    leftOnly: categoryAt(categories, 2, 'H no E'),
    rightOnly: categoryAt(categories, 1, 'not H and E'),
    neither: categoryAt(categories, 3, 'neither'),
  }
}

function medicalVennRegions(categories: Category[], selected: 'positive' | 'negative'): VennRegions {
  if (selected === 'negative') {
    return {
      intersection: categoryAt(categories, 3, 'true negative'),
      leftOnly: categoryAt(categories, 1, 'false positive'),
      rightOnly: categoryAt(categories, 2, 'false negative'),
      neither: categoryAt(categories, 0, 'true positive'),
    }
  }
  return {
    intersection: categoryAt(categories, 0, 'true positive'),
    leftOnly: categoryAt(categories, 2, 'false negative'),
    rightOnly: categoryAt(categories, 1, 'false positive'),
    neither: categoryAt(categories, 3, 'true negative'),
  }
}

function categoryAt(categories: Category[], index: number, fallbackLabel: string): Category {
  return categories[index] ?? { label: fallbackLabel, probability: 0, color: '#7fd6c2' }
}

function vennLayout(rect: Rect, pLeft: number, pRight: number, pIntersection: number) {
  let rMax = Math.min(rect.width * 0.34, rect.height * 0.58)
  const leftVisual = visualProbability(pLeft)
  const rightVisual = visualProbability(pRight)
  const intersectionVisual = pIntersection <= 0 ? 0 : Math.min(leftVisual, rightVisual, Math.max(pIntersection, Math.min(leftVisual, rightVisual) * 0.18))
  let leftRadius = Math.sqrt(leftVisual) * rMax
  let rightRadius = Math.sqrt(rightVisual) * rMax
  let distance = overlapDistance(leftRadius, rightRadius, Math.PI * rMax * rMax * intersectionVisual)
  const totalWidth = leftRadius + distance + rightRadius
  const widthLimit = rect.width * 0.9
  if (totalWidth > widthLimit) {
    rMax *= widthLimit / totalWidth
    leftRadius = Math.sqrt(leftVisual) * rMax
    rightRadius = Math.sqrt(rightVisual) * rMax
    distance = overlapDistance(leftRadius, rightRadius, Math.PI * rMax * rMax * intersectionVisual)
  }
  const fittedWidth = leftRadius + distance + rightRadius
  const leftX = rect.x + rect.width / 2 - fittedWidth / 2 + leftRadius
  const y = rect.y + rect.height * 0.52
  return {
    left: { x: leftX, y, r: leftRadius },
    right: { x: leftX + distance, y, r: rightRadius },
  }
}

function visualProbability(probability: number) {
  const p = clamp01(probability)
  if (p <= 0) return 0
  return Math.max(p, 0.055)
}

function overlapDistance(r1: number, r2: number, targetArea: number) {
  if (r1 <= 0 || r2 <= 0 || targetArea <= 0) return r1 + r2 + 10
  const minArea = Math.PI * Math.min(r1, r2) ** 2
  if (targetArea >= minArea - 0.01) return Math.abs(r1 - r2)
  let low = Math.abs(r1 - r2)
  let high = r1 + r2
  for (let index = 0; index < 36; index += 1) {
    const mid = (low + high) / 2
    const area = circleOverlapArea(r1, r2, mid)
    if (area > targetArea) low = mid
    else high = mid
  }
  return (low + high) / 2
}

function circleOverlapArea(r1: number, r2: number, distance: number) {
  if (distance >= r1 + r2) return 0
  if (distance <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2
  const a = r1 ** 2 * Math.acos(clampCos((distance ** 2 + r1 ** 2 - r2 ** 2) / (2 * distance * r1)))
  const b = r2 ** 2 * Math.acos(clampCos((distance ** 2 + r2 ** 2 - r1 ** 2) / (2 * distance * r2)))
  const c = 0.5 * Math.sqrt(Math.max(0, (-distance + r1 + r2) * (distance + r1 - r2) * (distance - r1 + r2) * (distance + r1 + r2)))
  return a + b - c
}

function circlePath(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath()
  ctx.arc(x, y, Math.max(0, radius), 0, Math.PI * 2)
}

function strokeCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, width: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  strokeCirclePath(ctx, x, y, radius)
  ctx.lineWidth = 1
}

function strokeCirclePath(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  if (radius <= 0) return
  circlePath(ctx, x, y, radius)
  ctx.stroke()
}

function centerLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 11) {
  ctx.fillStyle = color
  ctx.font = `${size}px Inter, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(text, x, y)
  ctx.textAlign = 'left'
}

function formatDrawingPercent(probability: number) {
  const percent = clamp01(probability) * 100
  if (percent > 0 && percent < 0.1) return '<0.1%'
  return `${percent.toFixed(percent >= 10 ? 0 : 1)}%`
}

function formatCompactCount(value: number) {
  if (!Number.isFinite(value)) return '0'
  return Math.round(value).toLocaleString('en-US')
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function clampCos(value: number) {
  return Math.max(-1, Math.min(1, value))
}

function drawTable(ctx: CanvasRenderingContext2D, rect: Rect, table: string[][], theme: ProbabilityTheme) {
  const rows = table.length
  const cols = table[0]?.length ?? 1
  const cellWidth = rect.width / cols
  const cellHeight = Math.min(54, rect.height / rows)
  ctx.strokeStyle = theme.border
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = rect.x + col * cellWidth
      const y = rect.y + row * cellHeight
      ctx.fillStyle = row === 0 || col === 0 ? withAlpha(theme.axis, 0.08) : theme.surface
      ctx.fillRect(x, y, cellWidth, cellHeight)
      ctx.strokeRect(x, y, cellWidth, cellHeight)
      label(ctx, table[row]?.[col] ?? '', x + 8, y + cellHeight / 2 + 4, row === 0 || col === 0 ? theme.text : theme.muted, 12)
    }
  }
}

function drawCallout(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, text: string, theme: ProbabilityTheme) {
  ctx.fillStyle = withAlpha(theme.highlight, 0.12)
  ctx.strokeStyle = withAlpha(theme.highlight, 0.72)
  roundRect(ctx, x, y, width, 42, 8)
  ctx.fill()
  ctx.stroke()
  label(ctx, text, x + 12, y + 26, theme.text, 12)
}

function drawMeter(ctx: CanvasRenderingContext2D, rect: Rect, theme: ProbabilityTheme, value: number, labelText: string, undefinedValue: boolean, labels: ProbabilityDrawingCopy) {
  ctx.fillStyle = theme.surface
  ctx.strokeStyle = theme.border
  roundRect(ctx, rect.x, rect.y, rect.width, rect.height * 0.42, 8)
  ctx.fill()
  ctx.stroke()
  label(ctx, labelText, rect.x + 14, rect.y + 26, theme.muted, 12)
  ctx.fillStyle = withAlpha(theme.highlight, 0.18)
  ctx.fillRect(rect.x + 14, rect.y + 48, (rect.width - 28) * Math.max(0, Math.min(1, value)), 22)
  ctx.strokeStyle = theme.border
  ctx.strokeRect(rect.x + 14, rect.y + 48, rect.width - 28, 22)
  label(ctx, undefinedValue ? labels.notDefined : `${(value * 100).toFixed(2)}%`, rect.x + 14, rect.y + 92, theme.text, 22)
}

function drawBarChart(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  theme: ProbabilityTheme,
  distributionInput: DiscreteDistribution,
  options: { overlay?: DiscreteDistribution; highlight?: (value: number) => boolean; xLabel: string; yLabel: string },
) {
  const distribution = normalizeDistribution(distributionInput)
  drawAxes(ctx, rect, theme)
  const maxY = Math.max(...distribution.probabilities, ...(options.overlay?.probabilities ?? []), 0.01) * 1.12
  const barGap = Math.min(5, rect.width / Math.max(1, distribution.values.length) * 0.16)
  const barWidth = rect.width / Math.max(1, distribution.values.length) - barGap
  for (let index = 0; index < distribution.values.length; index += 1) {
    const value = distribution.values[index] ?? 0
    const probability = distribution.probabilities[index] ?? 0
    const height = (probability / maxY) * rect.height
    const x = rect.x + index * (barWidth + barGap) + barGap / 2
    const y = rect.y + rect.height - height
    ctx.fillStyle = options.highlight?.(value) ? theme.highlight : theme.distributionPrimary
    ctx.fillRect(x, y, Math.max(1, barWidth), height)
    if (options.overlay) {
      const overlayProbability = options.overlay.probabilities[index] ?? 0
      const overlayHeight = (overlayProbability / maxY) * rect.height
      ctx.fillStyle = theme.simulationEmpirical
      ctx.fillRect(x + barWidth * 0.18, rect.y + rect.height - overlayHeight, Math.max(1, barWidth * 0.64), overlayHeight)
    }
    if (distribution.values.length <= 18 || index % Math.ceil(distribution.values.length / 12) === 0) {
      label(ctx, String(value), x, rect.y + rect.height + 16, theme.muted, 10)
    }
  }
  label(ctx, options.xLabel, rect.x + rect.width - 68, rect.y + rect.height + 32, theme.muted, 11)
  label(ctx, options.yLabel, rect.x - 28, rect.y - 8, theme.muted, 11)
}

function drawAxes(ctx: CanvasRenderingContext2D, rect: Rect, theme: ProbabilityTheme) {
  ctx.strokeStyle = theme.grid
  ctx.lineWidth = 1
  for (let index = 0; index <= 4; index += 1) {
    const y = rect.y + (rect.height * index) / 4
    ctx.beginPath()
    ctx.moveTo(rect.x, y)
    ctx.lineTo(rect.x + rect.width, y)
    ctx.stroke()
  }
  ctx.strokeStyle = theme.axis
  ctx.beginPath()
  ctx.moveTo(rect.x, rect.y)
  ctx.lineTo(rect.x, rect.y + rect.height)
  ctx.lineTo(rect.x + rect.width, rect.y + rect.height)
  ctx.stroke()
}

function drawDensityHistogram(ctx: CanvasRenderingContext2D, rect: Rect, theme: ProbabilityTheme, bins: HistogramBin[], min: number, max: number, maxY: number) {
  for (const bin of bins) {
    const x = rect.x + ((bin.x0 - min) / (max - min)) * rect.width
    const width = ((bin.x1 - bin.x0) / (max - min)) * rect.width
    const height = (bin.density / maxY) * rect.height
    ctx.fillStyle = theme.simulationEmpirical
    ctx.fillRect(x, rect.y + rect.height - height, Math.max(1, width - 1), height)
  }
}

function drawIntervalArea(ctx: CanvasRenderingContext2D, rect: Rect, theme: ProbabilityTheme, pdf: (x: number) => number, min: number, max: number, maxY: number, interval: [number, number]) {
  const a = Math.max(min, Math.min(interval[0], interval[1]))
  const b = Math.min(max, Math.max(interval[0], interval[1]))
  if (b <= a) return
  ctx.fillStyle = theme.fill
  ctx.beginPath()
  ctx.moveTo(rect.x + ((a - min) / (max - min)) * rect.width, rect.y + rect.height)
  for (let index = 0; index <= 120; index += 1) {
    const x = a + ((b - a) * index) / 120
    const y = pdf(x)
    ctx.lineTo(rect.x + ((x - min) / (max - min)) * rect.width, rect.y + rect.height - (y / maxY) * rect.height)
  }
  ctx.lineTo(rect.x + ((b - min) / (max - min)) * rect.width, rect.y + rect.height)
  ctx.closePath()
  ctx.fill()
}

function drawCurve(ctx: CanvasRenderingContext2D, rect: Rect, theme: ProbabilityTheme, points: Array<{ x: number; y: number }>, min: number, max: number, maxY: number, color: string, width: number, labels = defaultDrawingCopy) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  let started = false
  for (const point of points) {
    if (!Number.isFinite(point.y)) continue
    const x = rect.x + ((point.x - min) / (max - min)) * rect.width
    const y = rect.y + rect.height - (point.y / maxY) * rect.height
    if (!started) {
      ctx.moveTo(x, y)
      started = true
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
  ctx.lineWidth = 1
  label(ctx, labels.theory, rect.x + rect.width - 54, rect.y + 16, theme.muted, 10)
}

function drawPointMarker(ctx: CanvasRenderingContext2D, rect: Rect, theme: ProbabilityTheme, xValue: number, yValue: number, min: number, max: number, maxY: number) {
  const x = rect.x + ((xValue - min) / (max - min)) * rect.width
  const y = rect.y + rect.height - (yValue / maxY) * rect.height
  ctx.strokeStyle = theme.highlight
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(x, rect.y)
  ctx.lineTo(x, rect.y + rect.height)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = theme.highlight
  ctx.beginPath()
  ctx.arc(x, y, 4, 0, Math.PI * 2)
  ctx.fill()
}

function drawSourceDistribution(ctx: CanvasRenderingContext2D, rect: Rect, theme: ProbabilityTheme, source: SourceDistribution, sourceLabel: string, labels: ProbabilityDrawingCopy) {
  if (source.discrete) {
    drawBarChart(ctx, rect, theme, source.discrete, { xLabel: sourceLabel, yLabel: 'P' })
    return
  }
  drawAxes(ctx, rect, theme)
  const [min, max] = source.domain
  const pdf = source.id === 'uniform' ? (() => 1 / (max - min)) : (x: number) => (x < 0 ? 0 : Math.exp(-x))
  const curve = sampleCurve(pdf, min, max, 180)
  drawCurve(ctx, rect, theme, curve, min, max, Math.max(...curve.map((point) => point.y), 0.01) * 1.12, theme.distributionPrimary, 2, labels)
}

function drawPairGrid(ctx: CanvasRenderingContext2D, rect: Rect, theme: ProbabilityTheme, grid: PairMass[], selectedSum: number, labels: ProbabilityDrawingCopy) {
  const xValues = [...new Set(grid.map((cell) => cell.x))].sort((a, b) => a - b)
  const yValues = [...new Set(grid.map((cell) => cell.y))].sort((a, b) => a - b)
  const cellWidth = rect.width / Math.max(1, yValues.length)
  const cellHeight = rect.height / Math.max(1, xValues.length)
  for (let row = 0; row < xValues.length; row += 1) {
    for (let col = 0; col < yValues.length; col += 1) {
      const x = xValues[row] ?? 0
      const y = yValues[col] ?? 0
      const cell = grid.find((candidate) => candidate.x === x && candidate.y === y)
      const selected = cell?.sum === selectedSum
      ctx.fillStyle = selected ? withAlpha(theme.highlight, 0.6) : withAlpha(theme.distributionSecondary, 0.18 + (cell?.probability ?? 0) * 2)
      ctx.strokeStyle = theme.border
      ctx.fillRect(rect.x + col * cellWidth, rect.y + row * cellHeight, cellWidth, cellHeight)
      ctx.strokeRect(rect.x + col * cellWidth, rect.y + row * cellHeight, cellWidth, cellHeight)
      if (cellWidth > 38 && cellHeight > 24) label(ctx, String(cell?.sum ?? ''), rect.x + col * cellWidth + 8, rect.y + row * cellHeight + 17, theme.text, 10)
    }
  }
  label(ctx, labels.pairsWithSum(selectedSum), rect.x, rect.y - 10, theme.muted, 12)
}

function sampleCurve(fn: (x: number) => number, min: number, max: number, count: number): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = []
  for (let index = 0; index <= count; index += 1) {
    const x = min + ((max - min) * index) / count
    points.push({ x, y: Math.max(0, fn(x)) })
  }
  return points
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
}
