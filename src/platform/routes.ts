import type { LessonDefinition, ModuleDefinition } from './moduleTypes.ts'
import { moduleRegistry } from './moduleRegistry.ts'

export type ResolvedRoute =
  | { kind: 'home' }
  | { kind: 'module'; module: ModuleDefinition }
  | { kind: 'lesson'; module: ModuleDefinition; lesson: LessonDefinition }
  | { kind: 'not-found' }

export function resolveRoute(pathname: string): ResolvedRoute {
  const normalized = normalizePath(pathname)
  if (normalized === '/' || normalized === '/modules') {
    return { kind: 'home' }
  }

  for (const module of moduleRegistry) {
    if (normalized === module.routeBase) {
      return { kind: 'module', module }
    }
    const lesson = module.lessons.find((candidate) => normalized === candidate.route)
    if (lesson) {
      return { kind: 'lesson', module, lesson }
    }
  }

  return { kind: 'not-found' }
}

function normalizePath(pathname: string): string {
  const path = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname
  return path || '/'
}
