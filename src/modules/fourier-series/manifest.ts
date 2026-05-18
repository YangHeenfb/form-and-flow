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
  explorers: [
    explorer('draw', 'Draw a Path'),
    explorer('epicycles', 'Epicycle Animation'),
    explorer('spectrum', 'Coefficient Spectrum'),
    explorer('reconstruction', 'Reconstruction Quality'),
    explorer('intuition', 'Why It Works'),
  ],
}

function explorer(id: string, title: string) {
  return {
    id,
    title,
    description: 'Turn paths into rotating vectors and inspect their coefficients.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    thingsToTry: ['Represent a path as complex samples', 'Connect coefficients to circles'],
  }
}
