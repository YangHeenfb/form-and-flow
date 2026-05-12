import { localizeModule, platformCopy } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
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
      title: locale === 'zh' ? '傅里叶变换探索器' : 'Fourier Transform Explorer',
    },
    {
      id: 'probability',
      routeBase: '/modules/probability',
      title: locale === 'zh' ? '概率直觉实验室' : 'Probability Intuition Lab',
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
        {module.lessons.map((lesson) => (
          <a className="lesson-card convolution-lesson-card" href={lesson.route} key={lesson.id}>
            <h2>{lesson.title}</h2>
            <p>{lesson.description}</p>
            <strong>{moduleCopy.learningGoals}</strong>
            <ul>
              {lesson.learningGoals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          </a>
        ))}
      </div>
    </section>
  )
}
