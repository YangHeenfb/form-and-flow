import type { ModuleDefinition } from '../../platform/moduleTypes.ts'
import { CalculusModule } from './CalculusModule.tsx'

const base = '/modules/calculus'

export const calculusManifest: ModuleDefinition = {
  id: 'calculus',
  title: 'Calculus Discovery Lab',
  shortTitle: 'Calculus',
  description: 'Explore derivatives, integrals, the fundamental theorem, and Taylor approximation.',
  category: 'calculus',
  status: 'ready',
  routeBase: base,
  order: 2,
  previewKind: 'calculus',
  component: CalculusModule,
  lessons: [
    lesson('derivative', 'Derivative Explorer', 'Watch secant lines become tangent lines.'),
    lesson('integral', 'Integral / Riemann Sum Explorer', 'Approximate signed area with rectangles and trapezoids.'),
    lesson('fundamental-theorem', 'Fundamental Theorem Connector', 'Connect accumulated area with instantaneous height.'),
    lesson('taylor', 'Taylor Polynomial Explorer', 'Build local polynomial approximations around a center.'),
  ],
}

function lesson(id: string, title: string, description: string) {
  return {
    id,
    title,
    description,
    route: `${base}/${id}`,
    status: 'ready' as const,
    difficulty: 'beginner' as const,
    estimatedMinutes: 12,
    learningGoals: ['Connect formulas to motion and shape', 'Use sliders to compare numerical approximations'],
    component: CalculusModule,
  }
}
