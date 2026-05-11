import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

export const fourierManifest: ModuleDefinition = {
  id: 'fourier',
  title: 'Fourier Transform Explorer',
  shortTitle: 'Fourier',
  description: 'See how signals transform between time and frequency.',
  category: 'fourier',
  status: 'planned',
  routeBase: '/modules/fourier',
  order: 3,
  previewKind: 'fourier',
  lessons: [
    lesson('winding', 'Winding a Signal', 'Wind a signal around a circle and watch the average point.'),
    lesson('spectrum', 'Frequency Spectrum', 'Scan many frequencies to build a spectrum.'),
    lesson('reconstruction', 'Signal Reconstruction', 'Rebuild a signal from selected coefficients.'),
    lesson('filtering', 'Frequency Filtering', 'Keep or remove frequency bands and compare the signal.'),
  ],
}

function lesson(id: string, title: string, description: string) {
  return {
    id,
    title,
    description,
    route: `/modules/fourier/${id}`,
    status: 'planned' as const,
    difficulty: 'beginner' as const,
    estimatedMinutes: 12,
    learningGoals: ['Understand frequency components', 'Connect visual motion to a numeric spectrum'],
  }
}
