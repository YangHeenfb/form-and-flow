import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, PointerEvent, ReactNode, SetStateAction } from 'react'
import type { ViewPan } from '../math/types.ts'
import type { RenderPayload } from '../render/RendererAdapter.ts'
import { Canvas2DRenderer } from '../render/canvas2d/Canvas2DRenderer.ts'

const gridRadiusUnits = 5
const minVisibleGridPixels = 48
const maxVisibleGridPixels = 160
const visibleGridFraction = 0.18

type Props = RenderPayload & {
  title: string
  subtitle: string
  onViewPanChange: Dispatch<SetStateAction<ViewPan>>
  registerExporter: (exporter: () => string | null) => void
  headerAction?: ReactNode
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  startPan: ViewPan
}

export function Canvas2DView({ title, subtitle, onViewPanChange, registerExporter, headerAction, ...payload }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const renderer = useMemo(() => new Canvas2DRenderer(), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    renderer.render(canvas, payload)
    registerExporter(() => canvas.toDataURL('image/png'))
  }, [payload, registerExporter, renderer])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const rect = canvas.getBoundingClientRect()
    onViewPanChange((current) => {
      const next = clampViewPan(current, rect, payload.viewZoom)
      return pansEqual(current, next) ? current : next
    })
  }, [onViewPanChange, payload.viewPan, payload.viewZoom])

  useEffect(() => {
    const onResize = () => {
      if (canvasRef.current) {
        renderer.render(canvasRef.current, payload)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [payload, renderer])

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
      <canvas
        ref={canvasRef}
        className={`canvas-2d ${isPanning ? 'is-panning' : ''}`}
        aria-label={title}
        onPointerDown={startPan}
        onPointerMove={updatePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      />
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
