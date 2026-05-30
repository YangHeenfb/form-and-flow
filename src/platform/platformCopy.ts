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
    thingsToTry: string
    openExplorer: string
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

type ExplorerTranslation = Partial<Pick<ExplorerDefinition, 'title' | 'description' | 'thingsToTry'>>

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
      help: 'Reference',
      reset: 'Reset',
      exportPng: 'Export PNG',
      switchLanguage: '中文',
      switchLanguageAria: 'Switch language',
      switchToLightMode: 'Light mode',
      switchToDarkMode: 'Dark mode',
      collapse: 'Collapse module navigation',
      expand: 'Expand module navigation',
      homeAria: 'Form & Flow home',
      helpAria: 'Open current module reference',
      resetAria: 'Reset current module',
      exportAria: 'Export current visualization',
    },
    moduleHome: {
      roadmapTitle: 'Roadmap',
      roadmapSummary: 'Later modules are listed here as lower-priority slots.',
    },
    moduleDetail: {
      thingsToTry: 'Things to try',
      openExplorer: 'Open explorer',
    },
    comingSoon: {
      eyebrow: 'Module Slot',
      readyTitle: 'Ready for implementation',
      readyBody:
        'This route, manifest, and navigation slot are reserved for a later visualization module.',
      plannedExplorers: 'Planned explorers',
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
      help: '参考',
      reset: '重置',
      exportPng: '导出 PNG',
      switchLanguage: 'EN',
      switchLanguageAria: '切换语言',
      switchToLightMode: '浅色模式',
      switchToDarkMode: '深色模式',
      collapse: '收起模块导航',
      expand: '展开模块导航',
      homeAria: '形与流首页',
      helpAria: '打开当前模块参考',
      resetAria: '重置当前模块',
      exportAria: '导出当前可视化',
    },
    moduleHome: {
      roadmapTitle: '后续模块规划中',
      roadmapSummary: '',
    },
    moduleDetail: {
      thingsToTry: '可以尝试',
      openExplorer: '开始探索',
    },
    comingSoon: {
      eyebrow: '模块槽位',
      readyTitle: '已准备好实现',
      readyBody: '这个模块已预留位置，后续会补上对应的交互场景。',
      plannedExplorers: '规划中的工具',
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
      description: '可视化矩阵、向量空间、基向量与线性变换。',
      explorers: {
        'matrix-transformations': {
          title: '矩阵变换',
          description: '探索矩阵序列如何移动网格、基向量和自定义向量。',
          thingsToTry: ['组合矩阵变换', '读取变换后的基向量', '将行列式与面积或体积缩放联系起来'],
        },
      },
    },
    calculus: {
      title: '微积分',
      shortTitle: '微积分',
      description: '探索导数、积分、微积分基本定理和泰勒近似。',
      explorers: {
        derivative: {
          title: '导数',
          description: '观察割线如何逐渐变成切线。',
          thingsToTry: ['把公式和运动、形状联系起来', '用滑块比较数值近似'],
        },
        integral: {
          title: '积分 / 黎曼和',
          description: '用矩形和梯形近似有符号面积。',
          thingsToTry: ['把公式和运动、形状联系起来', '用滑块比较数值近似'],
        },
        'fundamental-theorem': {
          title: '微积分基本定理',
          description: '把累积面积和瞬时高度联系起来。',
          thingsToTry: ['把公式和运动、形状联系起来', '用滑块比较数值近似'],
        },
        taylor: {
          title: '泰勒多项式',
          description: '围绕一个中心构造局部多项式近似。',
          thingsToTry: ['把公式和运动、形状联系起来', '用滑块比较数值近似'],
        },
      },
    },
    fourier: {
      title: '傅里叶变换',
      shortTitle: '傅里叶',
      description: '观察信号如何在时间域和频率域之间转换。',
      explorers: {
        spectrum: {
          title: '频率频谱',
          description: '扫描多个频率来构建频谱。',
          thingsToTry: ['理解频率成分', '把视觉运动和数值频谱联系起来'],
        },
        reconstruction: {
          title: '信号重建',
          description: '用选定的系数重建信号。',
          thingsToTry: ['理解频率成分', '把视觉运动和数值频谱联系起来'],
        },
        filtering: {
          title: '频率滤波',
          description: '保留或移除频段，并比较信号变化。',
          thingsToTry: ['理解频率成分', '把视觉运动和数值频谱联系起来'],
        },
      },
    },
    'differential-equations': {
      title: '微分方程',
      shortTitle: '微分方程',
      description: '交互式 ODE 求解器和系统动力学可视化。',
      explorers: {
        'slope-fields': {
          title: '斜率场与初值问题',
          description: '探索局部变化规则如何生成整体运动。',
          thingsToTry: ['读懂变化规则', '比较数值运动和可视化轨迹'],
        },
        'numerical-methods': {
          title: '数值方法',
          description: '探索局部变化规则如何生成整体运动。',
          thingsToTry: ['读懂变化规则', '比较数值运动和可视化轨迹'],
        },
        'phase-portraits': {
          title: '相图与向量场',
          description: '探索局部变化规则如何生成整体运动。',
          thingsToTry: ['读懂变化规则', '比较数值运动和可视化轨迹'],
        },
        pendulum: {
          title: '摆与振子',
          description: '探索局部变化规则如何生成整体运动。',
          thingsToTry: ['读懂变化规则', '比较数值运动和可视化轨迹'],
        },
        population: {
          title: '种群动力学',
          description: '探索局部变化规则如何生成整体运动。',
          thingsToTry: ['读懂变化规则', '比较数值运动和可视化轨迹'],
        },
        'heat-equation': {
          title: '热方程 / 扩散',
          description: '探索局部变化规则如何生成整体运动。',
          thingsToTry: ['读懂变化规则', '比较数值运动和可视化轨迹'],
        },
      },
    },
    probability: {
      title: '概率直觉',
      shortTitle: '概率',
      description: '把概率公式转化为可见的人群、面积、样本和分布。',
      explorers: {
        'conditional-probability': {
          title: '条件概率',
          description: '在人群格中比较 P(A | B) 与 P(B | A)。',
          thingsToTry: ['分清当前正在观察的总体', '比较 P(A|B) 和 P(B|A) 时不混淆分母'],
        },
        bayes: {
          title: '贝叶斯规则',
          description: '用自然频数理解证据出现后如何更新假设。',
          thingsToTry: ['用人数理解证据来自哪里', '观察基础率如何影响后验概率'],
        },
        'medical-test': {
          title: '医学测试悖论',
          description: '观察基础率和假阳性如何改变测试结果的含义。',
          thingsToTry: ['分清测试准确率和结果可信度', '看假阳性如何改变阳性结果含义'],
        },
        binomial: {
          title: '二项分布',
          description: '构造重复独立试验中成功次数的分布。',
          thingsToTry: ['读懂成功次数分布', '观察 n 和 p 如何移动柱形图'],
        },
        'continuous-density': {
          title: '连续概率密度',
          description: '把连续概率读成密度曲线下的面积。',
          thingsToTry: ['把概率读成面积', '分清密度高度和概率'],
        },
        'central-limit-theorem': {
          title: '中心极限定理',
          description: '观察样本均值如何变窄并接近钟形。',
          thingsToTry: ['分清原始分布和样本均值分布', '观察 n 如何缩小平均数的波动'],
        },
        'random-variable-sum': {
          title: '随机变量：X + Y',
          description: '通过汇总所有独立配对来组合两个离散分布。',
          thingsToTry: ['用配对网格理解随机变量相加', '观察相同和如何汇总成输出分布'],
        },
      },
    },
    convolution: {
      title: '卷积',
      shortTitle: '卷积',
      description: '通过滑动、重叠、概率和、信号、图像与多项式理解卷积。',
      explorers: {
        discrete: {
          title: '离散卷积',
          description: '通过滑动、相乘和求和，看到卷积作为可复用模式的含义。',
          thingsToTry: ['看到翻转、平移、重叠、相乘、求和', '连接不同语境中的卷积'],
        },
        probability: {
          title: '概率和',
          description: '通过滑动、相乘和求和，看到卷积作为可复用模式的含义。',
          thingsToTry: ['看到翻转、平移、重叠、相乘、求和', '连接不同语境中的卷积'],
        },
        signal: {
          title: '信号滤波',
          description: '通过滑动、相乘和求和，看到卷积作为可复用模式的含义。',
          thingsToTry: ['看到翻转、平移、重叠、相乘、求和', '连接不同语境中的卷积'],
        },
        'image-kernel': {
          title: '图像卷积核',
          description: '通过滑动、相乘和求和，看到卷积作为可复用模式的含义。',
          thingsToTry: ['看到翻转、平移、重叠、相乘、求和', '连接不同语境中的卷积'],
        },
        polynomial: {
          title: '多项式乘法',
          description: '通过滑动、相乘和求和，看到卷积作为可复用模式的含义。',
          thingsToTry: ['看到翻转、平移、重叠、相乘、求和', '连接不同语境中的卷积'],
        },
        continuous: {
          title: '连续卷积',
          description: '通过滑动、相乘和求和，看到卷积作为可复用模式的含义。',
          thingsToTry: ['看到翻转、平移、重叠、相乘、求和', '连接不同语境中的卷积'],
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
  }
}

export function statusLabel(status: ModuleStatus | ExplorerStatus, locale: Locale): string {
  return platformCopy[locale].statusLabels[status]
}

export function categoryLabel(category: ModuleCategory, locale: Locale): string {
  return platformCopy[locale].categoryLabels[category]
}
