export type SpaceDim = 2 | 3

export type Matrix = number[][]

export type LinearMap = {
  id: string
  name: string
  inputDim: SpaceDim
  outputDim: SpaceDim
  matrix: Matrix
}

export type VectorState = {
  id: string
  name: string
  dim: SpaceDim
  values: number[]
  color?: string
}

export type MapValidation = {
  valid: boolean
  errors: string[]
}

export type MapSequenceValidation = MapValidation & {
  inputDim?: SpaceDim
  outputDim?: SpaceDim
}

export type PlaybackMode = 'combined' | 'step'

export type ThreeCameraView = 'free' | 'x' | 'y' | 'z'

export type MapKind = '2-2' | '3-3' | '3-2' | '2-3'

export type ThemeSurfaceMode = 'dark' | 'light'

export type ColorPreset = 'neutral' | 'high-contrast'

export type ThemeSettings = {
  surfaceMode: ThemeSurfaceMode
  colorPreset: ColorPreset
  colors: {
    grid: string
    transformedGrid: string
    axis: string
    vectorI: string
    vectorJ: string
    vectorK: string
    inputVector: string
    unitShape: string
  }
}

export type ViewOptions = {
  showGrid: boolean
  showBasis: boolean
  showUnitShape: boolean
  showVectors: boolean
  showTrails: boolean
}

export type ViewPan = {
  x: number
  y: number
}

export type AnimationState = {
  playing: boolean
  progress: number
  speed: number
  mode: PlaybackMode
  stepIndex: number
}
