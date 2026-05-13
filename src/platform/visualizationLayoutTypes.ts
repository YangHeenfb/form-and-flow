import type { ReactNode } from 'react'

export type VisualizationLayoutMode = 'standard' | 'focus'

export type OverlayPanelId =
  | 'matrices'
  | 'vectors'
  | 'theme'
  | 'explanation'
  | 'controls'
  | 'help'

export type OverlayPanelState = Record<OverlayPanelId, boolean>

export type VisualizationLayoutState = {
  mode: VisualizationLayoutMode
  overlayPanels: OverlayPanelState
  autoHideHud: boolean
}

export type OverlayPanelSide = 'left' | 'right' | 'bottom'

export type OverlayPanelDefinition = {
  id: OverlayPanelId
  title: string
  content: ReactNode
  side?: OverlayPanelSide
}

export type VisualizationWorkbenchStatus = {
  mode: VisualizationLayoutMode
}

export const overlayPanelIds: OverlayPanelId[] = ['matrices', 'vectors', 'theme', 'explanation', 'controls', 'help']

export function createOverlayPanelState(activePanelId?: OverlayPanelId | null): OverlayPanelState {
  return overlayPanelIds.reduce<OverlayPanelState>((state, panelId) => {
    state[panelId] = panelId === activePanelId
    return state
  }, {} as OverlayPanelState)
}
