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
    entryTitle: 'Need the basics?',
    entryHint: 'Open a short explanation when the graph, formula, or slider names are unfamiliar.',
    openOverview: 'Beginner Guide',
    openGraph: 'Read the graph',
    close: 'Close explanation',
  },
  zh: {
    entryTitle: '新手解释',
    entryHint: '遇到导数、积分、黎曼和、泰勒这些概念时，可以随时打开解释。',
    openOverview: '新手解释',
    openGraph: '怎么看图',
    close: '关闭解释',
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
      eyebrow: 'Calculus',
      title: '这个模块在探索什么？',
      summary: '微积分关心两件核心事情：量怎样变化，以及很多很小的量加起来会怎样。这里的图像和滑杆就是把这些抽象概念变成可观察的运动。',
      sections: [
        {
          title: '先建立直觉',
          items: [
            '导数看“某一点附近变化得多快”。',
            '积分看“从一段区间里累积了多少面积或总量”。',
            '微积分基本定理把“累积量”和“瞬时变化率”连起来。',
            '泰勒多项式用一个简单多项式去模仿复杂函数在某点附近的形状。',
          ],
        },
        {
          title: '建议的探索方式',
          items: [
            '先用预设函数，不急着输入自己的公式。',
            '拖动一个滑杆，只观察图中哪一部分跟着变。',
            '看懂图像变化后，再打开公式解释，把符号和图像对应起来。',
          ],
        },
      ],
    },
    graph: graphTopic,
    function: {
      eyebrow: '术语',
      title: '函数 f(x) 是什么？',
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
      title: '导数是什么？',
      summary: (
        <>
          导数 <Formula tex="f'(x)" /> 描述函数在某一点附近变化得多快。图上可以把它看成曲线在那个点的“瞬时斜率”。
        </>
      ),
      sections: [
        {
          title: '为什么用斜率理解导数',
          items: [
            '直线的斜率表示“往右走 1，往上或往下走多少”。',
            '曲线每一点的方向都可能不同，所以我们看那一点附近的切线斜率。',
            '如果切线很陡，函数变化快；如果切线接近水平，函数变化慢。',
            '导数不是一条新规则，而是曲线在局部看起来越来越像一条直线。',
          ],
        },
      ],
    },
    'secant-slope': {
      eyebrow: '符号',
      title: 'm_h 是什么？',
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
      title: "f'(x0) 是什么？",
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
      title: '割线和切线是什么？',
      summary: '割线穿过曲线上的两个点；切线只描述某一点附近的局部方向。',
      sections: [
        {
          title: '导数实验为什么让 h 变小',
          body: (
            <>
              两点之间的平均斜率是 <Formula tex="\\frac{f(x_0+h)-f(x_0)}{h}" />。当 <Formula tex="h" /> 越来越小，第二个点靠近第一个点，割线就越来越像切线。
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
          title: '你可以试试',
          items: [
            '把 h 从 1 拖到 0.05，看割线怎样靠近切线方向。',
            '把函数改成 abs(x)，并把 x0 拖到 0，观察导数为什么显示不存在。',
          ],
        },
      ],
    },
    limit: {
      eyebrow: '术语',
      title: '极限在这里是什么意思？',
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
      title: '积分是什么？',
      summary: (
        <>
          定积分 <Formula tex="\\int_a^b f(x)\\,dx" /> 可以先理解成从 <Formula tex="a" /> 到 <Formula tex="b" /> 这段区间里，曲线下方累积的有符号面积。
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
      title: '黎曼和在干什么？',
      summary: '黎曼和用很多小矩形或小梯形去拼曲线下方的面积。',
      sections: [
        {
          title: '为什么矩形越多越准',
          items: [
            '每个小矩形只近似一小段曲线下的面积。',
            '矩形越窄，每一小段的误差通常越小。',
            '左端点、右端点、中点是选一个高度；梯形法是连接两端高度。',
            '把 n 从 4 拖到 60，可以观察有符号面积估计怎样靠近参考积分。',
          ],
        },
      ],
    },
    'signed-area': {
      eyebrow: '术语',
      title: '有符号面积是什么意思？',
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
      title: '微积分基本定理在说什么？',
      summary: (
        <>
          它把积分和导数连起来：如果 <Formula tex="A(x)=\\int_a^x f(t)\\,dt" /> 表示从起点累积到 <Formula tex="x" /> 的面积，那么 <Formula tex="A'(x)=f(x)" />。
        </>
      ),
      sections: [
        {
          title: '怎么读这个连接',
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
      title: '累积函数 A(x) 是什么？',
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
      title: '泰勒多项式是什么？',
      summary: '泰勒多项式用多项式去模仿一个函数在某个中心点附近的行为。它不是全局复制函数，而是做局部近似。',
      sections: [
        {
          title: '为什么看起来在中心附近更准',
          items: [
            '泰勒多项式会尽量匹配函数在中心点的高度、斜率、弯曲程度等局部信息。',
            '离中心越远，这些局部信息越不够用，误差可能变大。',
            '提高阶数通常能改善中心附近的贴合，但不保证所有地方都好。',
            '先固定中心 c，再逐渐增加阶数；然后缩小或放大视野，看它从哪里开始失效。',
          ],
        },
      ],
    },
    approximation: {
      eyebrow: '术语',
      title: '近似是什么意思？',
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
      title: '当前数值在帮你看什么？',
      summary: '右侧数值把图像中的关键状态显示出来，例如当前点、步长、面积近似、导数估计或误差。',
      sections: [
        {
          title: '怎么用这些数',
          items: [
            '拖动滑杆后，看哪个数明显变化。',
            '把数值变化和图像变化对应起来，比单独看公式更容易建立直觉。',
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
      title: '积分公式怎么对应图像？',
      summary: (
        <>
          <Formula tex="\\int_a^b f(x)\\,dx" /> 表示从 <Formula tex="a" /> 到 <Formula tex="b" /> 把每个位置的小贡献累积起来。
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
      title: 'A(x) 公式怎么读？',
      summary: (
        <>
          <Formula tex="A(x)=\\int_a^x f(t)\\,dt" /> 表示“从起点 <Formula tex="a" /> 累积到当前 <Formula tex="x" /> 的面积”。
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
      title: 'Taylor 公式怎么读？',
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
    title: '导数公式怎么对应图像？',
    summary: (
      <>
        <Formula tex="\\frac{f(x_0+h)-f(x_0)}{h}" /> 是两个点之间的平均斜率。让 <Formula tex="h" /> 变小，是在看这个平均斜率能不能稳定成当前点的瞬时斜率。
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
      eyebrow: '图像阅读',
      title: '积分图像怎么看？',
      summary: '曲线下面的彩色矩形或梯形是在近似面积；矩形越多，每一块越窄，通常越接近真实积分。',
      sections: [
        {
          title: '看哪些东西',
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
      eyebrow: '图像阅读',
      title: '基本定理图像怎么看？',
      summary: '上半部分是原函数 f(x)，下半部分是累积面积 A(x)。两张图连在一起展示“高度”和“累计变化”之间的关系。',
      sections: [
        {
          title: '看当前位置',
          items: [
            '上图的当前高度 f(x) 决定下图 A(x) 当前增长得多快。',
            '如果 f(x) 为正，A(x) 往上增长；如果 f(x) 为负，A(x) 往下变化。',
            'A(x) 的斜率会接近 f(x) 的高度。',
          ],
        },
      ],
    }
  }
  if (lessonId === 'taylor') {
    return {
      eyebrow: '图像阅读',
      title: '泰勒图像怎么看？',
      summary: '一条曲线是真实函数，另一条曲线是泰勒多项式。中心点附近越贴合，说明局部近似越好。',
      sections: [
        {
          title: '看哪些变化',
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
    eyebrow: '图像阅读',
    title: '导数图像怎么看？',
    summary: '曲线上的两个点决定割线；当步长 h 变小，第二个点靠近第一个点，割线逐渐变成切线方向。',
    sections: [
      {
        title: '看哪些东西',
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
      eyebrow: 'Calculus',
      title: 'What is this module exploring?',
      summary: 'Calculus is mainly about two ideas: how quantities change, and what happens when many tiny pieces accumulate. The graph and sliders turn those ideas into visible motion.',
      sections: [
        {
          title: 'Start with intuition',
          items: [
            'Derivative asks how fast something changes near one point.',
            'Integral asks how much area or total quantity accumulates across an interval.',
            'The fundamental theorem connects accumulated quantity with instantaneous rate.',
            'Taylor polynomials use simple polynomials to imitate a function near a center point.',
          ],
        },
        {
          title: 'A useful exploration order',
          items: [
            'Start with presets before typing your own formula.',
            'Move one slider at a time and watch which part of the graph changes.',
            'After the picture makes sense, open the formula explanation and match symbols back to the graph.',
          ],
        },
      ],
    },
    graph: graphTopic,
    function: {
      eyebrow: 'Term',
      title: 'What is f(x)?',
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
      title: 'What is a derivative?',
      summary: (
        <>
          The derivative <Formula tex="f'(x)" /> describes how fast the function changes near one point. On the graph, it is the instantaneous slope there.
        </>
      ),
      sections: [
        {
          title: 'Why slope is the right picture',
          items: [
            'A line slope says how much y changes when x moves by 1.',
            'A curve can have a different direction at each point, so we use the tangent slope near that point.',
            'A steep tangent means fast change; a nearly flat tangent means slow change.',
            'A derivative is not a separate new rule; it is the curve becoming locally line-like.',
          ],
        },
      ],
    },
    'secant-slope': {
      eyebrow: 'Symbol',
      title: 'What is m_h?',
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
      title: "What is f'(x0)?",
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
      title: 'What are secant and tangent lines?',
      summary: 'A secant line passes through two points on the curve. A tangent line describes the local direction near one point.',
      sections: [
        {
          title: 'Why the derivative lab shrinks h',
          body: (
            <>
              The average slope between two points is <Formula tex="\\frac{f(x_0+h)-f(x_0)}{h}" />. As <Formula tex="h" /> gets smaller, the second point moves toward the first and the secant becomes more tangent-like.
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
          title: 'Try this',
          items: [
            'Drag h from 1 down to 0.05 and watch the secant approach the tangent direction.',
            'Switch to abs(x), move x0 to 0, and watch why the derivative becomes undefined.',
          ],
        },
      ],
    },
    limit: {
      eyebrow: 'Term',
      title: 'What does limit mean here?',
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
      title: 'What is an integral?',
      summary: (
        <>
          A definite integral <Formula tex="\\int_a^b f(x)\\,dx" /> can be read as signed area accumulated under the curve from <Formula tex="a" /> to <Formula tex="b" />.
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
      title: 'What is a Riemann sum doing?',
      summary: 'A Riemann sum uses many small rectangles or trapezoids to approximate area under a curve.',
      sections: [
        {
          title: 'Why more pieces usually helps',
          items: [
            'Each small shape approximates one small slice of area.',
            'Narrower slices usually reduce the error in each slice.',
            'Left, right, and midpoint choose one height; trapezoid connects the two endpoint heights.',
            'Drag n from 4 to 60 and compare the signed area estimate with the reference integral.',
          ],
        },
      ],
    },
    'signed-area': {
      eyebrow: 'Term',
      title: 'What is signed area?',
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
      title: 'What does the fundamental theorem say?',
      summary: (
        <>
          It connects integrals and derivatives: if <Formula tex="A(x)=\\int_a^x f(t)\\,dt" /> is accumulated area up to <Formula tex="x" />, then <Formula tex="A'(x)=f(x)" />.
        </>
      ),
      sections: [
        {
          title: 'How to read the connection',
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
      title: 'What is the accumulation function A(x)?',
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
      title: 'What is a Taylor polynomial?',
      summary: 'A Taylor polynomial uses a polynomial to imitate a function near one center point. It is a local approximation, not a full copy everywhere.',
      sections: [
        {
          title: 'Why it is better near the center',
          items: [
            'It tries to match the function height, slope, curvature, and other local information at the center.',
            'Farther from the center, that local information may no longer be enough.',
            'Higher degree often helps near the center, but it does not guarantee a good fit everywhere.',
            'Keep c fixed, raise the degree, then zoom out to see where the approximation starts failing.',
          ],
        },
      ],
    },
    approximation: {
      eyebrow: 'Term',
      title: 'What does approximation mean?',
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
      title: 'What are the current values for?',
      summary: 'The values panel exposes important graph state, such as current point, step size, area estimate, derivative estimate, or approximation error.',
      sections: [
        {
          title: 'How to use them',
          items: [
            'Move a slider and watch which value changes.',
            'Connect the value change with the graph change to build intuition.',
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
      title: 'How does the integral formula match the graph?',
      summary: (
        <>
          <Formula tex="\\int_a^b f(x)\\,dx" /> means accumulate small contributions from <Formula tex="a" /> to <Formula tex="b" />.
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
      title: 'How should I read A(x)?',
      summary: (
        <>
          <Formula tex="A(x)=\\int_a^x f(t)\\,dt" /> means “accumulated signed area from the start <Formula tex="a" /> up to the current <Formula tex="x" />.”
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
      title: 'How should I read the Taylor formula?',
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
    title: 'How does the derivative formula match the graph?',
    summary: (
      <>
        <Formula tex="\\frac{f(x_0+h)-f(x_0)}{h}" /> is the average slope between two points. Shrinking <Formula tex="h" /> checks whether that average slope settles into an instantaneous slope.
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
      eyebrow: 'Reading the graph',
      title: 'How do I read the integral graph?',
      summary: 'The colored rectangles or trapezoids under the curve approximate area. More pieces make each piece narrower and usually closer to the true integral.',
      sections: [
        {
          title: 'What to watch',
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
      eyebrow: 'Reading the graph',
      title: 'How do I read the fundamental theorem graph?',
      summary: 'The top pane is f(x). The bottom pane is accumulated area A(x). Together they show the relationship between height and accumulated change.',
      sections: [
        {
          title: 'Watch the current position',
          items: [
            'The top height f(x) controls how fast the bottom graph A(x) changes.',
            'When f(x) is positive, A(x) grows upward; when f(x) is negative, A(x) moves downward.',
            'The slope of A(x) is close to the height of f(x).',
          ],
        },
      ],
    }
  }
  if (lessonId === 'taylor') {
    return {
      eyebrow: 'Reading the graph',
      title: 'How do I read the Taylor graph?',
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
    eyebrow: 'Reading the graph',
    title: 'How do I read the derivative graph?',
    summary: 'Two points on the curve determine a secant line. As h shrinks, the second point moves toward the first and the secant direction approaches the tangent direction.',
    sections: [
      {
        title: 'What to watch',
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
