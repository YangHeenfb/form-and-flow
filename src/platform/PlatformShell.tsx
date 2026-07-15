import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Download, Grid3X3, HelpCircle, Languages, Menu, Moon, PanelLeftClose, RotateCcw, Sun } from 'lucide-react'
import { SelectMenu } from '../core/ui/SelectMenu.tsx'
import type { ModuleDefinition } from './moduleTypes.ts'
import { ModuleActionProvider, useModuleActionContext } from './ModuleActionContext.tsx'
import { moduleRegistry } from './moduleRegistry.ts'
import { localizeModule, platformCopy } from './platformCopy.ts'
import {
  loadStoredPlatformLocale,
  PlatformLocaleContext,
  PlatformSurfaceModeProvider,
  platformLocaleEventName,
  platformLocaleStorageKey,
  usePlatformSurfaceMode,
  type PlatformSurfaceMode,
} from './platformLocale.tsx'
import { getExplorerMode, moduleExplorerHref } from './routes.ts'

type Props = {
  currentModule?: ModuleDefinition
  currentExplorerId?: string
  currentMode?: string
  children: ReactNode
}

export function PlatformShell({ currentModule, currentExplorerId, currentMode, children }: Props) {
  const resetKey = `${currentModule?.id ?? 'home'}:${currentExplorerId ?? ''}`

  return (
    <PlatformSurfaceModeProvider>
      <ModuleActionProvider key={resetKey}>
        <PlatformShellContent currentModule={currentModule} currentExplorerId={currentExplorerId} currentMode={currentMode}>
          {children}
        </PlatformShellContent>
      </ModuleActionProvider>
    </PlatformSurfaceModeProvider>
  )
}

function PlatformShellContent({ currentModule, currentExplorerId, currentMode, children }: Props) {
  const assetBase = import.meta.env.BASE_URL
  const [locale, setLocale] = useState(() => loadStoredPlatformLocale())
  const { surfaceMode, setSurfaceMode } = usePlatformSurfaceMode()
  const { actions: moduleActions } = useModuleActionContext()
  const copy = platformCopy[locale].shell
  const modules = [...moduleRegistry].sort((a, b) => a.order - b.order).map((module) => localizeModule(module, locale))
  const readyModules = modules.filter((module) => module.status === 'ready')
  const roadmapModules = modules.filter((module) => module.status !== 'ready')
  const localizedCurrentModule = currentModule ? localizeModule(currentModule, locale) : undefined
  const currentExplorer = localizedCurrentModule?.explorers.find((explorer) => explorer.id === currentExplorerId)
  const showModuleSidebar = Boolean(currentModule)
  const [sidebarOpen, setSidebarOpen] = useState(!currentModule)
  const mobileNavTriggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    setSidebarOpen(!currentModule)
  }, [currentModule?.id])

  const closeSidebar = useCallback((restoreFocus = false) => {
    setSidebarOpen(false)
    if (restoreFocus) window.requestAnimationFrame(() => mobileNavTriggerRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!sidebarOpen || !showModuleSidebar) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeSidebar(true)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeSidebar, showModuleSidebar, sidebarOpen])

  useEffect(() => {
    localStorage.setItem(platformLocaleStorageKey, locale)
    window.dispatchEvent(new CustomEvent(platformLocaleEventName, { detail: locale }))
  }, [locale])

  const themeAria = surfaceMode === 'dark' ? copy.switchToLightMode : copy.switchToDarkMode

  return (
    <PlatformLocaleContext.Provider value={{ locale, setLocale }}>
      <main
        className={`platform-shell${showModuleSidebar ? '' : ' no-sidebar'}${sidebarOpen ? '' : ' sidebar-collapsed'}${moduleActions.isVisualizationExpanded ? ' visualization-expanded' : ''}`}
        data-current-module={currentModule?.id}
        data-locale={locale}
        data-surface-mode={surfaceMode}
        style={surfaceVariables(surfaceMode)}
      >
        <header className="platform-topbar">
          {showModuleSidebar && (
            <button
              ref={mobileNavTriggerRef}
              className="platform-mobile-nav-toggle"
              type="button"
              aria-label={copy.expand}
              aria-expanded={sidebarOpen}
              aria-controls="platform-navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={19} />
            </button>
          )}
          <a className="platform-brand" href="/modules" aria-label={copy.homeAria}>
            <span className="brand-mark" aria-hidden="true">
              <img src={`${assetBase}brand/form-flow-logo.png`} alt="" />
            </span>
            <strong>{copy.brandName}</strong>
          </a>
          <div className="platform-context">
            {localizedCurrentModule ? (
              <a className="platform-context-link" href={localizedCurrentModule.routeBase}>
                {localizedCurrentModule.shortTitle}
              </a>
            ) : (
              <span>{copy.modules}</span>
            )}
            {currentModule && localizedCurrentModule && currentExplorer && (
              <div className="platform-tool-selector">
                <SelectMenu
                  className="platform-tool-menu"
                  ariaLabel={copy.toolSelectorAria}
                  disabled={localizedCurrentModule.explorers.length === 0}
                  value={currentMode ?? getExplorerMode(currentExplorer)}
                  options={localizedCurrentModule.explorers.map((explorer) => ({
                    value: getExplorerMode(explorer),
                    label: explorer.title,
                    textValue: explorer.title,
                  }))}
                  onChange={(nextMode) => {
                    const nextExplorer = currentModule.explorers.find((explorer) => getExplorerMode(explorer) === nextMode)
                    if (nextExplorer) window.location.href = moduleExplorerHref(currentModule, nextExplorer)
                  }}
                />
              </div>
            )}
          </div>
          <div className="platform-actions">
            <button type="button" aria-label={copy.switchLanguageAria} onClick={() => setLocale((current) => (current === 'en' ? 'zh' : 'en'))}>
              <Languages size={17} />
              <span>{copy.switchLanguage}</span>
            </button>
            <button type="button" aria-label={themeAria} title={themeAria} onClick={() => setSurfaceMode((current) => (current === 'dark' ? 'light' : 'dark'))}>
              {surfaceMode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {moduleActions.openHelp && (
              <button type="button" aria-label={copy.helpAria} onClick={moduleActions.openHelp}>
                <HelpCircle size={17} />
                <span>{copy.help}</span>
              </button>
            )}
            {moduleActions.reset && (
              <button type="button" aria-label={copy.resetAria} onClick={moduleActions.reset}>
                <RotateCcw size={17} />
                <span>{copy.reset}</span>
              </button>
            )}
            {moduleActions.exportPng && (
              <button type="button" aria-label={copy.exportAria} onClick={moduleActions.exportPng}>
                <Download size={17} />
                <span>{copy.exportPng}</span>
              </button>
            )}
          </div>
        </header>

        <div className="platform-workspace">
          {showModuleSidebar && (
            <aside className="platform-sidebar" id="platform-navigation" aria-label={copy.modules}>
              <button
                className="sidebar-toggle"
                type="button"
                aria-label={sidebarOpen ? copy.collapse : copy.expand}
                title={sidebarOpen ? copy.collapse : copy.expand}
                onClick={() => sidebarOpen ? closeSidebar(true) : setSidebarOpen(true)}
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
                </>
              )}
            </aside>
          )}
          {showModuleSidebar && sidebarOpen && (
            <button className="platform-sidebar-backdrop" type="button" aria-label={copy.collapse} onClick={() => closeSidebar(true)} />
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
    '--app-bg': dark ? '#101519' : '#f6f7f8',
    '--panel-bg': dark ? '#171d21' : '#ffffff',
    '--panel-bg-soft': dark ? '#11171b' : '#f3f5f6',
    '--panel-border': dark ? '#323b42' : '#d9dee3',
    '--text-main': dark ? '#edf2f5' : '#17212b',
    '--text-muted': dark ? '#a8b3bb' : '#5c6873',
    '--control-bg': dark ? '#20282e' : '#f2f5f6',
    '--control-bg-strong': dark ? '#29343b' : '#e7edef',
    '--focus': dark ? '#62c4d2' : '#0b7285',
    '--grid-color': dark ? '#414b52' : '#cad1d6',
    '--axis-color': dark ? '#d6dde1' : '#293640',
    '--graph-canvas-background': dark ? '#11171b' : '#fbfcfd',
    '--native-control-scheme': dark ? 'dark' : 'light',
  } as CSSProperties
}
