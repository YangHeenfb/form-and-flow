import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Compass, Download, Grid3X3, HelpCircle, Languages, Menu, Moon, PanelLeftClose, RotateCcw, Sun } from 'lucide-react'
import type { ModuleDefinition } from './moduleTypes.ts'
import { ModuleActionProvider, useModuleActionContext } from './ModuleActionContext.tsx'
import { moduleRegistry } from './moduleRegistry.ts'
import { localizeModule, platformCopy } from './platformCopy.ts'
import {
  loadStoredPlatformLocale,
  loadStoredSurfaceMode,
  PlatformLocaleContext,
  platformLocaleEventName,
  platformLocaleStorageKey,
  platformSurfaceModeEventName,
  platformSurfaceStorageKey,
  type PlatformSurfaceMode,
} from './platformLocale.tsx'

type Props = {
  currentModule?: ModuleDefinition
  currentExplorerId?: string
  children: ReactNode
}

export function PlatformShell({ currentModule, currentExplorerId, children }: Props) {
  const resetKey = `${currentModule?.id ?? 'home'}:${currentExplorerId ?? ''}`

  return (
    <ModuleActionProvider key={resetKey}>
      <PlatformShellContent currentModule={currentModule} currentExplorerId={currentExplorerId}>
        {children}
      </PlatformShellContent>
    </ModuleActionProvider>
  )
}

function PlatformShellContent({ currentModule, currentExplorerId, children }: Props) {
  const [locale, setLocale] = useState(() => loadStoredPlatformLocale())
  const [surfaceMode, setSurfaceMode] = useState<PlatformSurfaceMode>(() => loadStoredSurfaceMode())
  const { actions: moduleActions } = useModuleActionContext()
  const copy = platformCopy[locale].shell
  const modules = [...moduleRegistry].sort((a, b) => a.order - b.order).map((module) => localizeModule(module, locale))
  const readyModules = modules.filter((module) => module.status === 'ready')
  const roadmapModules = modules.filter((module) => module.status !== 'ready')
  const localizedCurrentModule = currentModule ? localizeModule(currentModule, locale) : undefined
  const currentExplorer = localizedCurrentModule?.explorers.find((explorer) => explorer.id === currentExplorerId)
  const showModuleSidebar = Boolean(currentModule)
  const [sidebarOpen, setSidebarOpen] = useState(!currentModule)

  useEffect(() => {
    setSidebarOpen(!currentModule)
  }, [currentModule?.id])

  useEffect(() => {
    localStorage.setItem(platformLocaleStorageKey, locale)
    window.dispatchEvent(new CustomEvent(platformLocaleEventName, { detail: locale }))
  }, [locale])

  useEffect(() => {
    localStorage.setItem(platformSurfaceStorageKey, surfaceMode)
    window.dispatchEvent(new CustomEvent(platformSurfaceModeEventName, { detail: surfaceMode }))
  }, [surfaceMode])

  const themeAria = surfaceMode === 'dark' ? copy.switchToLightMode : copy.switchToDarkMode

  return (
    <PlatformLocaleContext.Provider value={{ locale, setLocale }}>
      <main
        className={`platform-shell${showModuleSidebar ? '' : ' no-sidebar'}${sidebarOpen ? '' : ' sidebar-collapsed'}${moduleActions.isVisualizationExpanded ? ' visualization-expanded' : ''}`}
        style={surfaceVariables(surfaceMode)}
      >
        <header className="platform-topbar">
          <a className="platform-brand" href="/modules" aria-label={copy.homeAria}>
            <span className="brand-mark">VM</span>
            <strong>Visual Math</strong>
          </a>
          <div className="platform-context">
            {localizedCurrentModule ? (
              <a className="platform-context-link" href={localizedCurrentModule.routeBase}>
                {localizedCurrentModule.shortTitle}
              </a>
            ) : (
              <span>{copy.modules}</span>
            )}
            {currentExplorer && <span className="context-lesson">/ {currentExplorer.title}</span>}
          </div>
          <div className="platform-actions">
            <button type="button" aria-label={copy.switchLanguageAria} onClick={() => setLocale((current) => (current === 'en' ? 'zh' : 'en'))}>
              <Languages size={17} />
              {copy.switchLanguage}
            </button>
            <button type="button" aria-label={themeAria} title={themeAria} onClick={() => setSurfaceMode((current) => (current === 'dark' ? 'light' : 'dark'))}>
              {surfaceMode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {moduleActions.openHelp && (
              <button type="button" aria-label={copy.helpAria} onClick={moduleActions.openHelp}>
                <HelpCircle size={17} />
                {copy.help}
              </button>
            )}
            {moduleActions.reset && (
              <button type="button" aria-label={copy.resetAria} onClick={moduleActions.reset}>
                <RotateCcw size={17} />
                {copy.reset}
              </button>
            )}
            {moduleActions.exportPng && (
              <button type="button" aria-label={copy.exportAria} onClick={moduleActions.exportPng}>
                <Download size={17} />
                {copy.exportPng}
              </button>
            )}
          </div>
        </header>

        <div className="platform-workspace">
          {showModuleSidebar && (
            <aside className="platform-sidebar">
              <button
                className="sidebar-toggle"
                type="button"
                aria-label={sidebarOpen ? copy.collapse : copy.expand}
                title={sidebarOpen ? copy.collapse : copy.expand}
                onClick={() => setSidebarOpen((open) => !open)}
              >
                {sidebarOpen ? <PanelLeftClose size={18} /> : <Menu size={18} />}
              </button>
              {sidebarOpen && (
                <>
                  <nav>
                    <p className="sidebar-label">{copy.explore}</p>
                    <a className={!currentModule ? 'active' : ''} href="/modules">
                      <Grid3X3 size={17} />
                      {copy.allModules}
                    </a>
                    <p className="sidebar-label">{copy.modules}</p>
                    {readyModules.map((module) => (
                      <a className={currentModule?.id === module.id ? 'active' : ''} href={module.routeBase} key={module.id}>
                        <span className="sidebar-order">{String(module.order).padStart(2, '0')}</span>
                        {module.shortTitle}
                      </a>
                    ))}
                    {roadmapModules.length > 0 && (
                      <details className="sidebar-roadmap">
                        <summary>{locale === 'zh' ? '路线图' : 'Roadmap'}</summary>
                        {roadmapModules.map((module) => (
                          <a className={currentModule?.id === module.id ? 'active' : ''} href={module.routeBase} key={module.id}>
                            <span className="sidebar-order">{String(module.order).padStart(2, '0')}</span>
                            {module.shortTitle}
                          </a>
                        ))}
                      </details>
                    )}
                  </nav>
                  {localizedCurrentModule && (
                    <nav className="lesson-nav">
                      <p className="sidebar-label">{copy.explorers}</p>
                      {localizedCurrentModule.explorers.map((explorer) => (
                        <a className={currentExplorerId === explorer.id ? 'active' : ''} href={explorer.route} key={explorer.id}>
                          <Compass size={15} />
                          {explorer.title}
                        </a>
                      ))}
                    </nav>
                  )}
                </>
              )}
            </aside>
          )}
          <section className="platform-content">{children}</section>
        </div>
      </main>
    </PlatformLocaleContext.Provider>
  )
}

function surfaceVariables(surfaceMode: PlatformSurfaceMode): CSSProperties {
  const dark = surfaceMode === 'dark'
  return {
    '--app-bg': dark ? '#0e141b' : '#eef2f6',
    '--panel-bg': dark ? '#151d26' : '#ffffff',
    '--panel-bg-soft': dark ? '#101720' : '#f7f9fc',
    '--panel-border': dark ? '#2b3642' : '#d6dde7',
    '--text-main': dark ? '#eef3f8' : '#15202b',
    '--text-muted': dark ? '#a7b1bd' : '#5e6a78',
    '--control-bg': dark ? '#1d2732' : '#edf2f8',
    '--control-bg-strong': dark ? '#263343' : '#dfe8f3',
    '--grid-color': dark ? '#3f4a55' : '#c7d0da',
    '--axis-color': dark ? '#d7dde5' : '#22303d',
    '--graph-canvas-background': dark ? '#101720' : '#f7f9fc',
    '--native-control-scheme': dark ? 'dark' : 'light',
  } as CSSProperties
}
