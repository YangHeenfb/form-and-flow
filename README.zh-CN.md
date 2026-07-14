# 形与流

[![CI](https://github.com/YangHeenfb/form-and-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/YangHeenfb/form-and-flow/actions/workflows/ci.yml)

语言：[English](README.md) | 中文

**形与流（Form & Flow）** 是一个交互式数学实验台，通过运动、形状和直接操作帮助学习者理解抽象结构。目前完成的六个模块共有 27 个 explorer，覆盖线性代数、微积分、傅里叶分析、微分方程、概率和卷积。

## 可视化预览

| 线性变换 | 微积分 | 傅里叶 |
|---|---|---|
| ![非单位矩阵变换预览](docs/media/matrix-transform.gif) | ![导数运动预览](docs/media/calculus-derivative.gif) | ![傅里叶频谱预览](docs/media/fourier-spectrum.gif) |
| **微分方程** | **概率** | **卷积** |
| ![斜率场预览](docs/media/differential-slope-fields.gif) | ![条件概率预览](docs/media/probability-conditional.gif) | ![离散卷积预览](docs/media/convolution-discrete.gif) |

## 已完成模块

| 模块 | Explorer 数量 | 内容 |
|---|---:|---|
| 矩阵与线性变换 | 1 | 变换序列、基向量和自定义向量、行列式、二维与三维视图 |
| 微积分 | 4 | 导数、黎曼和、微积分基本定理、泰勒多项式 |
| 傅里叶变换 | 3 | 频谱、信号重建、频率滤波 |
| 微分方程 | 6 | 斜率场、数值方法、相图、振子、种群动力学、扩散 |
| 概率直觉 | 7 | 条件概率、贝叶斯、医学检测、概率分布、中心极限定理、随机变量和 |
| 卷积 | 6 | 离散与连续卷积、概率和、信号滤波、图像核、多项式乘法 |

每个 explorer 都有稳定的 `/modules/{module}/{explorer}` 深链，并在适用时共享语言、主题、专注模式、重置和导出能力。

## 技术架构

- React 19 与 TypeScript 6 负责应用结构和类型化数学状态。
- 大部分图形使用 Canvas 2D；只有进入 Matrix 三维视图时才加载 Three.js。
- KaTeX 随数学课程内容按需加载，不进入模块首页首屏。
- 纯数值内核与渲染逻辑分离，并由 Vitest 覆盖。
- 模块 manifest 定义路由和懒加载入口，平台外壳负责导航和共享操作。
- Playwright 覆盖全部 27 个已完成 explorer、响应式布局、深链、无障碍和 bundle 边界。

这里的数值方法以教学演示为目的。采样密度、时间步长、有限网格、截断和边界条件都会影响显示结果；可视化不能替代数学证明或科研级求解器。

## 本地开发

需要 Node.js 20.19 或更高版本，以及 pnpm 11.0.9。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

常用检查命令：

```sh
pnpm typecheck       # TypeScript 类型检查
pnpm test            # 单元与行为测试
pnpm build           # 生产构建
pnpm check:bundle    # 首屏与分块体积预算
pnpm test:e2e        # Chromium 流程与无障碍检查
pnpm check           # 单元测试、构建和 bundle 审计
```

第一次运行浏览器测试时，可能需要执行 `pnpm exec playwright install chromium`。

## 仓库结构

```text
src/
├── components/      # 共享可视化组件
├── core/            # 可复用 UI 和应用工具
├── math/            # 数值计算内核
├── modules/         # 模块 manifest、explorer、状态与渲染适配
├── platform/        # 目录、路由、外壳与本地化
├── render/          # Canvas 与 Three.js 辅助逻辑
├── state/           # 共享状态与 URL 状态
└── test/            # 测试配置和辅助工具
e2e/                 # Playwright 测试
public/              # 静态及优化后的视觉资源
scripts/             # 构建审计脚本
```

## 项目范围与局限

模块目录中还展示了未来主题，但只有上面列出的六个模块属于已完成状态。目前没有公开托管的 Demo；可以本地运行，或将 `dist/` 发布到支持 SPA 路由回退的静态托管服务。

当前优先级是数学正确性、响应式交互、无障碍和清晰的 explorer 边界，而不是临时增加尚未充分验证的新学科内容。

## 许可证

MIT，详见 [LICENSE](LICENSE)。
