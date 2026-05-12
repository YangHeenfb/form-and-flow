import { categoryLabel, localizeModule, platformCopy } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { probabilityManifest } from './manifest.ts'

export function ProbabilityHome() {
  const { locale } = usePlatformLocale()
  const module = localizeModule(probabilityManifest, locale)
  const copy = platformCopy[locale].moduleDetail

  return (
    <section className="platform-page module-lesson-home probability-home">
      <div className="platform-page-heading">
        <span className="module-order">{String(module.order).padStart(2, '0')}</span>
        <div>
          <p className="eyebrow">{categoryLabel(module.category, locale)}</p>
          <h1>{module.title}</h1>
          <p>{module.description}</p>
        </div>
      </div>

      <div className="lesson-card-grid probability-lesson-grid">
        {module.lessons.map((lesson) => (
          <a className="lesson-card probability-lesson-card" href={lesson.route} key={lesson.id}>
            <div>
              <h2>{lesson.title}</h2>
              <p>{lesson.description}</p>
            </div>
            <strong>{copy.learningGoals}</strong>
            <ul>
              {lesson.learningGoals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
            {lesson.id === 'random-variable-sum' && (
              <p className="probability-card-link">{locale === 'zh' ? '若想深入了解，可打开卷积实验室。' : 'For a deeper version, open Convolution Lab.'}</p>
            )}
          </a>
        ))}
      </div>
    </section>
  )
}
