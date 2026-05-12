import type { ModuleDefinition } from '../../platform/moduleTypes.ts'
import { ProbabilityModule } from './ProbabilityModule.tsx'

const base = '/modules/probability'

export const probabilityManifest: ModuleDefinition = {
  id: 'probability',
  title: 'Probability Intuition',
  shortTitle: 'Probability',
  description: 'Turn probability formulas into visible populations, areas, samples, and distributions.',
  category: 'probability',
  status: 'ready',
  routeBase: base,
  order: 5,
  previewKind: 'probability',
  component: ProbabilityModule,
  lessons: [
    lesson('conditional-probability', 'Conditional Probability', 'Compare P(A | B) with P(B | A) inside a population grid.'),
    lesson('bayes', 'Bayes Rule', 'Update a hypothesis after evidence using natural frequencies.'),
    lesson('medical-test', 'Medical Test Paradox', 'See why base rates and false positives change what a test result means.'),
    lesson('binomial', 'Binomial Distribution', 'Build the distribution of successes across repeated independent trials.'),
    lesson('continuous-density', 'Continuous Probability Density', 'Read continuous probability as area under a density curve.'),
    lesson('central-limit-theorem', 'Central Limit Theorem', 'Watch sample means become narrower and more bell-shaped.'),
    lesson('random-variable-sum', 'Random Variables: X + Y', 'Combine two discrete distributions by summing all independent pairs.'),
  ],
}

function lesson(id: string, title: string, description: string) {
  return {
    id,
    title,
    description,
    route: `${base}/${id}`,
    status: 'ready' as const,
    difficulty: 'beginner' as const,
    estimatedMinutes: 12,
    learningGoals: ['Connect probability formulas to visible quantities', 'Use sliders and simulation to test intuition'],
    component: ProbabilityModule,
  }
}
