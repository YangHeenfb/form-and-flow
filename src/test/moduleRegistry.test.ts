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

  it('has no duplicate lesson ids within each module', () => {
    for (const module of moduleRegistry) {
      const lessonIds = module.lessons.map((lesson) => lesson.id)
      expect(new Set(lessonIds).size).toBe(lessonIds.length)
    }
  })

  it('resolves core routes', () => {
    expect(resolveRoute('/modules').kind).toBe('home')
    expect(resolveRoute('/modules/matrix').kind).toBe('module')
    expect(resolveRoute('/modules/matrix/transformations').kind).toBe('lesson')
    expect(resolveRoute('/modules/calculus').kind).toBe('module')
    expect(resolveRoute('/modules/calculus/derivative').kind).toBe('lesson')
    expect(resolveRoute('/modules/calculus/limits').kind).toBe('not-found')
    expect(resolveRoute('/modules/fourier').kind).toBe('module')
    expect(resolveRoute('/modules/fourier/winding').kind).toBe('not-found')
    expect(resolveRoute('/modules/fourier/spectrum').kind).toBe('lesson')
    expect(resolveRoute('/modules/fourier/reconstruction').kind).toBe('lesson')
    expect(resolveRoute('/modules/fourier/filtering').kind).toBe('lesson')
    expect(resolveRoute('/modules/differential-equations').kind).toBe('module')
    expect(resolveRoute('/modules/differential-equations/slope-fields').kind).toBe('lesson')
    expect(resolveRoute('/modules/differential-equations/heat-equation').kind).toBe('lesson')
    expect(resolveRoute('/modules/probability').kind).toBe('module')
    expect(resolveRoute('/modules/probability/bayes').kind).toBe('lesson')
    expect(resolveRoute('/modules/convolution').kind).toBe('module')
    expect(resolveRoute('/modules/convolution/discrete').kind).toBe('lesson')
    expect(resolveRoute('/modules/convolution/continuous').kind).toBe('lesson')
  })
})
