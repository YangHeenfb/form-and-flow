import type { ExplorerDefinition, ModuleDefinition } from './moduleTypes.ts'
import { moduleRegistry } from './moduleRegistry.ts'

export type ResolvedRoute =
  | { kind: 'home' }
  | {
      kind: 'module'
      module: ModuleDefinition
      activeExplorer?: ExplorerDefinition
      activeMode?: string
      legacyRedirectTo?: string
    }
  | { kind: 'not-found' }

const convolutionOutputModes = new Set(['full', 'same', 'valid'])
const binomialModes = new Set(['exact', 'at-most', 'at-least', 'between'])

export function resolveRoute(pathname: string, search = ''): ResolvedRoute {
  const normalized = normalizePath(pathname)
  if (normalized === '/' || normalized === '/modules') {
    return { kind: 'home' }
  }

  for (const module of moduleRegistry) {
    if (normalized === module.routeBase) {
      return resolveModuleRoute(module, search)
    }
    const explorer = module.explorers.find((candidate) => normalized === candidate.route)
    if (explorer) {
      const activeMode = getExplorerMode(explorer)
      return {
        kind: 'module',
        module,
        activeExplorer: explorer,
        activeMode,
        legacyRedirectTo: resolveLegacyExplorerRoute(module, explorer, search),
      }
    }
  }

  return { kind: 'not-found' }
}

export function getExplorerMode(explorer: ExplorerDefinition): string {
  const normalized = normalizePath(explorer.route)
  const lastSlash = normalized.lastIndexOf('/')
  return normalized.slice(lastSlash + 1) || explorer.id
}

export function moduleExplorerHref(module: ModuleDefinition, explorer: ExplorerDefinition): string {
  return `${module.routeBase}?mode=${encodeURIComponent(getExplorerMode(explorer))}`
}

export function resolveLegacyExplorerRoute(module: ModuleDefinition, explorer: ExplorerDefinition, search = ''): string {
  const next = canonicalLegacyParams(module, explorer, new URLSearchParams(trimSearch(search)))
  const query = next.toString()
  return query ? `${module.routeBase}?${query}` : module.routeBase
}

function resolveModuleRoute(module: ModuleDefinition, search: string): ResolvedRoute {
  const params = new URLSearchParams(trimSearch(search))
  const requestedMode = params.get('mode') ?? undefined
  const activeExplorer = explorerForMode(module, requestedMode)
  return {
    kind: 'module',
    module,
    activeExplorer,
    activeMode: activeExplorer ? getExplorerMode(activeExplorer) : undefined,
  }
}

function explorerForMode(module: ModuleDefinition, mode?: string): ExplorerDefinition | undefined {
  if (mode) {
    const normalizedMode = mode.trim()
    const matchingExplorer = module.explorers.find((explorer) => getExplorerMode(explorer) === normalizedMode || explorer.id === normalizedMode)
    if (matchingExplorer) return matchingExplorer
  }
  return module.explorers.find((explorer) => explorer.status === 'ready') ?? module.explorers[0]
}

function canonicalLegacyParams(module: ModuleDefinition, explorer: ExplorerDefinition, params: URLSearchParams): URLSearchParams {
  const legacyMode = params.get('mode')
  const next = new URLSearchParams()
  next.set('mode', getExplorerMode(explorer))

  for (const [key, value] of params) {
    if (key !== 'mode') next.append(key, value)
  }

  if (module.id === 'convolution' && legacyMode && convolutionOutputModes.has(legacyMode) && !next.has('convMode')) {
    next.append('convMode', legacyMode)
  }

  if (module.id === 'probability' && explorer.id === 'binomial' && legacyMode && binomialModes.has(legacyMode) && !next.has('binomialMode')) {
    next.append('binomialMode', legacyMode)
  }

  return next
}

function trimSearch(search: string): string {
  return search.startsWith('?') ? search.slice(1) : search
}

function normalizePath(pathname: string): string {
  const path = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname
  return path || '/'
}
