import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/matrix'
const loadMatrixHome = () => import('./MatrixHome.tsx').then(({ MatrixHome }) => ({ default: MatrixHome }))
const loadMatrixLesson = () => import('./MatrixModuleAdapter.tsx').then(({ MatrixModuleAdapter }) => ({ default: MatrixModuleAdapter }))

export const matrixManifest: ModuleDefinition = {
  id: 'matrix',
  title: 'Matrix and Linear Transformation',
  shortTitle: 'Matrix',
  description: 'Visualize matrices, vector spaces, basis vectors, and linear transformations.',
  category: 'linear-algebra',
  status: 'ready',
  routeBase: base,
  order: 1,
  previewKind: 'matrix',
  loadComponent: loadMatrixHome,
  lessons: [
    {
      id: 'matrix-transformations',
      title: 'Matrix Transformations',
      description: 'See how matrix sequences move grids, basis vectors, and custom vectors.',
      route: `${base}/transformations`,
      status: 'ready',
      difficulty: 'beginner',
      estimatedMinutes: 12,
      learningGoals: ['Compose matrix transformations', 'Read transformed basis vectors', 'Connect determinant to area or volume scale'],
      loadComponent: loadMatrixLesson,
    },
  ],
}
