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
        {module.explorers.map((explorer) => (
          <a className="lesson-card" href={explorer.route} key={explorer.id}>
            <h2>{explorer.title}</h2>
            <p>{explorer.description}</p>
            <strong>{copy.thingsToTry}</strong>
            <ul>
              {explorer.thingsToTry.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <span className="open-explorer-link">{copy.openExplorer}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
