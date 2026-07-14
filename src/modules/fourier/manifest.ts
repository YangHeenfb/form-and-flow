import type { ModuleComponentLoader, ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/fourier'
const explorerLoaders: Record<string, ModuleComponentLoader> = {
  spectrum: () => import('./entries/spectrum.tsx'),
  reconstruction: () => import('./entries/reconstruction.tsx'),
  filtering: () => import('./entries/filtering.tsx'),
}
const loadFourierModule = explorerLoaders.spectrum

export const fourierManifest: ModuleDefinition = {
  id: 'fourier',
  title: 'Fourier Transform',
  shortTitle: 'Fourier',
  description: 'See how signals transform between time and frequency.',
  category: 'fourier',
  status: 'ready',
  routeBase: base,
  order: 3,
  previewKind: 'fourier',
  loadComponent: loadFourierModule,
  explorers: [
    explorer('spectrum', 'Frequency Spectrum', 'Scan many frequencies to build a spectrum.'),
    explorer('reconstruction', 'Signal Reconstruction', 'Rebuild a signal from selected coefficients.'),
    explorer('filtering', 'Frequency Filtering', 'Keep or remove frequency bands and compare the signal.'),
  ],
}

function explorer(id: string, title: string, description: string) {
  return {
    id,
    title,
    description,
    route: `${base}/${id}`,
    status: 'ready' as const,
    thingsToTry: ['Understand frequency components', 'Connect visual motion to a numeric spectrum'],
    loadComponent: explorerLoaders[id],
  }
}
