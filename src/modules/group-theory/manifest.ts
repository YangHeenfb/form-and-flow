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
  explorers: [
    explorer('symmetry-actions', 'Symmetry Actions'),
    explorer('composition', 'Composition Is the Operation'),
    explorer('cayley-table', 'Cayley Table Builder'),
    explorer('cayley-diagram', 'Generators & Cayley Diagram'),
    explorer('permutations', 'Permutations'),
    explorer('subgroups-cosets', 'Subgroups & Cosets'),
    explorer('isomorphism', 'Isomorphism Matcher'),
  ],
}

function explorer(id: string, title: string) {
  return {
    id,
    title,
    description: 'Use finite symmetries to make abstract group structure visible.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    thingsToTry: ['Compose actions', 'Read group structure from tables and diagrams'],
  }
}
