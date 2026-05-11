import type { ModuleDefinition } from '../../platform/moduleTypes.ts'
import { MatrixHome } from './MatrixHome.tsx'
import { MatrixModuleAdapter } from './MatrixModuleAdapter.tsx'

const base = '/modules/matrix'

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
  component: MatrixHome,
  lessons: [
    {
      id: 'matrix-transformations',
      title: 'Matrix Transformations',
      description: 'Explore how matrix sequences move grids, basis vectors, and custom vectors.',
      route: `${base}/transformations`,
      status: 'ready',
      difficulty: 'beginner',
      estimatedMinutes: 12,
      learningGoals: ['Compose matrix transformations', 'Read transformed basis vectors', 'Connect determinant to area or volume scale'],
      component: MatrixModuleAdapter,
    },
  ],
}
