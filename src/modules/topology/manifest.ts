import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/topology'

export const topologyManifest: ModuleDefinition = {
  id: 'topology',
  title: 'Topology / Winding Number',
  shortTitle: 'Topology',
  description: 'Visualize topology and winding numbers.',
  category: 'topology',
  status: 'planned',
  routeBase: base,
  order: 13,
  previewKind: 'topology',
  lessons: [
    lesson('winding-number', 'Winding Number'),
    lesson('regions', 'Inside / Outside Regions'),
    lesson('homotopy', 'Homotopy Invariance'),
    lesson('image-loops', 'Image Loops & Domain Coloring'),
    lesson('root-counting', 'Root Counting Intuition'),
  ],
}

function lesson(id: string, title: string) {
  return {
    id,
    title,
    description: 'Use loops and target points to see topological invariants.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    difficulty: 'intermediate' as const,
    estimatedMinutes: 14,
    learningGoals: ['Trace loops', 'Connect winding to inside/outside intuition'],
  }
}
