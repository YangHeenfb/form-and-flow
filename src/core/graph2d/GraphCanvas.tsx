import { useCallback, useLayoutEffect, useRef } from 'react'
import { usePlatformSurfaceMode } from '../../platform/platformLocale.tsx'

export type GraphViewport = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  width: number
  height: number
  devicePixelRatio: number
}

export type GraphTheme = {
  background: string
  gridMinor: string
  gridMajor: string
  axis: string
  text: string
  muted: string
  primary: string
  secondary: string
  accent: string
  warning: string
  fill: string
}

type Props = {
  className?: string
  ariaLabel: string
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  draw: (ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme) => void
  onViewportChange?: (viewport: Pick<GraphViewport, 'xMin' | 'xMax' | 'yMin' | 'yMax'>) => void
}

export function GraphCanvas({ className, ariaLabel, xMin, xMax, yMin, yMax, draw, onViewportChange }: Props) {
  const { surfaceMode } = usePlatformSurfaceMode()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawRef = useRef(draw)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    rectWidth: number
    rectHeight: number
    view: Pick<GraphViewport, 'xMin' | 'xMax' | 'yMin' | 'yMax'>
  } | null>(null)

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const pixelWidth = Math.max(1, Math.floor(rect.width * dpr))
    const pixelHeight = Math.max(1, Math.floor(rect.height * dpr))
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const viewport = { xMin, xMax, yMin, yMax, width: rect.width, height: rect.height, devicePixelRatio: dpr }
    drawRef.current(ctx, viewport, readGraphTheme(canvas))
  }, [xMax, xMin, yMax, yMin])

  useLayoutEffect(() => {
    drawRef.current = draw
    renderCanvas()
  }, [draw, renderCanvas, surfaceMode])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(renderCanvas)
    observer.observe(canvas)
    return () => {
      observer.disconnect()
    }
  }, [renderCanvas])

  const makeViewportFromCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return {
      xMin,
      xMax,
      yMin,
      yMax,
      width: rect.width,
      height: rect.height,
      devicePixelRatio: window.devicePixelRatio || 1,
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'graph-canvas'}
      aria-label={ariaLabel}
      onPointerDown={(event) => {
        if (!onViewportChange || event.button !== 0) return
        const canvas = canvasRef.current
        const viewport = makeViewportFromCanvas()
        if (!canvas || !viewport) return
        canvas.setPointerCapture(event.pointerId)
        dragRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          rectWidth: viewport.width,
          rectHeight: viewport.height,
          view: { xMin, xMax, yMin, yMax },
        }
      }}
      onPointerMove={(event) => {
        if (!onViewportChange || !dragRef.current || dragRef.current.pointerId !== event.pointerId) return
        const drag = dragRef.current
        const dx = ((event.clientX - drag.startX) / Math.max(1, drag.rectWidth)) * (drag.view.xMax - drag.view.xMin)
        const dy = ((event.clientY - drag.startY) / Math.max(1, drag.rectHeight)) * (drag.view.yMax - drag.view.yMin)
        onViewportChange({
          xMin: drag.view.xMin - dx,
          xMax: drag.view.xMax - dx,
          yMin: drag.view.yMin + dy,
          yMax: drag.view.yMax + dy,
        })
      }}
      onPointerUp={(event) => {
        if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
      }}
      onPointerCancel={(event) => {
        if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
      }}
      onWheel={(event) => {
        if (!onViewportChange) return
        event.preventDefault()
        const viewport = makeViewportFromCanvas()
        const canvas = canvasRef.current
        if (!viewport || !canvas) return
        const rect = canvas.getBoundingClientRect()
        const px = event.clientX - rect.left
        const py = event.clientY - rect.top
        const focus = screenToWorld(viewport, px, py)
        const factor = Math.exp(Math.max(-240, Math.min(240, event.deltaY)) * 0.0015)
        const nextWidth = (xMax - xMin) * factor
        const nextHeight = (yMax - yMin) * factor
        const xRatio = px / Math.max(1, viewport.width)
        const yRatioFromBottom = (viewport.height - py) / Math.max(1, viewport.height)
        onViewportChange({
          xMin: focus.x - nextWidth * xRatio,
          xMax: focus.x + nextWidth * (1 - xRatio),
          yMin: focus.y - nextHeight * yRatioFromBottom,
          yMax: focus.y + nextHeight * (1 - yRatioFromBottom),
        })
      }}
    />
  )
}

export function worldToScreen(viewport: GraphViewport, x: number, y: number) {
  return {
    x: ((x - viewport.xMin) / (viewport.xMax - viewport.xMin)) * viewport.width,
    y: viewport.height - ((y - viewport.yMin) / (viewport.yMax - viewport.yMin)) * viewport.height,
  }
}

export function screenToWorld(viewport: GraphViewport, x: number, y: number) {
  return {
    x: viewport.xMin + (x / viewport.width) * (viewport.xMax - viewport.xMin),
    y: viewport.yMin + ((viewport.height - y) / viewport.height) * (viewport.yMax - viewport.yMin),
  }
}

export function drawGrid(ctx: CanvasRenderingContext2D, viewport: GraphViewport, theme: GraphTheme) {
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, viewport.width, viewport.height)
  ctx.lineWidth = 1
  ctx.strokeStyle = theme.gridMinor
  for (let x = Math.ceil(viewport.xMin); x <= viewport.xMax; x += 1) {
    line(ctx, viewport, x, viewport.yMin, x, viewport.yMax)
  }
  for (let y = Math.ceil(viewport.yMin); y <= viewport.yMax; y += 1) {
    line(ctx, viewport, viewport.xMin, y, viewport.xMax, y)
  }
  ctx.strokeStyle = theme.axis
  ctx.lineWidth = 1.4
  line(ctx, viewport, viewport.xMin, 0, viewport.xMax, 0)
  line(ctx, viewport, 0, viewport.yMin, 0, viewport.yMax)
}

export function line(ctx: CanvasRenderingContext2D, viewport: GraphViewport, x1: number, y1: number, x2: number, y2: number) {
  const a = worldToScreen(viewport, x1, y1)
  const b = worldToScreen(viewport, x2, y2)
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
}

function readGraphTheme(element: HTMLElement): GraphTheme {
  const style = getComputedStyle(element)
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return {
    background: read('--graph-canvas-background', '#101720'),
    gridMinor: read('--grid-color', '#3f4a55'),
    gridMajor: read('--panel-border', '#2b3642'),
    axis: read('--axis-color', '#d7dde5'),
    text: read('--text-main', '#eef3f8'),
    muted: read('--text-muted', '#a7b1bd'),
    primary: read('--graph-function-primary', '#7fd6c2'),
    secondary: read('--graph-function-secondary', '#b9a7ff'),
    accent: read('--focus', '#7fd6c2'),
    warning: read('--graph-warning', '#c7dc8a'),
    fill: read('--graph-area-fill', 'rgba(127, 214, 194, 0.24)'),
  }
}
