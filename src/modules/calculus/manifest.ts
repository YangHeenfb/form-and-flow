import type { ModuleComponentLoader, ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/calculus'
const explorerLoaders: Record<string, ModuleComponentLoader> = {
  derivative: () => import('./entries/derivative.tsx'),
  integral: () => import('./entries/integral.tsx'),
  'fundamental-theorem': () => import('./entries/fundamental-theorem.tsx'),
  taylor: () => import('./entries/taylor.tsx'),
}
const loadCalculusModule = explorerLoaders.derivative

export const calculusManifest: ModuleDefinition = {
  id: 'calculus',
  title: 'Calculus',
  shortTitle: 'Calculus',
  description: 'Work with derivatives, integrals, the fundamental theorem, and Taylor approximation.',
  category: 'calculus',
  status: 'ready',
  routeBase: base,
  order: 2,
  previewKind: 'calculus',
  loadComponent: loadCalculusModule,
  explorers: [
    explorer('derivative', 'Derivative', 'Watch secant lines become tangent lines.'),
    explorer('integral', 'Integral / Riemann Sums', 'Approximate signed area with rectangles and trapezoids.'),
    explorer('fundamental-theorem', 'Fundamental Theorem Connector', 'Connect accumulated area with instantaneous height.'),
    explorer('taylor', 'Taylor Polynomial', 'Build local polynomial approximations around a center.'),
  ],
}

function explorer(id: string, title: string, description: string) {
  return {
    id,
    title,
    description,
    route: `${base}/${id}`,
    status: 'ready' as const,
    thingsToTry: ['Connect formulas to motion and shape', 'Use sliders to compare numerical approximations'],
    loadComponent: explorerLoaders[id],
  }
}
