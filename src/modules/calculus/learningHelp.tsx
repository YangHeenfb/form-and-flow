import { Formula } from '../../core/ui/Formula.tsx'
import type { HelpTopic } from '../../core/ui/LearningHelp.tsx'
import type { Locale } from '../../i18n.ts'

export type CalculusHelpTopicId =
  | 'overview'
  | 'graph'
  | 'function'
  | 'derivative'
  | 'secant-slope'
  | 'derivative-notation'
  | 'secant-tangent'
  | 'limit'
  | 'integral'
  | 'riemann-sum'
  | 'signed-area'
  | 'fundamental-theorem'
  | 'accumulation'
  | 'taylor'
  | 'approximation'
  | 'formula'
  | 'values'

type LearningCopy = {
  entryTitle: string
  entryHint: string
  openOverview: string
  openGraph: string
  close: string
}

export const calculusLearningCopy: Record<Locale, LearningCopy> = {
  en: {
    entryTitle: 'Notes',
    entryHint: 'Short observations connecting the graph, formula, and controls.',
    openOverview: 'Notes',
    openGraph: 'Visual notes',
    close: 'Close notes',
  },
  zh: {
    entryTitle: '笔记',
    entryHint: '把图像、公式和控制参数联系起来的简短观察。',
    openOverview: '笔记',
    openGraph: '视觉笔记',
    close: '关闭笔记',
  },
}

export function getCalculusHelpTopics(locale: Locale, lessonId: string): Record<CalculusHelpTopicId, HelpTopic> {
  return locale === 'zh' ? zhTopics(lessonId) : enTopics(lessonId)
}

export function conceptTopicForLesson(lessonId: string): CalculusHelpTopicId {
  if (lessonId === 'integral') return 'integral'
  if (lessonId === 'fundamental-theorem') return 'fundamental-theorem'
  if (lessonId === 'taylor') return 'taylor'
  return 'derivative'
}

function zhTopics(lessonId: string): Record<CalculusHelpTopicId, HelpTopic> {
  const graphTopic = zhGraphTopic(lessonId)

  return {
    overview: {
      eyebrow: '笔记',
      title: '变化与累积',
      summary: '四个画面围绕同一组关系展开：局部变化、连续累积、两者的连接，以及用局部信息重建函数形状。',
      sections: [
        {
          title: '观察',
          items: [
            '导数把曲线在一点附近压缩成一个局部线性模型。',
            '积分把连续分布的小贡献累积成一个总量。',
            '基本定理把累积曲线的斜率重新连回原函数高度。',
            '泰勒多项式把同一点的导数信息逐阶编码进多项式。',
          ],
        },
        {
          title: '变化关系',
          items: [
            '位置参数移动正在被局部观察或累积到的点。',
            '步长、分块数和阶数控制近似所保留的尺度或信息量。',
            '图像中的运动与右侧公式使用同一组变量。',
          ],
        },
      ],
    },
    graph: graphTopic,
    function: {
      eyebrow: '术语',
      title: '函数 f(x)',
      summary: (
        <>
          函数可以先理解成“输入一个 <Formula tex="x" />，输出一个高度 <Formula tex="f(x)" />”的规则。图上的曲线就是所有这些输入和输出连成的形状。
        </>
      ),
      sections: [
        {
          title: '为什么总是在看曲线',
          items: [
            '横坐标 x 是输入。',
            '纵坐标 f(x) 是输出，也可以看成曲线在这个位置的高度。',
            '导数、积分和泰勒近似都在研究这条曲线的不同性质。',
          ],
        },
      ],
    },
    derivative: {
      eyebrow: '术语',
      title: '导数',
      summary: (
        <>
          在可导点附近，函数可以由一段线性变化来近似；导数 <Formula tex="f'(x)" /> 就是这段局部线性的斜率。
        </>
      ),
      sections: [
        {
          title: '为什么用斜率理解导数',
          items: [
            '直线的斜率表示“往右走 1，往上或往下走多少”。',
            '曲线每一点的方向都可能不同，所以我们看那一点附近的切线斜率。',
            '如果切线很陡，函数变化快；如果切线接近水平，函数变化慢。',
            '把每一点的局部线性变化收集起来，会得到新的函数 f′(x)。',
          ],
        },
      ],
    },
    'secant-slope': {
      eyebrow: '符号',
      title: '割线斜率 m_h',
      summary: (
        <>
          <Formula tex="m_h" /> 是当前步长 <Formula tex="h" /> 下的割线斜率，也就是两个点之间的平均变化率。
        </>
      ),
      sections: [
        {
          title: '它和滑杆的关系',
          items: [
            <>
              <Formula tex="h" /> 滑杆改变第二个点离 <Formula tex="x_0" /> 有多远。
            </>,
            <>
              <Formula tex="m_h" /> 会跟着 <Formula tex="h" /> 改变，因为它算的是当前这两个点之间的斜率。
            </>,
            <>
              <Formula tex="h" /> 还比较大时，<Formula tex="m_h" /> 只是平均变化率，不一定等于导数。
            </>,
          ],
        },
      ],
    },
    'derivative-notation': {
      eyebrow: '符号',
      title: "瞬时斜率 f'(x0)",
      summary: (
        <>
          <Formula tex="f'(x_0)" /> 表示函数在 <Formula tex="x_0" /> 这个点的导数，也就是这一点附近的瞬时斜率。
        </>
      ),
      sections: [
        {
          title: '它和 m_h 的区别',
          items: [
            <>
              <Formula tex="m_h" /> 是当前 <Formula tex="h" /> 下的割线斜率，会随 <Formula tex="h" /> 滑杆变化。
            </>,
            <>
              <Formula tex="f'(x_0)" /> 是 <Formula tex="h" /> 越来越小时想靠近的稳定值。
            </>,
            <>
              如果从左边和右边靠近时斜率不一样，<Formula tex="f'(x_0)" /> 就不存在。
            </>,
          ],
        },
      ],
    },
    'secant-tangent': {
      eyebrow: '术语',
      title: '割线与切线',
      summary: '割线穿过曲线上的两个点；切线只描述某一点附近的局部方向。',
      sections: [
        {
          title: '导数实验为什么让 h 变小',
          body: (
            <>
              两点之间的平均斜率是 <Formula tex="\frac{f(x_0+h)-f(x_0)}{h}" />。当 <Formula tex="h" /> 越来越小，第二个点靠近第一个点，割线就越来越像切线。
            </>
          ),
        },
        {
          title: "m 和 f' 分别是什么",
          body: (
            <>
              <Formula tex="m_h" /> 是当前这个 <Formula tex="h" /> 对应的割线斜率，也就是两个点之间的平均变化率。<Formula tex="f'(x_0)" /> 是当第二个点从左右两边都靠近 <Formula tex="x_0" /> 时，如果斜率稳定到同一个值，就把那个稳定值叫作导数。
            </>
          ),
        },
        {
          title: '变化线索',
          items: [
            'h 从 1 缩小到 0.05 时，割线会逐渐靠近切线方向。',
            '对 abs(x) 而言，x0 到达 0 时左右斜率不一致，因此导数显示为不存在。',
          ],
        },
      ],
    },
    limit: {
      eyebrow: '术语',
      title: '极限',
      summary: '极限不是“直接到达”，而是“当某个量不断靠近某个状态时，结果越来越接近什么”。',
      sections: [
        {
          title: '在导数和积分里怎么出现',
          items: [
            '导数里，让 h 越来越小，割线斜率逼近切线斜率。',
            '积分里，让小矩形越来越多、越来越窄，面积和逼近真实面积。',
          ],
        },
      ],
    },
    integral: {
      eyebrow: '术语',
      title: '积分',
      summary: (
        <>
          定积分 <Formula tex="\int_a^b f(x)\,dx" /> 可以先理解成从 <Formula tex="a" /> 到 <Formula tex="b" /> 这段区间里，曲线下方累积的有符号面积。
        </>
      ),
      sections: [
        {
          title: '为什么用面积理解',
          items: [
            '如果 f(x) 表示速度，面积就像这段时间走过的位移。',
            '如果 f(x) 表示流量，面积就像这段时间流过的总量。',
            '很多实际问题不是只看某一瞬间，而是看一段时间内的累计效果。',
            '积分不是只算面积；它是在把一段连续变化累积成一个总效果。',
          ],
        },
      ],
    },
    'riemann-sum': {
      eyebrow: '术语',
      title: '黎曼和与梯形法',
      summary: '左端点、右端点和中点模式使用矩形黎曼和；梯形模式用相邻端点之间的线性连接近似面积。',
      sections: [
        {
          title: '为什么矩形越多越准',
          items: [
            '每个小矩形只近似一小段曲线下的面积。',
            '矩形越窄，每一小段的误差通常越小。',
            '左端点、右端点和中点模式各自选择一个矩形高度；梯形法连接两端高度。',
            '当 n 从 4 增加到 60，带符号面积估计通常会逐渐稳定在参考积分附近。',
          ],
        },
      ],
    },
    'signed-area': {
      eyebrow: '术语',
      title: '有符号面积',
      summary: 'x 轴上方的面积算正，x 轴下方的面积算负。积分关心的是这些正负贡献相加后的净结果。',
      sections: [
        {
          title: '为什么不是所有面积都取正',
          body: '如果函数表示速度，负值可能表示反方向运动。把负面积保留下来，才能得到净位移，而不是总路程。',
        },
      ],
    },
    'fundamental-theorem': {
      eyebrow: '术语',
      title: '微积分基本定理',
      summary: (
        <>
          它把积分和导数连起来：如果 <Formula tex="A(x)=\int_a^x f(t)\,dt" /> 表示从起点累积到 <Formula tex="x" /> 的面积，那么 <Formula tex="A'(x)=f(x)" />。
        </>
      ),
      sections: [
        {
          title: '两幅图的连接',
          items: [
            '上方函数 f(x) 给出当前位置的高度。',
            '下方 A(x) 记录从起点到当前位置累积了多少面积。',
            '当前位置的高度越高，累积面积增长得越快。',
            '面积函数的斜率等于原函数高度，因为每次多走一点点，新增面积主要由当前位置的高度决定。',
          ],
        },
      ],
    },
    accumulation: {
      eyebrow: '术语',
      title: '累积函数 A(x)',
      summary: 'A(x) 不是一个固定面积，而是“从起点累积到当前 x 为止”的面积，所以 x 改变时 A(x) 也会改变。',
      sections: [
        {
          title: '为什么下面会出现另一条曲线',
          body: '每一个 x 都对应一个累计面积值，把这些值连起来，就得到 A(x) 的图像。',
        },
      ],
    },
    taylor: {
      eyebrow: '术语',
      title: '泰勒多项式',
      summary: '泰勒多项式用多项式去模仿一个函数在某个中心点附近的行为。它不是全局复制函数，而是做局部近似。',
      sections: [
        {
          title: '为什么看起来在中心附近更准',
          items: [
            '泰勒多项式会尽量匹配函数在中心点的高度、斜率、弯曲程度等局部信息。',
            '离中心越远，这些局部信息越不够用，误差可能变大。',
            '提高阶数通常能改善中心附近的贴合，但不保证所有地方都好。',
            '固定中心 c 时，提高阶数会扩展中心附近的贴合范围；离中心较远处仍可能逐渐分开。',
          ],
        },
      ],
    },
    approximation: {
      eyebrow: '术语',
      title: '近似',
      summary: '近似不是“随便猜”，而是用更容易计算或观察的对象去接近真实对象。',
      sections: [
        {
          title: '本模块里的近似',
          items: [
            '导数用很小的 h 近似瞬时斜率。',
            '积分用有限个矩形或梯形近似真实面积。',
            '泰勒用有限阶多项式近似复杂函数。',
          ],
        },
      ],
    },
    formula: zhFormulaTopic(lessonId),
    values: {
      eyebrow: '数值',
      title: '当前数值',
      summary: '右侧数值把图像中的关键状态显示出来，例如当前点、步长、面积近似、导数估计或误差。',
      sections: [
        {
          title: '数值对应',
          items: [
            '参数变化会反映在与它相关的数值上。',
            '相应的图像运动给出这次数值变化的几何含义。',
            '如果出现未定义，通常表示函数在当前位置没有可计算的值。',
          ],
        },
      ],
    },
  }
}

function zhFormulaTopic(lessonId: string): HelpTopic {
  if (lessonId === 'integral') {
    return {
      eyebrow: '公式',
      title: '积分公式与图像',
      summary: (
        <>
          <Formula tex="\int_a^b f(x)\,dx" /> 表示从 <Formula tex="a" /> 到 <Formula tex="b" /> 把每个位置的小贡献累积起来。
        </>
      ),
      sections: [
        {
          title: '符号对应',
          items: [
            'a 和 b：累积的起点和终点。',
            'f(x)：每个位置的高度，决定这一小段贡献有多大。',
            'dx：很窄的一段宽度。',
            '∫：把这些“小高度 × 小宽度”加起来。',
          ],
        },
        {
          title: '什么时候要小心',
          items: [
            '这里的参考积分值是高采样数值近似，不是解析精确值。',
            '如果函数有断点或剧烈震荡，有限个矩形或梯形可能不可靠。',
          ],
        },
      ],
    }
  }
  if (lessonId === 'fundamental-theorem') {
    return {
      eyebrow: '公式',
      title: 'A(x) 与图像',
      summary: (
        <>
          <Formula tex="A(x)=\int_a^x f(t)\,dt" /> 表示“从起点 <Formula tex="a" /> 累积到当前 <Formula tex="x" /> 的面积”。
        </>
      ),
      sections: [
        {
          title: '关键对应',
          items: [
            'A(x)：当前已经累积的有符号面积。',
            "A'(x)：累积面积当前变化得多快。",
            'f(x)：当前位置的高度，也就是 A(x) 当前的斜率。',
          ],
        },
        {
          title: '什么时候要小心',
          items: ['这个图展示的是连续或足够良好的函数上的直觉，不是严格证明。'],
        },
      ],
    }
  }
  if (lessonId === 'taylor') {
    return {
      eyebrow: '公式',
      title: 'Taylor 公式与图像',
      summary: (
        <>
          <Formula tex="P_n(x)" /> 是围绕中心 <Formula tex="c" /> 构造的多项式，用有限层局部信息近似原函数。
        </>
      ),
      sections: [
        {
          title: '符号对应',
          items: [
            'c：近似的中心点。',
            'n：阶数，也就是使用多少层局部信息。',
            'f^(k)(c)：函数在中心点的第 k 层局部信息。',
            '(x-c)^k：当前位置离中心多远，会影响这一项的大小。',
          ],
        },
        {
          title: '什么时候要小心',
          items: [
            'Taylor 近似目前只对指定预设使用解析系数；自定义函数不会被悄悄近似成别的函数。',
            '高阶不等于处处更好；远离中心时可能变差。',
          ],
        },
      ],
    }
  }
  return {
    eyebrow: '公式',
    title: '导数公式与图像',
    summary: (
      <>
        <Formula tex="\frac{f(x_0+h)-f(x_0)}{h}" /> 是两个点之间的平均斜率。让 <Formula tex="h" /> 变小，是在看这个平均斜率能不能稳定成当前点的瞬时斜率。
      </>
    ),
    sections: [
      {
        title: '符号对应',
        items: [
          'x0：当前研究的点。',
          'h：第二个点离当前点的水平距离。',
          'm_h：当前 h 下的割线斜率，会随着 h 滑杆一起改变。',
          "f'(x0)：当前点的导数估计，不是直接用这个 h 算出来的割线斜率。",
          '分子：两个点的高度变化。',
          '分母：两个点的水平距离。',
          '整个分式：割线斜率，也就是平均变化率。',
        ],
      },
      {
        title: '什么时候要小心',
        items: [
          '这里的导数值是数值估计，不是符号推导。',
          '如果左右两边靠近时斜率不一样，比如 abs(x) 在 0 点，导数不存在。',
        ],
      },
    ],
  }
}

function zhGraphTopic(lessonId: string): HelpTopic {
  if (lessonId === 'integral') {
    return {
      eyebrow: '视觉笔记',
      title: '积分视图',
      summary: '曲线下面的彩色矩形或梯形是在近似面积；矩形越多，每一块越窄，通常越接近真实积分。',
      sections: [
        {
          title: '变化关系',
          items: [
            '曲线 f(x) 是被累积的函数高度。',
            'a 和 b 是积分区间的左右端点。',
            'n 控制把区间切成多少块。',
            '不同方法决定每一块用左端点、右端点、中点还是梯形取高度。',
          ],
        },
      ],
    }
  }
  if (lessonId === 'fundamental-theorem') {
    return {
      eyebrow: '视觉笔记',
      title: '基本定理视图',
      summary: '上半部分是原函数 f(x)，下半部分是累积面积 A(x)。两张图连在一起展示“高度”和“累计变化”之间的关系。',
      sections: [
        {
          title: '当前位置',
          items: [
            '上图的当前高度 f(x) 决定下图 A(x) 当前增长得多快。',
            '如果 f(x) 为正，A(x) 往上增长；如果 f(x) 为负，A(x) 往下变化。',
            '在基本定理适用时，A(x) 的斜率等于 f(x) 的高度；画面中的读数是这一关系的数值近似。',
          ],
        },
      ],
    }
  }
  if (lessonId === 'taylor') {
    return {
      eyebrow: '视觉笔记',
      title: '泰勒视图',
      summary: '一条曲线是真实函数，另一条曲线是泰勒多项式。中心点附近越贴合，说明局部近似越好。',
      sections: [
        {
          title: '变化关系',
          items: [
            'c 是近似的中心，泰勒多项式围绕这个点匹配函数。',
            '阶数 n 越高，多项式使用的局部信息越多。',
            '离中心越远，两条曲线可能分开，这就是局部近似的限制。',
          ],
        },
      ],
    }
  }
  return {
    eyebrow: '视觉笔记',
    title: '导数视图',
    summary: '曲线上的两个点决定割线；当步长 h 变小，第二个点靠近第一个点，割线逐渐变成切线方向。',
    sections: [
      {
        title: '变化关系',
        items: [
          'x0 是你正在研究的点。',
          'h 是两个点之间的水平距离。',
          '穿过两个点的线表示平均斜率。',
          '贴着当前点的线表示切线方向，也就是导数的几何意义。',
        ],
      },
    ],
  }
}

function enTopics(lessonId: string): Record<CalculusHelpTopicId, HelpTopic> {
  const graphTopic = enGraphTopic(lessonId)

  return {
    overview: {
      eyebrow: 'Notes',
      title: 'Change and accumulation',
      summary: 'The four views share one thread: local change, continuous accumulation, the bridge between them, and the recovery of shape from local data.',
      sections: [
        {
          title: 'Observation',
          items: [
            'A derivative compresses the curve near one point into a local linear model.',
            'An integral accumulates continuously distributed contributions into a total.',
            'The fundamental theorem reconnects the slope of an accumulation curve to the original height.',
            'A Taylor polynomial encodes successive derivatives at one center into a polynomial.',
          ],
        },
        {
          title: 'What changes',
          items: [
            'Position parameters move the point being inspected or the endpoint of accumulation.',
            'Step size, partition count, and degree control the scale or amount of information retained by the approximation.',
            'The moving geometry and the formula use the same variables.',
          ],
        },
      ],
    },
    graph: graphTopic,
    function: {
      eyebrow: 'Term',
      title: 'Function f(x)',
      summary: (
        <>
          A function is a rule: put in <Formula tex="x" />, get out a height <Formula tex="f(x)" />. The curve is the shape made by all those input-output pairs.
        </>
      ),
      sections: [
        {
          title: 'Why the curve matters',
          items: [
            'The horizontal coordinate x is the input.',
            'The vertical coordinate f(x) is the output or height.',
            'Derivative, integral, and Taylor approximation study different properties of this curve.',
          ],
        },
      ],
    },
    derivative: {
      eyebrow: 'Term',
      title: 'Derivative',
      summary: (
        <>
          Near a differentiable point, a function is locally approximated by a linear change; the derivative <Formula tex="f'(x)" /> is the slope of that local linear model.
        </>
      ),
      sections: [
        {
          title: 'Why slope is the right picture',
          items: [
            'A line slope says how much y changes when x moves by 1.',
            'A curve can have a different direction at each point, so we use the tangent slope near that point.',
            'A steep tangent means fast change; a nearly flat tangent means slow change.',
            "Collecting the local linear change at each point gives a new function, f'(x).",
          ],
        },
      ],
    },
    'secant-slope': {
      eyebrow: 'Symbol',
      title: 'Secant slope m_h',
      summary: (
        <>
          <Formula tex="m_h" /> is the secant slope for the current step size <Formula tex="h" />. It is the average rate of change between two visible points.
        </>
      ),
      sections: [
        {
          title: 'How it connects to the slider',
          items: [
            <>
              The <Formula tex="h" /> slider controls how far the second point is from <Formula tex="x_0" />.
            </>,
            <>
              <Formula tex="m_h" /> changes when <Formula tex="h" /> changes because it uses the two currently visible points.
            </>,
            <>
              When <Formula tex="h" /> is still large, <Formula tex="m_h" /> is an average rate of change, not necessarily the derivative.
            </>,
          ],
        },
      ],
    },
    'derivative-notation': {
      eyebrow: 'Symbol',
      title: "Instantaneous slope f'(x0)",
      summary: (
        <>
          <Formula tex="f'(x_0)" /> means the derivative at <Formula tex="x_0" />: the instantaneous slope near that point.
        </>
      ),
      sections: [
        {
          title: 'How it differs from m_h',
          items: [
            <>
              <Formula tex="m_h" /> is the secant slope for the current <Formula tex="h" />, so it changes with the <Formula tex="h" /> slider.
            </>,
            <>
              <Formula tex="f'(x_0)" /> is the stable value those slopes approach as <Formula tex="h" /> gets smaller.
            </>,
            <>
              If left and right approaches do not settle to the same slope, <Formula tex="f'(x_0)" /> does not exist.
            </>,
          ],
        },
      ],
    },
    'secant-tangent': {
      eyebrow: 'Term',
      title: 'Secant and tangent lines',
      summary: 'A secant line passes through two points on the curve. A tangent line describes the local direction near one point.',
      sections: [
        {
          title: 'Why the derivative lab shrinks h',
          body: (
            <>
              The average slope between two points is <Formula tex="\frac{f(x_0+h)-f(x_0)}{h}" />. As <Formula tex="h" /> gets smaller, the second point moves toward the first and the secant becomes more tangent-like.
            </>
          ),
        },
        {
          title: "What m and f' mean",
          body: (
            <>
              <Formula tex="m_h" /> is the secant slope for the current <Formula tex="h" />, so it is the average rate of change between two visible points. <Formula tex="f'(x_0)" /> is the derivative: if slopes from the left and right settle to the same value as the second point approaches <Formula tex="x_0" />, that stable value is the instantaneous slope.
            </>
          ),
        },
        {
          title: 'What changes',
          items: [
            'As h shrinks from 1 to 0.05, the secant approaches the tangent direction.',
            'For abs(x), moving x0 to 0 reveals the mismatch between left and right slopes, so the derivative becomes undefined.',
          ],
        },
      ],
    },
    limit: {
      eyebrow: 'Term',
      title: 'Limit',
      summary: 'A limit asks what value a process approaches as some quantity gets closer and closer to a target state.',
      sections: [
        {
          title: 'Where it appears',
          items: [
            'For derivatives, h shrinks and secant slopes approach tangent slope.',
            'For integrals, rectangles get more numerous and narrower, and the sum approaches true area.',
          ],
        },
      ],
    },
    integral: {
      eyebrow: 'Term',
      title: 'Integral',
      summary: (
        <>
          A definite integral <Formula tex="\int_a^b f(x)\,dx" /> can be read as signed area accumulated under the curve from <Formula tex="a" /> to <Formula tex="b" />.
        </>
      ),
      sections: [
        {
          title: 'Why area is useful',
          items: [
            'If f(x) is velocity, area acts like displacement over time.',
            'If f(x) is flow rate, area acts like total amount flowed.',
            'Many problems need accumulated effect, not just one instant.',
            'An integral is not only area; it turns continuous change into a total effect.',
          ],
        },
      ],
    },
    'riemann-sum': {
      eyebrow: 'Term',
      title: 'Riemann sums and the trapezoidal rule',
      summary: 'Left, right, and midpoint modes are rectangular Riemann sums; trapezoid mode linearly connects the two endpoint heights.',
      sections: [
        {
          title: 'Why more pieces usually helps',
          items: [
            'Each small shape approximates one small slice of area.',
            'Narrower slices usually reduce the error in each slice.',
            'Left, right, and midpoint choose one rectangle height; the trapezoidal rule connects the two endpoint heights.',
            'As n increases from 4 to 60, the signed-area estimate usually settles toward the reference integral.',
          ],
        },
      ],
    },
    'signed-area': {
      eyebrow: 'Term',
      title: 'Signed area',
      summary: 'Area above the x-axis counts positive; area below counts negative. The integral adds those positive and negative contributions.',
      sections: [
        {
          title: 'Why not make all area positive?',
          body: 'If the function is velocity, negative values may mean motion in the opposite direction. Keeping negative area gives net displacement rather than total distance.',
        },
      ],
    },
    'fundamental-theorem': {
      eyebrow: 'Term',
      title: 'Fundamental theorem of calculus',
      summary: (
        <>
          It connects integrals and derivatives: if <Formula tex="A(x)=\int_a^x f(t)\,dt" /> is accumulated area up to <Formula tex="x" />, then <Formula tex="A'(x)=f(x)" />.
        </>
      ),
      sections: [
        {
          title: 'Connection between the graphs',
          items: [
            'The upper graph f(x) gives the current height.',
            'The lower graph A(x) records accumulated area so far.',
            'The higher the current height, the faster accumulated area grows.',
            'The slope of the area function equals the original height because each tiny move adds about current height times tiny width.',
          ],
        },
      ],
    },
    accumulation: {
      eyebrow: 'Term',
      title: 'Accumulation function A(x)',
      summary: 'A(x) is not one fixed area. It means the area accumulated from the start point up to the current x, so it changes as x changes.',
      sections: [
        {
          title: 'Why there is another curve',
          body: 'Every x has its own accumulated-area value. Connecting those values creates the graph of A(x).',
        },
      ],
    },
    taylor: {
      eyebrow: 'Term',
      title: 'Taylor polynomial',
      summary: 'A Taylor polynomial uses a polynomial to imitate a function near one center point. It is a local approximation, not a full copy everywhere.',
      sections: [
        {
          title: 'Why it is better near the center',
          items: [
            'It tries to match the function height, slope, curvature, and other local information at the center.',
            'Farther from the center, that local information may no longer be enough.',
            'Higher degree often helps near the center, but it does not guarantee a good fit everywhere.',
            'With c fixed, increasing the degree extends the close match near the center; farther away the curves can still separate.',
          ],
        },
      ],
    },
    approximation: {
      eyebrow: 'Term',
      title: 'Approximation',
      summary: 'Approximation means using something easier to compute or see to get close to a more exact object.',
      sections: [
        {
          title: 'Approximation in this module',
          items: [
            'Derivative uses small h to approximate instantaneous slope.',
            'Integral uses finitely many rectangles or trapezoids to approximate true area.',
            'Taylor uses a finite-degree polynomial to approximate a more complex function.',
          ],
        },
      ],
    },
    formula: enFormulaTopic(lessonId),
    values: {
      eyebrow: 'Values',
      title: 'Current values',
      summary: 'The values panel exposes important graph state, such as current point, step size, area estimate, derivative estimate, or approximation error.',
      sections: [
        {
          title: 'Reading the values',
          items: [
            'A parameter change is reflected in the values that depend on it.',
            'The corresponding graph motion shows the geometric meaning of that numerical change.',
            'If a value is undefined, the function usually cannot be evaluated at the current position.',
          ],
        },
      ],
    },
  }
}

function enFormulaTopic(lessonId: string): HelpTopic {
  if (lessonId === 'integral') {
    return {
      eyebrow: 'Formula',
      title: 'Integral formula and graph',
      summary: (
        <>
          <Formula tex="\int_a^b f(x)\,dx" /> means accumulate small contributions from <Formula tex="a" /> to <Formula tex="b" />.
        </>
      ),
      sections: [
        {
          title: 'Symbol map',
          items: [
            'a and b: the start and end of the accumulation interval.',
            'f(x): the height at each position.',
            'dx: a tiny slice of width.',
            '∫: add the tiny “height × width” contributions.',
          ],
        },
        {
          title: 'When to be careful',
          items: [
            'The reference integral here is a high-sample numerical approximation, not an exact symbolic integral.',
            'If a function jumps or oscillates sharply, finitely many rectangles or trapezoids may be unreliable.',
          ],
        },
      ],
    }
  }
  if (lessonId === 'fundamental-theorem') {
    return {
      eyebrow: 'Formula',
      title: 'A(x) and the graph',
      summary: (
        <>
          <Formula tex="A(x)=\int_a^x f(t)\,dt" /> means “accumulated signed area from the start <Formula tex="a" /> up to the current <Formula tex="x" />.”
        </>
      ),
      sections: [
        {
          title: 'Key match',
          items: [
            'A(x): accumulated signed area so far.',
            "A'(x): how fast the accumulated area is changing now.",
            'f(x): the current height, which is the current slope of A(x).',
          ],
        },
        {
          title: 'When to be careful',
          items: ['The picture shows the intuition for continuous or well-behaved functions; it is not a formal proof.'],
        },
      ],
    }
  }
  if (lessonId === 'taylor') {
    return {
      eyebrow: 'Formula',
      title: 'Taylor formula and graph',
      summary: (
        <>
          <Formula tex="P_n(x)" /> is a polynomial built around the center <Formula tex="c" /> from a finite amount of local information.
        </>
      ),
      sections: [
        {
          title: 'Symbol map',
          items: [
            'c: the approximation center.',
            'n: degree, or how many layers of local information are used.',
            'f^(k)(c): the kth layer of local information at the center.',
            '(x-c)^k: how distance from the center affects that term.',
          ],
        },
        {
          title: 'When to be careful',
          items: [
            'Taylor approximation currently uses analytic coefficients only for selected presets; custom functions are not silently replaced by another function.',
            'Higher degree does not mean good everywhere; far from the center the approximation can get worse.',
          ],
        },
      ],
    }
  }
  return {
    eyebrow: 'Formula',
    title: 'Derivative formula and graph',
    summary: (
      <>
        <Formula tex="\frac{f(x_0+h)-f(x_0)}{h}" /> is the average slope between two points. Shrinking <Formula tex="h" /> checks whether that average slope settles into an instantaneous slope.
      </>
    ),
    sections: [
      {
        title: 'Symbol map',
        items: [
          'x0: the point being studied.',
          'h: the horizontal distance to the second point.',
          'm_h: the secant slope for the current h, so it changes when the h slider changes.',
          "f'(x0): the derivative estimate at the current point, not the same as the secant slope from the slider.",
          'The numerator: height change.',
          'The denominator: horizontal change.',
          'The whole fraction: secant slope, or average rate of change.',
        ],
      },
      {
        title: 'When to be careful',
        items: [
          'The derivative value here is a numerical estimate, not symbolic differentiation.',
          'If left and right approaches give different slopes, such as abs(x) at 0, the derivative is undefined.',
        ],
      },
    ],
  }
}

function enGraphTopic(lessonId: string): HelpTopic {
  if (lessonId === 'integral') {
    return {
      eyebrow: 'Visual notes',
      title: 'Integral view',
      summary: 'The colored rectangles or trapezoids under the curve approximate area. More pieces make each piece narrower and usually closer to the true integral.',
      sections: [
        {
          title: 'What changes',
          items: [
            'The curve f(x) is the height being accumulated.',
            'a and b are the left and right endpoints of the interval.',
            'n controls how many pieces the interval is cut into.',
            'The method changes whether each piece uses left, right, midpoint, or trapezoid height.',
          ],
        },
      ],
    }
  }
  if (lessonId === 'fundamental-theorem') {
    return {
      eyebrow: 'Visual notes',
      title: 'Fundamental theorem view',
      summary: 'The top pane is f(x). The bottom pane is accumulated area A(x). Together they show the relationship between height and accumulated change.',
      sections: [
        {
          title: 'Current position',
          items: [
            'The top height f(x) controls how fast the bottom graph A(x) changes.',
            'When f(x) is positive, A(x) grows upward; when f(x) is negative, A(x) moves downward.',
            'Where the theorem applies, the slope of A(x) equals the height of f(x); the displayed readout estimates that relation numerically.',
          ],
        },
      ],
    }
  }
  if (lessonId === 'taylor') {
    return {
      eyebrow: 'Visual notes',
      title: 'Taylor view',
      summary: 'One curve is the original function and the other is the Taylor polynomial. The closer they are near the center, the better the local approximation.',
      sections: [
        {
          title: 'What changes',
          items: [
            'c is the center of approximation.',
            'Degree n controls how much local information the polynomial uses.',
            'Far from the center, the curves may separate; that is the limit of a local approximation.',
          ],
        },
      ],
    }
  }
  return {
    eyebrow: 'Visual notes',
    title: 'Derivative view',
    summary: 'Two points on the curve determine a secant line. As h shrinks, the second point moves toward the first and the secant direction approaches the tangent direction.',
    sections: [
      {
        title: 'What changes',
        items: [
          'x0 is the point being studied.',
          'h is the horizontal distance between the two points.',
          'The line through the two points shows average slope.',
          'The line touching the current point shows tangent direction, the geometric meaning of derivative.',
        ],
      },
    ],
  }
}
