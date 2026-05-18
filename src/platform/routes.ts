import type { ExplorerDefinition, ModuleDefinition } from './moduleTypes.ts'
import { moduleRegistry } from './moduleRegistry.ts'

export type ResolvedRoute =
  | { kind: 'home' }
  | { kind: 'module'; module: ModuleDefinition }
  | { kind: 'explorer'; module: ModuleDefinition; explorer: ExplorerDefinition }
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
    const explorer = module.explorers.find((candidate) => normalized === candidate.route)
    if (explorer) {
      return { kind: 'explorer', module, explorer }
    }
  }

  return { kind: 'not-found' }
}

function normalizePath(pathname: string): string {
  const path = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname
  return path || '/'
}
