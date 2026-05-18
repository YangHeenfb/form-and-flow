import type { ComponentType } from 'react'

export type ModuleComponent = ComponentType<any>

export type ModuleComponentLoader = () => Promise<{ default: ModuleComponent }>

export type ModuleCategory =
  | 'linear-algebra'
  | 'calculus'
  | 'fourier'
  | 'probability'
  | 'differential-equations'
  | 'transforms'
  | 'complex-numbers'
  | 'optimization'
  | 'machine-learning'
  | 'vector-calculus'
  | 'topology'
  | 'number-theory'
  | 'abstract-algebra'
  | 'other'

export type ModuleStatus = 'ready' | 'in-progress' | 'planned'
export type ExplorerStatus = 'ready' | 'in-progress' | 'planned'

export type ExplorerDefinition = {
  id: string
  title: string
  description: string
  route: string
  status: ExplorerStatus
  thingsToTry: string[]
  loadComponent?: ModuleComponentLoader
  relatedConcepts?: string[]
}

export type ModuleDefinition = {
  id: string
  title: string
  shortTitle: string
  description: string
  category: ModuleCategory
  status: ModuleStatus
  routeBase: string
  order: number
  icon?: string
  accentColor?: string
  explorers: ExplorerDefinition[]
  loadComponent?: ModuleComponentLoader
  previewKind?: string
  relatedConcepts?: string[]
}
