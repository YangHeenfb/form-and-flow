import { localizeModule, platformCopy } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { moduleExplorerHref } from '../../platform/routes.ts'
import { convolutionUiCopy } from './convolutionCopy.ts'
import { convolutionManifest } from './manifest.ts'

export function ConvolutionHome() {
  const { locale } = usePlatformLocale()
  const module = localizeModule(convolutionManifest, locale)
  const moduleCopy = platformCopy[locale].moduleDetail
  const copy = convolutionUiCopy[locale]
  const related = [
    {
      id: 'fourier',
      routeBase: '/modules/fourier',
      title: locale === 'zh' ? '傅里叶变换' : 'Fourier Transform',
    },
    {
      id: 'probability',
      routeBase: '/modules/probability',
      title: locale === 'zh' ? '概率直觉' : 'Probability Intuition',
    },
  ]

  return (
    <section className="platform-page convolution-home">
      <div className="platform-page-heading">
        <span className="module-order">{String(module.order).padStart(2, '0')}</span>
        <div>
          <p className="eyebrow">{module.shortTitle}</p>
          <h1>{module.title}</h1>
          <p>{module.description}</p>
          <p className="convolution-home-summary">{copy.homeSummary}</p>
        </div>
      </div>

      <div className="related-row" aria-label={copy.relatedModulesAria}>
        {related.map((relatedModule) => (
          <a href={relatedModule.routeBase} key={relatedModule.id}>
            {copy.relatedPrefix}: {relatedModule.title}
          </a>
        ))}
      </div>

      <div className="lesson-card-grid">
        {module.explorers.map((explorer) => (
          <a className="lesson-card convolution-lesson-card" href={moduleExplorerHref(module, explorer)} key={explorer.id}>
            <h2>{explorer.title}</h2>
            <p>{explorer.description}</p>
            <strong>{moduleCopy.thingsToTry}</strong>
            <ul>
              {explorer.thingsToTry.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <span className="open-explorer-link">{moduleCopy.openExplorer}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
