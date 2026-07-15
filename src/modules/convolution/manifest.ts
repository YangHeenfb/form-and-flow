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
  description: 'One sliding multiply-and-sum pattern appearing in sequences, probability, signals, images, and polynomials.',
  category: 'transforms',
  status: 'ready',
  routeBase: base,
  order: 6,
  previewKind: 'convolution',
  loadComponent: loadConvolutionModule,
  relatedConcepts: ['fourier-transform', 'convolution-theorem', 'filtering'],
  explorers: [
    explorer('discrete', 'Discrete Convolution', 'Flipping and shifting b exposes the products that form one output y[k].', 'Changing k moves the overlap window and selects a new sum.'),
    explorer('probability', 'Probability Sum', 'Independent pairs with the same total accumulate into one probability.', 'Changing the selected sum moves along a diagonal of the pair grid.'),
    explorer('signal', 'Signal Filtering', 'A short kernel turns nearby samples into one weighted output.', 'Changing the kernel changes which local features are preserved or suppressed.'),
    explorer('image-kernel', 'Image Kernel', 'The same local weighted sum applied to a two-dimensional pixel neighborhood.', 'Changing the kernel changes how each neighborhood is mapped into the output image.'),
    explorer('polynomial', 'Polynomial Multiplication', 'Terms with equal total degree collect into the same coefficient.', 'Changing k selects one diagonal of coefficient products.'),
    explorer('continuous', 'Continuous Convolution', 'The discrete overlap sum becomes an area under a product of two curves.', 'Changing t shifts one curve and changes the overlap integral.'),
  ],
}

function explorer(id: string, title: string, observation: string, whatChanges: string) {
  return {
    id,
    title,
    description: 'The flip, shift, overlap, multiply, and sum pattern in one setting.',
    route: `${base}/${id}`,
    status: 'ready' as const,
    observation,
    whatChanges,
    loadComponent: explorerLoaders[id],
    relatedConcepts: ['fourier-transform', 'convolution-theorem', 'filtering'],
  }
}
