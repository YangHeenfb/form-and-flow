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
    entryTitle: 'Notes',
    entryHint: 'Short observations connecting populations, areas, samples, and formulas.',
    openOverview: 'Notes',
    openGraph: 'Visual notes',
    close: 'Close notes',
  },
  zh: {
    entryTitle: '笔记',
    entryHint: '把人群、面积、样本和公式联系起来的简短观察。',
    openOverview: '笔记',
    openGraph: '视觉笔记',
    close: '关闭笔记',
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
      eyebrow: '笔记',
      title: '比例、面积与分布',
      summary: '概率不是只背公式，而是在问：哪些结果可能发生、发生的比例有多大，以及新信息会怎样改变判断。这里把概率变成面积、人数、柱子、样本和配对格子。',
      sections: [
        {
          title: '观察',
          items: [
            '概率可以理解成“在很多次或很多个对象里，目标情况占多大比例”。',
            '条件概率是在一个更小的世界里重新计算比例。',
            '分布描述一个随机变量可能取哪些值，以及每个值有多常见。',
            '模拟不是证明公式，而是帮你看到长期频率怎样接近理论概率。',
          ],
        },
        {
          title: '变化线索',
          items: [
            '高亮区域、柱子或面积把公式中的总体与目标部分直接画了出来。',
            '参数变化会传到分母、面积或分布最高点，但传递方式取决于当前总体。',
            '反直觉结果往往来自“正在观察的总体”已经改变。',
          ],
        },
      ],
    },
    graph: zhGraphTopic(lessonId),
    probability: {
      eyebrow: '术语',
      title: '概率 P(...)',
      summary: (
        <>
          <Formula tex="P(A)" /> 表示事件 <Formula tex="A" /> 发生的概率。可以先把它想成“目标部分占整体的比例”。
        </>
      ),
      sections: [
        {
          title: '为什么总是在看比例',
          items: [
            '在有限人群或离散图像里，概率 0 可以理解成不会出现，概率 1 可以理解成一定出现。',
            '在连续变量里，某个精确点的概率可以是 0，所以通常要看一段区间的面积。',
            '如果把总体画成一块区域，概率就是某个部分占这块区域的比例；图中极小区域有时会略放大，精确值看右侧读数。',
            '如果把总体画成人数，概率就是目标人数除以总人数。',
          ],
        },
      ],
    },
    conditional: {
      eyebrow: '术语',
      title: '条件概率',
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
      title: '贝叶斯规则',
      summary: (
        <>
          贝叶斯规则把“先觉得 <Formula tex="H" /> 有多可能”和“看到证据 <Formula tex="E" /> 后应怎样更新”连起来。
        </>
      ),
      sections: [
        {
          title: '先验、似然、后验',
          items: [
            'H 是你正在判断的假设，E 是你刚看到的证据。',
            '先验 P(H)：看到证据之前，假设本来有多常见。',
            '似然 P(E | H)：如果假设是真的，证据出现的概率。',
            '后验 P(H | E)：看到证据之后，假设为真的概率。',
          ],
        },
        {
          title: '分母 P(E) 从哪里来',
          items: ['所有证据 E = 来自 H 的证据 + 来自非 H 的证据。', 'P(E)=P(E|H)P(H)+P(E|非 H)P(非 H)。'],
        },
        {
          title: '赔率和似然比',
          items: ['赔率 odds 不是概率。概率问“占全部多少”，赔率问“目标情况 : 非目标情况”。', '似然比表示证据更偏向 H 还是非 H。大于 1 时更支持 H，小于 1 时更支持非 H。', '如果非 H 情况下证据从不出现，而 H 情况下会出现，似然比会显示为 ∞。'],
        },
        {
          title: '为什么基础率重要',
          body: '如果 H 本来非常少见，即使证据看起来支持 H，误报或其他来源也可能占很大比例。',
        },
      ],
    },
    'medical-test': {
      eyebrow: '术语',
      title: '基础率与阳性结果',
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
          body: '测试“准不准”和结果“意味着什么”不是同一个问题。敏感度和特异度描述测试本身；阳性预测值和阴性预测值描述拿到结果后，一个人属于哪一类的概率。',
        },
      ],
    },
    binomial: {
      eyebrow: '术语',
      title: '二项分布',
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
      title: '连续概率密度',
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
      title: '中心极限定理',
      summary: '它说的不是原始数据会变成正态，而是“很多次抽样得到的平均数”会趋向更稳定、更接近钟形的分布。',
      sections: [
        {
          title: '两层随机性',
          items: [
            '先从原始分布抽一组样本。',
            '把这一组样本求平均，得到一个样本均值。',
            '重复很多组后，样本均值本身也会形成一个分布。',
            '标准误 σ / √n 可以理解成样本平均数通常会离真实平均数多远。',
          ],
        },
      ],
    },
    'random-variable-sum': {
      eyebrow: '术语',
      title: '随机变量之和',
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
      title: '当前公式',
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
      title: '当前数值',
      summary: '右侧数值把图里的关键比例、面积、均值、方差或模拟结果显示出来，帮助你确认图像变化到底对应哪个概率量。',
      sections: [
        {
          title: '数值对应',
          items: [
            '参数变化会反映在与它相关的数值上。',
            '每个数值都对应图中的高亮区域、柱子或面积。',
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
      eyebrow: '视觉笔记',
      title: '贝叶斯面积图',
      summary: '图中把证据 E 的来源拆开：一部分来自 H，另一部分来自非 H。后验概率就是证据出现后，H 那部分占全部证据的比例。',
      sections: [
        {
          title: '看哪些东西',
          items: [
            'H 且 E 是分子。',
            '所有 E 是分母，包含 H 且 E 以及非 H 且 E。',
            '假阳性或误报越多，分母中非 H 的部分越大。',
            '很小的非零区域会稍微放大，方便看见；精确比例看右侧读数。',
          ],
        },
      ],
    }
  }
  if (lessonId === 'medical-test') {
    return {
      eyebrow: '视觉笔记',
      title: '医学测试频数图',
      summary: '图中把人群分成真阳性、假阳性、假阴性、真阴性。当前选中的测试结果会高亮对应的两类人。',
      sections: [
        {
          title: '读测试结果',
          items: [
            '阳性结果 = 真阳性 + 假阳性。',
            '阳性预测值看真阳性在所有阳性里占多少。',
            '阴性结果 = 真阴性 + 假阴性。',
            '阴性预测值看真阴性在所有阴性里占多少。',
            '基础率很低时，假阳性的数量可能很可观。',
            '很小的非零区域会稍微放大，方便看见；精确比例看右侧读数。',
          ],
        },
      ],
    }
  }
  if (lessonId === 'binomial') {
    return {
      eyebrow: '视觉笔记',
      title: '二项分布',
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
      eyebrow: '视觉笔记',
      title: '密度与面积',
      summary: '曲线高度是密度，真正的概率是高亮区间下方的面积。区间变宽通常会增加面积，但移动区间时还要看曲线高度。',
      sections: [
        {
          title: '不要只看高度',
          items: [
            '密度高说明附近值更集中，但单点本身没有概率质量。',
            'a 和 b 决定正在计算的区间。如果只是把区间变宽而不移走原来的部分，面积会变大；移动区间时，面积还取决于曲线高度。',
            '直方图来自随机样本，用来和理论密度对照。',
          ],
        },
      ],
    }
  }
  if (lessonId === 'central-limit-theorem') {
    return {
      eyebrow: '视觉笔记',
      title: '重复取平均',
      summary: '上方展示原始来源分布，下方展示很多组样本均值的分布。重点看下方，而不是误以为上方会变成正态。',
      sections: [
        {
          title: '看样本大小 n',
          items: [
            'n 越大，每组平均数通常越稳定。',
            '样本均值的分布会变窄。',
            '正态叠加线是理论近似，用来对照模拟结果。',
            '这里使用 i.i.d. 样本并假设原始分布方差有限；n 越大，正态近似通常越明显。',
          ],
        },
      ],
    }
  }
  if (lessonId === 'random-variable-sum') {
    return {
      eyebrow: '视觉笔记',
      title: '随机变量之和',
      summary: '左侧或上方的网格列出 X 和 Y 的所有配对；右侧输出分布把相同和的配对概率加到同一根柱子里。',
      sections: [
        {
          title: '看同一个和',
          items: [
            '这一节默认 X 和 Y 独立，所以格子的概率可以相乘。',
            '一个格子是一种 x 和 y 的组合。',
            '格子颜色或高亮表示这个组合是否得到当前选中的和。',
            '同一个和可能由很多组合产生，所以输出概率要相加。',
          ],
        },
      ],
    }
  }
  return {
    eyebrow: '视觉笔记',
    title: '条件概率面积图',
    summary: '图中先选定一个条件范围，再在这个范围里看目标事件占多少。条件就是新的分母。',
    sections: [
      {
        title: '看哪些东西',
        items: [
          '全集是所有可能对象。',
          '高亮区域是当前条件，也就是分母。',
          '高亮区域里同时满足目标事件的部分是分子。',
          '切换 P(A | B) 和 P(B | A) 时，分母会换掉。',
          '很小的非零区域会稍微放大，方便看见；精确比例看右侧读数。',
        ],
      },
    ],
  }
}

function zhVariationTopic(lessonId: ProbabilityLessonId): HelpTopic {
  if (lessonId === 'conditional-probability') {
    return {
      eyebrow: '变化线索',
      title: '分母与交集',
      summary: '优先看分母是否换了，或者交集相对于当前条件范围是否变大。',
      sections: [
        {
          title: '观察',
          items: ['P(A∩B) 增大时，两个方向的条件概率都可能变化。', '目标切换后，图中高亮的“世界”也随分母改变。', '条件概率未定义对应当前分母为 0。'],
        },
      ],
    }
  }
  if (lessonId === 'bayes' || lessonId === 'medical-test') {
    return {
      eyebrow: '变化线索',
      title: '先验与证据',
      summary: '不要只看测试或证据有多准，也要看目标情况本来有多常见。',
      sections: [
        {
          title: '观察',
          items: ['先验或患病率很低时，误报会在阳性结果中占据更明显的比例。', '似然、敏感度或特异度的变化会重新分配后验或预测值。', '人数模式把这些关系变成自然频数，比单独的百分比更直接。'],
        },
      ],
    }
  }
  if (lessonId === 'binomial') {
    return {
      eyebrow: '变化线索',
      title: '中心与宽度',
      summary: '看分布的中心、宽度和高亮事件概率怎样变化。',
      sections: [
        {
          title: '观察',
          items: ['p 增大时，柱群通常向右移动。', 'n 增大时，可能的成功次数范围变宽。', '模拟次数增加后，随机柱子通常更接近理论柱子。'],
        },
      ],
    }
  }
  if (lessonId === 'continuous-density') {
    return {
      eyebrow: '变化线索',
      title: '区间与面积',
      summary: '重点看高亮面积，而不是某一点的曲线高度。',
      sections: [
        {
          title: '观察',
          items: ['a 和 b 的移动直接改变被积累的概率面积。', 'σ 或 λ 改变时，密度曲线的宽窄与高度一起变化。', '直方图让有限样本的形状与理论密度同时出现。'],
        },
      ],
    }
  }
  if (lessonId === 'central-limit-theorem') {
    return {
      eyebrow: '变化线索',
      title: '样本大小与均值分布',
      summary: '重点看样本均值分布，而不是原始分布。',
      sections: [
        {
          title: '观察',
          items: ['样本大小 n 增大时，下方的均值分布通常变窄。', '来源分布改变后，均值分布仍会逐渐形成稳定的钟形轮廓。', '标准化 z 把不同 n 的尺度统一，便于比较形状。'],
        },
      ],
    }
  }
  return {
    eyebrow: '变化线索',
    title: '配对如何汇入总和',
    summary: 'X、Y 的分布会通过所有配对汇入 X + Y 的输出分布。',
    sections: [
      {
        title: '观察',
        items: ['两个公平骰子的中间和拥有最多配对。', '硬币偏置会改变每个配对的权重，并传到输出分布。', '不同的和对应配对网格中的不同对角线。'],
      },
    ],
  }
}

function enTopics(lessonId: ProbabilityLessonId): Record<ProbabilityHelpTopicId, HelpTopic> {
  return {
    overview: {
      eyebrow: 'Notes',
      title: 'Proportions, areas, and distributions',
      summary: 'Probability is about which outcomes can happen, how large their share is, and how new information changes judgment. This module turns probability into areas, counts, bars, samples, and pair grids.',
      sections: [
        {
          title: 'Observation',
          items: [
            'A probability can be read as the share of a target case inside many cases.',
            'Conditional probability recalculates that share inside a smaller world.',
            'A distribution lists possible values and how common each one is.',
            'Simulation does not formally prove the formula; it helps you see long-run frequency approach theory.',
          ],
        },
        {
          title: 'What changes',
          items: [
            'Highlighted regions, bars, and areas make the population and target part in each formula visible.',
            'Parameter changes propagate to denominators, areas, and distribution peaks in different ways.',
            'A surprising result often comes from a change in the population being viewed.',
          ],
        },
      ],
    },
    graph: enGraphTopic(lessonId),
    probability: {
      eyebrow: 'Term',
      title: 'Probability P(...)',
      summary: (
        <>
          <Formula tex="P(A)" /> means the probability that event <Formula tex="A" /> happens. A useful first image is “target part divided by whole.”
        </>
      ),
      sections: [
        {
          title: 'Why this is about proportions',
          items: [
            'In finite count pictures, probability 0 behaves like “does not occur” and probability 1 behaves like “always occurs.”',
            'For continuous variables, an exact point can have probability 0, so we usually measure intervals by area.',
            'In an area picture, probability is the share of the area. Tiny drawn regions may be enlarged slightly; use the readout for exact values.',
            'In a count picture, probability is target count divided by total count.',
          ],
        },
      ],
    },
    conditional: {
      eyebrow: 'Term',
      title: 'Conditional probability',
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
      title: 'Bayes rule',
      summary: (
        <>
          Bayes rule connects how plausible <Formula tex="H" /> was before evidence with how plausible it should be after seeing evidence <Formula tex="E" />.
        </>
      ),
      sections: [
        {
          title: 'Prior, likelihood, posterior',
          items: ['H is the hypothesis you are judging, and E is the evidence you just saw.', 'Prior P(H): how common the hypothesis was before evidence.', 'Likelihood P(E | H): how often the evidence appears if the hypothesis is true.', 'Posterior P(H | E): how likely the hypothesis is after evidence appears.'],
        },
        {
          title: 'Where P(E) comes from',
          items: ['All evidence E = evidence from H + evidence from not H.', 'P(E)=P(E|H)P(H)+P(E|not H)P(not H).'],
        },
        {
          title: 'Odds and likelihood ratio',
          items: ['Odds are not probability. Probability asks “share of the whole”; odds ask “target cases : other cases.”', 'The likelihood ratio says whether evidence leans toward H or not H. Above 1 supports H; below 1 supports not H.', 'If evidence never appears under not H but can appear under H, the likelihood ratio is shown as ∞.'],
        },
        {
          title: 'Why the base rate matters',
          body: 'If H is rare, false alarms or other sources of the same evidence can still dominate the evidence group.',
        },
      ],
    },
    'medical-test': {
      eyebrow: 'Term',
      title: 'Base rates and positive results',
      summary: 'A positive result includes true positives and false positives. What a positive result means depends on how many of each type are in the positive group.',
      sections: [
        {
          title: 'Separate the four cases',
          items: ['True positive: disease and positive test.', 'False positive: no disease but positive test.', 'False negative: disease but negative test.', 'True negative: no disease and negative test.'],
        },
        {
          title: 'Do not mix the questions',
          body: 'Test accuracy and result meaning are not the same question. Sensitivity and specificity describe the test. Predictive values describe what a result means for a person.',
        },
      ],
    },
    binomial: {
      eyebrow: 'Term',
      title: 'Binomial distribution',
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
      title: 'Continuous density',
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
      title: 'Central limit theorem',
      summary: 'It does not say the original data becomes normal. It says repeated sample averages tend to form a steadier, more bell-shaped distribution.',
      sections: [
        {
          title: 'Two layers of randomness',
          items: ['First sample several values from the source distribution.', 'Average that sample to get one sample mean.', 'Repeat many samples, and the sample means form their own distribution.', 'The standard error σ / √n is the typical distance between a sample mean and the true mean.'],
        },
      ],
    },
    'random-variable-sum': {
      eyebrow: 'Term',
      title: 'Sum of random variables',
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
      title: 'Current formula',
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
      title: 'Current values',
      summary: 'The readout shows the key proportions, areas, means, variances, or simulation results behind the picture.',
      sections: [
        {
          title: 'Reading the values',
          items: ['A parameter change is most visible in the values that depend on it.', 'Each value corresponds to a highlighted region, bar, or area.', 'An undefined value usually means the denominator is 0 or the current setting has no computable object.'],
        },
      ],
    },
    variation: enVariationTopic(lessonId),
  }
}

function enGraphTopic(lessonId: ProbabilityLessonId): HelpTopic {
  if (lessonId === 'bayes') {
    return {
      eyebrow: 'Visual notes',
      title: 'Bayes area view',
      summary: 'The graph splits evidence E by source: some comes from H, and some comes from not H. The posterior is the share of H inside all evidence cases.',
      sections: [
        {
          title: 'What to watch',
          items: ['H and E is the numerator.', 'All E cases form the denominator.', 'More false alarms make the not-H part of the denominator larger.', 'Tiny nonzero regions are enlarged slightly so they remain visible; use the readout for exact values.'],
        },
      ],
    }
  }
  if (lessonId === 'medical-test') {
    return {
      eyebrow: 'Visual notes',
      title: 'Medical-test frequency view',
      summary: 'The population is split into true positives, false positives, false negatives, and true negatives. The selected result highlights the relevant pair.',
      sections: [
        {
          title: 'Reading a test result',
          items: ['Positive results = true positives + false positives.', 'Positive predictive value is true positives divided by all positives.', 'Negative results = true negatives + false negatives.', 'Negative predictive value is true negatives divided by all negatives.', 'When base rate is low, false positives can be numerous.', 'Tiny nonzero regions are enlarged slightly so they remain visible; use the readout for exact values.'],
        },
      ],
    }
  }
  if (lessonId === 'binomial') {
    return {
      eyebrow: 'Visual notes',
      title: 'Binomial distribution',
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
      eyebrow: 'Visual notes',
      title: 'Density and area',
      summary: 'Curve height is density. Probability is the highlighted area under the curve across an interval. Widening an interval usually adds area; moving it also depends on curve height.',
      sections: [
        {
          title: 'Do not read only height',
          items: ['High density means nearby values are more concentrated, not that one exact point has probability mass.', 'a and b define the interval. If you only widen the interval without removing area, probability grows; moving it depends on the curve height.', 'The histogram comes from random samples and can be compared with the theoretical curve.'],
        },
      ],
    }
  }
  if (lessonId === 'central-limit-theorem') {
    return {
      eyebrow: 'Visual notes',
      title: 'Repeated averages',
      summary: 'The source distribution and the distribution of repeated sample means are different objects. The theorem is about the sample means.',
      sections: [
        {
          title: 'Sample size n',
          items: ['Larger n usually makes each average more stable.', 'The sample-mean distribution gets narrower.', 'The normal overlay is the theoretical approximation.', 'This view uses i.i.d. samples from a source with finite variance; larger n usually makes the normal approximation clearer.'],
        },
      ],
    }
  }
  if (lessonId === 'random-variable-sum') {
    return {
      eyebrow: 'Visual notes',
      title: 'Sum of random variables',
      summary: 'The grid lists all X and Y pairs. The output distribution adds every pair with the same sum into one bar.',
      sections: [
        {
          title: 'One selected sum',
          items: ['This experiment assumes X and Y are independent, so cell probabilities can be multiplied.', 'Each cell is one x and y combination.', 'Highlighted cells create the selected sum.', 'Many different pairs can feed the same output bar.'],
        },
      ],
    }
  }
  return {
    eyebrow: 'Visual notes',
    title: 'Conditional-probability area view',
    summary: 'The condition defines a smaller universe, and the target event is measured inside it. That conditioned group becomes the new denominator.',
    sections: [
      {
        title: 'What to watch',
        items: ['The universe is all possible cases.', 'The highlighted condition is the denominator.', 'The target part inside the condition is the numerator.', 'Switching P(A | B) and P(B | A) changes the denominator.', 'Tiny nonzero regions are enlarged slightly so they remain visible; use the readout for exact values.'],
      },
    ],
  }
}

function enVariationTopic(lessonId: ProbabilityLessonId): HelpTopic {
  if (lessonId === 'conditional-probability') {
    return {
      eyebrow: 'What changes',
      title: 'Denominator and intersection',
      summary: 'Focus on whether the denominator changed, or whether the intersection grew relative to the current condition.',
      sections: [{ title: 'Observation', items: ['As P(A∩B) grows, both conditional directions can change.', 'Switching the target changes the highlighted world along with the denominator.', 'An undefined conditional probability corresponds to a zero denominator.'] }],
    }
  }
  if (lessonId === 'bayes' || lessonId === 'medical-test') {
    return {
      eyebrow: 'What changes',
      title: 'Prior and evidence',
      summary: 'Do not only watch test accuracy or evidence strength. Also watch how common the target case was before evidence.',
      sections: [{ title: 'Observation', items: ['With a very low prior or prevalence, false alarms occupy a larger share of positive results.', 'Likelihood, sensitivity, and specificity redistribute the posterior or predictive value.', 'Count mode turns the same relationship into natural frequencies instead of isolated percentages.'] }],
    }
  }
  if (lessonId === 'binomial') {
    return {
      eyebrow: 'What changes',
      title: 'Center and width',
      summary: 'The center, width, and highlighted event probability move together as the parameters change.',
      sections: [{ title: 'Observation', items: ['As p increases, the bars usually move right.', 'As n increases, the range of possible success counts grows.', 'With more simulation runs, the random bars usually approach the theoretical bars.'] }],
    }
  }
  if (lessonId === 'continuous-density') {
    return {
      eyebrow: 'What changes',
      title: 'Interval and area',
      summary: 'The highlighted area carries probability; curve height alone does not.',
      sections: [{ title: 'Observation', items: ['Moving a and b directly changes the accumulated probability area.', 'Changing sigma or lambda alters both the width and height of the density.', 'The histogram places finite samples beside the theoretical density.'] }],
    }
  }
  if (lessonId === 'central-limit-theorem') {
    return {
      eyebrow: 'What changes',
      title: 'Sample size and mean distribution',
      summary: 'The changing object is the distribution of sample means, not the original distribution.',
      sections: [{ title: 'Observation', items: ['As sample size n increases, the lower mean distribution usually narrows.', 'Across different source distributions, the mean distribution develops a more stable bell-shaped outline.', 'Standardized z places different n values on a shared scale for shape comparison.'] }],
    }
  }
  return {
    eyebrow: 'What changes',
    title: 'How pairs flow into a sum',
    summary: 'The X and Y distributions flow through all pairs into the X + Y output.',
    sections: [{ title: 'Observation', items: ['For two fair dice, middle sums have the most contributing pairs.', 'Coin bias changes the weight of each pair and propagates to the output distribution.', 'Each selected sum corresponds to one diagonal of the pair grid.'] }],
  }
}
