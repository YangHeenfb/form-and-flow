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
  description: 'Local change and accumulation, seen through moving geometric approximations.',
  category: 'calculus',
  status: 'ready',
  routeBase: base,
  order: 2,
  previewKind: 'calculus',
  loadComponent: loadCalculusModule,
  explorers: [
    explorer('derivative', 'Derivative', 'A secant line resolving into a local linear model.', 'As h approaches zero, the average slope settles toward the derivative at the chosen point.', 'Changing x₀ moves the local model; changing h controls how local the comparison is.'),
    explorer('integral', 'Integral / Area Approximation', 'Signed area assembled from increasingly fine pieces.', 'The area estimate stabilizes as the partition becomes finer.', 'Changing n refines the partition; the sampling rule changes how each piece represents the curve.'),
    explorer('fundamental-theorem', 'Fundamental Theorem Connector', 'Accumulated area and instantaneous height in the same moving picture.', 'The height f(x) is the slope of the accumulated-area curve A(x).', 'Moving x changes both the new strip of area above and the tangent direction below.'),
    explorer('taylor', 'Taylor Polynomial', 'A polynomial built from local information at one center.', 'Each added degree matches one more derivative at the center.', 'Changing the center relocates the match; changing degree changes how much local shape is retained.'),
  ],
}

function explorer(id: string, title: string, description: string, observation: string, whatChanges: string) {
  return {
    id,
    title,
    description,
    route: `${base}/${id}`,
    status: 'ready' as const,
    observation,
    whatChanges,
    loadComponent: explorerLoaders[id],
  }
}
