import { describe, expect, it } from 'vitest'
import { encodeUrlState, decodeUrlState } from '../state/urlState.ts'
import { loadThemeSettings, neutralDarkTheme, saveThemeSettings } from '../state/useThemeState.ts'

describe('theme state', () => {
  it('saves and restores color settings', () => {
    localStorage.clear()
    const theme = {
      ...neutralDarkTheme,
      colors: {
        ...neutralDarkTheme.colors,
        grid: '#123456',
      },
    }
    saveThemeSettings(theme)
    expect(loadThemeSettings().colors.grid).toBe('#123456')
  })
})

describe('URL state', () => {
  it('saves and restores matrices and vectors', () => {
    const encoded = encodeUrlState({
      maps: [
        {
          id: 'A',
          name: 'A1',
          inputDim: 3,
          outputDim: 2,
          matrix: [
            [1, 0, 0],
            [0, 1, 0],
          ],
        },
      ],
      vectors: [
        {
          id: 'v',
          name: 'v1',
          dim: 3,
          values: [2, 3, 4],
          color: '#abcdef',
        },
      ],
    })
    const decoded = decodeUrlState(`?state=${encoded}`)
    expect(decoded?.maps[0].matrix).toEqual([
      [1, 0, 0],
      [0, 1, 0],
    ])
    expect(decoded?.vectors[0].values).toEqual([2, 3, 4])
  })
})
