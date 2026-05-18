import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/optimization'

export const optimizationManifest: ModuleDefinition = {
  id: 'optimization',
  title: 'Optimization / Gradient Descent',
  shortTitle: 'Optimization',
  description: 'Visualize optimization and gradient-based methods.',
  category: 'optimization',
  status: 'planned',
  routeBase: base,
  order: 8,
  previewKind: 'optimization',
  explorers: [
    explorer('one-dimensional-descent', '1D Gradient Descent'),
    explorer('contour-descent', 'Loss Landscape & Contours'),
    explorer('learning-rate', 'Learning Rate'),
    explorer('momentum', 'Momentum'),
    explorer('linear-regression', 'Linear Regression Training'),
    explorer('stochastic-gradient-descent', 'Stochastic / Mini-batch Gradient Descent'),
  ],
}

function explorer(id: string, title: string) {
  return {
    id,
    title,
    description: 'Move through loss landscapes and compare optimizer behavior.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    thingsToTry: ['Interpret gradients', 'Compare learning rates and optimizer paths'],
  }
}
