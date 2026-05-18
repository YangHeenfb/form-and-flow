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
  explorers: [
    explorer('basics', 'Vector Field Basics'),
    explorer('flow', 'Flow & Streamlines'),
    explorer('divergence', 'Divergence'),
    explorer('curl', 'Curl'),
    explorer('flux-circulation', 'Flux & Circulation'),
    explorer('gradient-fields', 'Gradient Fields'),
  ],
}

function explorer(id: string, title: string) {
  return {
    id,
    title,
    description: 'Follow arrows, particles, and local probes in a 2D vector field.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    thingsToTry: ['Understand vectors at each point', 'Connect local arrows to global flow'],
  }
}
