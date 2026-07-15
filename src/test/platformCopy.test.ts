import { describe, expect, it } from 'vitest'
import { calculusManifest } from '../modules/calculus/manifest.ts'
import { matrixManifest } from '../modules/matrix/manifest.ts'
import { localizeModule, statusLabel } from '../platform/platformCopy.ts'

describe('platform localization', () => {
  it('localizes module and explorer metadata into Chinese', () => {
    const matrix = localizeModule(matrixManifest, 'zh')
    const calculus = localizeModule(calculusManifest, 'zh')

    expect(matrix.title).toBe('矩阵与线性变换')
    expect(matrix.shortTitle).toBe('矩阵')
    expect(matrix.explorers[0].title).toBe('矩阵变换')
    expect(matrix.explorers[0].observation).toContain('基向量')

    expect(calculus.title).toBe('微积分')
    expect(calculus.explorers.find((explorer) => explorer.id === 'taylor')?.title).toBe('泰勒多项式')
    expect(calculus.explorers.find((explorer) => explorer.id === 'taylor')?.description).toBe('用一个中心点的局部信息构造多项式。')
  })

  it('keeps English metadata as the source fallback', () => {
    const matrix = localizeModule(matrixManifest, 'en')

    expect(matrix.title).toBe(matrixManifest.title)
    expect(matrix.explorers[0].title).toBe(matrixManifest.explorers[0].title)
  })

  it('translates status labels', () => {
    expect(statusLabel('ready', 'zh')).toBe('已可用')
    expect(statusLabel('planned', 'zh')).toBe('规划中')
    expect(statusLabel('ready', 'en')).toBe('ready')
  })
})
