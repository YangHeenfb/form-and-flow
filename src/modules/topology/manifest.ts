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
  explorers: [
    explorer('winding-number', 'Winding Number'),
    explorer('regions', 'Inside / Outside Regions'),
    explorer('homotopy', 'Homotopy Invariance'),
    explorer('image-loops', 'Image Loops & Domain Coloring'),
    explorer('root-counting', 'Root Counting Intuition'),
  ],
}

function explorer(id: string, title: string) {
  return {
    id,
    title,
    description: 'Use loops and target points to see topological invariants.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    thingsToTry: ['Trace loops', 'Connect winding to inside/outside intuition'],
  }
}
