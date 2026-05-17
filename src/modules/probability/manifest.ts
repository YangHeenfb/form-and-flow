import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/probability'
const loadProbabilityModule = () => import('./ProbabilityModule.tsx').then(({ ProbabilityModule }) => ({ default: ProbabilityModule }))

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
  loadComponent: loadProbabilityModule,
  lessons: [
    lesson('conditional-probability', 'Conditional Probability', 'Compare P(A | B) with P(B | A) inside a population grid.', ['Identify the population currently being observed', 'Compare P(A | B) with P(B | A) without swapping the denominator']),
    lesson('bayes', 'Bayes Rule', 'Update a hypothesis after evidence using natural frequencies.', ['Use counts to see where evidence comes from', 'Watch how the base rate changes the posterior']),
    lesson('medical-test', 'Medical Test Paradox', 'See why base rates and false positives change what a test result means.', ['Separate test accuracy from result meaning', 'See how false positives reshape a positive result']),
    lesson('binomial', 'Binomial Distribution', 'Build the distribution of successes across repeated independent trials.', ['Read a distribution of success counts', 'Watch n and p move and spread the bars']),
    lesson('continuous-density', 'Continuous Probability Density', 'Read continuous probability as area under a density curve.', ['Read probability as area under the curve', 'Separate density height from probability']),
    lesson('central-limit-theorem', 'Central Limit Theorem', 'Watch sample means become narrower and more bell-shaped.', ['Separate source data from the distribution of sample means', 'Watch n shrink the variability of averages']),
    lesson('random-variable-sum', 'Random Variables: X + Y', 'Combine two discrete distributions by summing all independent pairs.', ['Use a pair grid to understand X + Y', 'See how equal sums collect into one output bar']),
  ],
}

function lesson(id: string, title: string, description: string, learningGoals: string[]) {
  return {
    id,
    title,
    description,
    route: `${base}/${id}`,
    status: 'ready' as const,
    difficulty: 'beginner' as const,
    estimatedMinutes: 12,
    learningGoals,
    loadComponent: loadProbabilityModule,
  }
}
