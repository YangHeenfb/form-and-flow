import { moduleRegistry } from './moduleRegistry.ts'
import { localizeModule, platformCopy, statusLabel } from './platformCopy.ts'
import { usePlatformLocale } from './platformLocale.tsx'

export function ModuleHome() {
  const { locale } = usePlatformLocale()
  const copy = platformCopy[locale].moduleHome
  const modules = [...moduleRegistry].sort((a, b) => a.order - b.order).map((module) => localizeModule(module, locale))
  return (
    <section className="platform-page module-home">
      <div className="platform-page-heading">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.summary(modules.length)}</p>
        </div>
      </div>

      <div className="module-grid">
        {modules.map((module) => (
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
  )
}

function ModulePreview({ id }: { id: string }) {
  return (
    <div className="module-preview" aria-hidden="true">
      <img src={`/module-covers/${id}.jpg`} alt="" loading="lazy" />
    </div>
  )
}
