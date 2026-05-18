import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/complex-plane'

export const complexPlaneManifest: ModuleDefinition = {
  id: 'complex-plane',
  title: 'Complex Plane',
  shortTitle: 'Complex Plane',
  description: 'Visualize complex numbers, maps, conformal transformations, and image loops.',
  category: 'complex-numbers',
  status: 'planned',
  routeBase: base,
  order: 7,
  previewKind: 'complex-plane',
  explorers: [
    explorer('basics', 'Complex Numbers as Points'),
    explorer('multiplication', 'Multiplication as Rotation and Scaling'),
    explorer('maps', 'Complex Function Maps'),
    explorer('image-loops', 'Image Loops'),
  ],
}

function explorer(id: string, title: string) {
  return {
    id,
    title,
    description: 'Watch complex arithmetic act on points, curves, and regions.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    thingsToTry: ['Read complex numbers geometrically', 'Connect formulas to plane motion'],
  }
}
