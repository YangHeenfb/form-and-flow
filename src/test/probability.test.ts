import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { bayesPosterior, contingencyFromIntersection, likelihoodRatio, oddsFromProbability } from '../modules/probability/math/bayes.ts'
import { binomialDistribution, binomialMean, binomialPMF, binomialVariance, combination } from '../modules/probability/math/binomial.ts'
import { empiricalMean, getSourceDistribution, sampleMeans, theoreticalStandardError } from '../modules/probability/math/clt.ts'
import { exponentialDistribution, histogram, intervalProbability, normalDistribution, sampleContinuousDistribution, uniformDistribution } from '../modules/probability/math/continuous.ts'
import { convolveDiscrete, distributionById, sumDistributionStats } from '../modules/probability/math/convolution.ts'
import { medicalTestMetrics } from '../modules/probability/math/medical.ts'
import { normalizeDistribution, sumProbabilities } from '../modules/probability/math/probability.ts'
import { decodeBayesUrlState, decodeBinomialUrlState, decodeCltUrlState } from '../modules/probability/shared/useProbabilityUrlState.ts'
import { probabilityManifest } from '../modules/probability/manifest.ts'
import { ProbabilityModule } from '../modules/probability/ProbabilityModule.tsx'
import { moduleRegistry } from '../platform/moduleRegistry.ts'
import { resolveRoute } from '../platform/routes.ts'

describe('probability math helpers', () => {
  it('computes conditional probabilities safely', () => {
    const result = contingencyFromIntersection(0.3, 0.4, 0.12)
    expect(result.aGivenB).toBeCloseTo(0.3)
    expect(result.bGivenA).toBeCloseTo(0.4)
    expect(contingencyFromIntersection(0.3, 0, 0).aGivenB).toBeNull()
    expect(contingencyFromIntersection(0.2, 0.2, 0.8).intersection).toBeCloseTo(0.2)
  })

  it('computes Bayes posterior and odds', () => {
    const result = bayesPosterior(0.01, 0.9, 0.09)
    expect(result.posterior).toBeCloseTo(0.0917, 3)
    expect(bayesPosterior(0, 0, 0).posterior).toBeNull()
    expect(oddsFromProbability(0.25)).toBeCloseTo(1 / 3)
    expect(likelihoodRatio(0.9, 0.09)).toBeCloseTo(10)
  })

  it('computes medical test metrics', () => {
    const result = medicalTestMetrics(0.01, 0.9, 0.91)
    expect(result.positivePredictiveValue).toBeCloseTo(0.0917, 3)
    expect(result.truePositive + result.falsePositive + result.trueNegative + result.falseNegative).toBeCloseTo(1)
    expect(medicalTestMetrics(0.01, 0.9, 0.99).falsePositive).toBeLessThan(result.falsePositive)
    expect(medicalTestMetrics(0.01, 0.99, 0.91).falseNegative).toBeLessThan(result.falseNegative)
  })
})

describe('binomial distribution', () => {
  it('matches known values', () => {
    expect(combination(10, 5)).toBe(252)
    expect(binomialPMF(10, 0.5, 5)).toBeCloseTo(0.24609375)
    expect(sumProbabilities(binomialDistribution(10, 0.5))).toBeCloseTo(1)
    expect(binomialMean(10, 0.5)).toBe(5)
    expect(binomialVariance(10, 0.5)).toBe(2.5)
    expect(binomialPMF(10, 0, 0)).toBe(1)
    expect(binomialPMF(10, 1, 10)).toBe(1)
  })
})

describe('continuous distributions', () => {
  it('computes interval probabilities', () => {
    expect(intervalProbability(uniformDistribution(0, 1), 0.2, 0.7)).toBeCloseTo(0.5)
    expect(intervalProbability(exponentialDistribution(1), 0, 1)).toBeCloseTo(1 - Math.exp(-1))
    expect(intervalProbability(normalDistribution(0, 1), -1, 1)).toBeCloseTo(0.6827, 2)
  })

  it('samples and bins safely', () => {
    const samples = sampleContinuousDistribution(normalDistribution(0, 1), 1000, 42)
    const bins = histogram(samples, -4, 4, 20)
    expect(bins.reduce((sum, bin) => sum + bin.probability, 0)).toBeGreaterThan(0.99)
  })
})

describe('central limit theorem helpers', () => {
  it('computes fair die moments and repeatable means', () => {
    const source = getSourceDistribution('die')
    expect(source.mean).toBe(3.5)
    expect(source.variance).toBeCloseTo(35 / 12)
    expect(theoreticalStandardError(source, 25)).toBeCloseTo(Math.sqrt(35 / 12) / 5)
    expect(sampleMeans(source, 1, 6, 123)).toEqual(sampleMeans(source, 1, 6, 123))
    expect(empiricalMean(sampleMeans(source, 5, 50, 123))).toBeGreaterThan(2)
  })
})

describe('random variable sums', () => {
  it('convolves two fair dice', () => {
    const die = distributionById('die')
    const sum = convolveDiscrete(die, die)
    expect(sumProbabilities(sum)).toBeCloseTo(1)
    expect(sum.probabilities[sum.values.indexOf(7)]).toBeCloseTo(6 / 36)
    const stats = sumDistributionStats(die, die)
    expect(stats.sumMean).toBeCloseTo(stats.xMean + stats.yMean)
  })

  it('normalizes custom distributions', () => {
    const normalized = normalizeDistribution({ values: [10, 20, 30], probabilities: [2, 0, 8] })
    expect(sumProbabilities(normalized)).toBeCloseTo(1)
  })
})

describe('probability URL state', () => {
  it('decodes supported state only', () => {
    expect(decodeBayesUrlState('?prior=0.01&likelihood=0.9&falseAlarm=0.09&population=10000').prior).toBe(0.01)
    expect(decodeBinomialUrlState('?n=10&p=0.5&k=5&mode=exact').mode).toBe('exact')
    expect(decodeCltUrlState('?source=die&sampleSize=30&samples=5000&seed=123').sampleSize).toBe(30)
    expect(decodeBinomialUrlState('?n=oops&p=2').n).toBe(10)
  })
})

describe('probability registry integration', () => {
  it('registers probability once with ready routes', () => {
    expect(moduleRegistry.filter((module) => module.id === 'probability')).toHaveLength(1)
    expect(probabilityManifest.status).toBe('ready')
    expect(resolveRoute('/modules/probability').kind).toBe('module')
    for (const explorer of probabilityManifest.explorers) expect(resolveRoute(explorer.route).kind).toBe('explorer')
    expect(new Set(probabilityManifest.explorers.map((explorer) => explorer.id)).size).toBe(probabilityManifest.explorers.length)
  })

  it('renders the probability home and explorers without crashing', () => {
    expect(renderToStaticMarkup(createElement(ProbabilityModule))).toContain('Probability Intuition')
    for (const explorer of probabilityManifest.explorers) {
      const html = renderToStaticMarkup(createElement(ProbabilityModule, { lessonId: explorer.id }))
      expect(html).toContain('probability-main-canvas')
    }
  })
})
