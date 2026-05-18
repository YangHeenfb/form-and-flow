import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/convolution'
const loadConvolutionModule = () => import('./ConvolutionModule.tsx').then(({ ConvolutionModule }) => ({ default: ConvolutionModule }))

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
    loadComponent: loadConvolutionModule,
    relatedConcepts: ['fourier-transform', 'convolution-theorem', 'filtering'],
  }
}
