import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useResizeObserver(ref, (rect) => {
    setSize({ width: rect.width, height: rect.height })
  })

  return {
    ref,
    width: size.width,
    height: size.height,
  }
}

export function useResizeObserver(
  ref: RefObject<Element | null>,
  onResize: (rect: DOMRectReadOnly) => void,
): void {
  const onResizeRef = useRef(onResize)

  useEffect(() => {
    onResizeRef.current = onResize
  }, [onResize])

  const notify = useCallback((element: Element) => {
    onResizeRef.current(element.getBoundingClientRect())
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    notify(element)

    if (typeof ResizeObserver === 'undefined') {
      const handleResize = () => notify(element)
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        onResizeRef.current(entry.contentRect)
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [notify, ref])
}
