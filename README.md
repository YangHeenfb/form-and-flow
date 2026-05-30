# Form & Flow

Languages: English | [中文](README.zh-CN.md)

Form & Flow is an interactive math visualization tool for building intuition. It is not a course, textbook, or teaching package; it helps users explore mathematical objects by dragging, tuning parameters, playing animations, and reading lightweight values.

Built with React, Vite, Canvas, and Three.js.

## Local Development

Install dependencies, then run the Vite dev server:

```sh
pnpm install
pnpm dev
```

Do not expose the Vite development server to the public internet with `--host` unless you have reviewed the current Vite/esbuild dev-server advisories and added the necessary network protections. Use a production build for public hosting:

```sh
pnpm build
```

## Static Hosting

If the app is deployed under a nested path, set Vite's `base` option for that path so public assets resolve correctly. Configure the static host to fall back module routes such as `/modules/matrix/transformations` to `index.html`; otherwise direct refreshes on deep routes can 404.
