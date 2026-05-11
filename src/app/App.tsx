import { ComingSoonModule } from '../platform/ComingSoonModule.tsx'
import { ModuleHome } from '../platform/ModuleHome.tsx'
import { PlatformShell } from '../platform/PlatformShell.tsx'
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
    if (route.module.component) {
      const Component = route.module.component
      return (
        <PlatformShell currentModule={route.module}>
          <Component />
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
    if (route.lesson.component) {
      const Component = route.lesson.component
      return (
        <PlatformShell currentModule={route.module} currentLessonId={route.lesson.id}>
          <Component lessonId={route.lesson.id} />
        </PlatformShell>
      )
    }
    if (route.module.component) {
      const Component = route.module.component
      return (
        <PlatformShell currentModule={route.module} currentLessonId={route.lesson.id}>
          <Component lessonId={route.lesson.id} />
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
