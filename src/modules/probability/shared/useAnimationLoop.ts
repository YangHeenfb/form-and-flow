import { useEffect } from 'react'

export function useAnimationLoop(enabled: boolean, onFrame: (deltaMs: number) => void) {
  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return
    let frame = 0
    let previous = performance.now()
    const tick = (now: number) => {
      const delta = Math.min(100, now - previous)
      previous = now
      onFrame(delta)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [enabled, onFrame])
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}
