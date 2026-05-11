import type { ModuleDefinition } from '../../platform/moduleTypes.ts'

const base = '/modules/number-theory-fractals'

export const numberTheoryFractalsManifest: ModuleDefinition = {
  id: 'number-theory-fractals',
  title: 'Number Theory / Fractal Lab',
  shortTitle: 'Numbers & Fractals',
  description: 'Discover patterns in numbers and beautiful fractals.',
  category: 'number-theory',
  status: 'planned',
  routeBase: base,
  order: 14,
  previewKind: 'number-theory-fractals',
  lessons: [
    lesson('modular-circles', 'Modular Multiplication Circles'),
    lesson('prime-patterns', 'Prime Pattern Explorer'),
    lesson('collatz', 'Collatz Orbit Explorer'),
    lesson('ifs-chaos-game', 'IFS / Chaos Game Explorer'),
    lesson('mandelbrot-julia', 'Mandelbrot & Julia Explorer'),
    lesson('newton-fractal', 'Newton Fractal Explorer'),
    lesson('hilbert-curve', 'Hilbert Curve Explorer'),
  ],
}

function lesson(id: string, title: string) {
  return {
    id,
    title,
    description: 'See simple discrete and iterative rules create complex patterns.',
    route: `${base}/${id}`,
    status: 'planned' as const,
    difficulty: 'intermediate' as const,
    estimatedMinutes: 15,
    learningGoals: ['Experiment with iteration', 'Read number patterns visually'],
  }
}
