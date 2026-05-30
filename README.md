# Form & Flow

Languages: English | [中文](README.zh-CN.md)

**Form & Flow** is an interactive math visualization lab for exploring mathematical structure through motion, shape, and direct manipulation. It turns abstract objects into scenes you can adjust: drag points, tune parameters, play animations, compare readouts, and save visual states.

The first release focuses on six visual explorers: linear transformations, calculus, Fourier analysis, differential equations, probability, and convolution.

## Preview

| Linear transformations | Calculus | Fourier |
|---|---|---|
| ![Non-identity matrix transformation preview](docs/media/matrix-transform.gif) | ![Derivative motion preview](docs/media/calculus-derivative.gif) | ![Fourier spectrum preview](docs/media/fourier-spectrum.gif) |
| **Differential equations** | **Probability** | **Convolution** |
| ![Slope field preview](docs/media/differential-slope-fields.gif) | ![Conditional probability preview](docs/media/probability-conditional.gif) | ![Discrete convolution preview](docs/media/convolution-discrete.gif) |

## What you can explore

Form & Flow is built around visual experiments. Each module combines an interactive scene, adjustable controls, compact formulas, and live numerical readouts.

| Module | Explorers | What it helps visualize |
|---|---|---|
| **Matrix and Linear Transformation** | Matrix Transformations | Matrix sequences, basis vectors, custom vectors, area / volume scaling, orientation changes, 2D and 3D linear transformations. |
| **Calculus** | Derivative, Integral / Riemann Sums, Fundamental Theorem Connector, Taylor Polynomial | Secant-to-tangent motion, signed area approximation, accumulation, local polynomial approximation. |
| **Fourier Transform** | Frequency Spectrum, Signal Reconstruction, Frequency Filtering | Time-domain signals, frequency components, coefficient magnitude, reconstruction, and filtering. |
| **Differential Equations** | Slope Fields, Numerical Methods, Phase Portraits, Pendulum, Population Dynamics, Heat Equation | Change rules, solution paths, vector fields, numerical approximation, oscillator motion, diffusion. |
| **Probability Intuition** | Conditional Probability, Bayes Rule, Medical Test, Binomial Distribution, Continuous Density, Central Limit Theorem, Random Variable Sum | Populations, areas, samples, distributions, base rates, conditional probability, sampling behavior. |
| **Convolution** | Discrete Convolution, Probability Sum, Signal Filtering, Image Kernel, Polynomial Multiplication, Continuous Convolution | Sliding, overlap, multiply-and-sum patterns across signals, probability, images, and algebra. |

## Core features

- Interactive browser-based math scenes.
- Canvas-based 2D rendering and Three.js-based 3D rendering.
- Matrix sequences and vector tracking for linear transformations.
- Sliders, presets, toggles, and playback controls.
- Live readouts for formulas, parameters, and numerical results.
- Theme controls for visual customization.
- PNG export for capturing the current view.
- URL-friendly routing for module and explorer pages.
- Unit tests for core math and UI behavior.

## Project status

Form & Flow is in an early public version. The current priority is to make the first six modules polished, consistent, and easy to explore.

The roadmap includes additional modules that are already represented in the source tree or planned as future explorers:

- Complex Plane
- Optimization
- Neural Networks
- Vector Fields
- Fourier Series
- Group Theory
- Topology
- Number Theory and Fractals

## Tech stack

- **React** for UI structure.
- **TypeScript** for typed application and math logic.
- **Vite** for development and production builds.
- **Canvas 2D** for fast 2D mathematical scenes.
- **Three.js** for 3D visualizations.
- **KaTeX** for mathematical notation.
- **Vitest** for tests.
- **pnpm** for dependency management.

## Getting started

### Prerequisites

Install Node.js and pnpm before running the project locally.

### Install dependencies

```sh
pnpm install
```

### Start the development server

```sh
pnpm dev
```

Then open the local URL printed by Vite.

### Build for production

```sh
pnpm build
```

The production output is generated in `dist/`.

### Preview the production build locally

```sh
pnpm preview
```

### Run tests

```sh
pnpm test
```

## Repository structure

```text
form-and-flow/
├── public/                 # Static assets
├── src/
│   ├── app/                # Application shell
│   ├── components/         # Shared React components
│   ├── core/               # Shared UI and application utilities
│   ├── math/               # Reusable math logic
│   ├── modules/            # Individual visualization modules
│   ├── platform/           # Module registry, routes, layout, copy
│   ├── render/             # Canvas and Three.js render helpers
│   ├── state/              # App state and URL state helpers
│   └── test/               # Test helpers and setup
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Module design notes

Each module should feel like an explorer:

1. The visual scene should be usable immediately.
2. Controls should change the scene directly.
3. Readouts should explain the current state with numbers, formulas, and short notes.
4. Presets should provide good starting points.
5. Advanced options should stay out of the way until needed.

When adding a new explorer, prefer this structure:

```text
src/modules/<module-name>/
├── manifest.ts             # Module title, description, routes, explorers
├── <Module>.tsx            # Main module component
├── <Module>Home.tsx        # Optional module landing page
├── learningHelp.tsx        # Optional reference notes
└── ...                     # Rendering, state, and helper files
```

## Working with coding agents

This project is intentionally visualization-first. When using Codex or another coding agent, give it clear boundaries:

- Preserve the explorer-style interface.
- Prefer direct manipulation over long explanation flows.
- Keep module pages consistent with the first six modules.
- Keep math logic, rendering logic, and UI components separated.
- Add tests for math utilities and state transformations.
- Avoid large rewrites unless the change improves consistency across modules.

A useful task prompt format:

```text
Update the <module> explorer in Form & Flow.
Keep the visualization-first interface.
Do not change unrelated modules.
Add or update tests for any math/state logic you touch.
Run pnpm build and pnpm test before summarizing the change.
```

## Deployment notes

Form & Flow is a Vite single-page application. For static hosting:

1. Run `pnpm build`.
2. Deploy the generated `dist/` directory.
3. If deploying under a nested path such as `https://username.github.io/form-and-flow/`, set Vite's `base` option to that path.
4. Configure the host to fall back deep routes such as `/modules/matrix/transformations` to `index.html`, otherwise direct refreshes on module routes may return 404.

Use `pnpm preview` only to inspect the production build locally; use a proper static hosting provider for public deployment.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
