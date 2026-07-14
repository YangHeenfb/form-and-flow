import { describe, expect, it } from 'vitest'
import { moduleRegistry } from '../platform/moduleRegistry.ts'
import { resolveRoute } from '../platform/routes.ts'

describe('module registry', () => {
  it('registers all module ids once', () => {
    const ids = moduleRegistry.map((module) => module.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps matrix and calculus ready', () => {
    expect(moduleRegistry.find((module) => module.id === 'matrix')?.status).toBe('ready')
    expect(moduleRegistry.find((module) => module.id === 'calculus')?.status).toBe('ready')
    expect(moduleRegistry.find((module) => module.id === 'fourier')?.status).toBe('ready')
    expect(moduleRegistry.find((module) => module.id === 'differential-equations')?.status).toBe('ready')
    expect(moduleRegistry.find((module) => module.id === 'probability')?.status).toBe('ready')
    expect(moduleRegistry.find((module) => module.id === 'convolution')?.status).toBe('ready')
  })

  it('has no duplicate explorer ids within each module', () => {
    for (const module of moduleRegistry) {
      const explorerIds = module.explorers.map((explorer) => explorer.id)
      expect(new Set(explorerIds).size).toBe(explorerIds.length)
    }
  })

  it('gives every ready explorer its own lazy entry', () => {
    for (const module of moduleRegistry.filter((candidate) => candidate.status === 'ready')) {
      const loaders = module.explorers.map((explorer) => explorer.loadComponent)
      expect(loaders.every(Boolean)).toBe(true)
      expect(new Set(loaders).size).toBe(loaders.length)
    }
  })

  it('resolves core routes', () => {
    expect(resolveRoute('/modules').kind).toBe('home')
    expectModuleRoute('/modules/matrix', undefined, 'transformations', 'matrix-transformations')
    expectModuleRoute('/modules/matrix/transformations', undefined, 'transformations', 'matrix-transformations', '/modules/matrix?mode=transformations')
    expectModuleRoute('/modules/calculus', undefined, 'derivative', 'derivative')
    expectModuleRoute('/modules/calculus/derivative', undefined, 'derivative', 'derivative', '/modules/calculus?mode=derivative')
    expect(resolveRoute('/modules/calculus/limits').kind).toBe('not-found')
    expectModuleRoute('/modules/fourier', undefined, 'spectrum', 'spectrum')
    expect(resolveRoute('/modules/fourier/winding').kind).toBe('not-found')
    expectModuleRoute('/modules/fourier/spectrum', undefined, 'spectrum', 'spectrum', '/modules/fourier?mode=spectrum')
    expectModuleRoute('/modules/fourier/reconstruction', undefined, 'reconstruction', 'reconstruction', '/modules/fourier?mode=reconstruction')
    expectModuleRoute('/modules/fourier/filtering', undefined, 'filtering', 'filtering', '/modules/fourier?mode=filtering')
    expectModuleRoute('/modules/differential-equations', undefined, 'slope-fields', 'slope-fields')
    expectModuleRoute('/modules/differential-equations/slope-fields', undefined, 'slope-fields', 'slope-fields', '/modules/differential-equations?mode=slope-fields')
    expectModuleRoute('/modules/differential-equations/heat-equation', undefined, 'heat-equation', 'heat-equation', '/modules/differential-equations?mode=heat-equation')
    expectModuleRoute('/modules/probability', undefined, 'conditional-probability', 'conditional-probability')
    expectModuleRoute('/modules/probability/bayes', undefined, 'bayes', 'bayes', '/modules/probability?mode=bayes')
    expectModuleRoute('/modules/convolution', undefined, 'discrete', 'discrete')
    expectModuleRoute('/modules/convolution/discrete', undefined, 'discrete', 'discrete', '/modules/convolution?mode=discrete')
    expectModuleRoute('/modules/convolution/continuous', undefined, 'continuous', 'continuous', '/modules/convolution?mode=continuous')
  })

  it('uses mode query params for canonical module routes', () => {
    expectModuleRoute('/modules/calculus', '?mode=taylor', 'taylor', 'taylor')
    expectModuleRoute('/modules/matrix', '?mode=transformations', 'transformations', 'matrix-transformations')
    expectModuleRoute('/modules/calculus', '?mode=limits', 'derivative', 'derivative')
  })

  it('migrates legacy query params that used mode internally', () => {
    expectModuleRoute('/modules/convolution/discrete', '?mode=same', 'discrete', 'discrete', '/modules/convolution?mode=discrete&convMode=same')
    expectModuleRoute('/modules/convolution/signal', '?mode=valid&boundary=wrap', 'signal', 'signal', '/modules/convolution?mode=signal&boundary=wrap&convMode=valid')
    expectModuleRoute('/modules/probability/binomial', '?mode=at-most', 'binomial', 'binomial', '/modules/probability?mode=binomial&binomialMode=at-most')
  })
})

function expectModuleRoute(pathname: string, search: string | undefined, activeMode: string, activeExplorerId: string, legacyRedirectTo?: string) {
  const route = resolveRoute(pathname, search)
  expect(route.kind).toBe('module')
  if (route.kind !== 'module') throw new Error(`${pathname} did not resolve to a module`)
  expect(route.activeMode).toBe(activeMode)
  expect(route.activeExplorer?.id).toBe(activeExplorerId)
  expect(route.legacyRedirectTo).toBe(legacyRedirectTo)
}
