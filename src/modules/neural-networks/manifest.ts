import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/neural-networks'

export const neuralNetworksManifest: ModuleDefinition = {
  id: 'neural-networks',
  title: 'Neural Network Playground',
  shortTitle: 'Neural Networks',
  description: 'Build, train, and understand simple neural networks.',
  category: 'machine-learning',
  status: 'planned',
  routeBase: base,
  order: 9,
  previewKind: 'neural-networks',
  lessons: [
    lesson('perceptron', 'Perceptron Basics'),
    lesson('forward-pass', 'Forward Pass'),
    lesson('training', 'Training Playground'),
  ],
}

function lesson(id: string, title: string) {
  return {
    id,
    title,
    description: 'Use visual models to connect parameters, activations, and training.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    difficulty: 'intermediate' as const,
    estimatedMinutes: 15,
    learningGoals: ['Read network structure', 'Connect training to changing parameters'],
  }
}
