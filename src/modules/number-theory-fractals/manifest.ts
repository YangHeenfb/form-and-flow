import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/number-theory-fractals'

export const numberTheoryFractalsManifest: ModuleDefinition = {
  id: 'number-theory-fractals',
  title: 'Number Theory / Fractals',
  shortTitle: 'Numbers & Fractals',
  description: 'Discover patterns in numbers and beautiful fractals.',
  category: 'number-theory',
  status: 'planned',
  routeBase: base,
  order: 14,
  previewKind: 'number-theory-fractals',
  explorers: [
    explorer('modular-circles', 'Modular Multiplication Circles'),
    explorer('prime-patterns', 'Prime Patterns'),
    explorer('collatz', 'Collatz Orbits'),
    explorer('ifs-chaos-game', 'IFS / Chaos Game'),
    explorer('mandelbrot-julia', 'Mandelbrot & Julia'),
    explorer('newton-fractal', 'Newton Fractals'),
    explorer('hilbert-curve', 'Hilbert Curve'),
  ],
}

function explorer(id: string, title: string) {
  return {
    id,
    title,
    description: 'See simple discrete and iterative rules create complex patterns.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    thingsToTry: ['Experiment with iteration', 'Read number patterns visually'],
  }
}
