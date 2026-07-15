import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/matrix'
const loadMatrixModule = () => import('./MatrixModuleAdapter.tsx').then(({ MatrixModuleAdapter }) => ({ default: MatrixModuleAdapter }))

export const matrixManifest: ModuleDefinition = {
  id: 'matrix',
  title: 'Matrix and Linear Transformation',
  shortTitle: 'Matrix',
  description: 'A geometric view of matrices through bases, grids, vectors, and linear maps.',
  category: 'linear-algebra',
  status: 'ready',
  routeBase: base,
  order: 1,
  previewKind: 'matrix',
  loadComponent: loadMatrixModule,
  explorers: [
    {
      id: 'matrix-transformations',
      title: 'Matrix Transformations',
      description: 'A matrix sequence acting on the same basis, grid, and chosen vectors.',
      route: `${base}/transformations`,
      status: 'ready',
      observation: 'The matrix columns are the destinations of the basis vectors; linearity carries the rest of the space with them.',
      whatChanges: 'Changing one column moves one basis direction and every vector component built from it.',
      notes: 'Between steps, the animation uses an entrywise interpolation of the displayed matrices.',
      connections: ['Linear maps reappear in convolution, Fourier analysis, and differential systems.'],
      loadComponent: loadMatrixModule,
    },
  ],
}
