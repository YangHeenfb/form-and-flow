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
  description: 'The same signal viewed as a curve, a winding, and a set of rotating components.',
  category: 'fourier',
  status: 'ready',
  routeBase: base,
  order: 3,
  previewKind: 'fourier',
  loadComponent: loadFourierModule,
  explorers: [
    explorer('spectrum', 'Frequency Spectrum', 'A frequency scan built from the average position of wound signals.', 'A matching frequency fails to cancel around the origin, leaving a visible coefficient.', 'Changing the test frequency links the time curve, winding direction, center of mass, and spectrum position.'),
    explorer('reconstruction', 'Signal Reconstruction', 'A signal rebuilt from selected rotating components.', 'The reconstructed curve gains structure as more coefficients are included.', 'Changing the coefficient set alters both the active spectrum bars and the time-domain approximation.'),
    explorer('filtering', 'Frequency Filtering', 'Time-domain changes produced by editing frequency content.', 'A filter reshapes the signal by retaining some coefficients and suppressing others.', 'Changing the cutoff moves a boundary in the spectrum and immediately changes the reconstructed signal.'),
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
    notes: 'Signals are sampled on t in [0,1]; amplitude normalization is an explicit display choice.',
    loadComponent: explorerLoaders[id],
  }
}
