import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CalculusHome } from '../modules/calculus/CalculusHome.tsx'
import { ConvolutionHome } from '../modules/convolution/ConvolutionHome.tsx'
import { DifferentialEquationsHome } from '../modules/differential-equations/DifferentialEquationsHome.tsx'
import { FourierHome } from '../modules/fourier/FourierHome.tsx'
import { MatrixHome } from '../modules/matrix/MatrixHome.tsx'
import { ProbabilityHome } from '../modules/probability/ProbabilityHome.tsx'

describe('ready module home layouts', () => {
  const homes = [
    ['matrix', <MatrixHome />],
    ['calculus', <CalculusHome />],
    ['fourier', <FourierHome />],
    ['differential equations', <DifferentialEquationsHome />],
    ['probability', <ProbabilityHome />],
    ['convolution', <ConvolutionHome />],
  ] as const

  for (const [name, home] of homes) {
    it(`${name} uses the shared heading and explorer card contract`, () => {
      const container = document.createElement('div')
      container.innerHTML = renderToStaticMarkup(home)

      expect(container.querySelector('.module-lesson-home')).toBeTruthy()
      expect(container.querySelector('.module-detail-heading .eyebrow')).toBeTruthy()
      expect(container.querySelector('.module-detail-heading h1')).toBeTruthy()
      expect(container.querySelector('.lesson-card .lesson-card-copy')).toBeTruthy()
      expect(container.querySelector('.lesson-card .lesson-card-try')).toBeTruthy()
      expect(container.querySelector('.lesson-card .open-explorer-link')).toBeTruthy()
    })
  }
})
