import { localizeModule, platformCopy } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { moduleExplorerHref } from '../../platform/routes.ts'
import { calculusManifest } from './manifest.ts'

export function CalculusHome() {
  const { locale } = usePlatformLocale()
  const copy = platformCopy[locale].moduleDetail
  const module = localizeModule(calculusManifest, locale)

  return (
    <section className="platform-page calculus-home">
      <div className="platform-page-heading">
        <span className="module-order">{String(module.order).padStart(2, '0')}</span>
        <div>
          <p className="eyebrow">{module.shortTitle}</p>
          <h1>{module.title}</h1>
          <p>{module.description}</p>
        </div>
      </div>
      <div className="lesson-card-grid">
        {module.explorers.map((explorer) => (
          <a className="lesson-card" href={moduleExplorerHref(module, explorer)} key={explorer.id}>
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
