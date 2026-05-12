import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/vector-field'

export const vectorFieldManifest: ModuleDefinition = {
  id: 'vector-field',
  title: 'Vector Fields',
  shortTitle: 'Vector Fields',
  description: 'Visualize vector fields, flow, divergence, curl, flux, and circulation.',
  category: 'vector-calculus',
  status: 'planned',
  routeBase: base,
  order: 10,
  previewKind: 'vector-field',
  lessons: [
    lesson('basics', 'Vector Field Basics'),
    lesson('flow', 'Flow & Streamlines'),
    lesson('divergence', 'Divergence'),
    lesson('curl', 'Curl'),
    lesson('flux-circulation', 'Flux & Circulation'),
    lesson('gradient-fields', 'Gradient Fields'),
  ],
}

function lesson(id: string, title: string) {
  return {
    id,
    title,
    description: 'Follow arrows, particles, and local probes in a 2D vector field.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    difficulty: 'intermediate' as const,
    estimatedMinutes: 14,
    learningGoals: ['Understand vectors at each point', 'Connect local arrows to global flow'],
  }
}
