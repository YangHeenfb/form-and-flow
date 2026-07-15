import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, PointerEvent, ReactNode, SetStateAction } from 'react'
import type { ViewPan } from '../math/types.ts'
import { useResizeObserver } from '../platform/useElementSize.ts'
import type { MatrixAnimationFrame, RenderPayload } from '../render/RendererAdapter.ts'
import { Canvas2DRenderer } from '../render/canvas2d/Canvas2DRenderer.ts'

const gridRadiusUnits = 5
const minVisibleGridPixels = 48
const maxVisibleGridPixels = 160
const visibleGridFraction = 0.18

type Props = RenderPayload & {
  title: string
  subtitle: string
  isAnimating?: boolean
  onViewPanChange: Dispatch<SetStateAction<ViewPan>>
  registerExporter: (exporter: () => string | null) => void
  registerFrameRenderer?: (renderer: (frame: MatrixAnimationFrame) => void) => () => void
  headerAction?: ReactNode
  stageAction?: ReactNode
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  startPan: ViewPan
}

export function Canvas2DView({ title, subtitle, isAnimating = false, onViewPanChange, registerExporter, registerFrameRenderer, headerAction, stageAction, ...payload }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const payloadRef = useRef(payload)
  const [isPanning, setIsPanning] = useState(false)
  const renderer = useMemo(() => new Canvas2DRenderer(), [])

  useEffect(() => {
    payloadRef.current = payload
  }, [payload])

  const clampCurrentPan = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const rect = canvas.getBoundingClientRect()
    onViewPanChange((current) => {
      const next = clampViewPan(current, rect, payloadRef.current.viewZoom)
      return pansEqual(current, next) ? current : next
    })
  }, [onViewPanChange])

  const renderCurrent = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    renderer.render(canvas, payloadRef.current)
  }, [renderer])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || isAnimating) {
      return
    }
    renderer.render(canvas, payload)
  }, [isAnimating, payload, renderer])

  useEffect(() => {
    registerExporter(() => canvasRef.current?.toDataURL('image/png') ?? null)
  }, [registerExporter])

  useEffect(() => {
    clampCurrentPan()
  }, [clampCurrentPan, payload.viewPan, payload.viewZoom])

  useResizeObserver(canvasRef, () => {
    clampCurrentPan()
    renderCurrent()
  })

  useEffect(() => {
    if (!registerFrameRenderer) {
      return
    }
    return registerFrameRenderer((frame) => {
      const canvas = canvasRef.current
      if (canvas) {
        renderer.render(canvas, { ...payloadRef.current, matrix: frame.matrix })
      }
    })
  }, [registerFrameRenderer, renderer])

  const startPan = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPan: payload.viewPan,
    }
    setIsPanning(true)
  }

  const updatePan = (event: PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    onViewPanChange(
      clampViewPan(
        {
          x: drag.startPan.x + event.clientX - drag.startX,
          y: drag.startPan.y + event.clientY - drag.startY,
        },
        rect,
        payload.viewZoom,
      ),
    )
  }

  const endPan = (event: PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
    setIsPanning(false)
  }

  return (
    <section className="view-panel">
      <header className="view-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {headerAction && <div className="view-header-actions">{headerAction}</div>}
      </header>
      <div className="view-stage">
        <canvas
          ref={canvasRef}
          className={`canvas-2d ${isPanning ? 'is-panning' : ''}`}
          role="img"
          aria-label={title}
          onPointerDown={startPan}
          onPointerMove={updatePan}
          onPointerUp={endPan}
          onPointerCancel={endPan}
        >
          {subtitle}
        </canvas>
        {stageAction}
      </div>
    </section>
  )
}

function clampViewPan(pan: ViewPan, rect: DOMRect, zoom: number): ViewPan {
  const scale = (Math.min(rect.width, rect.height) / 9) * zoom
  const gridRadius = gridRadiusUnits * scale
  const visibleGuard = clamp(Math.min(rect.width, rect.height) * visibleGridFraction, minVisibleGridPixels, maxVisibleGridPixels)
  const minX = visibleGuard - gridRadius - rect.width / 2
  const maxX = rect.width / 2 - visibleGuard + gridRadius
  const minY = visibleGuard - gridRadius - rect.height / 2
  const maxY = rect.height / 2 - visibleGuard + gridRadius

  return {
    x: clamp(pan.x, minX, maxX),
    y: clamp(pan.y, minY, maxY),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function pansEqual(a: ViewPan, b: ViewPan): boolean {
  return Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5
}
