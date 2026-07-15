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
  description: 'Probability read through populations, areas, repeated samples, and distributions.',
  category: 'probability',
  status: 'ready',
  routeBase: base,
  order: 5,
  previewKind: 'probability',
  loadComponent: loadProbabilityModule,
  explorers: [
    explorer('conditional-probability', 'Conditional Probability', 'Two conditional views of the same population grid.', 'Conditioning replaces the original universe with a smaller denominator.', 'Switching P(A | B) and P(B | A) changes which highlighted group counts as the whole.'),
    explorer('bayes', 'Bayes Rule', 'A posterior assembled from the possible sources of the same evidence.', 'Natural frequencies make the numerator and denominator visible as counts.', 'Changing the base rate changes how much of the evidence can plausibly come from the hypothesis.'),
    explorer('medical-test', 'Medical Test Paradox', 'Test accuracy viewed against prevalence and false positives.', 'A positive result mixes true positives with false positives; their ratio gives its meaning.', 'Changing prevalence can change predictive value even when sensitivity and specificity stay fixed.'),
    explorer('binomial', 'Binomial Distribution', 'Success counts across repeated independent trials.', 'Each bar collects all trial sequences with the same number of successes.', 'Changing p shifts the distribution; changing n changes its center and spread.'),
    explorer('continuous-density', 'Continuous Probability Density', 'Probability represented as area under a density curve.', 'Curve height is local concentration; interval area is probability.', 'Changing the interval moves the highlighted probability mass through the density.'),
    explorer('central-limit-theorem', 'Central Limit Theorem', 'Repeated sample means forming their own distribution.', 'Averaging preserves the center while reducing the typical spread.', 'Increasing sample size narrows the mean distribution and often makes its shape more bell-like.'),
    explorer('random-variable-sum', 'Random Variables: X + Y', 'A sum distribution assembled from every independent pair.', 'Cells on the same diagonal contribute to the same output value.', 'Changing either source distribution reweights the pair grid and therefore the output bars.'),
  ],
}

function explorer(id: string, title: string, description: string, observation: string, whatChanges: string) {
  return {
    id,
    title,
    description,
    route: `${base}/${id}`,
    status: 'ready' as const,
    observation,
    whatChanges,
    loadComponent: explorerLoaders[id],
  }
}
