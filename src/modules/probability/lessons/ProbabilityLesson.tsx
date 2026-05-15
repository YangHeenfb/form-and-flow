import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Pause, Play, RotateCcw, Shuffle } from 'lucide-react'
import { Formula, renderMathText } from '../../../core/ui/Formula.tsx'
import { HelpTrigger, LearningDrawer, TermButton } from '../../../core/ui/LearningHelp.tsx'
import { SelectMenu } from '../../../core/ui/SelectMenu.tsx'
import type { Locale } from '../../../i18n.ts'
import { LessonStageActions } from '../../../platform/LessonStageActions.tsx'
import { ModuleFocusFrame } from '../../../platform/ModuleFocusFrame.tsx'
import { usePlatformLocale } from '../../../platform/platformLocale.tsx'
import { convolutionManifest } from '../../convolution/manifest.ts'
import {
  conceptTopicForLesson,
  getProbabilityHelpTopics,
  probabilityLearningCopy,
  type ProbabilityHelpTopicId,
} from '../learningHelp.tsx'
import { bayesPosterior, contingencyFromConditionals, contingencyFromIntersection } from '../math/bayes.ts'
import {
  binomialDistribution,
  binomialMean,
  binomialRangeProbability,
  binomialVariance,
  simulateBinomial,
  type BinomialRangeMode,
} from '../math/binomial.ts'
import {
  allSourceDistributions,
  empiricalMean,
  empiricalStandardDeviation,
  getSourceDistribution,
  sampleMeans,
  theoreticalStandardError,
  type SourceDistributionId,
} from '../math/clt.ts'
import {
  histogram,
  intervalProbability,
  makeContinuousDistribution,
  sampleContinuousDistribution,
  type ContinuousDistributionId,
} from '../math/continuous.ts'
import { convolveDiscrete, distributionById, probabilityMassGrid, sumDistributionStats } from '../math/convolution.ts'
import { formatCount, formatNumber, formatPercent, formatProbability } from '../math/formatting.ts'
import { medicalTestMetrics } from '../math/medical.ts'
import { cumulativeProbability, normalizeDistribution, sumProbabilities } from '../math/probability.ts'
import { randomSeed } from '../math/random.ts'
import type { ProbabilityLessonId, ValueRow } from '../probabilityTypes.ts'
import { ProbabilityCanvas } from '../shared/ProbabilityCanvas.tsx'
import {
  drawBayesScene,
  drawBinomialScene,
  drawCltScene,
  drawConditionalScene,
  drawContinuousScene,
  drawMedicalScene,
  drawRandomVariableSumScene,
  type ProbabilityDrawingCopy,
} from '../shared/probabilityDrawing.ts'
import { useAnimationLoop } from '../shared/useAnimationLoop.ts'
import {
  booleanParam,
  integerParam,
  numberParam,
  readSearchParams,
  stringParam,
} from '../shared/useProbabilityUrlState.ts'

type Props = {
  lessonId: ProbabilityLessonId
}

type ConditionMode = 'intersection' | 'conditional'
type ConditionalTarget = 'a-given-b' | 'b-given-a' | 'a-given-not-b' | 'b-given-not-a'
type MedicalSelection = 'positive' | 'negative'
type FrequencyMode = 'count' | 'probability'
type DiscretePresetId = 'die' | 'coin' | 'biased-coin' | 'small-custom'

type LessonCopy = {
  title: string
  what: string
  why: string
  formulaTex: string
  formulaLabel: string
  watch: string
}

const lessonCopy: Record<Locale, Record<ProbabilityLessonId, LessonCopy>> = {
  en: {
    'conditional-probability': {
      title: 'Conditional Probability',
      what: 'The highlighted group is the world you are looking inside; the numerator is the part of that world with the target event.',
      why: 'Conditional probability changes the denominator, so P(A | B) and P(B | A) usually answer different questions.',
      formulaTex: 'P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}',
      formulaLabel: 'Conditional probability',
      watch: 'The denominator is the condition. If the condition has probability 0, the conditional probability is not defined.',
    },
    bayes: {
      title: 'Bayes Rule',
      what: 'H is the hypothesis you are judging, and E is the evidence you just saw. Among all E cases, the highlighted part is where H is actually true.',
      why: 'Bayes rule compares evidence from the hypothesis with all possible sources of the same evidence.',
      formulaTex: '\\begin{aligned}P(H\\mid E)&=\\frac{P(E\\mid H)P(H)}{P(E)}\\\\P(E)&=P(E\\mid H)P(H)\\\\&\\quad+P(E\\mid \\neg H)P(\\neg H)\\end{aligned}',
      formulaLabel: 'Bayes rule',
      watch: 'A rare hypothesis can remain unlikely even after evidence if false alarms are common.',
    },
    'medical-test': {
      title: 'Medical Test Paradox',
      what: 'The positive result group contains true positives and false positives; the visible mix determines what a positive result means.',
      why: 'Sensitivity and specificity describe the test. Predictive values describe what the result means for a person.',
      formulaTex: 'PPV=\\frac{TP}{TP+FP}',
      formulaLabel: 'Positive predictive value',
      watch: 'Educational toy model, not medical advice. Base rate matters.',
    },
    binomial: {
      title: 'Binomial Distribution',
      what: 'Each bar is the probability of seeing exactly k successes in n independent trials.',
      why: 'The binomial distribution comes from counting repeated yes/no outcomes with the same success probability.',
      formulaTex: 'P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}',
      formulaLabel: 'Binomial probability mass',
      watch: 'The distribution shifts as p changes; with more runs, simulation usually moves closer to theory but still fluctuates.',
    },
    'continuous-density': {
      title: 'Continuous Probability Density',
      what: 'Probability is the highlighted area under the density curve, not the height at a single point.',
      why: 'A single point has width 0, so P(X = x) is 0 even when the density height is positive.',
      formulaTex: 'P(a\\le X\\le b)=\\int_a^b f(x)\\,dx',
      formulaLabel: 'Interval probability',
      watch: 'Density can be higher than 1; area, not height, must stay between 0 and 1.',
    },
    'central-limit-theorem': {
      title: 'Central Limit Theorem',
      what: 'The lower histogram shows sample means collected from many repeated samples.',
      why: 'The sample-mean distribution keeps center near μ while its spread is about σ / √n.',
      formulaTex: '\\bar X\\approx \\mathcal N\\left(\\mu,\\frac{\\sigma^2}{n}\\right)',
      formulaLabel: 'Normal approximation for sample means',
      watch: 'The original data does not become normal; the distribution of averages is what changes.',
    },
    'random-variable-sum': {
      title: 'Random Variables: X + Y',
      what: 'Every outcome of X pairs with every outcome of Y; diagonals with the same sum collect into the same output bar.',
      why: 'For independent variables, pair probability is P(X=x)P(Y=y), and matching sums are added.',
      formulaTex: 'P(S=k)=\\sum_{x+y=k}P(X=x)P(Y=y)',
      formulaLabel: 'Discrete convolution for a sum',
      watch: 'This lesson assumes X and Y are independent. Different pairs can produce the same sum, which is why dice sums form a triangle.',
    },
  },
  zh: {
    'conditional-probability': {
      title: '条件概率',
      what: '高亮部分表示当前条件下正在观察的世界，分子是其中同时满足目标事件的部分。',
      why: '条件概率会改变分母，所以 P(A | B) 和 P(B | A) 通常是在回答不同问题。',
      formulaTex: 'P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}',
      formulaLabel: '条件概率',
      watch: '分母是条件本身。当条件概率为 0 时，条件概率未定义。',
    },
    bayes: {
      title: '贝叶斯规则',
      what: 'H 是你正在判断的假设，E 是你刚看到的证据。在所有出现证据 E 的情形中，高亮部分是假设 H 真实成立的比例。',
      why: '贝叶斯规则比较“来自假设的证据”和“所有可能来源的证据”。',
      formulaTex: '\\begin{aligned}P(H\\mid E)&=\\frac{P(E\\mid H)P(H)}{P(E)}\\\\P(E)&=P(E\\mid H)P(H)\\\\&\\quad+P(E\\mid \\neg H)P(\\neg H)\\end{aligned}',
      formulaLabel: '贝叶斯规则',
      watch: '当假设很少见且误报常见时，证据出现后假设仍可能不高。',
    },
    'medical-test': {
      title: '医学测试悖论',
      what: '阳性结果中同时包含真阳性和假阳性；两者的可见比例决定了阳性结果的含义。',
      why: '敏感度和特异度描述测试本身，预测值描述测试结果对一个人的含义。',
      formulaTex: 'PPV=\\frac{TP}{TP+FP}',
      formulaLabel: '阳性预测值',
      watch: '这是教学玩具模型，不是医疗建议。基础率很重要。',
    },
    binomial: {
      title: '二项分布',
      what: '每根柱子表示 n 次独立试验中正好出现 k 次成功的概率。',
      why: '二项分布来自重复的、成功概率相同的是/否试验。',
      formulaTex: 'P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}',
      formulaLabel: '二项概率质量',
      watch: 'p 改变时分布会移动；模拟次数增加时，模拟结果通常更接近理论值，但每次仍会有随机波动。',
    },
    'continuous-density': {
      title: '连续概率密度',
      what: '概率是密度曲线下被高亮的面积，而不是某一点的高度。',
      why: '单点宽度为 0，所以即使密度高度为正，P(X = x) 仍为 0。',
      formulaTex: 'P(a\\le X\\le b)=\\int_a^b f(x)\\,dx',
      formulaLabel: '区间概率',
      watch: '密度高度可以超过 1；必须保持在 0 到 1 之间的是面积。',
    },
    'central-limit-theorem': {
      title: '中心极限定理',
      what: '下方直方图显示从许多重复样本中收集到的样本均值。',
      why: '样本均值的中心仍在 μ 附近，宽度大约缩小为 σ / √n。',
      formulaTex: '\\bar X\\approx \\mathcal N\\left(\\mu,\\frac{\\sigma^2}{n}\\right)',
      formulaLabel: '样本均值的正态近似',
      watch: '不是原始数据变成正态，而是平均数的分布在变化。',
    },
    'random-variable-sum': {
      title: '随机变量：X + Y',
      what: 'X 的每个结果都能和 Y 的每个结果配对；相同和的对角线会汇总到同一根输出柱。',
      why: '独立变量的配对概率是 P(X=x)P(Y=y)，同一个和对应的概率要相加。',
      formulaTex: 'P(S=k)=\\sum_{x+y=k}P(X=x)P(Y=y)',
      formulaLabel: '和的离散卷积',
      watch: '这一节默认 X 和 Y 独立。不同配对可能得到同一个和，所以两个骰子的和会形成三角形。',
    },
  },
}

type ProbabilityUiCopy = {
  controls: {
    parameters: string
    lesson: string
    exportPng: string
    play: string
    pause: string
    reset: string
    speed: string
    mode: string
    target: string
    population: string
    populationAria: string
    prior: string
    likelihood: string
    falseAlarm: string
    showOdds: string
    naturalFrequencies: string
    prevalence: string
    sensitivity: string
    specificity: string
    testResult: string
    readout: string
    positive: string
    negative: string
    peopleCount: string
    probability: string
    nTrials: string
    pSuccess: string
    range: string
    exactlyK: string
    atMostK: string
    atLeastK: string
    betweenK: string
    simulationRuns: string
    distribution: string
    normal: string
    uniform: string
    exponential: string
    triangular: string
    min: string
    max: string
    mu: string
    sigma: string
    lambda: string
    modeValue: string
    intervalA: string
    intervalB: string
    sampleCount: string
    showHistogram: string
    showCdf: string
    pointMode: string
    source: string
    sampleSize: string
    numberOfSamples: string
    normalOverlay: string
    standardizedZ: string
    xDistribution: string
    yDistribution: string
    fairDie: string
    coin: string
    biasedCoin: string
    smallCustom: string
    xWeightAt: (value: number) => string
    yWeightAt: (value: number) => string
    normalizeX: string
    normalizeY: string
    selectedSum: string
    showPairGrid: string
    twoDiceSum7: string
    seed: string
    randomizeSeed: string
  }
  sections: {
    what: string
    why: string
    formula: string
    values: string
    watch: string
  }
  values: {
    selectedConditional: string
    likelihoodRatio: string
    priorOdds: string
    posteriorOdds: string
    hAndECount: string
    hAndEProbability: string
    tp: string
    fp: string
    fn: string
    tn: string
    ppv: string
    npv: string
    selectedProbability: string
    mean: string
    variance: string
    pmfSum: string
    intervalProbability: string
    pdfMidpoint: string
    sourceMean: string
    sourceVariance: string
    standardError: string
    empiricalZSd: string
    empiricalSd: string
    empiricalMean: string
    totalProbability: string
    sumProbability: (sum: number) => string
    sumMean: string
    separateMean: string
    sumVariance: string
    notDefined: string
  }
  drawing: ProbabilityDrawingCopy
  categoryLabels: {
    aAndB: string
    aOnly: string
    bOnly: string
    neither: string
    notA: string
    notB: string
    hAndE: string
    notHAndE: string
    hNoE: string
    truePositive: string
    falsePositive: string
    falseNegative: string
    trueNegative: string
    disease: string
    noDisease: string
    positiveTest: string
    negativeTest: string
    trueAmongPositive: string
    noDiseaseAmongNegative: string
    bayesNote: string
  }
  distributionLabels: Record<ContinuousDistributionId, string>
  sourceLabels: Record<SourceDistributionId, string>
  canvasAriaSuffix: string
  medicalWarning: string
  relatedConvolution: string
}

const probabilityUiCopy: Record<Locale, ProbabilityUiCopy> = {
  en: {
    controls: {
      parameters: 'Parameters',
      lesson: 'Lesson',
      exportPng: 'Export PNG',
      play: 'Play',
      pause: 'Pause',
      reset: 'Reset parameters',
      speed: 'speed',
      mode: 'Input method',
      target: 'Question to answer',
      population: 'Population size',
      populationAria: 'population size',
      prior: 'How common H was before evidence: P(H)',
      likelihood: 'If H is true, chance E appears: P(E|H)',
      falseAlarm: 'If H is not true, chance E still appears',
      showOdds: 'Show odds: target / other',
      naturalFrequencies: 'Show as people counts',
      prevalence: 'How many people have the disease before testing',
      sensitivity: 'Among diseased people, share testing positive',
      specificity: 'Among non-diseased people, share testing negative',
      testResult: 'test result',
      readout: 'readout',
      positive: 'positive',
      negative: 'negative',
      peopleCount: 'people count',
      probability: 'probability',
      nTrials: 'Number of trials n',
      pSuccess: 'Chance of success each trial p',
      range: 'Event to highlight',
      exactlyK: 'exactly k',
      atMostK: 'at most k',
      atLeastK: 'at least k',
      betweenK: 'between k1 and k2',
      simulationRuns: 'simulation runs',
      distribution: 'distribution',
      normal: 'Normal',
      uniform: 'Uniform',
      exponential: 'Exponential',
      triangular: 'Triangular',
      min: 'Left edge',
      max: 'Right edge',
      mu: 'Center μ',
      sigma: 'Spread σ',
      lambda: 'Rate λ',
      modeValue: 'Peak location',
      intervalA: 'interval a',
      intervalB: 'interval b',
      sampleCount: 'sample count',
      showHistogram: 'show histogram',
      showCdf: 'Show cumulative area curve CDF',
      pointMode: 'Inspect density height at one point',
      source: 'source',
      sampleSize: 'sample size n',
      numberOfSamples: 'number of samples',
      normalOverlay: 'normal overlay',
      standardizedZ: 'Standardize z: center 0, spread 1',
      xDistribution: 'X distribution',
      yDistribution: 'Y distribution',
      fairDie: 'fair die',
      coin: 'coin',
      biasedCoin: 'biased coin',
      smallCustom: 'custom 0, 2, 5 tendencies',
      xWeightAt: (value) => `X tendency toward ${value}`,
      yWeightAt: (value) => `Y tendency toward ${value}`,
      normalizeX: 'turn X tendencies into probabilities',
      normalizeY: 'turn Y tendencies into probabilities',
      selectedSum: 'selected sum',
      showPairGrid: 'show pair grid',
      twoDiceSum7: 'classic: two dice sum to 7',
      seed: 'Random seed: repeat the same simulation',
      randomizeSeed: 'randomize seed',
    },
    sections: {
      what: 'What you are seeing',
      why: 'Why it matters',
      formula: 'Current formula',
      values: 'Current values',
      watch: 'Watch for',
    },
    values: {
      selectedConditional: 'selected conditional',
      likelihoodRatio: 'evidence tilt (likelihood ratio)',
      priorOdds: 'prior odds H : not H',
      posteriorOdds: 'posterior odds H : not H',
      hAndECount: 'H and E count',
      hAndEProbability: 'H and E probability',
      tp: 'TP',
      fp: 'FP',
      fn: 'FN',
      tn: 'TN',
      ppv: 'PPV',
      npv: 'NPV',
      selectedProbability: 'selected probability',
      mean: 'mean',
      variance: 'variance',
      pmfSum: 'sum of all bar probabilities',
      intervalProbability: 'P(a ≤ X ≤ b)',
      pdfMidpoint: 'density height at midpoint, not probability',
      sourceMean: 'source mean',
      sourceVariance: 'source variance',
      standardError: 'typical distance of sample mean from true mean',
      empiricalZSd: 'empirical z standard deviation',
      empiricalSd: 'empirical sd',
      empiricalMean: 'empirical mean',
      totalProbability: 'total probability',
      sumProbability: (sum) => `P(sum=${sum})`,
      sumMean: 'E(X+Y)',
      separateMean: 'E(X)+E(Y)',
      sumVariance: 'Var(X+Y)',
      notDefined: 'not defined',
    },
    drawing: {
      universe: 'Universe',
      countPrefix: 'n=',
      notDefined: 'not defined',
      theory: 'theory',
      originalDistribution: 'original distribution',
      standardizedSampleMeans: 'standardized sample means',
      sampleMeans: 'sample means',
      successesK: 'successes k',
      probability: 'probability',
      density: 'density',
      pairsWithSum: (sum) => `pairs with x + y = ${sum}`,
      tinyRegionNote: 'Tiny regions enlarged; use readout.',
    },
    categoryLabels: {
      aAndB: 'A and B',
      aOnly: 'A only',
      bOnly: 'B only',
      neither: 'neither',
      notA: 'not A',
      notB: 'not B',
      hAndE: 'H and E',
      notHAndE: 'not H and E',
      hNoE: 'H no E',
      truePositive: 'true positive',
      falsePositive: 'false positive',
      falseNegative: 'false negative',
      trueNegative: 'true negative',
      disease: 'Disease',
      noDisease: 'No disease',
      positiveTest: '+ test',
      negativeTest: '- test',
      trueAmongPositive: 'True among positive',
      noDiseaseAmongNegative: 'No disease among negative',
      bayesNote: 'E is the denominator; H ∩ E is the numerator.',
    },
    distributionLabels: {
      normal: 'Normal',
      uniform: 'Uniform',
      exponential: 'Exponential',
      triangular: 'Triangular',
    },
    sourceLabels: {
      die: 'Fair die',
      'biased-coin': 'Biased coin',
      uniform: 'Uniform 0 to 1',
      exponential: 'Exponential',
      'skewed-discrete': 'Skewed discrete',
    },
    canvasAriaSuffix: 'probability visualization',
    medicalWarning: 'Educational toy model, not medical advice.',
    relatedConvolution: 'Open the full Convolution module for the continuous and signal-processing view.',
  },
  zh: {
    controls: {
      parameters: '参数',
      lesson: '章节',
      exportPng: '导出 PNG',
      play: '播放',
      pause: '暂停',
      reset: '重置参数',
      speed: '速度',
      mode: '输入方式',
      target: '要回答的问题',
      population: '总体人数',
      populationAria: '总体数量',
      prior: 'H 原本有多常见：P(H)',
      likelihood: '如果 H 为真，证据 E 出现的概率：P(E|H)',
      falseAlarm: '如果 H 不为真，也出现证据 E 的概率',
      showOdds: '显示 odds：目标 / 非目标',
      naturalFrequencies: '用“多少人”来显示概率',
      prevalence: '人群里本来患病的人占多少',
      sensitivity: '患病者中测出阳性的比例',
      specificity: '未患病者中测出阴性的比例',
      testResult: '测试结果',
      readout: '读数方式',
      positive: '阳性',
      negative: '阴性',
      peopleCount: '人数',
      probability: '概率',
      nTrials: '重复试验次数 n',
      pSuccess: '每次试验成功的概率 p',
      range: '要高亮的事件',
      exactlyK: '恰好 k 次',
      atMostK: '至多 k 次',
      atLeastK: '至少 k 次',
      betweenK: '介于 k1 与 k2',
      simulationRuns: '模拟次数',
      distribution: '分布',
      normal: '正态',
      uniform: '均匀',
      exponential: '指数',
      triangular: '三角',
      min: '左边界',
      max: '右边界',
      mu: '中心位置 μ',
      sigma: '宽度/标准差 σ',
      lambda: '率 λ',
      modeValue: '最高点位置',
      intervalA: '区间 a',
      intervalB: '区间 b',
      sampleCount: '样本数',
      showHistogram: '显示直方图',
      showCdf: '显示累计面积曲线 CDF',
      pointMode: '查看某一点的密度，不是概率',
      source: '来源分布',
      sampleSize: '样本大小 n',
      numberOfSamples: '样本组数',
      normalOverlay: '正态叠加',
      standardizedZ: '标准化 z：中心移到 0，宽度缩成 1',
      xDistribution: 'X 分布',
      yDistribution: 'Y 分布',
      fairDie: '公平骰子',
      coin: '硬币',
      biasedCoin: '偏置硬币',
      smallCustom: '自定义 0、2、5 的出现倾向',
      xWeightAt: (value) => `X 更偏向取 ${value} 的程度`,
      yWeightAt: (value) => `Y 更偏向取 ${value} 的程度`,
      normalizeX: '把 X 的倾向换成总和为 1 的概率',
      normalizeY: '把 Y 的倾向换成总和为 1 的概率',
      selectedSum: '选中的和',
      showPairGrid: '显示配对网格',
      twoDiceSum7: '回到经典例子：两个骰子和为 7',
      seed: '随机种子：固定同一次模拟',
      randomizeSeed: '随机生成种子',
    },
    sections: {
      what: '你正在看到什么',
      why: '为什么重要',
      formula: '当前公式',
      values: '当前数值',
      watch: '注意观察',
    },
    values: {
      selectedConditional: '选中的条件概率',
      likelihoodRatio: '证据偏向程度（似然比）',
      priorOdds: '证据前赔率 H : 非 H',
      posteriorOdds: '证据后赔率 H : 非 H',
      hAndECount: 'H 且 E 的人数',
      hAndEProbability: 'H 且 E 的概率',
      tp: '真阳性',
      fp: '假阳性',
      fn: '假阴性',
      tn: '真阴性',
      ppv: '阳性预测值',
      npv: '阴性预测值',
      selectedProbability: '选中概率',
      mean: '均值',
      variance: '方差',
      pmfSum: '所有柱子的概率总和',
      intervalProbability: 'P(a ≤ X ≤ b)',
      pdfMidpoint: '中点的密度高度，不是概率',
      sourceMean: '来源均值',
      sourceVariance: '来源方差',
      standardError: '样本平均数通常会离真实平均数多远',
      empiricalZSd: '经验 z 标准差',
      empiricalSd: '经验标准差',
      empiricalMean: '经验均值',
      totalProbability: '总概率',
      sumProbability: (sum) => `P(和=${sum})`,
      sumMean: 'E(X+Y)',
      separateMean: 'E(X)+E(Y)',
      sumVariance: 'Var(X+Y)',
      notDefined: '未定义',
    },
    drawing: {
      universe: '全集',
      countPrefix: 'n=',
      notDefined: '未定义',
      theory: '理论',
      originalDistribution: '原始分布',
      standardizedSampleMeans: '标准化样本均值',
      sampleMeans: '样本均值',
      successesK: '成功次数 k',
      probability: '概率',
      density: '密度',
      pairsWithSum: (sum) => `x + y = ${sum} 的配对`,
      tinyRegionNote: '小区域会放大；精确看读数。',
    },
    categoryLabels: {
      aAndB: 'A 且 B',
      aOnly: '仅 A',
      bOnly: '仅 B',
      neither: '两者都不',
      notA: '非 A',
      notB: '非 B',
      hAndE: 'H 且 E',
      notHAndE: '非 H 且 E',
      hNoE: 'H 且非 E',
      truePositive: '真阳性',
      falsePositive: '假阳性',
      falseNegative: '假阴性',
      trueNegative: '真阴性',
      disease: '患病',
      noDisease: '未患病',
      positiveTest: '阳性',
      negativeTest: '阴性',
      trueAmongPositive: '阳性中的真阳性',
      noDiseaseAmongNegative: '阴性中的未患病',
      bayesNote: 'E 是分母；H ∩ E 是分子。',
    },
    distributionLabels: {
      normal: '正态',
      uniform: '均匀',
      exponential: '指数',
      triangular: '三角',
    },
    sourceLabels: {
      die: '公平骰子',
      'biased-coin': '偏置硬币',
      uniform: '0 到 1 均匀分布',
      exponential: '指数分布',
      'skewed-discrete': '偏斜离散分布',
    },
    canvasAriaSuffix: '概率可视化',
    medicalWarning: '教学玩具模型，不是医疗建议。',
    relatedConvolution: '打开完整卷积模块，查看连续与信号处理视角。',
  },
}

const conditionalTargetValues: ConditionalTarget[] = ['a-given-b', 'b-given-a', 'a-given-not-b', 'b-given-not-a']

function conditionalTargetOptions(locale: Locale): Array<readonly [ConditionalTarget, string]> {
  return locale === 'zh'
    ? [
        ['a-given-b', 'P(A | B)'],
        ['b-given-a', 'P(B | A)'],
        ['a-given-not-b', 'P(A | 非 B)'],
        ['b-given-not-a', 'P(B | 非 A)'],
      ]
    : [
        ['a-given-b', 'P(A | B)'],
        ['b-given-a', 'P(B | A)'],
        ['a-given-not-b', 'P(A | not B)'],
        ['b-given-not-a', 'P(B | not A)'],
      ]
}

export function ProbabilityLesson({ lessonId }: Props) {
  const { locale } = usePlatformLocale()
  const copy = lessonCopy[locale][lessonId] ?? lessonCopy[locale]['conditional-probability']
  const ui = probabilityUiCopy[locale]
  const learningCopy = probabilityLearningCopy[locale]
  const learningTopics = useMemo(() => getProbabilityHelpTopics(locale, lessonId), [lessonId, locale])
  const [activeHelpTopicId, setActiveHelpTopicId] = useState<ProbabilityHelpTopicId | null>(null)
  const activeHelpTopic = activeHelpTopicId ? learningTopics[activeHelpTopicId] : null
  const openHelpTopic = useCallback((topic: ProbabilityHelpTopicId) => setActiveHelpTopicId(topic), [])
  const params = useMemo(() => readSearchParams(), [])
  const [conditionMode, setConditionMode] = useState<ConditionMode>(() => stringParam(params, 'mode', 'intersection', ['intersection', 'conditional'] as const))
  const [target, setTarget] = useState<ConditionalTarget>(() => stringParam(params, 'target', 'a-given-b', conditionalTargetValues))
  const [population, setPopulation] = useState(() => integerParam(params, 'population', 1000, 100, 10000))
  const [pA, setPA] = useState(() => numberParam(params, 'pA', 0.3, 0, 1))
  const [pB, setPB] = useState(() => numberParam(params, 'pB', 0.4, 0, 1))
  const [pAB, setPAB] = useState(() => numberParam(params, 'pAB', 0.12, 0, 1))
  const [bGivenA, setBGivenA] = useState(() => numberParam(params, 'bGivenA', 0.4, 0, 1))
  const [bGivenNotA, setBGivenNotA] = useState(() => numberParam(params, 'bGivenNotA', 0.4, 0, 1))

  const [prior, setPrior] = useState(() => numberParam(params, 'prior', 0.01, 0, 1))
  const [likelihood, setLikelihood] = useState(() => numberParam(params, 'likelihood', 0.9, 0, 1))
  const [falseAlarm, setFalseAlarm] = useState(() => numberParam(params, 'falseAlarm', 0.09, 0, 1))
  const [showOdds, setShowOdds] = useState(() => booleanParam(params, 'odds', true))
  const [showFrequencies, setShowFrequencies] = useState(() => booleanParam(params, 'frequencies', true))

  const [prevalence, setPrevalence] = useState(() => numberParam(params, 'prevalence', 0.01, 0, 1))
  const [sensitivity, setSensitivity] = useState(() => numberParam(params, 'sensitivity', 0.9, 0, 1))
  const [specificity, setSpecificity] = useState(() => numberParam(params, 'specificity', 0.91, 0, 1))
  const [selectedTestResult, setSelectedTestResult] = useState<MedicalSelection>(() => stringParam(params, 'result', 'positive', ['positive', 'negative'] as const))
  const [frequencyMode, setFrequencyMode] = useState<FrequencyMode>(() => stringParam(params, 'frequencyMode', 'count', ['count', 'probability'] as const))

  const [trials, setTrials] = useState(() => integerParam(params, 'n', 10, 1, 100))
  const [successProbability, setSuccessProbability] = useState(() => numberParam(params, 'p', 0.5, 0, 1))
  const [selectedK, setSelectedK] = useState(() => integerParam(params, 'k', 5, 0, 100))
  const [selectedK2, setSelectedK2] = useState(() => integerParam(params, 'k2', 8, 0, 100))
  const [rangeMode, setRangeMode] = useState<BinomialRangeMode>(() => stringParam(params, 'mode', 'exact', ['exact', 'at-most', 'at-least', 'between'] as const))
  const [simulationRuns, setSimulationRuns] = useState(() => integerParam(params, 'runs', 5000, 0, 100000))
  const [seed, setSeed] = useState(() => integerParam(params, 'seed', 123, 1, 2147483647))

  const [continuousId, setContinuousId] = useState<ContinuousDistributionId>(() => stringParam(params, 'dist', 'normal', ['uniform', 'normal', 'exponential', 'triangular'] as const))
  const [uniformMin, setUniformMin] = useState(() => numberParam(params, 'min', 0, -10, 10))
  const [uniformMax, setUniformMax] = useState(() => numberParam(params, 'max', 1, -10, 10))
  const [normalMu, setNormalMu] = useState(() => numberParam(params, 'mu', 0, -5, 5))
  const [normalSigma, setNormalSigma] = useState(() => numberParam(params, 'sigma', 1, 0.1, 5))
  const [lambda, setLambda] = useState(() => numberParam(params, 'lambda', 1, 0.1, 5))
  const [triangularMode, setTriangularMode] = useState(() => numberParam(params, 'triMode', 0.5, -10, 10))
  const [intervalA, setIntervalA] = useState(() => numberParam(params, 'a', -1, -10, 10))
  const [intervalB, setIntervalB] = useState(() => numberParam(params, 'b', 1, -10, 10))
  const [sampleCount, setSampleCount] = useState(() => integerParam(params, 'samples', 4000, 0, 100000))
  const [showHistogram, setShowHistogram] = useState(() => booleanParam(params, 'histogram', true))
  const [showCdf, setShowCdf] = useState(() => booleanParam(params, 'cdf', false))
  const [pointMode, setPointMode] = useState(() => booleanParam(params, 'point', false))

  const [sourceId, setSourceId] = useState<SourceDistributionId>(() => stringParam(params, 'source', 'die', ['die', 'biased-coin', 'uniform', 'exponential', 'skewed-discrete'] as const))
  const [sampleSize, setSampleSize] = useState(() => integerParam(params, 'sampleSize', 30, 1, 100))
  const [cltSamples, setCltSamples] = useState(() => integerParam(params, 'samples', 5000, 1, 100000))
  const [showNormal, setShowNormal] = useState(() => booleanParam(params, 'normal', true))
  const [standardized, setStandardized] = useState(() => booleanParam(params, 'standardized', false))

  const [xPreset, setXPreset] = useState<DiscretePresetId>(() => stringParam(params, 'x', 'die', ['die', 'coin', 'biased-coin', 'small-custom'] as const))
  const [yPreset, setYPreset] = useState<DiscretePresetId>(() => stringParam(params, 'y', 'die', ['die', 'coin', 'biased-coin', 'small-custom'] as const))
  const [xCustom0, setXCustom0] = useState(() => numberParam(params, 'x0', 0.2, 0, 1))
  const [xCustom2, setXCustom2] = useState(() => numberParam(params, 'x2', 0.5, 0, 1))
  const [xCustom5, setXCustom5] = useState(() => numberParam(params, 'x5', 0.3, 0, 1))
  const [yCustom0, setYCustom0] = useState(() => numberParam(params, 'y0', 0.2, 0, 1))
  const [yCustom2, setYCustom2] = useState(() => numberParam(params, 'y2', 0.5, 0, 1))
  const [yCustom5, setYCustom5] = useState(() => numberParam(params, 'y5', 0.3, 0, 1))
  const [selectedSum, setSelectedSum] = useState(() => integerParam(params, 'sum', 7, -20, 20))
  const [showPairGrid, setShowPairGrid] = useState(() => booleanParam(params, 'pairGrid', true))

  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [animationPhase, setAnimationPhase] = useState(0)

  useAnimationLoop(
    playing,
    useCallback((deltaMs) => {
      setAnimationPhase((value) => value + deltaMs * 0.004 * speed)
    }, [speed]),
  )

  const conditional = useMemo(
    () => (conditionMode === 'conditional' ? contingencyFromConditionals(pA, bGivenA, bGivenNotA) : contingencyFromIntersection(pA, pB, pAB)),
    [bGivenA, bGivenNotA, conditionMode, pA, pAB, pB],
  )
  const bayes = useMemo(() => bayesPosterior(prior, likelihood, falseAlarm), [falseAlarm, likelihood, prior])
  const medical = useMemo(() => medicalTestMetrics(prevalence, sensitivity, specificity), [prevalence, sensitivity, specificity])
  const binomial = useMemo(() => binomialDistribution(trials, successProbability), [successProbability, trials])
  const binomialSimulation = useMemo(() => simulateBinomial(trials, successProbability, simulationRuns, seed), [seed, simulationRuns, successProbability, trials])
  const continuousDistribution = useMemo(
    () =>
      makeContinuousDistribution(continuousId, {
        min: uniformMin,
        max: Math.max(uniformMin + 0.1, uniformMax),
        mu: normalMu,
        sigma: normalSigma,
        lambda,
        mode: triangularMode,
      }),
    [continuousId, lambda, normalMu, normalSigma, triangularMode, uniformMax, uniformMin],
  )
  const continuousSamples = useMemo(() => sampleContinuousDistribution(continuousDistribution, showHistogram ? sampleCount : 0, seed), [continuousDistribution, sampleCount, seed, showHistogram])
  const continuousHistogram = useMemo(() => histogram(continuousSamples, continuousDistribution.domain[0], continuousDistribution.domain[1], 42), [continuousDistribution.domain, continuousSamples])
  const source = useMemo(() => getSourceDistribution(sourceId), [sourceId])
  const cltMeans = useMemo(() => sampleMeans(source, sampleSize, cltSamples, seed, standardized), [cltSamples, sampleSize, seed, source, standardized])
  const cltDomain = useMemo<[number, number]>(() => {
    if (standardized) return [-4, 4]
    const se = theoreticalStandardError(source, sampleSize)
    return [Math.min(source.domain[0], source.mean - 4 * se), Math.max(source.domain[1], source.mean + 4 * se)]
  }, [sampleSize, source, standardized])
  const cltHistogram = useMemo(() => histogram(cltMeans, cltDomain[0], cltDomain[1], 44), [cltDomain, cltMeans])
  const xDistribution = useMemo(() => makeDiscretePreset(xPreset, [xCustom0, xCustom2, xCustom5]), [xCustom0, xCustom2, xCustom5, xPreset])
  const yDistribution = useMemo(() => makeDiscretePreset(yPreset, [yCustom0, yCustom2, yCustom5]), [yCustom0, yCustom2, yCustom5, yPreset])
  const sumDistribution = useMemo(() => convolveDiscrete(xDistribution, yDistribution), [xDistribution, yDistribution])
  const pairGrid = useMemo(() => probabilityMassGrid(xDistribution, yDistribution), [xDistribution, yDistribution])
  const sumStats = useMemo(() => sumDistributionStats(xDistribution, yDistribution), [xDistribution, yDistribution])
  const animatedSelectedSum = useMemo(() => {
    if (lessonId !== 'random-variable-sum' || !playing || sumDistribution.values.length === 0) return selectedSum
    return sumDistribution.values[Math.floor(animationPhase) % sumDistribution.values.length] ?? selectedSum
  }, [animationPhase, lessonId, playing, selectedSum, sumDistribution.values])
  const currentCopy = useMemo(
    () => currentLessonCopy(copy, locale, lessonId, target, selectedTestResult, rangeMode),
    [copy, lessonId, locale, rangeMode, selectedTestResult, target],
  )

  const selectedRange = useCallback(
    (value: number) => {
      if (rangeMode === 'exact') return value === selectedK
      if (rangeMode === 'at-most') return value <= selectedK
      if (rangeMode === 'at-least') return value >= selectedK
      return value >= Math.min(selectedK, selectedK2) && value <= Math.max(selectedK, selectedK2)
    },
    [rangeMode, selectedK, selectedK2],
  )

  const values = getValues({
    lessonId,
    conditional,
    target,
    bayes,
    medical,
    selectedTestResult,
    frequencyMode,
    population,
    binomial,
    rangeMode,
    selectedK,
    selectedK2,
    trials,
    successProbability,
    continuousDistribution,
    intervalA,
    intervalB,
    source,
    cltMeans,
    sampleSize,
    standardized,
    sumDistribution,
    selectedSum: animatedSelectedSum,
    sumStats,
    showFrequencies,
    showOdds,
    labels: ui.values,
  })

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, size: Parameters<NonNullable<Parameters<typeof ProbabilityCanvas>[0]['draw']>>[1], theme: Parameters<NonNullable<Parameters<typeof ProbabilityCanvas>[0]['draw']>>[2]) => {
      if (lessonId === 'conditional-probability') {
        drawConditionalScene(ctx, size, theme, {
          title: currentCopy.title,
          population,
          categories: conditionalCategories(conditional, target, theme, ui.categoryLabels),
          table: conditionalTable(conditional, ui.categoryLabels),
          focusLabel: conditionalFocusLabel(target, conditional, ui.categoryLabels, ui.drawing.notDefined),
          labels: ui.drawing,
        })
      } else if (lessonId === 'bayes') {
        drawBayesScene(ctx, size, theme, {
          title: currentCopy.title,
          population,
          categories: bayesCategories(bayes, theme, ui.categoryLabels),
          posterior: bayes.posterior,
          note: showOdds ? ui.categoryLabels.bayesNote : undefined,
          labels: ui.drawing,
        })
      } else if (lessonId === 'medical-test') {
        drawMedicalScene(ctx, size, theme, {
          title: currentCopy.title,
          population,
          categories: medicalCategories(medical, selectedTestResult, theme, ui.categoryLabels),
          selected: selectedTestResult,
          predictiveValue: selectedTestResult === 'positive' ? medical.positivePredictiveValue : medical.negativePredictiveValue,
          eventLabels: ui.categoryLabels,
          labels: ui.drawing,
        })
      } else if (lessonId === 'binomial') {
        drawBinomialScene(ctx, size, theme, { distribution: binomial, simulation: binomialSimulation, selectedRange, title: currentCopy.title, labels: ui.drawing })
      } else if (lessonId === 'continuous-density') {
        drawContinuousScene(ctx, size, theme, {
          distribution: continuousDistribution,
          interval: [intervalA, intervalB],
          samples: continuousHistogram,
          showHistogram,
          showCdf,
          pointMode,
          title: `${ui.distributionLabels[continuousId]}${locale === 'zh' ? '密度' : ' density'}`,
          labels: ui.drawing,
        })
      } else if (lessonId === 'central-limit-theorem') {
        drawCltScene(ctx, size, theme, { source, meansHistogram: cltHistogram, meanDomain: cltDomain, standardized, showNormal, sampleSize, title: currentCopy.title, sourceLabel: ui.sourceLabels[sourceId], labels: ui.drawing })
      } else {
        drawRandomVariableSumScene(ctx, size, theme, {
          x: xDistribution,
          y: yDistribution,
          sum: sumDistribution,
          grid: pairGrid,
          selectedSum: animatedSelectedSum,
          showPairGrid,
          title: currentCopy.title,
          labels: ui.drawing,
        })
      }
    },
    [
      animatedSelectedSum,
      bayes,
      binomial,
      binomialSimulation,
      cltDomain,
      cltHistogram,
      conditional,
      continuousDistribution,
      continuousHistogram,
      currentCopy.title,
      intervalA,
      intervalB,
      lessonId,
      medical,
      pairGrid,
      pointMode,
      population,
      selectedRange,
      selectedTestResult,
      showCdf,
      showHistogram,
      showNormal,
      showOdds,
      showPairGrid,
      source,
      sourceId,
      standardized,
      sumDistribution,
      target,
      ui,
      xDistribution,
      yDistribution,
      sampleSize,
      continuousId,
    ],
  )

  return (
    <>
    <ModuleFocusFrame>
      {({ focusButton }) => (
    <section className="probability-lesson">
      <aside className="probability-controls platform-card">
        <div className="probability-learning-entry learning-help-entry">
          <HelpTrigger ariaLabel={learningCopy.openOverview} onClick={() => openHelpTopic('overview')}>
            {learningCopy.openOverview}
          </HelpTrigger>
        </div>
        <h2>{ui.controls.parameters}</h2>
        {renderControls()}
      </aside>

      <main className="probability-main">
        <div className="calculus-title-row">
          <div>
            <p className="eyebrow">{ui.controls.lesson}</p>
            <h1>{currentCopy.title}</h1>
          </div>
        </div>
        <div className="graph-help-stage probability-graph-stage">
          <ProbabilityCanvas ariaLabel={`${currentCopy.title} ${ui.canvasAriaSuffix}`} draw={draw} />
          <LessonStageActions
            graphLabel={learningCopy.openGraph}
            graphAriaLabel={learningCopy.openGraph}
            onGraphHelp={() => openHelpTopic('graph')}
            focusButton={focusButton}
            exportLabel={ui.controls.exportPng}
            onExport={exportPng}
          />
        </div>
        <div className="probability-playback platform-card">
          <div className="transport-buttons">
            <button type="button" className="primary-button" aria-label={playing ? ui.controls.pause : ui.controls.play} onClick={() => setPlaying((current) => !current)}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
              {playing ? ui.controls.pause : ui.controls.play}
            </button>
            <button type="button" onClick={resetLesson}>
              <RotateCcw size={16} />
              {ui.controls.reset}
            </button>
          </div>
          <Range label={ui.controls.speed} value={speed} min={0.25} max={3} step={0.05} valueSuffix="x" onChange={setSpeed} />
        </div>
      </main>

      <aside className="probability-explanation platform-card">
        <h2>
          <HelpLabel topic="graph" onOpenHelpTopic={openHelpTopic}>
            {ui.sections.what}
          </HelpLabel>
        </h2>
        <p>{currentCopy.what}</p>
        <h2>
          <HelpLabel topic={conceptTopicForLesson(lessonId)} onOpenHelpTopic={openHelpTopic}>
            {ui.sections.why}
          </HelpLabel>
        </h2>
        <p>{currentCopy.why}</p>
        <h2>
          <HelpLabel topic="formula" onOpenHelpTopic={openHelpTopic}>
            {ui.sections.formula}
          </HelpLabel>
        </h2>
        <p className="formula-text formula-card">
          <Formula tex={currentCopy.formulaTex} block label={currentCopy.formulaLabel} />
        </p>
        <h2>
          <HelpLabel topic="values" onOpenHelpTopic={openHelpTopic}>
            {ui.sections.values}
          </HelpLabel>
        </h2>
        <dl>
          {values.map((row) => (
            <div key={row.label}>
              <dt>{renderMathText(row.label)}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        {lessonId === 'medical-test' && <p className="warning-box">{ui.medicalWarning}</p>}
        {lessonId === 'random-variable-sum' && convolutionManifest.status === 'ready' && (
          <a className="text-link probability-related-link" href="/modules/convolution">
            {ui.relatedConvolution}
          </a>
        )}
        <h2>
          <HelpLabel topic="variation" onOpenHelpTopic={openHelpTopic}>
            {ui.sections.watch}
          </HelpLabel>
        </h2>
        <p>{currentCopy.watch}</p>
      </aside>
    </section>
      )}
    </ModuleFocusFrame>
    <LearningDrawer topic={activeHelpTopic} closeLabel={learningCopy.close} onClose={() => setActiveHelpTopicId(null)} />
    </>
  )

  function renderControls() {
    if (lessonId === 'conditional-probability') {
      const intersectionMin = Math.max(0, pA + pB - 1)
      const intersectionMax = Math.min(pA, pB)
      const intersectionHint =
        locale === 'zh'
          ? '交集不能超过 A 或 B，也不能小于由 A、B 大小决定的最低值。当前滑杆会自动限制到可行范围。'
          : 'The intersection cannot exceed A or B, and it has a minimum set by the current sizes of A and B.'
      return (
        <>
          <SelectField
            label={ui.controls.mode}
            value={conditionMode}
            options={[
              ['intersection', locale === 'zh' ? '直接输入 A、B、交集' : 'Enter A, B, and their overlap'],
              ['conditional', locale === 'zh' ? '用 A 和条件概率生成 B' : 'Build B from A and conditional probabilities'],
            ]}
            onChange={setConditionMode}
          />
          <SelectField label={ui.controls.target} value={target} options={conditionalTargetOptions(locale)} onChange={setTarget} />
          <PopulationSelect value={population} onChange={setPopulation} labels={ui.controls} />
          <Range label={locale === 'zh' ? '事件 A 占总体的比例 P(A)' : 'Share of the population in event A: P(A)'} value={pA} min={0} max={1} step={0.01} onChange={setPA} />
          {conditionMode === 'intersection' ? (
            <>
              <Range label={locale === 'zh' ? '事件 B 占总体的比例 P(B)' : 'Share of the population in event B: P(B)'} value={pB} min={0} max={1} step={0.01} onChange={setPB} />
              <Range label={locale === 'zh' ? 'A 和 B 同时发生的比例 P(A∩B)' : 'Share where A and B both happen: P(A∩B)'} value={pAB} min={intersectionMin} max={intersectionMax} step={0.01} hint={intersectionHint} onChange={setPAB} />
            </>
          ) : (
            <>
              <Range label={locale === 'zh' ? '在 A 里面，B 也发生的比例 P(B|A)' : 'Inside A, share that also has B: P(B|A)'} value={bGivenA} min={0} max={1} step={0.01} onChange={setBGivenA} />
              <Range label={locale === 'zh' ? '不在 A 里面，B 发生的比例 P(B|非 A)' : 'Outside A, share that has B: P(B|not A)'} value={bGivenNotA} min={0} max={1} step={0.01} onChange={setBGivenNotA} />
            </>
          )}
        </>
      )
    }
    if (lessonId === 'bayes') {
      return (
        <>
          <Range label={ui.controls.prior} value={prior} min={0} max={1} step={0.001} onChange={setPrior} />
          <Range label={ui.controls.likelihood} value={likelihood} min={0} max={1} step={0.01} onChange={setLikelihood} />
          <Range label={ui.controls.falseAlarm} value={falseAlarm} min={0} max={1} step={0.001} onChange={setFalseAlarm} />
          <PopulationSelect value={population} onChange={setPopulation} labels={ui.controls} />
          <Toggle label={ui.controls.showOdds} checked={showOdds} onChange={setShowOdds} />
          <Toggle label={ui.controls.naturalFrequencies} checked={showFrequencies} onChange={setShowFrequencies} />
        </>
      )
    }
    if (lessonId === 'medical-test') {
      return (
        <>
          <Range label={ui.controls.prevalence} value={prevalence} min={0} max={1} step={0.001} onChange={setPrevalence} />
          <Range label={ui.controls.sensitivity} value={sensitivity} min={0} max={1} step={0.01} onChange={setSensitivity} />
          <Range label={ui.controls.specificity} value={specificity} min={0} max={1} step={0.01} onChange={setSpecificity} />
          <PopulationSelect value={population} onChange={setPopulation} labels={ui.controls} />
          <SelectField label={ui.controls.testResult} value={selectedTestResult} options={[['positive', ui.controls.positive], ['negative', ui.controls.negative]]} onChange={setSelectedTestResult} />
          <SelectField label={ui.controls.readout} value={frequencyMode} options={[['count', ui.controls.peopleCount], ['probability', ui.controls.probability]]} onChange={setFrequencyMode} />
        </>
      )
    }
    if (lessonId === 'binomial') {
      return (
        <>
          <Range label={ui.controls.nTrials} value={trials} min={1} max={100} step={1} onChange={setTrials} />
          <Range label={ui.controls.pSuccess} value={successProbability} min={0} max={1} step={0.01} onChange={setSuccessProbability} />
          <SelectField label={ui.controls.range} value={rangeMode} options={[['exact', ui.controls.exactlyK], ['at-most', ui.controls.atMostK], ['at-least', ui.controls.atLeastK], ['between', ui.controls.betweenK]]} onChange={setRangeMode} />
          <Range label="k" value={selectedK} min={0} max={trials} step={1} onChange={setSelectedK} />
          {rangeMode === 'between' && <Range label="k2" value={selectedK2} min={0} max={trials} step={1} onChange={setSelectedK2} />}
          <Range label={ui.controls.simulationRuns} value={simulationRuns} min={0} max={100000} step={1000} onChange={setSimulationRuns} />
          <SeedControl seed={seed} setSeed={setSeed} labels={ui.controls} />
        </>
      )
    }
    if (lessonId === 'continuous-density') {
      return (
        <>
          <SelectField label={ui.controls.distribution} value={continuousId} options={[['normal', ui.controls.normal], ['uniform', ui.controls.uniform], ['exponential', ui.controls.exponential], ['triangular', ui.controls.triangular]]} onChange={setContinuousId} />
          {continuousId === 'uniform' && (
            <>
              <Range label={ui.controls.min} value={uniformMin} min={-4} max={4} step={0.1} onChange={setUniformMin} />
              <Range label={ui.controls.max} value={uniformMax} min={-4} max={6} step={0.1} onChange={setUniformMax} />
            </>
          )}
          {continuousId === 'normal' && (
            <>
              <Range label={ui.controls.mu} value={normalMu} min={-4} max={4} step={0.1} onChange={setNormalMu} />
              <Range label={ui.controls.sigma} value={normalSigma} min={0.1} max={4} step={0.1} onChange={setNormalSigma} />
            </>
          )}
          {continuousId === 'exponential' && <Range label={ui.controls.lambda} value={lambda} min={0.1} max={5} step={0.1} onChange={setLambda} />}
          {continuousId === 'triangular' && <Range label={ui.controls.modeValue} value={triangularMode} min={uniformMin} max={uniformMax} step={0.1} onChange={setTriangularMode} />}
          <Range label={ui.controls.intervalA} value={intervalA} min={continuousDistribution.domain[0]} max={continuousDistribution.domain[1]} step={0.05} onChange={setIntervalA} />
          <Range label={ui.controls.intervalB} value={intervalB} min={continuousDistribution.domain[0]} max={continuousDistribution.domain[1]} step={0.05} onChange={setIntervalB} />
          <Range label={ui.controls.sampleCount} value={sampleCount} min={0} max={100000} step={1000} onChange={setSampleCount} />
          <SeedControl seed={seed} setSeed={setSeed} labels={ui.controls} />
          <Toggle label={ui.controls.showHistogram} checked={showHistogram} onChange={setShowHistogram} />
          <Toggle label={ui.controls.showCdf} checked={showCdf} onChange={setShowCdf} />
          <Toggle label={ui.controls.pointMode} checked={pointMode} onChange={setPointMode} />
        </>
      )
    }
    if (lessonId === 'central-limit-theorem') {
      return (
        <>
          <SelectField label={ui.controls.source} value={sourceId} options={allSourceDistributions().map((item) => [item.id, ui.sourceLabels[item.id]])} onChange={setSourceId} />
          <Range label={ui.controls.sampleSize} value={sampleSize} min={1} max={100} step={1} onChange={setSampleSize} />
          <Range label={ui.controls.numberOfSamples} value={cltSamples} min={1} max={100000} step={1000} onChange={setCltSamples} />
          <SeedControl seed={seed} setSeed={setSeed} labels={ui.controls} />
          <Toggle label={ui.controls.normalOverlay} checked={showNormal} onChange={setShowNormal} />
          <Toggle label={ui.controls.standardizedZ} checked={standardized} onChange={setStandardized} />
        </>
      )
    }
    return (
      <>
        <SelectField label={ui.controls.xDistribution} value={xPreset} options={[['die', ui.controls.fairDie], ['coin', ui.controls.coin], ['biased-coin', ui.controls.biasedCoin], ['small-custom', ui.controls.smallCustom]]} onChange={setXPreset} />
        {xPreset === 'small-custom' && (
          <>
            <Range label={ui.controls.xWeightAt(0)} value={xCustom0} min={0} max={1} step={0.01} onChange={setXCustom0} />
            <Range label={ui.controls.xWeightAt(2)} value={xCustom2} min={0} max={1} step={0.01} onChange={setXCustom2} />
            <Range label={ui.controls.xWeightAt(5)} value={xCustom5} min={0} max={1} step={0.01} onChange={setXCustom5} />
            <button type="button" onClick={() => normalizeCustom(setXCustom0, setXCustom2, setXCustom5, [xCustom0, xCustom2, xCustom5])}>{ui.controls.normalizeX}</button>
          </>
        )}
        <SelectField label={ui.controls.yDistribution} value={yPreset} options={[['die', ui.controls.fairDie], ['coin', ui.controls.coin], ['biased-coin', ui.controls.biasedCoin], ['small-custom', ui.controls.smallCustom]]} onChange={setYPreset} />
        {yPreset === 'small-custom' && (
          <>
            <Range label={ui.controls.yWeightAt(0)} value={yCustom0} min={0} max={1} step={0.01} onChange={setYCustom0} />
            <Range label={ui.controls.yWeightAt(2)} value={yCustom2} min={0} max={1} step={0.01} onChange={setYCustom2} />
            <Range label={ui.controls.yWeightAt(5)} value={yCustom5} min={0} max={1} step={0.01} onChange={setYCustom5} />
            <button type="button" onClick={() => normalizeCustom(setYCustom0, setYCustom2, setYCustom5, [yCustom0, yCustom2, yCustom5])}>{ui.controls.normalizeY}</button>
          </>
        )}
        <Range label={ui.controls.selectedSum} value={selectedSum} min={Math.min(...sumDistribution.values)} max={Math.max(...sumDistribution.values)} step={1} onChange={setSelectedSum} />
        <Toggle label={ui.controls.showPairGrid} checked={showPairGrid} onChange={setShowPairGrid} />
        <button
          type="button"
          onClick={() => {
            setXPreset('die')
            setYPreset('die')
            setSelectedSum(7)
          }}
        >
          <RotateCcw size={15} />
          {ui.controls.twoDiceSum7}
        </button>
      </>
    )
  }

  function resetLesson() {
    setPlaying(false)
    setAnimationPhase(0)
    if (lessonId === 'conditional-probability') {
      setConditionMode('intersection')
      setTarget('a-given-b')
      setPopulation(1000)
      setPA(0.3)
      setPB(0.4)
      setPAB(0.12)
      setBGivenA(0.4)
      setBGivenNotA(0.4)
    } else if (lessonId === 'bayes') {
      setPrior(0.01)
      setLikelihood(0.9)
      setFalseAlarm(0.09)
      setPopulation(10000)
      setShowOdds(true)
      setShowFrequencies(true)
    } else if (lessonId === 'medical-test') {
      setPrevalence(0.01)
      setSensitivity(0.9)
      setSpecificity(0.91)
      setPopulation(10000)
      setSelectedTestResult('positive')
    } else if (lessonId === 'binomial') {
      setTrials(10)
      setSuccessProbability(0.5)
      setSelectedK(5)
      setSelectedK2(8)
      setRangeMode('exact')
      setSimulationRuns(5000)
      setSeed(123)
    } else if (lessonId === 'continuous-density') {
      setContinuousId('normal')
      setNormalMu(0)
      setNormalSigma(1)
      setIntervalA(-1)
      setIntervalB(1)
      setSampleCount(4000)
      setShowHistogram(true)
      setShowCdf(false)
      setPointMode(false)
    } else if (lessonId === 'central-limit-theorem') {
      setSourceId('die')
      setSampleSize(30)
      setCltSamples(5000)
      setShowNormal(true)
      setStandardized(false)
      setSeed(123)
    } else {
      setXPreset('die')
      setYPreset('die')
      setXCustom0(0.2)
      setXCustom2(0.5)
      setXCustom5(0.3)
      setYCustom0(0.2)
      setYCustom2(0.5)
      setYCustom5(0.3)
      setSelectedSum(7)
      setShowPairGrid(true)
    }
  }
}

function HelpLabel({
  topic,
  onOpenHelpTopic,
  children,
}: {
  topic: ProbabilityHelpTopicId
  onOpenHelpTopic: (topic: ProbabilityHelpTopicId) => void
  children: ReactNode
}) {
  return <TermButton onClick={() => onOpenHelpTopic(topic)}>{children}</TermButton>
}

function currentLessonCopy(base: LessonCopy, locale: Locale, lessonId: ProbabilityLessonId, target: ConditionalTarget, selectedTestResult: MedicalSelection, rangeMode: BinomialRangeMode): LessonCopy {
  if (lessonId === 'conditional-probability') {
    const formulas: Record<ConditionalTarget, Pick<LessonCopy, 'formulaTex' | 'formulaLabel'>> = {
      'a-given-b': {
        formulaTex: 'P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}',
        formulaLabel: 'P(A given B)',
      },
      'b-given-a': {
        formulaTex: 'P(B\\mid A)=\\frac{P(A\\cap B)}{P(A)}',
        formulaLabel: 'P(B given A)',
      },
      'a-given-not-b': {
        formulaTex: 'P(A\\mid \\neg B)=\\frac{P(A\\cap \\neg B)}{P(\\neg B)}',
        formulaLabel: 'P(A given not B)',
      },
      'b-given-not-a': {
        formulaTex: 'P(B\\mid \\neg A)=\\frac{P(B\\cap \\neg A)}{P(\\neg A)}',
        formulaLabel: 'P(B given not A)',
      },
    }
    return { ...base, ...formulas[target] }
  }

  if (lessonId === 'medical-test') {
    if (selectedTestResult === 'negative') {
      return {
        ...base,
        what:
          locale === 'zh'
            ? '阴性结果中同时包含真阴性和假阴性；两者的可见比例决定了阴性结果的含义。'
            : 'The negative result group contains true negatives and false negatives; the visible mix determines what a negative result means.',
        why:
          locale === 'zh'
            ? '测试“准不准”和结果“意味着什么”不是同一个问题。阴性预测值只在所有阴性结果里重新计算。'
            : 'Test accuracy and result meaning are not the same question. Negative predictive value recalculates inside all negative results.',
        formulaTex: 'NPV=\\frac{TN}{TN+FN}',
        formulaLabel: locale === 'zh' ? '阴性预测值' : 'Negative predictive value',
      }
    }
    return {
      ...base,
      what:
        locale === 'zh'
          ? '阳性结果中同时包含真阳性和假阳性；两者的可见比例决定了阳性结果的含义。'
          : 'The positive result group contains true positives and false positives; the visible mix determines what a positive result means.',
      why:
        locale === 'zh'
          ? '测试“准不准”和结果“意味着什么”不是同一个问题。阳性预测值只在所有阳性结果里重新计算。'
          : 'Test accuracy and result meaning are not the same question. Positive predictive value recalculates inside all positive results.',
      formulaTex: 'PPV=\\frac{TP}{TP+FP}',
      formulaLabel: locale === 'zh' ? '阳性预测值' : 'Positive predictive value',
    }
  }

  if (lessonId === 'binomial') {
    const formulas: Record<BinomialRangeMode, Pick<LessonCopy, 'formulaTex' | 'formulaLabel'>> = {
      exact: {
        formulaTex: 'P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}',
        formulaLabel: locale === 'zh' ? '恰好 k 次成功' : 'Exactly k successes',
      },
      'at-most': {
        formulaTex: '\\begin{aligned}P(X\\le k)&=\\sum_{i=0}^{k}P(X=i)\\\\P(X=i)&=\\binom{n}{i}p^i(1-p)^{n-i}\\end{aligned}',
        formulaLabel: locale === 'zh' ? '至多 k 次成功' : 'At most k successes',
      },
      'at-least': {
        formulaTex: '\\begin{aligned}P(X\\ge k)&=\\sum_{i=k}^{n}P(X=i)\\\\P(X=i)&=\\binom{n}{i}p^i(1-p)^{n-i}\\end{aligned}',
        formulaLabel: locale === 'zh' ? '至少 k 次成功' : 'At least k successes',
      },
      between: {
        formulaTex: '\\begin{aligned}P(k_1\\le X\\le k_2)&=\\sum_{i=k_1}^{k_2}P(X=i)\\\\P(X=i)&=\\binom{n}{i}p^i(1-p)^{n-i}\\end{aligned}',
        formulaLabel: locale === 'zh' ? '介于 k1 与 k2 次成功' : 'Between k1 and k2 successes',
      },
    }
    return { ...base, ...formulas[rangeMode] }
  }

  return base
}

function makeDiscretePreset(preset: DiscretePresetId, customWeights: number[]) {
  if (preset !== 'small-custom') return distributionById(preset)
  return normalizeDistribution({ values: [0, 2, 5], probabilities: customWeights })
}

function normalizeCustom(setA: (value: number) => void, setB: (value: number) => void, setC: (value: number) => void, weights: number[]) {
  const normalized = normalizeDistribution({ values: [0, 2, 5], probabilities: weights }).probabilities
  setA(normalized[0] ?? 0)
  setB(normalized[1] ?? 0)
  setC(normalized[2] ?? 0)
}

function Range({
  label,
  value,
  min,
  max,
  step,
  valueSuffix,
  hint,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  valueSuffix?: string
  hint?: string
  onChange: (value: number) => void
}) {
  const constrainedValue = Math.min(max, Math.max(min, value))
  if (valueSuffix) {
    return (
      <label className="speed-control">
        <span>{renderMathText(label)}</span>
        <input type="range" min={min} max={max} step={step} value={constrainedValue} onChange={(event) => onChange(Number(event.target.value))} />
        <strong>{`${constrainedValue.toFixed(2)}${valueSuffix}`}</strong>
      </label>
    )
  }

  return (
    <label className="probability-range">
      <span>
        <span className="probability-range-label">{renderMathText(label)}:</span>
        <strong>{formatNumber(constrainedValue)}</strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={constrainedValue} onChange={(event) => onChange(Number(event.target.value))} />
      {hint && <small className="probability-range-hint">{hint}</small>}
    </label>
  )
}

function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<readonly [T, string]>; onChange: (value: T) => void }) {
  return (
    <label>
      {label}
      <SelectMenu value={value} options={options.map(([optionValue, text]) => ({ value: optionValue, label: text, textValue: text }))} onChange={onChange} ariaLabel={label} />
    </label>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="checkbox-line probability-toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  )
}

function PopulationSelect({ value, onChange, labels }: { value: number; onChange: (value: number) => void; labels: ProbabilityUiCopy['controls'] }) {
  return (
    <label>
      {labels.population}
      <SelectMenu
        value={value}
        options={[100, 1000, 10000].map((next) => ({ value: next, label: formatCount(next), textValue: String(next) }))}
        onChange={onChange}
        ariaLabel={labels.populationAria}
      />
    </label>
  )
}

function SeedControl({ seed, setSeed, labels }: { seed: number; setSeed: (value: number) => void; labels: ProbabilityUiCopy['controls'] }) {
  return (
    <div className="seed-control">
      <Range label={labels.seed} value={seed} min={1} max={2147483647} step={1} onChange={setSeed} />
      <button type="button" aria-label={labels.randomizeSeed} title={labels.randomizeSeed} onClick={() => setSeed(randomSeed())}>
        <Shuffle size={15} />
      </button>
    </div>
  )
}

function exportPng() {
  const canvas = document.querySelector<HTMLCanvasElement>('.probability-main-canvas')
  if (!canvas) return
  const anchor = document.createElement('a')
  anchor.href = canvas.toDataURL('image/png')
  anchor.download = `probability-${window.location.pathname.split('/').at(-1) ?? 'lesson'}.png`
  anchor.click()
}

function conditionalCategories(conditional: ReturnType<typeof contingencyFromIntersection>, target: ConditionalTarget, theme: Parameters<typeof drawConditionalScene>[2], labels: ProbabilityUiCopy['categoryLabels']) {
  const highlightA = target === 'b-given-a'
  const highlightB = target === 'a-given-b'
  const highlightNotA = target === 'b-given-not-a'
  const highlightNotB = target === 'a-given-not-b'
  return [
    { label: labels.aAndB, probability: conditional.intersection, color: theme.intersection, highlight: highlightA || highlightB },
    { label: labels.aOnly, probability: conditional.aOnly, color: theme.eventA, highlight: highlightA || highlightNotB },
    { label: labels.bOnly, probability: conditional.bOnly, color: theme.eventB, highlight: highlightB || highlightNotA },
    { label: labels.neither, probability: conditional.neither, color: theme.complement, highlight: highlightNotA || highlightNotB },
  ]
}

function bayesCategories(bayes: ReturnType<typeof bayesPosterior>, theme: Parameters<typeof drawBayesScene>[2], labels: ProbabilityUiCopy['categoryLabels']) {
  const hAndE = bayes.prior * bayes.likelihood
  const notHAndE = (1 - bayes.prior) * bayes.falseAlarm
  return [
    { label: labels.hAndE, probability: hAndE, color: theme.intersection, highlight: true },
    { label: labels.notHAndE, probability: notHAndE, color: theme.eventB, highlight: true },
    { label: labels.hNoE, probability: bayes.prior * (1 - bayes.likelihood), color: theme.eventA },
    { label: labels.neither, probability: (1 - bayes.prior) * (1 - bayes.falseAlarm), color: theme.complement },
  ]
}

function medicalCategories(medical: ReturnType<typeof medicalTestMetrics>, selected: MedicalSelection, theme: Parameters<typeof drawMedicalScene>[2], labels: ProbabilityUiCopy['categoryLabels']) {
  return [
    { label: labels.truePositive, probability: medical.truePositive, color: theme.truePositive, highlight: selected === 'positive' },
    { label: labels.falsePositive, probability: medical.falsePositive, color: theme.falsePositive, highlight: selected === 'positive' },
    { label: labels.falseNegative, probability: medical.falseNegative, color: theme.falseNegative, highlight: selected === 'negative' },
    { label: labels.trueNegative, probability: medical.trueNegative, color: theme.trueNegative, highlight: selected === 'negative' },
  ]
}

function conditionalTable(conditional: ReturnType<typeof contingencyFromIntersection>, labels: ProbabilityUiCopy['categoryLabels']): string[][] {
  return [
    ['', 'B', labels.notB],
    ['A', formatPercent(conditional.intersection), formatPercent(conditional.aOnly)],
    [labels.notA, formatPercent(conditional.bOnly), formatPercent(conditional.neither)],
  ]
}

function conditionalFocusLabel(target: ConditionalTarget, conditional: ReturnType<typeof contingencyFromIntersection>, labels: ProbabilityUiCopy['categoryLabels'], notDefined: string): string {
  if (target === 'a-given-b') return `P(A | B) = ${formatLocalizedPercent(conditional.aGivenB, notDefined)}`
  if (target === 'b-given-a') return `P(B | A) = ${formatLocalizedPercent(conditional.bGivenA, notDefined)}`
  if (target === 'a-given-not-b') return `P(A | ${labels.notB}) = ${formatLocalizedPercent(conditional.aGivenNotB, notDefined)}`
  return `P(B | ${labels.notA}) = ${formatLocalizedPercent(conditional.bGivenNotA, notDefined)}`
}

function getValues(state: {
  lessonId: ProbabilityLessonId
  conditional: ReturnType<typeof contingencyFromIntersection>
  target: ConditionalTarget
  bayes: ReturnType<typeof bayesPosterior>
  medical: ReturnType<typeof medicalTestMetrics>
  selectedTestResult: MedicalSelection
  frequencyMode: FrequencyMode
  population: number
  binomial: ReturnType<typeof binomialDistribution>
  rangeMode: BinomialRangeMode
  selectedK: number
  selectedK2: number
  trials: number
  successProbability: number
  continuousDistribution: ReturnType<typeof makeContinuousDistribution>
  intervalA: number
  intervalB: number
  source: ReturnType<typeof getSourceDistribution>
  cltMeans: number[]
  sampleSize: number
  standardized: boolean
  sumDistribution: ReturnType<typeof convolveDiscrete>
  selectedSum: number
  sumStats: ReturnType<typeof sumDistributionStats>
  showFrequencies: boolean
  showOdds: boolean
  labels: ProbabilityUiCopy['values']
}): ValueRow[] {
  if (state.lessonId === 'conditional-probability') {
    const focus = state.target === 'a-given-b' ? state.conditional.aGivenB : state.target === 'b-given-a' ? state.conditional.bGivenA : state.target === 'a-given-not-b' ? state.conditional.aGivenNotB : state.conditional.bGivenNotA
    return [
      { label: 'P(A)', value: formatLocalizedPercent(state.conditional.a, state.labels.notDefined) },
      { label: 'P(B)', value: formatLocalizedPercent(state.conditional.b, state.labels.notDefined) },
      { label: 'P(A∩B)', value: formatLocalizedPercent(state.conditional.intersection, state.labels.notDefined) },
      { label: state.labels.selectedConditional, value: formatLocalizedPercent(focus, state.labels.notDefined) },
    ]
  }
  if (state.lessonId === 'bayes') {
    const hAndE = state.bayes.prior * state.bayes.likelihood
    const rows: ValueRow[] = [
      { label: 'P(E)', value: formatLocalizedPercent(state.bayes.evidence, state.labels.notDefined) },
      { label: 'P(H|E)', value: formatLocalizedPercent(state.bayes.posterior, state.labels.notDefined) },
      { label: state.labels.likelihoodRatio, value: formatLocalizedNumber(state.bayes.likelihoodRatio, state.labels.notDefined) },
      { label: state.showFrequencies ? state.labels.hAndECount : state.labels.hAndEProbability, value: state.showFrequencies ? formatCount(hAndE * state.population) : formatLocalizedProbability(hAndE, state.labels.notDefined) },
    ]
    if (state.showOdds) {
      rows.splice(3, 0, { label: state.labels.priorOdds, value: formatLocalizedNumber(state.bayes.priorOdds, state.labels.notDefined) }, { label: state.labels.posteriorOdds, value: formatLocalizedNumber(state.bayes.posteriorOdds, state.labels.notDefined) })
    }
    return rows
  }
  if (state.lessonId === 'medical-test') {
    const value = state.selectedTestResult === 'positive' ? state.medical.positivePredictiveValue : state.medical.negativePredictiveValue
    const scale = state.frequencyMode === 'count' ? state.population : 1
    return [
      { label: state.labels.tp, value: state.frequencyMode === 'count' ? formatCount(state.medical.truePositive * scale) : formatLocalizedPercent(state.medical.truePositive, state.labels.notDefined) },
      { label: state.labels.fp, value: state.frequencyMode === 'count' ? formatCount(state.medical.falsePositive * scale) : formatLocalizedPercent(state.medical.falsePositive, state.labels.notDefined) },
      { label: state.labels.fn, value: state.frequencyMode === 'count' ? formatCount(state.medical.falseNegative * scale) : formatLocalizedPercent(state.medical.falseNegative, state.labels.notDefined) },
      { label: state.labels.tn, value: state.frequencyMode === 'count' ? formatCount(state.medical.trueNegative * scale) : formatLocalizedPercent(state.medical.trueNegative, state.labels.notDefined) },
      { label: state.selectedTestResult === 'positive' ? state.labels.ppv : state.labels.npv, value: formatLocalizedPercent(value, state.labels.notDefined) },
    ]
  }
  if (state.lessonId === 'binomial') {
    return [
      { label: state.labels.selectedProbability, value: formatLocalizedPercent(binomialRangeProbability(state.trials, state.successProbability, state.rangeMode, state.selectedK, state.selectedK2), state.labels.notDefined) },
      { label: state.labels.mean, value: formatLocalizedNumber(binomialMean(state.trials, state.successProbability), state.labels.notDefined) },
      { label: state.labels.variance, value: formatLocalizedNumber(binomialVariance(state.trials, state.successProbability), state.labels.notDefined) },
      { label: state.labels.pmfSum, value: formatLocalizedProbability(sumProbabilities(state.binomial), state.labels.notDefined) },
    ]
  }
  if (state.lessonId === 'continuous-density') {
    const probability = intervalProbability(state.continuousDistribution, state.intervalA, state.intervalB)
    const point = (state.intervalA + state.intervalB) / 2
    return [
      { label: state.labels.intervalProbability, value: formatLocalizedPercent(probability, state.labels.notDefined) },
      { label: state.labels.pdfMidpoint, value: formatLocalizedNumber(state.continuousDistribution.pdf(point), state.labels.notDefined) },
      { label: state.labels.mean, value: formatLocalizedNumber(state.continuousDistribution.mean, state.labels.notDefined) },
      { label: state.labels.variance, value: formatLocalizedNumber(state.continuousDistribution.variance, state.labels.notDefined) },
    ]
  }
  if (state.lessonId === 'central-limit-theorem') {
    return [
      { label: state.labels.sourceMean, value: formatLocalizedNumber(state.source.mean, state.labels.notDefined) },
      { label: state.labels.sourceVariance, value: formatLocalizedNumber(state.source.variance, state.labels.notDefined) },
      { label: state.labels.standardError, value: formatLocalizedNumber(theoreticalStandardError(state.source, state.sampleSize), state.labels.notDefined) },
      { label: state.standardized ? state.labels.empiricalZSd : state.labels.empiricalSd, value: formatLocalizedNumber(empiricalStandardDeviation(state.cltMeans), state.labels.notDefined) },
      { label: state.labels.empiricalMean, value: formatLocalizedNumber(empiricalMean(state.cltMeans), state.labels.notDefined) },
    ]
  }
  return [
    { label: state.labels.sumProbability(state.selectedSum), value: formatLocalizedPercent(cumulativeProbability(state.sumDistribution, (value) => value === state.selectedSum), state.labels.notDefined) },
    { label: state.labels.totalProbability, value: formatLocalizedProbability(sumProbabilities(state.sumDistribution), state.labels.notDefined) },
    { label: state.labels.sumMean, value: formatLocalizedNumber(state.sumStats.sumMean, state.labels.notDefined) },
    { label: state.labels.separateMean, value: formatLocalizedNumber(state.sumStats.xMean + state.sumStats.yMean, state.labels.notDefined) },
    { label: state.labels.sumVariance, value: formatLocalizedNumber(state.sumStats.sumVariance, state.labels.notDefined) },
  ]
}

function formatLocalizedNumber(value: number | null | undefined, notDefined: string, digits?: number): string {
  if (value === Number.POSITIVE_INFINITY) return '∞'
  if (value === Number.NEGATIVE_INFINITY) return '-∞'
  if (value === null || value === undefined || !Number.isFinite(value)) return notDefined
  return formatNumber(value, digits)
}

function formatLocalizedProbability(value: number | null | undefined, notDefined: string, digits?: number): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return notDefined
  return formatProbability(value, digits)
}

function formatLocalizedPercent(value: number | null | undefined, notDefined: string, digits?: number): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return notDefined
  return formatPercent(value, digits)
}
