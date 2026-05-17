import { moduleRegistry } from './moduleRegistry.ts'
import { localizeModule, platformCopy, statusLabel } from './platformCopy.ts'
import { usePlatformLocale } from './platformLocale.tsx'

export function ModuleHome() {
  const { locale } = usePlatformLocale()
  const copy = platformCopy[locale].moduleHome
  const modules = [...moduleRegistry].sort((a, b) => a.order - b.order).map((module) => localizeModule(module, locale))
  const readyModules = modules.filter((module) => module.status === 'ready')
  const plannedModules = modules.filter((module) => module.status !== 'ready')
  const sections = [
    {
      title: locale === 'zh' ? '第一版模块' : 'Version 1 modules',
      summary: locale === 'zh' ? '这 6 个模块会作为第一版的主要学习体验。' : 'These 6 modules are the primary Version 1 learning experience.',
      modules: readyModules,
    },
    {
      title: locale === 'zh' ? '后续模块' : 'Coming later',
      summary: locale === 'zh' ? '这些入口保留路线和规划，但视觉上不再和第一版模块同权重。' : 'These routes keep the roadmap visible without competing with the ready modules.',
      modules: plannedModules,
    },
  ]

  return (
    <section className="platform-page module-home">
      <div className="platform-page-heading">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.summary(modules.length)}</p>
        </div>
      </div>

      {sections.map((section) => (
        <section className="module-home-section" key={section.title}>
          <div className="module-section-heading">
            <h2>{section.title}</h2>
            <p>{section.summary}</p>
          </div>
          <div className="module-grid">
            {section.modules.map((module) => (
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
      ))}
    </section>
  )
}

function ModulePreview({ id }: { id: string }) {
  const base = import.meta.env.BASE_URL
  return (
    <div className="module-preview" aria-hidden="true">
      <img src={`${base}module-covers/${id}.jpg`} alt="" loading="lazy" />
    </div>
  )
}
