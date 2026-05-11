import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/differential-equations'

export const differentialEquationsManifest: ModuleDefinition = {
  id: 'differential-equations',
  title: 'Differential Equation Playground',
  shortTitle: 'Differential Equations',
  description: 'Interactive ODE solver and system dynamics explorer.',
  category: 'differential-equations',
  status: 'planned',
  routeBase: base,
  order: 4,
  previewKind: 'differential-equations',
  lessons: [
    lesson('slope-fields', 'Slope Fields & Initial Value Problems'),
    lesson('numerical-methods', 'Numerical Methods Lab'),
    lesson('phase-portraits', 'Phase Portraits & Vector Fields'),
    lesson('pendulum', 'Pendulum & Oscillators'),
    lesson('population', 'Population Dynamics'),
    lesson('heat-equation', 'Heat Equation / Diffusion Explorer'),
  ],
}

function lesson(id: string, title: string) {
  return {
    id,
    title,
    description: 'Explore how local rules of change generate global motion.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    difficulty: 'intermediate' as const,
    estimatedMinutes: 14,
    learningGoals: ['Read a change rule', 'Compare numerical motion and visual trajectories'],
  }
}
