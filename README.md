# Form & Flow

[![CI](https://github.com/YangHeenfb/form-and-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/YangHeenfb/form-and-flow/actions/workflows/ci.yml)

Languages: English | [中文](README.zh-CN.md)

**Live demo:** [formnflow.netlify.app](https://formnflow.netlify.app)

**Form & Flow** is an interactive mathematics laboratory for exploring structure through motion, shape, and direct manipulation. Its six completed modules contain 27 explorers for linear algebra, calculus, Fourier analysis, differential equations, probability, and convolution.

## Preview

| Linear transformations | Calculus | Fourier |
|---|---|---|
| ![Non-identity matrix transformation preview](docs/media/matrix-transform.gif) | ![Derivative motion preview](docs/media/calculus-derivative.gif) | ![Fourier spectrum preview](docs/media/fourier-spectrum.gif) |
| **Differential equations** | **Probability** | **Convolution** |
| ![Slope field preview](docs/media/differential-slope-fields.gif) | ![Conditional probability preview](docs/media/probability-conditional.gif) | ![Discrete convolution preview](docs/media/convolution-discrete.gif) |

## Completed modules

| Module | Explorers | Topics |
|---|---:|---|
| Matrix and Linear Transformation | 1 | Transformation sequences, basis and custom vectors, determinant, 2D and 3D views |
| Calculus | 4 | Derivatives, Riemann sums, the fundamental theorem, Taylor polynomials |
| Fourier Transform | 3 | Spectrum, reconstruction, frequency filtering |
| Differential Equations | 6 | Slope fields, numerical methods, phase portraits, oscillators, populations, diffusion |
| Probability Intuition | 7 | Conditional probability, Bayes, medical testing, distributions, CLT, random-variable sums |
| Convolution | 6 | Discrete and continuous convolution, probability sums, filtering, image kernels, polynomials |

Every explorer has a stable deep link under `/modules/{module}/{explorer}` and supports the shared language, theme, focus, reset, and export behavior where applicable.

## Architecture

- React 19 and TypeScript 6 for the application and typed mathematical state.
- Canvas 2D for most plots; Three.js is loaded only when the Matrix 3D view is opened.
- KaTeX is lazy-loaded with mathematical lesson content rather than the module catalogue.
- Pure numerical kernels are separated from rendering and covered by Vitest.
- Module manifests define routes and lazy explorer entries; the platform shell provides navigation and shared actions.
- Playwright covers all 27 completed explorers, responsive layouts, deep links, accessibility, and bundle boundaries.

The numerical methods are educational approximations. Sampling density, time steps, finite grids, truncation, and boundary choices affect the displayed result; the visualizations are not substitutes for a proof or a scientific solver.

## Local development

Requirements: Node.js 20.19 or newer and pnpm 11.0.9.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Useful checks:

```sh
pnpm typecheck       # TypeScript
pnpm test            # unit and behavior tests
pnpm build           # production build
pnpm check:bundle    # initial-load and chunk budgets
pnpm test:e2e        # Chromium smoke and accessibility tests
pnpm check           # unit tests, build, and bundle audit
```

The first browser-test run may require `pnpm exec playwright install chromium`.

## Repository structure

```text
src/
├── components/      # shared visualization components
├── core/            # reusable UI and application utilities
├── math/            # numerical kernels
├── modules/         # module manifests, explorers, state, rendering adapters
├── platform/        # catalogue, routes, shell, localization
├── render/          # Canvas and Three.js helpers
├── state/           # shared and URL state
└── test/            # test setup and helpers
e2e/                 # Playwright coverage
public/              # static and optimized visual assets
scripts/             # build audits
```

## Project scope and limitations

The catalogue includes roadmap cards for future topics, but only the six modules listed above are marked complete. The public demo is deployed on Netlify with SPA route fallback, and every push to `main` is built and published automatically after validation.

Current priorities are mathematical correctness, responsive interaction, accessibility, and coherent explorer boundaries—not adding unvalidated subject areas.

## License

MIT. See [LICENSE](LICENSE).
