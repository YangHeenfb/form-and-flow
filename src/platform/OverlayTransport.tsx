import type { ReactNode } from 'react'

type OverlayTransportProps = {
  children: ReactNode
}

export function OverlayTransport({ children }: OverlayTransportProps) {
  return <div className="visualization-overlay-transport">{children}</div>
}
