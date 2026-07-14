import type { ModuleComponentLoader, ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/convolution'
const explorerLoaders: Record<string, ModuleComponentLoader> = {
  discrete: () => import('./entries/discrete.tsx'),
  probability: () => import('./entries/probability.tsx'),
  signal: () => import('./entries/signal.tsx'),
  'image-kernel': () => import('./entries/image-kernel.tsx'),
  polynomial: () => import('./entries/polynomial.tsx'),
  continuous: () => import('./entries/continuous.tsx'),
}
const loadConvolutionModule = explorerLoaders.discrete

export const convolutionManifest: ModuleDefinition = {
  id: 'convolution',
  title: 'Convolution',
  shortTitle: 'Convolution',
  description: 'Understand convolution through sliding, overlapping, probability sums, signals, images, and polynomials.',
  category: 'transforms',
  status: 'ready',
  routeBase: base,
  order: 6,
  previewKind: 'convolution',
  loadComponent: loadConvolutionModule,
  relatedConcepts: ['fourier-transform', 'convolution-theorem', 'filtering'],
  explorers: [
    explorer('discrete', 'Discrete Convolution'),
    explorer('probability', 'Probability Sum'),
    explorer('signal', 'Signal Filtering'),
    explorer('image-kernel', 'Image Kernel'),
    explorer('polynomial', 'Polynomial Multiplication'),
    explorer('continuous', 'Continuous Convolution'),
  ],
}

function explorer(id: string, title: string) {
  return {
    id,
    title,
    description: 'Slide, multiply, and sum to see convolution as a reusable pattern.',
    route: `${base}/${id}`,
    status: 'ready' as const,
    thingsToTry: ['See flip, shift, overlap, multiply, sum', 'Connect convolution across contexts'],
    loadComponent: explorerLoaders[id],
    relatedConcepts: ['fourier-transform', 'convolution-theorem', 'filtering'],
  }
}
