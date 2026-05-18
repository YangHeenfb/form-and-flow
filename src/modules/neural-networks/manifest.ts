import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/neural-networks'

export const neuralNetworksManifest: ModuleDefinition = {
  id: 'neural-networks',
  title: 'Neural Networks',
  shortTitle: 'Neural Networks',
  description: 'Build, train, and understand simple neural networks.',
  category: 'machine-learning',
  status: 'planned',
  routeBase: base,
  order: 9,
  previewKind: 'neural-networks',
  explorers: [
    explorer('perceptron', 'Perceptron Basics'),
    explorer('forward-pass', 'Forward Pass'),
    explorer('training', 'Training'),
  ],
}

function explorer(id: string, title: string) {
  return {
    id,
    title,
    description: 'Use visual models to connect parameters, activations, and training.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    thingsToTry: ['Read network structure', 'Connect training to changing parameters'],
  }
}
