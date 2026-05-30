# 形与流

语言：[English](README.md) | 中文

形与流是一个用于建立直觉理解的交互式数学可视化工具。它不是课程、教材或教学项目；它帮助用户通过拖动、调参、播放动画和查看简短读数来观察数学对象如何变化。

项目使用 React、Vite、Canvas 和 Three.js 构建。

## 本地开发

安装依赖后启动 Vite 开发服务器：

```sh
pnpm install
pnpm dev
```

不要在没有检查当前 Vite/esbuild 开发服务器安全公告、并做好网络保护的情况下，用 `--host` 将 Vite 开发服务器暴露到公网。公开部署请使用生产构建：

```sh
pnpm build
```

## 静态部署

如果应用部署在嵌套路径下，请为该路径设置 Vite 的 `base` 选项，确保公共资源能正确加载。静态托管服务需要把 `/modules/matrix/transformations` 这类模块路由回退到 `index.html`；否则直接刷新深层路由时可能会 404。
