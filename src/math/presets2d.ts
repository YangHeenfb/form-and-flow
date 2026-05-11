import type { LinearMap } from './types.ts'

const rootTwoOverTwo = Math.SQRT1_2

export const presets2d: LinearMap[] = [
  {
    id: 'preset-2d-identity',
    name: 'Identity',
    inputDim: 2,
    outputDim: 2,
    matrix: [
      [1, 0],
      [0, 1],
    ],
  },
  {
    id: 'preset-2d-scale',
    name: 'Scale',
    inputDim: 2,
    outputDim: 2,
    matrix: [
      [1.5, 0],
      [0, 0.75],
    ],
  },
  {
    id: 'preset-2d-rotation',
    name: 'Rotation 45 degrees',
    inputDim: 2,
    outputDim: 2,
    matrix: [
      [rootTwoOverTwo, -rootTwoOverTwo],
      [rootTwoOverTwo, rootTwoOverTwo],
    ],
  },
  {
    id: 'preset-2d-shear',
    name: 'Shear',
    inputDim: 2,
    outputDim: 2,
    matrix: [
      [1, 0.8],
      [0, 1],
    ],
  },
  {
    id: 'preset-2d-reflection',
    name: 'Reflection',
    inputDim: 2,
    outputDim: 2,
    matrix: [
      [1, 0],
      [0, -1],
    ],
  },
  {
    id: 'preset-2d-projection',
    name: 'Projection',
    inputDim: 2,
    outputDim: 2,
    matrix: [
      [1, 0],
      [0, 0],
    ],
  },
  {
    id: 'preset-2d-singular',
    name: 'Singular matrix',
    inputDim: 2,
    outputDim: 2,
    matrix: [
      [1, 2],
      [2, 4],
    ],
  },
  {
    id: 'preset-2d-flip',
    name: 'Orientation flip',
    inputDim: 2,
    outputDim: 2,
    matrix: [
      [0, 1],
      [1, 0],
    ],
  },
]
