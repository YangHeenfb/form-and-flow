import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/optimization'

export const optimizationManifest: ModuleDefinition = {
  id: 'optimization',
  title: 'Optimization / Gradient Descent Lab',
  shortTitle: 'Optimization',
  description: 'Visualize optimization and gradient-based methods.',
  category: 'optimization',
  status: 'planned',
  routeBase: base,
  order: 8,
  previewKind: 'optimization',
  lessons: [
    lesson('one-dimensional-descent', '1D Gradient Descent'),
    lesson('contour-descent', 'Loss Landscape & Contours'),
    lesson('learning-rate', 'Learning Rate Explorer'),
    lesson('momentum', 'Momentum Explorer'),
    lesson('linear-regression', 'Linear Regression Training'),
    lesson('stochastic-gradient-descent', 'Stochastic / Mini-batch Gradient Descent'),
  ],
}

function lesson(id: string, title: string) {
  return {
    id,
    title,
    description: 'Move through loss landscapes and compare optimizer behavior.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    difficulty: 'intermediate' as const,
    estimatedMinutes: 14,
    learningGoals: ['Interpret gradients', 'Compare learning rates and optimizer paths'],
  }
}
