import type { LinearMap } from './types.ts'

const c = Math.SQRT1_2
const s = Math.SQRT1_2

export const presets3d: LinearMap[] = [
  {
    id: 'preset-3d-identity',
    name: 'Identity',
    inputDim: 3,
    outputDim: 3,
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  },
  {
    id: 'preset-3d-scale',
    name: 'Scale',
    inputDim: 3,
    outputDim: 3,
    matrix: [
      [1.4, 0, 0],
      [0, 0.8, 0],
      [0, 0, 1.2],
    ],
  },
  {
    id: 'preset-3d-rotate-x',
    name: 'Rotate around x axis',
    inputDim: 3,
    outputDim: 3,
    matrix: [
      [1, 0, 0],
      [0, c, -s],
      [0, s, c],
    ],
  },
  {
    id: 'preset-3d-rotate-y',
    name: 'Rotate around y axis',
    inputDim: 3,
    outputDim: 3,
    matrix: [
      [c, 0, s],
      [0, 1, 0],
      [-s, 0, c],
    ],
  },
  {
    id: 'preset-3d-rotate-z',
    name: 'Rotate around z axis',
    inputDim: 3,
    outputDim: 3,
    matrix: [
      [c, -s, 0],
      [s, c, 0],
      [0, 0, 1],
    ],
  },
  {
    id: 'preset-3d-shear',
    name: 'Shear',
    inputDim: 3,
    outputDim: 3,
    matrix: [
      [1, 0.5, 0],
      [0, 1, 0.25],
      [0, 0, 1],
    ],
  },
  {
    id: 'preset-3d-reflection',
    name: 'Reflection',
    inputDim: 3,
    outputDim: 3,
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, -1],
    ],
  },
  {
    id: 'preset-3d-projection-xy',
    name: 'Projection to xy plane',
    inputDim: 3,
    outputDim: 3,
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
  {
    id: 'preset-3d-singular',
    name: 'Singular matrix',
    inputDim: 3,
    outputDim: 3,
    matrix: [
      [1, 2, 3],
      [2, 4, 6],
      [0, 1, 0],
    ],
  },
  {
    id: 'preset-3d-flip',
    name: 'Orientation flip',
    inputDim: 3,
    outputDim: 3,
    matrix: [
      [0, 1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ],
  },
]

export const presetsR3ToR2: LinearMap[] = [
  {
    id: 'preset-3-2-drop-z',
    name: 'Drop z',
    inputDim: 3,
    outputDim: 2,
    matrix: [
      [1, 0, 0],
      [0, 1, 0],
    ],
  },
  {
    id: 'preset-3-2-drop-y',
    name: 'Drop y',
    inputDim: 3,
    outputDim: 2,
    matrix: [
      [1, 0, 0],
      [0, 0, 1],
    ],
  },
  {
    id: 'preset-3-2-oblique',
    name: 'Oblique projection',
    inputDim: 3,
    outputDim: 2,
    matrix: [
      [1, 0, 0.5],
      [0, 1, 0.5],
    ],
  },
  {
    id: 'preset-3-2-rank-1',
    name: 'Rank 1 collapse',
    inputDim: 3,
    outputDim: 2,
    matrix: [
      [1, 1, 1],
      [0, 0, 0],
    ],
  },
  {
    id: 'preset-3-2-zero',
    name: 'Zero map',
    inputDim: 3,
    outputDim: 2,
    matrix: [
      [0, 0, 0],
      [0, 0, 0],
    ],
  },
]

export const presetsR2ToR3: LinearMap[] = [
  {
    id: 'preset-2-3-xy',
    name: 'Embed into xy plane',
    inputDim: 2,
    outputDim: 3,
    matrix: [
      [1, 0],
      [0, 1],
      [0, 0],
    ],
  },
  {
    id: 'preset-2-3-tilted',
    name: 'Embed into tilted plane',
    inputDim: 2,
    outputDim: 3,
    matrix: [
      [1, 0],
      [0, 1],
      [0.5, 0.5],
    ],
  },
]
