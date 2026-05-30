# Form & Flow

Languages: English | [中文](README.zh-CN.md)

Interactive math visualization modules built with React, Vite, Canvas, and Three.js.

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
