import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/group-theory'

export const groupTheoryManifest: ModuleDefinition = {
  id: 'group-theory',
  title: 'Group Theory / Symmetry',
  shortTitle: 'Group Theory',
  description: 'Visualize symmetries, groups, actions, tables, diagrams, and transformations.',
  category: 'abstract-algebra',
  status: 'planned',
  routeBase: base,
  order: 12,
  previewKind: 'group-theory',
  lessons: [
    lesson('symmetry-actions', 'Symmetry Actions'),
    lesson('composition', 'Composition Is the Operation'),
    lesson('cayley-table', 'Cayley Table Builder'),
    lesson('cayley-diagram', 'Generators & Cayley Diagram'),
    lesson('permutations', 'Permutations'),
    lesson('subgroups-cosets', 'Subgroups & Cosets'),
    lesson('isomorphism', 'Isomorphism Matcher'),
  ],
}

function lesson(id: string, title: string) {
  return {
    id,
    title,
    description: 'Use finite symmetries to make abstract group structure visible.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    difficulty: 'intermediate' as const,
    estimatedMinutes: 15,
    learningGoals: ['Compose actions', 'Read group structure from tables and diagrams'],
  }
}
