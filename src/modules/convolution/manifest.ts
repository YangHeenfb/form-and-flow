import type { ModuleDefinition } from '../../platform/moduleTypes.ts'
import { ConvolutionModule } from './ConvolutionModule.tsx'

const base = '/modules/convolution'

export const convolutionManifest: ModuleDefinition = {
  id: 'convolution',
  title: 'Convolution Lab',
  shortTitle: 'Convolution',
  description: 'Understand convolution through sliding, overlapping, probability sums, signals, images, and polynomials.',
  category: 'transforms',
  status: 'ready',
  routeBase: base,
  order: 6,
  previewKind: 'convolution',
  component: ConvolutionModule,
  relatedConcepts: ['fourier-transform', 'convolution-theorem', 'filtering'],
  lessons: [
    lesson('discrete', 'Discrete Convolution Explorer'),
    lesson('probability', 'Probability Sum Explorer'),
    lesson('signal', 'Signal Filtering Lab'),
    lesson('image-kernel', 'Image Kernel Lab'),
    lesson('polynomial', 'Polynomial Multiplication Lab'),
    lesson('continuous', 'Continuous Convolution Explorer'),
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
    component: ConvolutionModule,
    relatedConcepts: ['fourier-transform', 'convolution-theorem', 'filtering'],
  }
}
