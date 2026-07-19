import type { Locale } from '../i18n.ts'
import type {
  ExplorerDefinition,
  ExplorerStatus,
  ModuleCategory,
  ModuleDefinition,
  ModuleStatus,
} from './moduleTypes.ts'

type PlatformCopy = {
  shell: {
    brandName: string
    modules: string
    explore: string
    allModules: string
    tool: string
    toolSelectorAria: string
    help: string
    reset: string
    exportPng: string
    switchLanguage: string
    switchLanguageAria: string
    switchToLightMode: string
    switchToDarkMode: string
    collapse: string
    expand: string
    homeAria: string
    helpAria: string
    resetAria: string
    exportAria: string
  }
  moduleHome: {
    roadmapTitle: string
    roadmapSummary: string
  }
  moduleDetail: {
    observation: string
    openModule: string
  }
  comingSoon: {
    eyebrow: string
    readyTitle: string
    readyBody: string
    plannedExplorers: string
  }
  notFound: {
    title: string
    body: string
    back: string
  }
  statusLabels: Record<ModuleStatus | ExplorerStatus, string>
  categoryLabels: Record<ModuleCategory, string>
}

type ExplorerTranslation = Partial<Pick<ExplorerDefinition, 'title' | 'description' | 'thingsToTry' | 'observation' | 'whatChanges' | 'notes' | 'connections'>>

type ModuleTranslation = Partial<Pick<ModuleDefinition, 'title' | 'shortTitle' | 'description'>> & {
  explorers?: Record<string, ExplorerTranslation>
}

export const platformCopy: Record<Locale, PlatformCopy> = {
  en: {
    shell: {
      brandName: 'Form & Flow',
      modules: 'Modules',
      explore: 'Explore',
      allModules: 'All Modules',
      tool: 'Tool',
      toolSelectorAria: 'Select module tool',
      help: 'Notes',
      reset: 'Reset',
      exportPng: 'Export PNG',
      switchLanguage: '中文',
      switchLanguageAria: 'Switch language',
      switchToLightMode: 'Light mode',
      switchToDarkMode: 'Dark mode',
      collapse: 'Collapse module navigation',
      expand: 'Expand module navigation',
      homeAria: 'Form & Flow home',
      helpAria: 'Open current module notes',
      resetAria: 'Reset current module',
      exportAria: 'Export current visualization',
    },
    moduleHome: {
      roadmapTitle: 'Roadmap',
      roadmapSummary: 'Later modules are listed here as lower-priority slots.',
    },
    moduleDetail: {
      observation: 'Observation',
      openModule: 'Open module',
    },
    comingSoon: {
      eyebrow: 'Module Slot',
      readyTitle: 'Ready for implementation',
      readyBody:
        'This route, manifest, and navigation slot are reserved for a later visualization module.',
      plannedExplorers: 'Planned modules',
    },
    notFound: {
      title: 'Page not found',
      body: 'The requested module route does not exist yet.',
      back: 'Back to all modules',
    },
    statusLabels: {
      ready: 'ready',
      'in-progress': 'in progress',
      planned: 'planned',
    },
    categoryLabels: {
      'linear-algebra': 'Linear Algebra',
      calculus: 'Calculus',
      fourier: 'Fourier Analysis',
      probability: 'Probability',
      'differential-equations': 'Differential Equations',
      transforms: 'Transforms',
      'complex-numbers': 'Complex Numbers',
      optimization: 'Optimization',
      'machine-learning': 'Machine Learning',
      'vector-calculus': 'Vector Calculus',
      topology: 'Topology',
      'number-theory': 'Number Theory',
      'abstract-algebra': 'Abstract Algebra',
      other: 'Other',
    },
  },
  zh: {
    shell: {
      brandName: '形与流',
      modules: '模块',
      explore: '浏览',
      allModules: '全部模块',
      tool: '工具',
      toolSelectorAria: '选择模块工具',
      help: '笔记',
      reset: '重置',
      exportPng: '导出 PNG',
      switchLanguage: 'EN',
      switchLanguageAria: '切换语言',
      switchToLightMode: '浅色模式',
      switchToDarkMode: '深色模式',
      collapse: '收起模块导航',
      expand: '展开模块导航',
      homeAria: '形与流首页',
      helpAria: '打开当前模块笔记',
      resetAria: '重置当前模块',
      exportAria: '导出当前可视化',
    },
    moduleHome: {
      roadmapTitle: '后续模块规划中',
      roadmapSummary: '',
    },
    moduleDetail: {
      observation: '观察',
      openModule: '打开模块',
    },
    comingSoon: {
      eyebrow: '模块槽位',
      readyTitle: '已准备好实现',
      readyBody: '这个模块已预留位置，后续会补上对应的交互场景。',
      plannedExplorers: '规划中的模块',
    },
    notFound: {
      title: '页面未找到',
      body: '请求的模块路由还不存在。',
      back: '返回全部模块',
    },
    statusLabels: {
      ready: '已可用',
      'in-progress': '开发中',
      planned: '规划中',
    },
    categoryLabels: {
      'linear-algebra': '线性代数',
      calculus: '微积分',
      fourier: '傅里叶分析',
      probability: '概率',
      'differential-equations': '微分方程',
      transforms: '变换',
      'complex-numbers': '复数',
      optimization: '优化',
      'machine-learning': '机器学习',
      'vector-calculus': '向量微积分',
      topology: '拓扑',
      'number-theory': '数论',
      'abstract-algebra': '抽象代数',
      other: '其他',
    },
  },
}

const moduleTranslations: Partial<Record<Locale, Record<string, ModuleTranslation>>> = {
  zh: {
    matrix: {
      title: '矩阵与线性变换',
      shortTitle: '矩阵',
      description: '从基、网格、向量和线性映射的几何变化理解矩阵。',
      explorers: {
        'matrix-transformations': {
          title: '矩阵变换',
          description: '同一个基、网格和选定向量在矩阵序列下的变化。',
          observation: '矩阵的各列就是基向量的落点；线性性再把整个空间一起带过去。',
          whatChanges: '改变一列会移动一个基方向，以及所有包含该方向分量的向量。',
          notes: '相邻步骤之间的动画采用矩阵元素的逐项插值。',
          connections: ['线性映射也会出现在卷积、傅里叶分析和微分系统中。'],
        },
      },
    },
    calculus: {
      title: '微积分',
      shortTitle: '微积分',
      description: '通过运动中的几何近似观察局部变化与累积。',
      explorers: {
        derivative: {
          title: '导数',
          description: '割线逐渐收束为局部线性模型。',
          observation: '当 h 趋近于 0，平均斜率会收束到所选点的导数。',
          whatChanges: 'x₀ 决定观察位置，h 决定这次比较有多局部。',
        },
        integral: {
          title: '积分 / 面积近似',
          description: '由越来越细的分块拼成有符号面积。',
          observation: '分割变细时，面积估计逐渐稳定。',
          whatChanges: 'n 细化分割，取样方式决定每一小块如何代表原曲线。',
        },
        'fundamental-theorem': {
          title: '微积分基本定理',
          description: '把累积面积与瞬时高度放在同一个运动画面中。',
          observation: '函数高度 f(x) 就是累积面积曲线 A(x) 的斜率。',
          whatChanges: '移动 x 时，上方新加入的面积条与下方的切线方向同步变化。',
        },
        taylor: {
          title: '泰勒多项式',
          description: '用一个中心点的局部信息构造多项式。',
          observation: '每增加一阶，多项式就会在中心多匹配一阶导数。',
          whatChanges: '中心决定贴合发生的位置，阶数决定保留多少局部形状。',
        },
      },
    },
    fourier: {
      title: '傅里叶变换',
      shortTitle: '傅里叶',
      description: '把同一个信号看成曲线、缠绕以及一组旋转成分。',
      explorers: {
        spectrum: {
          title: '频率频谱',
          description: '先用缠绕探针检测频率，再用镜像系数对重建一个真实振动。',
          observation: '匹配的探针会留下可见系数；随后 +f 与 -f 两根箭头纵向抵消、沿实轴相加。',
          whatChanges: '切换观察方式会把频率检测、镜像频谱峰值和共轭频率对合成连成同一条直觉链。',
          notes: '信号采样于 t∈[0,1]；幅值归一化是显式可选项。',
        },
        reconstruction: {
          title: '信号重建',
          description: '由选定的旋转成分重新拼出信号。',
          observation: '加入更多系数时，重建曲线会逐渐恢复原信号的结构。',
          whatChanges: '系数集合的变化会同时反映在频谱柱和时间域近似上。',
          notes: '信号采样于 t∈[0,1]；幅值归一化是显式可选项。',
        },
        filtering: {
          title: '频率滤波',
          description: '通过编辑频率成分改变时间域信号。',
          observation: '滤波器先保留或抑制部分系数，再由剩余系数重建信号。',
          whatChanges: '移动截止位置会改变频谱中的边界，并立即传回时间曲线。',
          notes: '信号采样于 t∈[0,1]；幅值归一化是显式可选项。',
        },
      },
    },
    'differential-equations': {
      title: '微分方程',
      shortTitle: '微分方程',
      description: '局部变化规则展开为轨迹、相流和扩散。',
      explorers: {
        'slope-fields': {
          title: '斜率场与初值问题',
          description: '局部斜率规则与初值选出的数值轨迹。',
          observation: '斜率场包含所有局部方向，初值从中选出一条路径。',
          whatChanges: '移动初值会改变路径，但不会改变整个斜率场。',
        },
        'numerical-methods': {
          title: '数值方法',
          description: '三种逐步近似同一变化规则的方法。',
          observation: 'Euler、中点法和 RK4 的区别在于迈步前采样了多少局部方向。',
          whatChanges: '步数变化会显露这些近似在何处一致、又在何处漂移。',
        },
        'phase-portraits': {
          title: '相图与向量场',
          description: '二维状态沿局部向量场运动。',
          observation: '每个箭头给出局部速度，轨迹把这些速度连接成整体路径。',
          whatChanges: '改变初始状态会在同一个流中选择不同路径。',
        },
        pendulum: {
          title: '摆与振子',
          description: '角度与角速度构成一条相空间轨道。',
          observation: '把位置和速度合成一个状态后，摆会变成一阶相流。',
          whatChanges: '阻尼会让轨道收缩，初始角度和速度决定起始能量。',
        },
        population: {
          title: '种群动力学',
          description: '捕食者与猎物通过反馈回路相互耦合。',
          observation: '一个种群的增长会改变另一个种群接下来的运动方向。',
          whatChanges: '改变速率会重塑相流，并移动系统的平衡点。',
        },
        'heat-equation': {
          title: '热方程 / 扩散',
          description: '温度曲线在局部曲率的驱动下逐渐平滑。',
          observation: '峰值冷却、谷底升温，因为每一点都会响应附近的平均温度。',
          whatChanges: '扩散率改变平滑速度，固定冷端让热量可以离开杆。',
        },
      },
    },
    probability: {
      title: '概率直觉',
      shortTitle: '概率',
      description: '通过人群、面积、重复样本和分布读取概率。',
      explorers: {
        'conditional-probability': {
          title: '条件概率',
          description: '同一个人群格中的两种条件视角。',
          observation: '条件化会把原来的全集替换成一个更小的分母。',
          whatChanges: '切换 P(A|B) 与 P(B|A) 会改变哪一组高亮区域被视作整体。',
        },
        bayes: {
          title: '贝叶斯规则',
          description: '把同一证据的不同来源汇总为后验概率。',
          observation: '自然频数把分子和分母直接显示成可见人数。',
          whatChanges: '基础率会改变证据中有多少部分可能真正来自这个假设。',
        },
        'medical-test': {
          title: '医学测试悖论',
          description: '把测试准确率放回患病率与假阳性中理解。',
          observation: '阳性结果混合了真阳性和假阳性，它们的比例才决定结果的含义。',
          whatChanges: '即使灵敏度和特异度不变，患病率也能改变阳性预测值。',
        },
        binomial: {
          title: '二项分布',
          description: '重复独立试验中的成功次数分布。',
          observation: '每根柱子收集所有具有相同成功次数的试验序列。',
          whatChanges: 'p 会移动分布，n 会改变它的中心和宽度。',
        },
        'continuous-density': {
          title: '连续概率密度',
          description: '把概率表示为密度曲线下的面积。',
          observation: '曲线高度表示局部集中程度，区间面积才是概率。',
          whatChanges: '移动区间会让高亮概率质量穿过不同的密度区域。',
        },
        'central-limit-theorem': {
          title: '中心极限定理',
          description: '重复样本均值形成自己的分布。',
          observation: '取平均会保留中心，同时缩小典型波动。',
          whatChanges: '样本量增大时，均值分布会变窄，并常常更接近钟形。',
        },
        'random-variable-sum': {
          title: '随机变量：X + Y',
          description: '由所有独立配对拼成的和分布。',
          observation: '同一条对角线上的格子都会贡献给相同的输出值。',
          whatChanges: '任一来源分布的变化都会重加权配对网格，并改变输出柱。',
        },
      },
    },
    convolution: {
      title: '卷积',
      shortTitle: '卷积',
      description: '同一个滑动乘积求和模式，出现在序列、概率、信号、图像与多项式中。',
      explorers: {
        discrete: {
          title: '离散卷积',
          description: '在一个场景中看清翻转、平移、重叠、相乘和求和。',
          observation: '翻转并平移 b，会显露组成当前输出 y[k] 的各项乘积。',
          whatChanges: '改变 k 会移动重叠窗口，并选择一组新的求和项。',
        },
        probability: {
          title: '概率和',
          description: '卷积在独立随机变量相加中的形式。',
          observation: '总和相同的独立配对会累积成一个输出概率。',
          whatChanges: '改变选中的和，会沿着配对网格的一条对角线移动。',
        },
        signal: {
          title: '信号滤波',
          description: '卷积在局部信号滤波中的形式。',
          observation: '一段短卷积核把附近样本变成一个加权输出。',
          whatChanges: '改变卷积核会改变哪些局部特征被保留或抑制。',
        },
        'image-kernel': {
          title: '图像卷积核',
          description: '卷积在二维像素邻域中的形式。',
          observation: '同一个局部加权和可以作用在二维像素邻域上。',
          whatChanges: '改变卷积核会改变每个邻域映射成输出图像的方式。',
        },
        polynomial: {
          title: '多项式乘法',
          description: '卷积在多项式系数合并中的形式。',
          observation: '总次数相同的乘积会收集到同一个系数。',
          whatChanges: '改变 k 会选择一条新的系数乘积对角线。',
        },
        continuous: {
          title: '连续卷积',
          description: '离散重叠和在连续曲线上的对应形式。',
          observation: '离散乘积和在连续情形中变成两条曲线乘积下的面积。',
          whatChanges: '改变 t 会平移其中一条曲线，并改变重叠积分。',
        },
      },
    },
    'complex-plane': {
      title: '复平面',
      shortTitle: '复平面',
      description: '探索复数、映射、保角变换和图像环路。',
      explorers: {
        basics: {
          title: '作为点的复数',
          description: '观察复数运算如何作用在点、曲线和区域上。',
          thingsToTry: ['用几何方式读取复数', '把公式和平面运动联系起来'],
        },
        multiplication: {
          title: '作为旋转和缩放的乘法',
          description: '观察复数运算如何作用在点、曲线和区域上。',
          thingsToTry: ['用几何方式读取复数', '把公式和平面运动联系起来'],
        },
        maps: {
          title: '复函数映射',
          description: '观察复数运算如何作用在点、曲线和区域上。',
          thingsToTry: ['用几何方式读取复数', '把公式和平面运动联系起来'],
        },
        'image-loops': {
          title: '图像环路',
          description: '观察复数运算如何作用在点、曲线和区域上。',
          thingsToTry: ['用几何方式读取复数', '把公式和平面运动联系起来'],
        },
      },
    },
    optimization: {
      title: '优化 / 梯度下降',
      shortTitle: '优化',
      description: '可视化优化过程和基于梯度的方法。',
      explorers: {
        'one-dimensional-descent': {
          title: '一维梯度下降',
          description: '在损失地形中移动，并比较优化器行为。',
          thingsToTry: ['解释梯度', '比较学习率和优化路径'],
        },
        'contour-descent': {
          title: '损失地形与等高线',
          description: '在损失地形中移动，并比较优化器行为。',
          thingsToTry: ['解释梯度', '比较学习率和优化路径'],
        },
        'learning-rate': {
          title: '学习率',
          description: '在损失地形中移动，并比较优化器行为。',
          thingsToTry: ['解释梯度', '比较学习率和优化路径'],
        },
        momentum: {
          title: '动量',
          description: '在损失地形中移动，并比较优化器行为。',
          thingsToTry: ['解释梯度', '比较学习率和优化路径'],
        },
        'linear-regression': {
          title: '线性回归训练',
          description: '在损失地形中移动，并比较优化器行为。',
          thingsToTry: ['解释梯度', '比较学习率和优化路径'],
        },
        'stochastic-gradient-descent': {
          title: '随机 / 小批量梯度下降',
          description: '在损失地形中移动，并比较优化器行为。',
          thingsToTry: ['解释梯度', '比较学习率和优化路径'],
        },
      },
    },
    'neural-networks': {
      title: '神经网络',
      shortTitle: '神经网络',
      description: '构建、训练并理解简单神经网络。',
      explorers: {
        perceptron: {
          title: '感知机基础',
          description: '用可视化模型连接参数、激活和训练。',
          thingsToTry: ['读懂网络结构', '把训练和参数变化联系起来'],
        },
        'forward-pass': {
          title: '前向传播',
          description: '用可视化模型连接参数、激活和训练。',
          thingsToTry: ['读懂网络结构', '把训练和参数变化联系起来'],
        },
        training: {
          title: '训练',
          description: '用可视化模型连接参数、激活和训练。',
          thingsToTry: ['读懂网络结构', '把训练和参数变化联系起来'],
        },
      },
    },
    'vector-field': {
      title: '向量场',
      shortTitle: '向量场',
      description: '可视化向量场、流、散度、旋度、通量和环流。',
      explorers: {
        basics: {
          title: '向量场基础',
          description: '在二维向量场中跟随箭头、粒子和局部探针。',
          thingsToTry: ['理解每个点上的向量', '把局部箭头和整体流动联系起来'],
        },
        flow: {
          title: '流与流线',
          description: '在二维向量场中跟随箭头、粒子和局部探针。',
          thingsToTry: ['理解每个点上的向量', '把局部箭头和整体流动联系起来'],
        },
        divergence: {
          title: '散度',
          description: '在二维向量场中跟随箭头、粒子和局部探针。',
          thingsToTry: ['理解每个点上的向量', '把局部箭头和整体流动联系起来'],
        },
        curl: {
          title: '旋度',
          description: '在二维向量场中跟随箭头、粒子和局部探针。',
          thingsToTry: ['理解每个点上的向量', '把局部箭头和整体流动联系起来'],
        },
        'flux-circulation': {
          title: '通量与环流',
          description: '在二维向量场中跟随箭头、粒子和局部探针。',
          thingsToTry: ['理解每个点上的向量', '把局部箭头和整体流动联系起来'],
        },
        'gradient-fields': {
          title: '梯度场',
          description: '在二维向量场中跟随箭头、粒子和局部探针。',
          thingsToTry: ['理解每个点上的向量', '把局部箭头和整体流动联系起来'],
        },
      },
    },
    'fourier-series': {
      title: '傅里叶级数 / 圆轮',
      shortTitle: '傅里叶级数',
      description: '用圆轮和傅里叶级数绘制周期函数。',
      explorers: {
        draw: {
          title: '绘制路径',
          description: '把路径转换为旋转向量，并检查它们的系数。',
          thingsToTry: ['把路径表示为复数采样', '把系数和圆联系起来'],
        },
        epicycles: {
          title: '圆轮动画',
          description: '把路径转换为旋转向量，并检查它们的系数。',
          thingsToTry: ['把路径表示为复数采样', '把系数和圆联系起来'],
        },
        spectrum: {
          title: '系数频谱',
          description: '把路径转换为旋转向量，并检查它们的系数。',
          thingsToTry: ['把路径表示为复数采样', '把系数和圆联系起来'],
        },
        reconstruction: {
          title: '重建质量',
          description: '把路径转换为旋转向量，并检查它们的系数。',
          thingsToTry: ['把路径表示为复数采样', '把系数和圆联系起来'],
        },
        intuition: {
          title: '为什么有效',
          description: '把路径转换为旋转向量，并检查它们的系数。',
          thingsToTry: ['把路径表示为复数采样', '把系数和圆联系起来'],
        },
      },
    },
    'group-theory': {
      title: '群论 / 对称性',
      shortTitle: '群论',
      description: '探索对称性、群、作用、表格、图示和变换。',
      explorers: {
        'symmetry-actions': {
          title: '对称作用',
          description: '用有限对称性让抽象群结构可见。',
          thingsToTry: ['组合不同作用', '从表格和图示中读取群结构'],
        },
        composition: {
          title: '复合就是运算',
          description: '用有限对称性让抽象群结构可见。',
          thingsToTry: ['组合不同作用', '从表格和图示中读取群结构'],
        },
        'cayley-table': {
          title: '凯莱表构建器',
          description: '用有限对称性让抽象群结构可见。',
          thingsToTry: ['组合不同作用', '从表格和图示中读取群结构'],
        },
        'cayley-diagram': {
          title: '生成元与凯莱图',
          description: '用有限对称性让抽象群结构可见。',
          thingsToTry: ['组合不同作用', '从表格和图示中读取群结构'],
        },
        permutations: {
          title: '置换',
          description: '用有限对称性让抽象群结构可见。',
          thingsToTry: ['组合不同作用', '从表格和图示中读取群结构'],
        },
        'subgroups-cosets': {
          title: '子群与陪集',
          description: '用有限对称性让抽象群结构可见。',
          thingsToTry: ['组合不同作用', '从表格和图示中读取群结构'],
        },
        isomorphism: {
          title: '同构匹配器',
          description: '用有限对称性让抽象群结构可见。',
          thingsToTry: ['组合不同作用', '从表格和图示中读取群结构'],
        },
      },
    },
    topology: {
      title: '拓扑 / 绕数',
      shortTitle: '拓扑',
      description: '可视化探索拓扑和绕数。',
      explorers: {
        'winding-number': {
          title: '绕数',
          description: '用环路和目标点观察拓扑不变量。',
          thingsToTry: ['追踪环路', '把绕数和内外判断直觉联系起来'],
        },
        regions: {
          title: '内部 / 外部区域',
          description: '用环路和目标点观察拓扑不变量。',
          thingsToTry: ['追踪环路', '把绕数和内外判断直觉联系起来'],
        },
        homotopy: {
          title: '同伦不变性',
          description: '用环路和目标点观察拓扑不变量。',
          thingsToTry: ['追踪环路', '把绕数和内外判断直觉联系起来'],
        },
        'image-loops': {
          title: '图像环路与定义域着色',
          description: '用环路和目标点观察拓扑不变量。',
          thingsToTry: ['追踪环路', '把绕数和内外判断直觉联系起来'],
        },
        'root-counting': {
          title: '根计数直觉',
          description: '用环路和目标点观察拓扑不变量。',
          thingsToTry: ['追踪环路', '把绕数和内外判断直觉联系起来'],
        },
      },
    },
    'number-theory-fractals': {
      title: '数论 / 分形',
      shortTitle: '数与分形',
      description: '发现数字中的模式和美丽分形。',
      explorers: {
        'modular-circles': {
          title: '模乘圆',
          description: '观察简单离散规则和迭代规则如何产生复杂图案。',
          thingsToTry: ['尝试迭代', '从视觉中读取数字模式'],
        },
        'prime-patterns': {
          title: '素数模式',
          description: '观察简单离散规则和迭代规则如何产生复杂图案。',
          thingsToTry: ['尝试迭代', '从视觉中读取数字模式'],
        },
        collatz: {
          title: '考拉兹轨道',
          description: '观察简单离散规则和迭代规则如何产生复杂图案。',
          thingsToTry: ['尝试迭代', '从视觉中读取数字模式'],
        },
        'ifs-chaos-game': {
          title: 'IFS / 混沌游戏',
          description: '观察简单离散规则和迭代规则如何产生复杂图案。',
          thingsToTry: ['尝试迭代', '从视觉中读取数字模式'],
        },
        'mandelbrot-julia': {
          title: 'Mandelbrot 与 Julia',
          description: '观察简单离散规则和迭代规则如何产生复杂图案。',
          thingsToTry: ['尝试迭代', '从视觉中读取数字模式'],
        },
        'newton-fractal': {
          title: '牛顿分形',
          description: '观察简单离散规则和迭代规则如何产生复杂图案。',
          thingsToTry: ['尝试迭代', '从视觉中读取数字模式'],
        },
        'hilbert-curve': {
          title: 'Hilbert 曲线',
          description: '观察简单离散规则和迭代规则如何产生复杂图案。',
          thingsToTry: ['尝试迭代', '从视觉中读取数字模式'],
        },
      },
    },
  },
}

export function localizeModule(module: ModuleDefinition, locale: Locale): ModuleDefinition {
  const translation = moduleTranslations[locale]?.[module.id]
  if (!translation) return module
  return {
    ...module,
    title: translation.title ?? module.title,
    shortTitle: translation.shortTitle ?? module.shortTitle,
    description: translation.description ?? module.description,
    explorers: module.explorers.map((explorer) => localizeExplorer(module.id, explorer, locale)),
  }
}

export function localizeExplorer(moduleId: string, explorer: ExplorerDefinition, locale: Locale): ExplorerDefinition {
  const translation = moduleTranslations[locale]?.[moduleId]?.explorers?.[explorer.id]
  if (!translation) return explorer
  return {
    ...explorer,
    title: translation.title ?? explorer.title,
    description: translation.description ?? explorer.description,
    thingsToTry: translation.thingsToTry ?? explorer.thingsToTry,
    observation: translation.observation ?? explorer.observation,
    whatChanges: translation.whatChanges ?? explorer.whatChanges,
    notes: translation.notes ?? explorer.notes,
    connections: translation.connections ?? explorer.connections,
  }
}

export function statusLabel(status: ModuleStatus | ExplorerStatus, locale: Locale): string {
  return platformCopy[locale].statusLabels[status]
}

export function categoryLabel(category: ModuleCategory, locale: Locale): string {
  return platformCopy[locale].categoryLabels[category]
}
