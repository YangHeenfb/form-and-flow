import type { ReactNode } from 'react'
import type { ModuleDefinition } from './moduleTypes.ts'
import { categoryLabel, platformCopy } from './platformCopy.ts'
import { usePlatformLocale } from './platformLocale.tsx'
import { moduleExplorerHref } from './routes.ts'

export function ModuleHomeLayout({
  module,
  description,
  relatedLinks,
  className,
}: {
  module: ModuleDefinition
  description?: ReactNode
  relatedLinks?: ReactNode
  className?: string
}) {
  const { locale } = usePlatformLocale()
  const copy = platformCopy[locale].moduleDetail

  return (
    <section className={joinClassNames('platform-page', 'module-lesson-home', className)}>
      <div className="platform-page-heading module-detail-heading">
        <span className="module-order">{String(module.order).padStart(2, '0')}</span>
        <div>
          <p className="eyebrow">{categoryLabel(module.category, locale)}</p>
          <h1>{module.title}</h1>
          <div className="module-detail-description">{description ?? <p>{module.description}</p>}</div>
        </div>
      </div>

      {relatedLinks && <div className="module-related-links">{relatedLinks}</div>}

      <div className="lesson-card-grid">
        {module.explorers.map((explorer) => (
          <a className="lesson-card" href={moduleExplorerHref(module, explorer)} key={explorer.id}>
            <div className="lesson-card-copy">
              <h2>{explorer.title}</h2>
              <p>{explorer.description}</p>
            </div>
            <div className="lesson-card-observation">
              <strong>{copy.observation}</strong>
              <p>{explorer.observation ?? explorer.description}</p>
            </div>
            <span className="open-explorer-link">{copy.openModule}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ')
}
