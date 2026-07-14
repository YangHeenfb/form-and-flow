import type { ModuleComponentLoader, ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/probability'
const explorerLoaders: Record<string, ModuleComponentLoader> = {
  'conditional-probability': () => import('./entries/conditional-probability.tsx'),
  bayes: () => import('./entries/bayes.tsx'),
  'medical-test': () => import('./entries/medical-test.tsx'),
  binomial: () => import('./entries/binomial.tsx'),
  'continuous-density': () => import('./entries/continuous-density.tsx'),
  'central-limit-theorem': () => import('./entries/central-limit-theorem.tsx'),
  'random-variable-sum': () => import('./entries/random-variable-sum.tsx'),
}
const loadProbabilityModule = explorerLoaders['conditional-probability']

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
  explorers: [
    explorer('conditional-probability', 'Conditional Probability', 'Compare P(A | B) with P(B | A) inside a population grid.', ['Identify the population currently being observed', 'Compare P(A | B) with P(B | A) without swapping the denominator']),
    explorer('bayes', 'Bayes Rule', 'Update a hypothesis after evidence using natural frequencies.', ['Use counts to see where evidence comes from', 'Watch how the base rate changes the posterior']),
    explorer('medical-test', 'Medical Test Paradox', 'See why base rates and false positives change what a test result means.', ['Separate test accuracy from result meaning', 'See how false positives reshape a positive result']),
    explorer('binomial', 'Binomial Distribution', 'Build the distribution of successes across repeated independent trials.', ['Read a distribution of success counts', 'Watch n and p move and spread the bars']),
    explorer('continuous-density', 'Continuous Probability Density', 'Read continuous probability as area under a density curve.', ['Read probability as area under the curve', 'Separate density height from probability']),
    explorer('central-limit-theorem', 'Central Limit Theorem', 'Watch sample means become narrower and more bell-shaped.', ['Separate source data from the distribution of sample means', 'Watch n shrink the variability of averages']),
    explorer('random-variable-sum', 'Random Variables: X + Y', 'Combine two discrete distributions by summing all independent pairs.', ['Use a pair grid to understand X + Y', 'See how equal sums collect into one output bar']),
  ],
}

function explorer(id: string, title: string, description: string, thingsToTry: string[]) {
  return {
    id,
    title,
    description,
    route: `${base}/${id}`,
    status: 'ready' as const,
    thingsToTry,
    loadComponent: explorerLoaders[id],
  }
}
