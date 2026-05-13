import type { Matrix, SpaceDim, ThemeSettings, VectorState, ViewOptions, ViewPan } from '../math/types.ts'

export type RenderPayload = {
  matrix: Matrix
  inputDim: SpaceDim
  outputDim: SpaceDim
  vectors: VectorState[]
  options: ViewOptions
  theme: ThemeSettings
  viewZoom: number
  viewPan: ViewPan
}

export type ThreeRenderPayload = RenderPayload & {
  visualMatrix: Matrix
}

export type MatrixAnimationFrame = {
  matrix: Matrix
  visualMatrix: Matrix
  progress: number
}
