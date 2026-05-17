export type Complex = {
  re: number
  im: number
}

export type SignalDomain = {
  tMin: number
  tMax: number
}

export type SignalSourceType = 'preset' | 'expression' | 'drawn' | 'samples' | 'audio'

export type SignalSource = {
  id: string
  type: SignalSourceType
  label: string
  expression?: string
  samples?: number[]
  sampleRate?: number
  domain: SignalDomain
  periodic: boolean
  normalizeAmplitude: boolean
}

export type FourierCoefficient = {
  frequency: number
  value: Complex
  magnitude: number
  phase: number
}

export type Spectrum = {
  coefficients: FourierCoefficient[]
  frequencyMin: number
  frequencyMax: number
  frequencyStep: number
  sampleCount: number
}

export type WindingPoint = {
  t: number
  sample: number
  point: Complex
}

export type ReconstructionMode = 'paired-frequency-blocks' | 'first-harmonics' | 'top-magnitudes'

export type FilterType = 'low-pass' | 'high-pass' | 'band-pass' | 'band-stop' | 'magnitude-threshold'

export type FilterConfig = {
  type: FilterType
  cutoff: number
  lowCutoff: number
  highCutoff: number
  threshold: number
}

export type FourierLessonState = {
  signalSource: SignalSource
  selectedFrequency: number
  sampleCount: number
  isPlaying: boolean
  playbackSpeed: number
  showOriginalSignal: boolean
  showWindingPath: boolean
  showWindingVectors: boolean
  showCenterOfMass: boolean
  showSpectrum: boolean
  showPhase: boolean
  showReconstruction: boolean
  showLabels: boolean
}
