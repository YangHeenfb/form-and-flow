import { useCallback, useLayoutEffect, useRef } from 'react'
import { usePlatformSurfaceMode } from '../../../platform/platformLocale.tsx'
import { readProbabilityTheme, type ProbabilityTheme } from './probabilityThemeAdapter.ts'

export type ProbabilityCanvasSize = {
  width: number
  height: number
  devicePixelRatio: number
}

type Props = {
  ariaLabel: string
  className?: string
  draw: (ctx: CanvasRenderingContext2D, size: ProbabilityCanvasSize, theme: ProbabilityTheme) => void
}

export function ProbabilityCanvas({ ariaLabel, className, draw }: Props) {
  const { surfaceMode } = usePlatformSurfaceMode()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawRef = useRef(draw)

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
    drawRef.current(ctx, { width: rect.width, height: rect.height, devicePixelRatio: dpr }, readProbabilityTheme(canvas))
  }, [])

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

  return <canvas ref={canvasRef} className={`graph-canvas probability-canvas probability-main-canvas${className ? ` ${className}` : ''}`} aria-label={ariaLabel} />
}
