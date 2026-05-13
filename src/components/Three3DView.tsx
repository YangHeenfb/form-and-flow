import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppCopy } from '../i18n.ts'
import type { ThreeCameraView } from '../math/types.ts'
import { useResizeObserver } from '../platform/useElementSize.ts'
import type { MatrixAnimationFrame, ThreeRenderPayload } from '../render/RendererAdapter.ts'
import { Three3DRenderer } from '../render/three3d/Three3DRenderer.ts'

type Props = ThreeRenderPayload & {
  copy: AppCopy['threeView']
  title: string
  subtitle: string
  cameraView: ThreeCameraView
  onCameraViewChange: (view: ThreeCameraView) => void
  viewResetKey?: number
  registerExporter: (exporter: () => string | null) => void
  registerFrameRenderer?: (renderer: (frame: MatrixAnimationFrame) => void) => () => void
  headerAction?: ReactNode
  stageAction?: ReactNode
}

const cameraViews: ThreeCameraView[] = ['free', 'x', 'y', 'z']

export function Three3DView({ copy, title, subtitle, cameraView, onCameraViewChange, viewResetKey, registerExporter, registerFrameRenderer, headerAction, stageAction, ...payload }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Three3DRenderer | null>(null)
  const payloadRef = useRef(payload)
  const cameraViewRef = useRef(cameraView)
  const [webglUnavailable, setWebglUnavailable] = useState(false)

  useEffect(() => {
    payloadRef.current = payload
  }, [payload])

  useEffect(() => {
    cameraViewRef.current = cameraView
  }, [cameraView])

  const renderCurrent = useCallback(() => {
    rendererRef.current?.render(payloadRef.current, cameraViewRef.current)
  }, [])

  useEffect(() => {
    if (!hostRef.current || rendererRef.current) {
      return
    }
    try {
      rendererRef.current = new Three3DRenderer(hostRef.current)
    } catch {
      setWebglUnavailable(true)
      return
    }
    registerExporter(() => rendererRef.current?.exportPng() ?? null)
    return () => {
      rendererRef.current?.dispose()
      rendererRef.current = null
    }
  }, [registerExporter])

  useEffect(() => {
    if (!webglUnavailable) {
      rendererRef.current?.render(payload, cameraView)
    }
  }, [cameraView, payload, webglUnavailable])

  useEffect(() => {
    rendererRef.current?.resetCamera()
    if (!webglUnavailable) {
      rendererRef.current?.render(payloadRef.current, cameraViewRef.current)
    }
  }, [viewResetKey, webglUnavailable])

  useResizeObserver(hostRef, renderCurrent)

  useEffect(() => {
    if (!registerFrameRenderer || webglUnavailable) {
      return
    }
    return registerFrameRenderer((frame) => {
      rendererRef.current?.render(
        {
          ...payloadRef.current,
          matrix: frame.matrix,
          visualMatrix: frame.visualMatrix,
        },
        cameraView,
      )
    })
  }, [cameraView, registerFrameRenderer, webglUnavailable])

  return (
    <section className="view-panel">
      <header className="view-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="view-header-actions">
          <div className="camera-view-control segmented" role="group" aria-label={copy.cameraLabel}>
            {cameraViews.map((view) => (
              <button
                key={view}
                type="button"
                className={cameraView === view ? 'active' : ''}
                onClick={() => onCameraViewChange(view)}
              >
                {copy[view]}
              </button>
            ))}
          </div>
          {headerAction}
        </div>
      </header>
      <div className="view-stage">
        <div ref={hostRef} className={`three-host${webglUnavailable ? ' three-host-fallback' : ''}`} role="img" aria-label={title}>
          {webglUnavailable && <p>{copy.webglUnavailable}</p>}
        </div>
        {stageAction}
      </div>
    </section>
  )
}
