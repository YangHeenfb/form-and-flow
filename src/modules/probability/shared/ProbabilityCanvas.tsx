import { useEffect, useRef } from 'react'
import { platformSurfaceModeEventName } from '../../../platform/platformLocale.tsx'
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let frame = 0
    const render = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(ctx, { width: rect.width, height: rect.height, devicePixelRatio: dpr }, readProbabilityTheme(canvas))
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(render)
    }
    schedule()
    const observer = new ResizeObserver(schedule)
    observer.observe(canvas)
    window.addEventListener(platformSurfaceModeEventName, schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener(platformSurfaceModeEventName, schedule)
      observer.disconnect()
    }
  }, [draw])

  return <canvas ref={canvasRef} className={`graph-canvas probability-canvas probability-main-canvas${className ? ` ${className}` : ''}`} aria-label={ariaLabel} />
}
