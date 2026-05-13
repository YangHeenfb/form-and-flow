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
  lessons: [
    lesson('discrete', 'Discrete Convolution'),
    lesson('probability', 'Probability Sum'),
    lesson('signal', 'Signal Filtering'),
    lesson('image-kernel', 'Image Kernel'),
    lesson('polynomial', 'Polynomial Multiplication'),
    lesson('continuous', 'Continuous Convolution'),
  ],
}

function lesson(id: string, title: string) {
  return {
    id,
    title,
    description: 'Slide, multiply, and sum to see convolution as a reusable pattern.',
    route: `${base}/${id}`,
    status: 'ready' as const,
    difficulty: 'intermediate' as const,
    estimatedMinutes: 12,
    learningGoals: ['See flip, shift, overlap, multiply, sum', 'Connect convolution across contexts'],
    loadComponent: loadConvolutionModule,
    relatedConcepts: ['fourier-transform', 'convolution-theorem', 'filtering'],
  }
}
