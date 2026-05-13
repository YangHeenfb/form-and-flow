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
export type LessonStatus = 'ready' | 'in-progress' | 'planned'
export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced'

export type LessonDefinition = {
  id: string
  title: string
  description: string
  route: string
  status: LessonStatus
  difficulty: LessonDifficulty
  estimatedMinutes?: number
  learningGoals: string[]
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
  lessons: LessonDefinition[]
  loadComponent?: ModuleComponentLoader
  previewKind?: string
  relatedConcepts?: string[]
}
