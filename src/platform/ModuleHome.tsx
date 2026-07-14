import { moduleRegistry } from './moduleRegistry.ts'
import { localizeModule, platformCopy, statusLabel } from './platformCopy.ts'
import { usePlatformLocale } from './platformLocale.tsx'

export function ModuleHome() {
  const { locale } = usePlatformLocale()
  const copy = platformCopy[locale].moduleHome
  const modules = [...moduleRegistry].sort((a, b) => a.order - b.order).map((module) => localizeModule(module, locale))
  const readyModules = modules.filter((module) => module.status === 'ready')
  const plannedModules = modules.filter((module) => module.status !== 'ready')

  return (
    <section className="platform-page module-home">
      <section className="module-home-section">
        <div className="module-grid">
          {readyModules.map((module) => (
            <a className={`module-card module-card-${module.status}`} href={module.routeBase} key={module.id}>
              <div className="module-card-header">
                <span className="module-order">{String(module.order).padStart(2, '0')}</span>
                <span className="module-status">{statusLabel(module.status, locale)}</span>
              </div>
              <ModulePreview id={module.id} />
              <h2>{module.title}</h2>
              <p>{module.description}</p>
            </a>
          ))}
        </div>
      </section>

      {plannedModules.length > 0 && (
        <details className="module-roadmap">
          <summary>
            <span>{copy.roadmapTitle}</span>
            {copy.roadmapSummary && <small>{copy.roadmapSummary}</small>}
          </summary>
          <div className="roadmap-list">
            {plannedModules.map((module) => (
              <a className={`roadmap-item roadmap-item-${module.status}`} href={module.routeBase} key={module.id}>
                <span className="module-order">{String(module.order).padStart(2, '0')}</span>
                <span>{module.title}</span>
                <small>{statusLabel(module.status, locale)}</small>
              </a>
            ))}
          </div>
        </details>
      )}

    </section>
  )
}

function ModulePreview({ id }: { id: string }) {
  const base = import.meta.env.BASE_URL
  return (
    <div className="module-preview" aria-hidden="true">
      <picture>
        <source srcSet={`${base}module-covers/${id}.webp`} type="image/webp" />
        <img src={`${base}module-covers/${id}.jpg`} alt="" width="768" height="512" loading="lazy" decoding="async" />
      </picture>
    </div>
  )
}
