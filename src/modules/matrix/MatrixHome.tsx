import { categoryLabel, localizeModule, platformCopy } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { matrixManifest } from './manifest.ts'

export function MatrixHome() {
  const { locale } = usePlatformLocale()
  const copy = platformCopy[locale].moduleDetail
  const module = localizeModule(matrixManifest, locale)

  return (
    <section className="platform-page module-lesson-home">
      <div className="platform-page-heading">
        <span className="module-order">{String(module.order).padStart(2, '0')}</span>
        <div>
          <p className="eyebrow">{categoryLabel(module.category, locale)}</p>
          <h1>{module.title}</h1>
          <p>{module.description}</p>
        </div>
      </div>

      <div className="lesson-card-grid">
        {module.lessons.map((lesson) => (
          <a className="lesson-card" href={lesson.route} key={lesson.id}>
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
