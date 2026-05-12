import type { ModuleDefinition } from '../../platform/moduleTypes.ts'
import { DifferentialEquationsModule } from './DifferentialEquationsModule.tsx'

const base = '/modules/differential-equations'

export const differentialEquationsManifest: ModuleDefinition = {
  id: 'differential-equations',
  title: 'Differential Equations',
  shortTitle: 'Differential Equations',
  description: 'Interactive ODE solver and system dynamics explorer.',
  category: 'differential-equations',
  status: 'ready',
  routeBase: base,
  order: 4,
  previewKind: 'differential-equations',
  component: DifferentialEquationsModule,
  lessons: [
    lesson('slope-fields', 'Slope Fields & Initial Value Problems', 'Read local slopes and launch a solution from an initial condition.'),
    lesson('numerical-methods', 'Numerical Methods', 'Compare Euler, midpoint, and RK4 on the same ODE.'),
    lesson('phase-portraits', 'Phase Portraits & Vector Fields', 'Follow trajectories through two-dimensional systems.'),
    lesson('pendulum', 'Pendulum & Oscillators', 'Turn a second-order oscillator into a phase-space system.'),
    lesson('population', 'Population Dynamics', 'Explore coupled feedback in predator-prey motion.'),
    lesson('heat-equation', 'Heat Equation / Diffusion', 'Watch an initial temperature profile diffuse over time.'),
  ],
}

function lesson(id: string, title: string, description: string) {
  return {
    id,
    title,
    description,
    route: `${base}/${id}`,
    status: 'ready' as const,
    difficulty: 'intermediate' as const,
    estimatedMinutes: 14,
    learningGoals: ['Read a change rule', 'Compare numerical motion and visual trajectories'],
    component: DifferentialEquationsModule,
  }
}
