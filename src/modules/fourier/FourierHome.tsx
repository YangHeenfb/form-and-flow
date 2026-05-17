import { localizeModule, platformCopy } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { fourierManifest } from './manifest.ts'

export function FourierHome() {
  const { locale } = usePlatformLocale()
  const module = localizeModule(fourierManifest, locale)
  const copy = platformCopy[locale].moduleDetail

  return (
    <section className="platform-page fourier-home">
      <div className="platform-page-heading">
        <span className="module-order">{String(module.order).padStart(2, '0')}</span>
        <div>
          <p className="eyebrow">{module.shortTitle}</p>
          <h1>{module.title}</h1>
          <p>
            {locale === 'zh'
              ? '通过缠绕信号、扫描频率空间和用傅里叶系数重建信号，探索信号如何分解成频率。'
              : 'Explore how signals decompose into frequencies by winding them around circles, scanning frequency space, and reconstructing signals from Fourier coefficients.'}
          </p>
        </div>
      </div>

      <div className="lesson-card-grid">
        {module.lessons.map((lesson) => (
          <a className="lesson-card fourier-lesson-card" href={lesson.route} key={lesson.id}>
            <h2>{lesson.title}</h2>
            <p>{lesson.description}</p>
            <strong>{copy.learningGoals}</strong>
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
