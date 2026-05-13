import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ModuleActions = {
  share?: () => void | Promise<void>
  exportPng?: () => void
  reset?: () => void
  openHelp?: () => void
}

type ModuleActionContextValue = {
  actions: ModuleActions
  registerModuleActions: (actions: ModuleActions) => () => void
}

const ModuleActionContext = createContext<ModuleActionContextValue>({
  actions: {},
  registerModuleActions: () => () => undefined,
})

type ProviderProps = {
  children: ReactNode
}

export function ModuleActionProvider({ children }: ProviderProps) {
  const [actions, setActions] = useState<ModuleActions>({})

  const registerModuleActions = useCallback((nextActions: ModuleActions) => {
    setActions(nextActions)
    return () => {
      setActions((current) => (current === nextActions ? {} : current))
    }
  }, [])

  const value = useMemo<ModuleActionContextValue>(
    () => ({
      actions,
      registerModuleActions,
    }),
    [actions, registerModuleActions],
  )

  return <ModuleActionContext.Provider value={value}>{children}</ModuleActionContext.Provider>
}

export function useModuleActionContext(): ModuleActionContextValue {
  return useContext(ModuleActionContext)
}

export function useModuleActions(actions: ModuleActions): void {
  const { registerModuleActions } = useModuleActionContext()

  useEffect(() => registerModuleActions(actions), [actions, registerModuleActions])
}
