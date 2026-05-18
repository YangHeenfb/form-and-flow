import { categoryLabel, localizeModule, platformCopy } from '../../platform/platformCopy.ts'
import { usePlatformLocale } from '../../platform/platformLocale.tsx'
import { moduleExplorerHref } from '../../platform/routes.ts'
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
        {module.explorers.map((explorer) => (
          <a className="lesson-card probability-lesson-card" href={moduleExplorerHref(module, explorer)} key={explorer.id}>
            <div>
              <h2>{explorer.title}</h2>
              <p>{explorer.description}</p>
            </div>
            <strong>{copy.thingsToTry}</strong>
            <ul>
              {explorer.thingsToTry.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <span className="open-explorer-link">{copy.openExplorer}</span>
            {explorer.id === 'random-variable-sum' && (
              <p className="probability-card-link">{locale === 'zh' ? '若想深入了解，可打开卷积模块。' : 'For a deeper version, open the Convolution module.'}</p>
            )}
          </a>
        ))}
      </div>
    </section>
  )
}
