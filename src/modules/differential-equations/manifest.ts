import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/differential-equations'
const loadDifferentialEquationsModule = () =>
  import('./DifferentialEquationsModule.tsx').then(({ DifferentialEquationsModule }) => ({ default: DifferentialEquationsModule }))

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
  loadComponent: loadDifferentialEquationsModule,
  explorers: [
    explorer('slope-fields', 'Slope Fields & Initial Value Problems', 'Read local slopes and launch a solution from an initial condition.'),
    explorer('numerical-methods', 'Numerical Methods', 'Compare Euler, midpoint, and RK4 on the same ODE.'),
    explorer('phase-portraits', 'Phase Portraits & Vector Fields', 'Follow trajectories through two-dimensional systems.'),
    explorer('pendulum', 'Pendulum & Oscillators', 'Turn a second-order oscillator into a phase-space system.'),
    explorer('population', 'Population Dynamics', 'Explore coupled feedback in predator-prey motion.'),
    explorer('heat-equation', 'Heat Equation / Diffusion', 'Watch an initial temperature profile diffuse over time.'),
  ],
}

function explorer(id: string, title: string, description: string) {
  return {
    id,
    title,
    description,
    route: `${base}/${id}`,
    status: 'ready' as const,
    thingsToTry: ['Read a change rule', 'Compare numerical motion and visual trajectories'],
    loadComponent: loadDifferentialEquationsModule,
  }
}
