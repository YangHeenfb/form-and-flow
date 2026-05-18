import type { ModuleDefinition } from './moduleTypes.ts'
import { localizeModule, platformCopy, statusLabel } from './platformCopy.ts'
import { usePlatformLocale } from './platformLocale.tsx'

type Props = {
  module: ModuleDefinition
}

export function ComingSoonModule({ module }: Props) {
  const { locale } = usePlatformLocale()
  const copy = platformCopy[locale].comingSoon
  const localizedModule = localizeModule(module, locale)

  return (
    <section className="platform-page coming-soon-page">
      <div className="platform-page-heading">
        <span className="module-order">{String(localizedModule.order).padStart(2, '0')}</span>
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{localizedModule.title}</h1>
          <p>{localizedModule.description}</p>
        </div>
      </div>

      <div className="platform-card">
        <h2>{copy.readyTitle}</h2>
        <p>{copy.readyBody}</p>
      </div>

      <div className="platform-card">
        <h2>{copy.plannedExplorers}</h2>
        <div className="lesson-list">
          {localizedModule.explorers.map((explorer) => (
            <a className="lesson-row" href={explorer.route} key={explorer.id}>
              <span>{explorer.title}</span>
              <small>{statusLabel(explorer.status, locale)}</small>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
