import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/probability'

export const probabilityManifest: ModuleDefinition = {
  id: 'probability',
  title: 'Probability Intuition Lab',
  shortTitle: 'Probability',
  description: 'Build intuition through simulations, distributions, Bayes, and expectation.',
  category: 'probability',
  status: 'planned',
  routeBase: base,
  order: 5,
  previewKind: 'probability',
  lessons: [
    lesson('randomness', 'Randomness & Long-Run Frequency'),
    lesson('distributions', 'Distribution Builder'),
    lesson('conditional-probability', 'Conditional Probability'),
    lesson('bayes', 'Bayes Explorer'),
    lesson('expectation', 'Expected Value'),
  ],
}

function lesson(id: string, title: string) {
  return {
    id,
    title,
    description: 'Use interaction and simulation to connect probability rules to visible outcomes.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    difficulty: 'beginner' as const,
    estimatedMinutes: 12,
    learningGoals: ['Connect randomness to distributions', 'Read probability from repeated trials'],
  }
}
