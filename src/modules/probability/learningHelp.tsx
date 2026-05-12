import { Formula } from '../../core/ui/Formula.tsx'
import type { HelpTopic } from '../../core/ui/LearningHelp.tsx'
import type { Locale } from '../../i18n.ts'
import type { ProbabilityLessonId } from './probabilityTypes.ts'

export type ProbabilityHelpTopicId =
  | 'overview'
  | 'graph'
  | 'probability'
  | 'conditional'
  | 'bayes'
  | 'medical-test'
  | 'binomial'
  | 'density'
  | 'clt'
  | 'random-variable-sum'
  | 'formula'
  | 'values'
  | 'variation'

type LearningCopy = {
  entryTitle: string
  entryHint: string
  openOverview: string
  openGraph: string
  close: string
}

export const probabilityLearningCopy: Record<Locale, LearningCopy> = {
  en: {
    entryTitle: 'Need the basics?',
    entryHint: 'Open a short explanation when probability symbols, distributions, or simulations feel unfamiliar.',
    openOverview: 'Beginner Guide',
    openGraph: 'Read the graph',
    close: 'Close explanation',
  },
  zh: {
    entryTitle: '看不懂也可以继续探索',
    entryHint: '遇到条件概率、贝叶斯、分布、密度或模拟这些概念时，可以随时打开解释。',
    openOverview: '新手解释',
    openGraph: '怎么看图',
    close: '关闭解释',
  },
}

export function getProbabilityHelpTopics(locale: Locale, lessonId: ProbabilityLessonId): Record<ProbabilityHelpTopicId, HelpTopic> {
  return locale === 'zh' ? zhTopics(lessonId) : enTopics(lessonId)
}

export function conceptTopicForLesson(lessonId: ProbabilityLessonId): ProbabilityHelpTopicId {
  if (lessonId === 'bayes') return 'bayes'
  if (lessonId === 'medical-test') return 'medical-test'
  if (lessonId === 'binomial') return 'binomial'
  if (lessonId === 'continuous-density') return 'density'
  if (lessonId === 'central-limit-theorem') return 'clt'
  if (lessonId === 'random-variable-sum') return 'random-variable-sum'
  return 'conditional'
}

function zhTopics(lessonId: ProbabilityLessonId): Record<ProbabilityHelpTopicId, HelpTopic> {
  return {
    overview: {
      eyebrow: 'Probability',
      title: '这个模块在探索什么？',
      summary: '概率不是只背公式，而是在问：哪些结果可能发生、发生的比例有多大，以及新信息会怎样改变判断。这里把概率变成面积、人数、柱子、样本和配对格子。',
      sections: [
        {
          title: '先建立直觉',
          items: [
            '概率可以理解成“在很多次或很多个对象里，目标情况占多大比例”。',
            '条件概率是在一个更小的世界里重新计算比例。',
            '分布描述一个随机变量可能取哪些值，以及每个值有多常见。',
            '模拟不是证明公式，而是帮你看到长期频率怎样接近理论概率。',
          ],
        },
        {
          title: '建议的探索方式',
          items: [
            '先看高亮区域、柱子或面积表示什么，再看公式。',
            '一次只拖动一个滑杆，观察分母、面积或最高柱子怎么变。',
            '如果出现反直觉结果，优先检查“正在观察的总体”是否变了。',
          ],
        },
      ],
    },
    graph: zhGraphTopic(lessonId),
    probability: {
      eyebrow: '术语',
      title: '概率 P(...) 是什么？',
      summary: (
        <>
          <Formula tex="P(A)" /> 表示事件 <Formula tex="A" /> 发生的概率。可以先把它想成“目标部分占整体的比例”。
        </>
      ),
      sections: [
        {
          title: '为什么总是在看比例',
          items: [
            '概率 0 表示不发生，概率 1 表示一定发生。',
            '如果把总体画成一块区域，概率就是某个部分占这块区域的比例。',
            '如果把总体画成人数，概率就是目标人数除以总人数。',
          ],
        },
      ],
    },
    conditional: {
      eyebrow: '术语',
      title: '条件概率是什么？',
      summary: (
        <>
          <Formula tex="P(A\\mid B)" /> 读作“在 <Formula tex="B" /> 已经发生的前提下，<Formula tex="A" /> 发生的概率”。竖线右边的条件会改变分母。
        </>
      ),
      sections: [
        {
          title: '为什么 P(A | B) 和 P(B | A) 不一样',
          items: [
            'P(A | B) 只在 B 的范围里看 A 占多少。',
            'P(B | A) 只在 A 的范围里看 B 占多少。',
            '两次计算看的是不同总体，所以结果通常不同。',
          ],
        },
      ],
    },
    bayes: {
      eyebrow: '术语',
      title: '贝叶斯规则在干什么？',
      summary: (
        <>
          贝叶斯规则把“先觉得 <Formula tex="H" /> 有多可能”和“看到证据 <Formula tex="E" /> 后应怎样更新”连起来。
        </>
      ),
      sections: [
        {
          title: '先验、似然、后验',
          items: [
            '先验 P(H)：看到证据之前，假设本来有多常见。',
            '似然 P(E | H)：如果假设是真的，证据出现的概率。',
            '后验 P(H | E)：看到证据之后，假设为真的概率。',
          ],
        },
        {
          title: '为什么基础率重要',
          body: '如果 H 本来非常少见，即使证据看起来支持 H，误报或其他来源也可能占很大比例。',
        },
      ],
    },
    'medical-test': {
      eyebrow: '术语',
      title: '医学测试悖论为什么反直觉？',
      summary: '阳性结果里既有真阳性，也有假阳性。阳性结果“意味着什么”，取决于这两类人各有多少。',
      sections: [
        {
          title: '先分清四类人',
          items: [
            '真阳性：患病，测试也显示阳性。',
            '假阳性：未患病，但测试显示阳性。',
            '假阴性：患病，但测试显示阴性。',
            '真阴性：未患病，测试也显示阴性。',
          ],
        },
        {
          title: '不要把两个问题混在一起',
          body: '敏感度和特异度描述测试本身；阳性预测值和阴性预测值描述拿到结果后，一个人属于哪一类的概率。',
        },
      ],
    },
    binomial: {
      eyebrow: '术语',
      title: '二项分布是什么？',
      summary: (
        <>
          二项分布描述：重复做 <Formula tex="n" /> 次相同的独立试验，每次成功概率都是 <Formula tex="p" />，最终成功 <Formula tex="k" /> 次的概率是多少。
        </>
      ),
      sections: [
        {
          title: '柱子表示什么',
          items: [
            '横轴 k 是成功次数。',
            '每根柱子的高度是“正好 k 次成功”的概率。',
            'p 越大，分布通常越往右；n 越大，可能的 k 越多。',
          ],
        },
      ],
    },
    density: {
      eyebrow: '术语',
      title: '连续概率密度是什么？',
      summary: '连续变量的概率要看一段区间下方的面积，而不是看某一个点的高度。',
      sections: [
        {
          title: '为什么单点概率是 0',
          items: [
            '连续变量可以取无限多个值，某一个精确点没有宽度。',
            '没有宽度就没有面积，所以 P(X = x) 通常是 0。',
            'P(a ≤ X ≤ b) 看的是从 a 到 b 的面积。',
          ],
        },
      ],
    },
    clt: {
      eyebrow: '术语',
      title: '中心极限定理在说什么？',
      summary: '它说的不是原始数据会变成正态，而是“很多次抽样得到的平均数”会趋向更稳定、更接近钟形的分布。',
      sections: [
        {
          title: '看清两层随机性',
          items: [
            '先从原始分布抽一组样本。',
            '把这一组样本求平均，得到一个样本均值。',
            '重复很多组后，样本均值本身也会形成一个分布。',
          ],
        },
      ],
    },
    'random-variable-sum': {
      eyebrow: '术语',
      title: '随机变量相加在做什么？',
      summary: (
        <>
          如果 <Formula tex="S=X+Y" />，就要把所有能得到同一个和的 <Formula tex="(x,y)" /> 配对概率加起来。
        </>
      ),
      sections: [
        {
          title: '为什么会出现对角线',
          items: [
            '网格中的每个格子是一种 X 和 Y 的配对。',
            '同一条对角线上的配对有相同的 x + y。',
            '输出柱子的高度是这些格子概率的总和。',
          ],
        },
      ],
    },
    formula: {
      eyebrow: '公式',
      title: '当前公式应该怎么读？',
      summary: '公式是对图像里“分子、分母、面积、柱子或配对求和”的压缩写法。先把每个符号对应回图形，不需要一开始就推导。',
      sections: [
        {
          title: '常见符号',
          items: [
            'P(A)：事件 A 发生的概率。',
            'P(A | B)：只在 B 已经发生的范围里看 A 的比例。',
            '∩：两个事件同时发生。',
            'Σ：把满足条件的很多项相加。',
            'E(X)：随机变量 X 的平均值或期望。',
          ],
        },
      ],
    },
    values: {
      eyebrow: '数值',
      title: '当前数值在帮你看什么？',
      summary: '右侧数值把图里的关键比例、面积、均值、方差或模拟结果显示出来，帮助你确认图像变化到底对应哪个概率量。',
      sections: [
        {
          title: '怎么用这些数',
          items: [
            '拖动滑杆后，看哪个数明显变化。',
            '把数值变化和图中高亮区域、柱子或面积对应起来。',
            '如果数值未定义，通常表示分母为 0 或当前设置没有可计算对象。',
          ],
        },
      ],
    },
    variation: zhVariationTopic(lessonId),
  }
}

function zhGraphTopic(lessonId: ProbabilityLessonId): HelpTopic {
  if (lessonId === 'bayes') {
    return {
      eyebrow: '图像阅读',
      title: '贝叶斯图像怎么看？',
      summary: '图中把证据 E 的来源拆开：一部分来自 H，另一部分来自非 H。后验概率就是证据出现后，H 那部分占全部证据的比例。',
      sections: [
        {
          title: '看哪些东西',
          items: [
            'H 且 E 是分子。',
            '所有 E 是分母，包含 H 且 E 以及非 H 且 E。',
            '假阳性或误报越多，分母中非 H 的部分越大。',
          ],
        },
      ],
    }
  }
  if (lessonId === 'medical-test') {
    return {
      eyebrow: '图像阅读',
      title: '医学测试图像怎么看？',
      summary: '图中把人群分成真阳性、假阳性、假阴性、真阴性。当前选中的测试结果会高亮对应的两类人。',
      sections: [
        {
          title: '读阳性结果',
          items: [
            '阳性结果 = 真阳性 + 假阳性。',
            '阳性预测值看真阳性在所有阳性里占多少。',
            '基础率很低时，假阳性的数量可能很可观。',
          ],
        },
      ],
    }
  }
  if (lessonId === 'binomial') {
    return {
      eyebrow: '图像阅读',
      title: '二项分布图像怎么看？',
      summary: '每根柱子对应一个成功次数 k，柱子高度表示正好 k 次成功的概率。高亮范围是当前选择的事件。',
      sections: [
        {
          title: '看理论和模拟',
          items: [
            '理论分布来自公式计算。',
            '模拟分布来自重复随机试验。',
            '模拟次数越多，两者通常越接近。',
          ],
        },
      ],
    }
  }
  if (lessonId === 'continuous-density') {
    return {
      eyebrow: '图像阅读',
      title: '密度图像怎么看？',
      summary: '曲线高度是密度，真正的概率是高亮区间下方的面积。区间越宽，面积通常越大。',
      sections: [
        {
          title: '不要只看高度',
          items: [
            '密度高说明附近值更集中，但单点本身没有概率质量。',
            'a 和 b 决定正在计算的区间。',
            '直方图来自随机样本，用来和理论密度对照。',
          ],
        },
      ],
    }
  }
  if (lessonId === 'central-limit-theorem') {
    return {
      eyebrow: '图像阅读',
      title: '中心极限定理图像怎么看？',
      summary: '上方展示原始来源分布，下方展示很多组样本均值的分布。重点看下方，而不是误以为上方会变成正态。',
      sections: [
        {
          title: '看样本大小 n',
          items: [
            'n 越大，每组平均数通常越稳定。',
            '样本均值的分布会变窄。',
            '正态叠加线是理论近似，用来对照模拟结果。',
          ],
        },
      ],
    }
  }
  if (lessonId === 'random-variable-sum') {
    return {
      eyebrow: '图像阅读',
      title: 'X + Y 图像怎么看？',
      summary: '左侧或上方的网格列出 X 和 Y 的所有配对；右侧输出分布把相同和的配对概率加到同一根柱子里。',
      sections: [
        {
          title: '看同一个和',
          items: [
            '一个格子是一种 x 和 y 的组合。',
            '格子颜色或高亮表示这个组合是否得到当前选中的和。',
            '同一个和可能由很多组合产生，所以输出概率要相加。',
          ],
        },
      ],
    }
  }
  return {
    eyebrow: '图像阅读',
    title: '条件概率图像怎么看？',
    summary: '图中先选定一个条件范围，再在这个范围里看目标事件占多少。条件就是新的分母。',
    sections: [
      {
        title: '看哪些东西',
        items: [
          '全集是所有可能对象。',
          '高亮区域是当前条件，也就是分母。',
          '高亮区域里同时满足目标事件的部分是分子。',
          '切换 P(A | B) 和 P(B | A) 时，分母会换掉。',
        ],
      },
    ],
  }
}

function zhVariationTopic(lessonId: ProbabilityLessonId): HelpTopic {
  if (lessonId === 'conditional-probability') {
    return {
      eyebrow: '探索提示',
      title: '调整参数时看什么？',
      summary: '优先看分母是否换了，或者交集相对于当前条件范围是否变大。',
      sections: [
        {
          title: '建议观察',
          items: ['增大 P(A∩B) 时，两个方向的条件概率都可能变化。', '切换目标时，图中高亮的“世界”会改变。', '如果条件概率未定义，说明当前分母为 0。'],
        },
      ],
    }
  }
  if (lessonId === 'bayes' || lessonId === 'medical-test') {
    return {
      eyebrow: '探索提示',
      title: '调整参数时看什么？',
      summary: '不要只看测试或证据有多准，也要看目标情况本来有多常见。',
      sections: [
        {
          title: '建议观察',
          items: ['先把先验或患病率调得很低，观察误报怎样影响结果。', '再提高似然、敏感度或特异度，看后验或预测值是否明显改变。', '用人数模式看自然频数，通常比百分比更直观。'],
        },
      ],
    }
  }
  if (lessonId === 'binomial') {
    return {
      eyebrow: '探索提示',
      title: '调整参数时看什么？',
      summary: '看分布的中心、宽度和高亮事件概率怎样变化。',
      sections: [
        {
          title: '建议观察',
          items: ['增大 p，柱群通常向右移动。', '增大 n，可能的成功次数范围变宽。', '增加模拟次数，随机柱子通常更接近理论柱子。'],
        },
      ],
    }
  }
  if (lessonId === 'continuous-density') {
    return {
      eyebrow: '探索提示',
      title: '调整参数时看什么？',
      summary: '重点看高亮面积，而不是某一点的曲线高度。',
      sections: [
        {
          title: '建议观察',
          items: ['移动 a 和 b，观察概率面积怎么改变。', '改变 σ 或 λ，观察密度曲线变窄或变宽。', '打开直方图时，把样本形状和理论曲线对照。'],
        },
      ],
    }
  }
  if (lessonId === 'central-limit-theorem') {
    return {
      eyebrow: '探索提示',
      title: '调整参数时看什么？',
      summary: '重点看样本均值分布，而不是原始分布。',
      sections: [
        {
          title: '建议观察',
          items: ['增大样本大小 n，下方分布通常变窄。', '切换不同来源分布，看下方是否仍逐渐接近钟形。', '打开标准化 z 后，观察尺度被统一后的形状。'],
        },
      ],
    }
  }
  return {
    eyebrow: '探索提示',
    title: '调整参数时看什么？',
    summary: '看 X、Y 的分布怎样通过所有配对传到 X + Y 的输出分布。',
    sections: [
      {
        title: '建议观察',
        items: ['先用两个公平骰子，看为什么和为 7 的组合最多。', '切换硬币或偏置硬币，观察输出分布如何改变。', '选中不同的和，看哪些配对格子被收集起来。'],
      },
    ],
  }
}

function enTopics(lessonId: ProbabilityLessonId): Record<ProbabilityHelpTopicId, HelpTopic> {
  return {
    overview: {
      eyebrow: 'Probability',
      title: 'What is this module exploring?',
      summary: 'Probability is about which outcomes can happen, how large their share is, and how new information changes judgment. This module turns probability into areas, counts, bars, samples, and pair grids.',
      sections: [
        {
          title: 'Start with intuition',
          items: [
            'A probability can be read as the share of a target case inside many cases.',
            'Conditional probability recalculates that share inside a smaller world.',
            'A distribution lists possible values and how common each one is.',
            'Simulation does not prove the formula; it helps you see long-run frequency approach theory.',
          ],
        },
        {
          title: 'A useful exploration order',
          items: [
            'Read what the highlighted region, bar, or area represents before reading the formula.',
            'Move one slider at a time and watch which denominator, area, or tallest bar changes.',
            'If a result feels surprising, check which population you are looking inside.',
          ],
        },
      ],
    },
    graph: enGraphTopic(lessonId),
    probability: {
      eyebrow: 'Term',
      title: 'What does P(...) mean?',
      summary: (
        <>
          <Formula tex="P(A)" /> means the probability that event <Formula tex="A" /> happens. A useful first image is “target part divided by whole.”
        </>
      ),
      sections: [
        {
          title: 'Why this is about proportions',
          items: ['Probability 0 means impossible; probability 1 means certain.', 'In an area picture, probability is the share of the area.', 'In a count picture, probability is target count divided by total count.'],
        },
      ],
    },
    conditional: {
      eyebrow: 'Term',
      title: 'What is conditional probability?',
      summary: (
        <>
          <Formula tex="P(A\\mid B)" /> means “the probability of <Formula tex="A" /> given that <Formula tex="B" /> already happened.” The condition on the right side of the bar changes the denominator.
        </>
      ),
      sections: [
        {
          title: 'Why P(A | B) and P(B | A) differ',
          items: ['P(A | B) looks only inside B.', 'P(B | A) looks only inside A.', 'The two calculations use different worlds, so their answers usually differ.'],
        },
      ],
    },
    bayes: {
      eyebrow: 'Term',
      title: 'What is Bayes rule doing?',
      summary: (
        <>
          Bayes rule connects how plausible <Formula tex="H" /> was before evidence with how plausible it should be after seeing evidence <Formula tex="E" />.
        </>
      ),
      sections: [
        {
          title: 'Prior, likelihood, posterior',
          items: ['Prior P(H): how common the hypothesis was before evidence.', 'Likelihood P(E | H): how often the evidence appears if the hypothesis is true.', 'Posterior P(H | E): how likely the hypothesis is after evidence appears.'],
        },
        {
          title: 'Why the base rate matters',
          body: 'If H is rare, false alarms or other sources of the same evidence can still dominate the evidence group.',
        },
      ],
    },
    'medical-test': {
      eyebrow: 'Term',
      title: 'Why can test results feel paradoxical?',
      summary: 'A positive result includes true positives and false positives. What a positive result means depends on how many of each type are in the positive group.',
      sections: [
        {
          title: 'Separate the four cases',
          items: ['True positive: disease and positive test.', 'False positive: no disease but positive test.', 'False negative: disease but negative test.', 'True negative: no disease and negative test.'],
        },
        {
          title: 'Do not mix the questions',
          body: 'Sensitivity and specificity describe the test. Predictive values describe what a result means for a person.',
        },
      ],
    },
    binomial: {
      eyebrow: 'Term',
      title: 'What is a binomial distribution?',
      summary: (
        <>
          It describes the probability of getting <Formula tex="k" /> successes after <Formula tex="n" /> independent yes/no trials where each success probability is <Formula tex="p" />.
        </>
      ),
      sections: [
        {
          title: 'What the bars mean',
          items: ['The x-axis k is the success count.', 'Each bar is the probability of exactly k successes.', 'Larger p shifts the distribution right; larger n gives more possible k values.'],
        },
      ],
    },
    density: {
      eyebrow: 'Term',
      title: 'What is continuous density?',
      summary: 'For continuous variables, probability comes from area across an interval, not from the height at one exact point.',
      sections: [
        {
          title: 'Why one exact point has probability 0',
          items: ['A continuous variable has infinitely many possible values.', 'One exact point has no width, so it has no area.', 'P(a <= X <= b) uses the area from a to b.'],
        },
      ],
    },
    clt: {
      eyebrow: 'Term',
      title: 'What does the central limit theorem say?',
      summary: 'It does not say the original data becomes normal. It says repeated sample averages tend to form a steadier, more bell-shaped distribution.',
      sections: [
        {
          title: 'Keep the two layers separate',
          items: ['First sample several values from the source distribution.', 'Average that sample to get one sample mean.', 'Repeat many samples, and the sample means form their own distribution.'],
        },
      ],
    },
    'random-variable-sum': {
      eyebrow: 'Term',
      title: 'What happens when random variables add?',
      summary: (
        <>
          If <Formula tex="S=X+Y" />, every pair <Formula tex="(x,y)" /> that creates the same sum contributes probability to the same output bar.
        </>
      ),
      sections: [
        {
          title: 'Why diagonals appear',
          items: ['Each grid cell is one X and Y pair.', 'Pairs on the same diagonal have the same x + y.', 'The output bar height is the total probability of those cells.'],
        },
      ],
    },
    formula: {
      eyebrow: 'Formula',
      title: 'How should I read the current formula?',
      summary: 'The formula compresses what the graph shows as numerator, denominator, area, bars, or a sum over pairs. Match symbols back to the picture before trying to derive it.',
      sections: [
        {
          title: 'Common symbols',
          items: ['P(A): probability that event A happens.', 'P(A | B): share of A inside the world where B happened.', '∩: both events happen.', 'Σ: add many matching terms.', 'E(X): average or expected value of random variable X.'],
        },
      ],
    },
    values: {
      eyebrow: 'Values',
      title: 'What are the current values for?',
      summary: 'The readout shows the key proportions, areas, means, variances, or simulation results behind the picture.',
      sections: [
        {
          title: 'How to use them',
          items: ['Move a slider and watch which value changes most.', 'Match each value to the highlighted region, bar, or area.', 'If a value is undefined, the denominator is usually 0 or the current setting has no computable object.'],
        },
      ],
    },
    variation: enVariationTopic(lessonId),
  }
}

function enGraphTopic(lessonId: ProbabilityLessonId): HelpTopic {
  if (lessonId === 'bayes') {
    return {
      eyebrow: 'Graph reading',
      title: 'How do I read the Bayes picture?',
      summary: 'The graph splits evidence E by source: some comes from H, and some comes from not H. The posterior is the share of H inside all evidence cases.',
      sections: [
        {
          title: 'What to watch',
          items: ['H and E is the numerator.', 'All E cases form the denominator.', 'More false alarms make the not-H part of the denominator larger.'],
        },
      ],
    }
  }
  if (lessonId === 'medical-test') {
    return {
      eyebrow: 'Graph reading',
      title: 'How do I read the medical-test picture?',
      summary: 'The population is split into true positives, false positives, false negatives, and true negatives. The selected result highlights the relevant pair.',
      sections: [
        {
          title: 'Reading a positive result',
          items: ['Positive results = true positives + false positives.', 'Positive predictive value is true positives divided by all positives.', 'When base rate is low, false positives can be numerous.'],
        },
      ],
    }
  }
  if (lessonId === 'binomial') {
    return {
      eyebrow: 'Graph reading',
      title: 'How do I read the binomial chart?',
      summary: 'Each bar is one success count k. Its height is the probability of exactly k successes. The highlighted range is the selected event.',
      sections: [
        {
          title: 'Theory and simulation',
          items: ['The theory bars come from the formula.', 'The simulation bars come from repeated random trials.', 'With more runs, simulation usually gets closer to theory.'],
        },
      ],
    }
  }
  if (lessonId === 'continuous-density') {
    return {
      eyebrow: 'Graph reading',
      title: 'How do I read the density graph?',
      summary: 'Curve height is density. Probability is the highlighted area under the curve across an interval.',
      sections: [
        {
          title: 'Do not read only height',
          items: ['High density means nearby values are more concentrated, not that one exact point has probability mass.', 'a and b define the interval.', 'The histogram comes from random samples and can be compared with the theoretical curve.'],
        },
      ],
    }
  }
  if (lessonId === 'central-limit-theorem') {
    return {
      eyebrow: 'Graph reading',
      title: 'How do I read the CLT graph?',
      summary: 'The source distribution and the distribution of repeated sample means are different objects. The theorem is about the sample means.',
      sections: [
        {
          title: 'Watch sample size n',
          items: ['Larger n usually makes each average more stable.', 'The sample-mean distribution gets narrower.', 'The normal overlay is the theoretical approximation.'],
        },
      ],
    }
  }
  if (lessonId === 'random-variable-sum') {
    return {
      eyebrow: 'Graph reading',
      title: 'How do I read the X + Y picture?',
      summary: 'The grid lists all X and Y pairs. The output distribution adds every pair with the same sum into one bar.',
      sections: [
        {
          title: 'Watch one sum',
          items: ['Each cell is one x and y combination.', 'Highlighted cells create the selected sum.', 'Many different pairs can feed the same output bar.'],
        },
      ],
    }
  }
  return {
    eyebrow: 'Graph reading',
    title: 'How do I read the conditional-probability picture?',
    summary: 'Choose a condition first, then measure the target event inside that condition. The condition is the new denominator.',
    sections: [
      {
        title: 'What to watch',
        items: ['The universe is all possible cases.', 'The highlighted condition is the denominator.', 'The target part inside the condition is the numerator.', 'Switching P(A | B) and P(B | A) changes the denominator.'],
      },
    ],
  }
}

function enVariationTopic(lessonId: ProbabilityLessonId): HelpTopic {
  if (lessonId === 'conditional-probability') {
    return {
      eyebrow: 'Exploration tip',
      title: 'What should I watch while changing parameters?',
      summary: 'Focus on whether the denominator changed, or whether the intersection grew relative to the current condition.',
      sections: [{ title: 'Try this', items: ['Increase P(A∩B) and watch both conditional directions.', 'Switch the target and see the highlighted world change.', 'Undefined usually means the denominator is 0.'] }],
    }
  }
  if (lessonId === 'bayes' || lessonId === 'medical-test') {
    return {
      eyebrow: 'Exploration tip',
      title: 'What should I watch while changing parameters?',
      summary: 'Do not only watch test accuracy or evidence strength. Also watch how common the target case was before evidence.',
      sections: [{ title: 'Try this', items: ['Make the prior or prevalence very low and watch false alarms.', 'Then raise likelihood, sensitivity, or specificity and compare the result.', 'Use count mode; natural frequencies are often easier than percentages.'] }],
    }
  }
  if (lessonId === 'binomial') {
    return {
      eyebrow: 'Exploration tip',
      title: 'What should I watch while changing parameters?',
      summary: 'Watch the center, width, and highlighted event probability.',
      sections: [{ title: 'Try this', items: ['Increase p and the bars usually move right.', 'Increase n and the range of success counts grows.', 'Increase simulation runs and the random bars usually approach theory.'] }],
    }
  }
  if (lessonId === 'continuous-density') {
    return {
      eyebrow: 'Exploration tip',
      title: 'What should I watch while changing parameters?',
      summary: 'Watch highlighted area, not only curve height.',
      sections: [{ title: 'Try this', items: ['Move a and b and watch probability area change.', 'Change sigma or lambda and watch the curve narrow or spread.', 'Turn on the histogram and compare samples with the theoretical curve.'] }],
    }
  }
  if (lessonId === 'central-limit-theorem') {
    return {
      eyebrow: 'Exploration tip',
      title: 'What should I watch while changing parameters?',
      summary: 'Watch the sample-mean distribution, not the original distribution.',
      sections: [{ title: 'Try this', items: ['Increase sample size n and the lower distribution usually narrows.', 'Switch source distributions and watch whether the lower shape still becomes bell-like.', 'Turn on standardized z to compare shapes on the same scale.'] }],
    }
  }
  return {
    eyebrow: 'Exploration tip',
    title: 'What should I watch while changing parameters?',
    summary: 'Watch how the X and Y distributions flow through all pairs into the X + Y output.',
    sections: [{ title: 'Try this', items: ['Start with two fair dice and see why sum 7 has the most pairs.', 'Switch to coin or biased coin and watch the output distribution change.', 'Select different sums and see which grid cells are collected.'] }],
  }
}
