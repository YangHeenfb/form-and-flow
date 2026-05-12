import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/fourier-series'

export const fourierSeriesManifest: ModuleDefinition = {
  id: 'fourier-series',
  title: 'Fourier Series / Epicycle',
  shortTitle: 'Fourier Series',
  description: 'Draw periodic functions using epicycles and Fourier series.',
  category: 'fourier',
  status: 'planned',
  routeBase: base,
  order: 11,
  previewKind: 'fourier-series',
  lessons: [
    lesson('draw', 'Draw a Path'),
    lesson('epicycles', 'Epicycle Animation'),
    lesson('spectrum', 'Coefficient Spectrum'),
    lesson('reconstruction', 'Reconstruction Quality'),
    lesson('intuition', 'Why It Works'),
  ],
}

function lesson(id: string, title: string) {
  return {
    id,
    title,
    description: 'Turn paths into rotating vectors and inspect their coefficients.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    difficulty: 'intermediate' as const,
    estimatedMinutes: 15,
    learningGoals: ['Represent a path as complex samples', 'Connect coefficients to circles'],
  }
}
