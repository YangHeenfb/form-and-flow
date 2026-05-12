export type ConvolutionMode = 'full' | 'same' | 'valid'

export type OperationMode = 'convolution' | 'correlation'

export type BoundaryMode = 'zero' | 'clamp' | 'wrap'

export type NumericSample = {
  x: number
  y: number
}

export type TermContribution = {
  aIndex: number
  bIndex: number
  aValue: number
  bValue: number
  product: number
}
