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
  lessons: [
    lesson('basics', 'Complex Numbers as Points'),
    lesson('multiplication', 'Multiplication as Rotation and Scaling'),
    lesson('maps', 'Complex Function Maps'),
    lesson('image-loops', 'Image Loops'),
  ],
}

function lesson(id: string, title: string) {
  return {
    id,
    title,
    description: 'Watch complex arithmetic act on points, curves, and regions.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    difficulty: 'beginner' as const,
    estimatedMinutes: 12,
    learningGoals: ['Read complex numbers geometrically', 'Connect formulas to plane motion'],
  }
}
