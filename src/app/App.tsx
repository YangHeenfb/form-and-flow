import { lazy, Suspense, useMemo } from 'react'
import { ComingSoonModule } from '../platform/ComingSoonModule.tsx'
import { ModuleHome } from '../platform/ModuleHome.tsx'
import { PlatformShell } from '../platform/PlatformShell.tsx'
import type { ModuleComponentLoader } from '../platform/moduleTypes.ts'
import { platformCopy } from '../platform/platformCopy.ts'
import { usePlatformLocale } from '../platform/platformLocale.tsx'
import { resolveRoute } from '../platform/routes.ts'

export function App() {
  const route = resolveRoute(typeof window === 'undefined' ? '/modules' : window.location.pathname)

  if (route.kind === 'home') {
    return (
      <PlatformShell>
        <ModuleHome />
      </PlatformShell>
    )
  }

  if (route.kind === 'module') {
    if (route.module.loadComponent) {
      return (
        <PlatformShell currentModule={route.module}>
          <LazyModule loadComponent={route.module.loadComponent} />
        </PlatformShell>
      )
    }
    return (
      <PlatformShell currentModule={route.module}>
        <ComingSoonModule module={route.module} />
      </PlatformShell>
    )
  }

  if (route.kind === 'lesson') {
    const loadComponent = route.lesson.loadComponent ?? route.module.loadComponent
    if (loadComponent) {
      return (
        <PlatformShell currentModule={route.module} currentLessonId={route.lesson.id}>
          <LazyModule loadComponent={loadComponent} lessonId={route.lesson.id} />
        </PlatformShell>
      )
    }
    return (
      <PlatformShell currentModule={route.module} currentLessonId={route.lesson.id}>
        <ComingSoonModule module={route.module} />
      </PlatformShell>
    )
  }

  return (
    <PlatformShell>
      <NotFoundPage />
    </PlatformShell>
  )
}

function LazyModule({ loadComponent, lessonId }: { loadComponent: ModuleComponentLoader; lessonId?: string }) {
  const Component = useMemo(() => lazy(loadComponent), [loadComponent])

  return (
    <Suspense fallback={<ModuleLoading />}>
      <Component lessonId={lessonId} />
    </Suspense>
  )
}

function ModuleLoading() {
  const { locale } = usePlatformLocale()
  const copy = locale === 'zh' ? '正在载入模块...' : 'Loading module...'

  return (
    <section className="platform-page">
      <div className="platform-card module-loading" role="status" aria-live="polite">
        <span aria-hidden="true" />
        {copy}
      </div>
    </section>
  )
}

function NotFoundPage() {
  const { locale } = usePlatformLocale()
  const copy = platformCopy[locale].notFound

  return (
    <section className="platform-page">
      <div className="platform-card">
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        <a className="text-link" href="/modules">
          {copy.back}
        </a>
      </div>
    </section>
  )
}
