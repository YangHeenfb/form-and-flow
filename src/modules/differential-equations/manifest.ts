import type { ModuleComponentLoader, ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/differential-equations'
const explorerLoaders: Record<string, ModuleComponentLoader> = {
  'slope-fields': () => import('./entries/slope-fields.tsx'),
  'numerical-methods': () => import('./entries/numerical-methods.tsx'),
  'phase-portraits': () => import('./entries/phase-portraits.tsx'),
  pendulum: () => import('./entries/pendulum.tsx'),
  population: () => import('./entries/population.tsx'),
  'heat-equation': () => import('./entries/heat-equation.tsx'),
}
const loadDifferentialEquationsModule = explorerLoaders['slope-fields']

export const differentialEquationsManifest: ModuleDefinition = {
  id: 'differential-equations',
  title: 'Differential Equations',
  shortTitle: 'Differential Equations',
  description: 'Local change rules unfolding into trajectories, phase flow, and diffusion.',
  category: 'differential-equations',
  status: 'ready',
  routeBase: base,
  order: 4,
  previewKind: 'differential-equations',
  loadComponent: loadDifferentialEquationsModule,
  explorers: [
    explorer('slope-fields', 'Slope Fields & Initial Value Problems', 'A local slope rule with one numerical trajectory selected by an initial value.', 'The field contains every local direction; the initial condition selects one path through it.', 'Moving the initial point changes the path while leaving the field unchanged.'),
    explorer('numerical-methods', 'Numerical Methods', 'Three step-by-step approximations to the same change rule.', 'Euler, midpoint, and RK4 differ in how much of the local direction they sample before taking a step.', 'Changing the step count reveals where the approximations agree or drift apart.'),
    explorer('phase-portraits', 'Phase Portraits & Vector Fields', 'A two-dimensional state moving through its local vector field.', 'Each arrow is a local velocity; a trajectory threads those velocities into a global path.', 'Changing the initial state selects a different path through the same flow.'),
    explorer('pendulum', 'Pendulum & Oscillators', 'Angle and angular velocity forming one phase-space orbit.', 'The pendulum becomes a first-order flow once position and velocity are treated as one state.', 'Damping contracts the orbit; the initial angle and velocity choose its starting energy.'),
    explorer('population', 'Population Dynamics', 'Predator and prey counts coupled through a feedback loop.', 'Growth in one population changes the direction of motion for the other.', 'Changing a rate reshapes the phase flow and moves its balance point.'),
    explorer('heat-equation', 'Heat Equation / Diffusion', 'A temperature profile smoothing under local curvature.', 'Peaks cool and valleys warm because each point responds to its nearby average.', 'Diffusivity changes the speed of smoothing; the fixed cold ends let heat leave the rod.'),
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
    notes: 'Displayed paths are numerical trajectories generated from the selected method and step size.',
    loadComponent: explorerLoaders[id],
  }
}
