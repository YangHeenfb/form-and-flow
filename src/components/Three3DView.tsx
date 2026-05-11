import { useEffect, useRef } from 'react'
import type { AppCopy } from '../i18n.ts'
import type { ThreeCameraView } from '../math/types.ts'
import type { ThreeRenderPayload } from '../render/RendererAdapter.ts'
import { Three3DRenderer } from '../render/three3d/Three3DRenderer.ts'

type Props = ThreeRenderPayload & {
  copy: AppCopy['threeView']
  title: string
  subtitle: string
  cameraView: ThreeCameraView
  onCameraViewChange: (view: ThreeCameraView) => void
  registerExporter: (exporter: () => string | null) => void
}

const cameraViews: ThreeCameraView[] = ['free', 'x', 'y', 'z']

export function Three3DView({ copy, title, subtitle, cameraView, onCameraViewChange, registerExporter, ...payload }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<Three3DRenderer | null>(null)

  useEffect(() => {
    if (!hostRef.current || rendererRef.current) {
      return
    }
    rendererRef.current = new Three3DRenderer(hostRef.current)
    registerExporter(() => rendererRef.current?.exportPng() ?? null)
    return () => {
      rendererRef.current?.dispose()
      rendererRef.current = null
    }
  }, [registerExporter])

  useEffect(() => {
    rendererRef.current?.render(payload, cameraView)
  }, [cameraView, payload])

  useEffect(() => {
    const onResize = () => rendererRef.current?.render(payload, cameraView)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [cameraView, payload])

  return (
    <section className="view-panel">
      <header className="view-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
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
      </header>
      <div ref={hostRef} className="three-host" aria-label={title} />
    </section>
  )
}
