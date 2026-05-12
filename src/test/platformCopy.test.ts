import { describe, expect, it } from 'vitest'
import { calculusManifest } from '../modules/calculus/manifest.ts'
import { matrixManifest } from '../modules/matrix/manifest.ts'
import { localizeModule, statusLabel } from '../platform/platformCopy.ts'

describe('platform localization', () => {
  it('localizes module and lesson metadata into Chinese', () => {
    const matrix = localizeModule(matrixManifest, 'zh')
    const calculus = localizeModule(calculusManifest, 'zh')

    expect(matrix.title).toBe('矩阵与线性变换')
    expect(matrix.shortTitle).toBe('矩阵')
    expect(matrix.lessons[0].title).toBe('矩阵变换')
    expect(matrix.lessons[0].learningGoals).toContain('组合矩阵变换')

    expect(calculus.title).toBe('微积分')
    expect(calculus.lessons.find((lesson) => lesson.id === 'taylor')?.title).toBe('泰勒多项式')
    expect(calculus.lessons.find((lesson) => lesson.id === 'taylor')?.description).toBe('围绕一个中心构造局部多项式近似。')
  })

  it('keeps English metadata as the source fallback', () => {
    const matrix = localizeModule(matrixManifest, 'en')

    expect(matrix.title).toBe(matrixManifest.title)
    expect(matrix.lessons[0].title).toBe(matrixManifest.lessons[0].title)
  })

  it('translates status labels', () => {
    expect(statusLabel('ready', 'zh')).toBe('已可用')
    expect(statusLabel('planned', 'zh')).toBe('规划中')
    expect(statusLabel('ready', 'en')).toBe('ready')
  })
})
