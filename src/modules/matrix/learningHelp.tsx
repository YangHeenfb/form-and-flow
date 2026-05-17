import { Formula } from '../../core/ui/Formula.tsx'
import type { HelpTopic } from '../../core/ui/LearningHelp.tsx'
import type { Locale } from '../../i18n.ts'
import type { SpaceDim } from '../../math/types.ts'

export type MatrixHelpTopicId =
  | 'overview'
  | 'graph'
  | 'matrix'
  | 'linear-map'
  | 'composition'
  | 'dimension'
  | 'basis'
  | 'determinant'
  | 'rank-nullity'
  | 'vector'

type LearningCopy = {
  entryTitle: string
  entryHint: string
  openOverview: string
  openGraph: string
  close: string
}

export const matrixLearningCopy: Record<Locale, LearningCopy> = {
  en: {
    entryTitle: 'Need the basics?',
    entryHint: 'Open a short explanation when a symbol or picture is unfamiliar.',
    openOverview: 'Beginner Guide',
    openGraph: 'Read the picture',
    close: 'Close explanation',
  },
  zh: {
    entryTitle: '新手解释',
    entryHint: '遇到矩阵、基向量、行列式或秩这些概念时，可以随时打开解释。',
    openOverview: '新手解释',
    openGraph: '怎么看图',
    close: '关闭解释',
  },
}

export function getMatrixHelpTopics(locale: Locale, inputDim: SpaceDim, outputDim: SpaceDim, usesThree: boolean): Record<MatrixHelpTopicId, HelpTopic> {
  return locale === 'zh' ? zhTopics(inputDim, outputDim, usesThree) : enTopics(inputDim, outputDim, usesThree)
}

function zhTopics(inputDim: SpaceDim, outputDim: SpaceDim, usesThree: boolean): Record<MatrixHelpTopicId, HelpTopic> {
  const inputSpace = spaceName(inputDim)
  const outputSpace = spaceName(outputDim)
  const viewKind = usesThree ? '三维场景' : '二维画布'

  return {
    overview: {
      eyebrow: '矩阵模块',
      title: '这个实验到底在做什么？',
      summary: (
        <>
          把矩阵先看成一台“移动空间的机器”：输入一个向量 <Formula tex="v" />，它输出新向量 <Formula tex="Av" />。画面展示的是这台机器怎样移动网格、基向量、单位形状和你添加的向量。
        </>
      ),
      sections: [
        {
          title: '先不用背公式',
          items: [
            '每一列告诉你一个基础方向会被送到哪里。',
            '网格被拉伸、旋转、剪切、压扁或翻转，就是矩阵的几何效果。',
            '右侧数字不是额外知识，而是把这张图压缩成几个可读指标。',
          ],
        },
        {
          title: '建议的探索顺序',
          items: [
            '先用预设库试旋转、缩放、反射、投影。',
            '观察 i、j、k 这些基向量怎么动，再看整个网格怎么跟着动。',
            '最后再看行列式、秩和零化度，它们是在描述“面积/体积怎么变”和“有没有方向被压没”。',
          ],
        },
      ],
    },
    graph: {
      eyebrow: '图像阅读',
      title: `${viewKind}里每个东西代表什么？`,
      summary: `当前图像表示一个从 ${inputSpace} 到 ${outputSpace} 的线性映射。你看到的不是函数曲线，而是整个空间被矩阵移动后的样子。`,
      sections: [
        {
          title: '颜色和形状',
          items: [
            '灰色网格是原来的坐标空间；彩色/变形后的网格是矩阵作用后的空间。',
            'i、j、k 是基向量，也就是坐标轴方向上的单位箭头。',
            '单位方形或单位立方体会显示面积/体积如何被拉伸、压缩或翻转。',
            '你添加的向量会从输入位置移动到输出位置；开启轨迹时可以看它中间怎么走。',
          ],
        },
        {
          title: '怎么判断发生了什么',
          items: [
            '网格变密表示空间被压缩，变疏表示空间被放大。',
            '单位形状被压成线或点时，说明某些方向的信息丢失了。',
            '如果方向顺序被翻过来，右侧通常会出现负的行列式提示。',
          ],
        },
      ],
    },
    matrix: {
      eyebrow: '术语',
      title: '矩阵是什么？',
      summary: (
        <>
          在这个模块里，矩阵 <Formula tex="A" /> 是一个数字表，用来定义规则 <Formula tex="v" /> ↦ <Formula tex="Av" />。它不是只存数字，而是在告诉空间怎么移动。
        </>
      ),
      sections: [
        {
          title: '行和列怎么读',
          items: [
            `如果矩阵形状是 ${outputDim}×${inputDim}（行 × 列），它就把 ${inputSpace} 的向量映射到 ${outputSpace} 的向量。`,
            '列数对应输入有几个坐标；行数对应输出有几个坐标。',
            '第 1 列是 i 被送到哪里，第 2 列是 j 被送到哪里，第 3 列是 k 被送到哪里。',
          ],
        },
        {
          title: '改一个数字会怎样',
          body: '你改的每个格子都会影响某个输出坐标对某个输入方向的依赖程度。初学时不必逐格心算，先看网格和基向量怎样变化。',
        },
      ],
    },
    'linear-map': {
      eyebrow: '术语',
      title: '线性映射是什么意思？',
      summary: '线性映射就是一种特别规矩的变换：它可以拉伸、旋转、剪切、投影、嵌入，但不会把直线弯成曲线，也不会把原点移走。',
      sections: [
        {
          title: '为什么图像看起来像“整张纸”在动',
          items: [
            '矩阵不是只移动一个点，而是对空间里每个向量都使用同一条规则。',
            '只要知道基向量被送到哪里，其他所有点的位置都能由线性组合自动确定。',
          ],
        },
      ],
    },
    composition: {
      eyebrow: '术语',
      title: '矩阵序列和合成矩阵',
      summary: (
        <>
          用户顺序 <Formula tex="[A_1,A_2,A_3]" /> 表示先做 <Formula tex="A_1" />，再做 <Formula tex="A_2" />，最后做 <Formula tex="A_3" />；合成矩阵写成 <Formula tex="A_3A_2A_1" />。
        </>
      ),
      sections: [
        {
          title: '为什么顺序看起来反过来',
          body: (
            <>
              向量从右边开始被作用：<Formula tex="v" /> ↦ <Formula tex="A_1v" /> ↦ <Formula tex="A_2(A_1v)" /> ↦ <Formula tex="A_3(A_2(A_1v))" />。所以最后写出来是 <Formula tex="A_3A_2A_1" />，但实验面板仍按你选择的先后顺序播放。
            </>
          ),
        },
      ],
    },
    dimension: {
      eyebrow: '术语',
      title: '输入维度、输出维度和矩阵形状',
      summary: `${inputSpace} 表示有 ${inputDim} 个坐标的输入空间，${outputSpace} 表示有 ${outputDim} 个坐标的输出空间。`,
      sections: [
        {
          title: '为什么维度要对上',
          items: [
            '一个 3D 到 2D 的矩阵可以把三维向量压到平面上。',
            '一个 2D 到 3D 的矩阵可以把平面嵌入到三维空间里。',
            '如果前一步输出是 2D，下一步却要求 3D 输入，中间就接不上，系统会提示维度错误。',
          ],
        },
      ],
    },
    basis: {
      eyebrow: '术语',
      title: '基向量是什么？为什么看它？',
      summary: '基向量是坐标系统的基础方向。二维里通常是 i、j；三维里是 i、j、k。',
      sections: [
        {
          title: '矩阵的列就是基向量的去向',
          items: [
            '第一列告诉你 i 变成什么。',
            '第二列告诉你 j 变成什么。',
            '第三列（如果有）告诉你 k 变成什么。',
          ],
        },
        {
          title: '为什么这足够了',
          body: '任意向量都可以由基向量加权拼出来。只要知道基向量的新位置，任意向量的新位置也就确定了。',
        },
      ],
    },
    determinant: {
      eyebrow: '术语',
      title: '行列式在图上代表什么？',
      summary: '对方阵来说，行列式描述面积或体积被放大多少倍，以及空间方向有没有翻转。',
      sections: [
        {
          title: '怎么读行列式',
          items: [
            '行列式等于 2：单位面积或单位体积变成原来的 2 倍。',
            '行列式在 0 附近：空间被压扁，某些方向丢失，所以不可逆。',
            '行列式为负：面积/体积大小仍看绝对值，但方向顺序被翻转。',
          ],
        },
      ],
    },
    'rank-nullity': {
      eyebrow: '术语',
      title: '秩和零化度在说什么？',
      summary: '秩描述输出还能展开成几个独立方向；零化度描述输入里有几个独立方向被压成 0。',
      sections: [
        {
          title: '在图上怎么理解',
          items: [
            '秩为 2：结果仍能铺成一个平面。',
            '秩为 1：结果只剩一条线。',
            '秩为 0：所有东西都压到原点。',
            '零化度越大，说明被矩阵“抹掉”的方向越多。',
          ],
        },
        {
          title: '一个核心关系',
          body: (
            <>
              对输入空间来说：<Formula tex="\\operatorname{rank}(A)+\\operatorname{nullity}(A)=\\text{input dimension}" />。
            </>
          ),
        },
      ],
    },
    vector: {
      eyebrow: '术语',
      title: '向量在这个实验里是什么？',
      summary: (
        <>
          向量可以看作一个箭头，也可以看作从原点出发的坐标。矩阵会把输入向量 <Formula tex="v" /> 变成输出向量 <Formula tex="Av" />。
        </>
      ),
      sections: [
        {
          title: '为什么要添加自定义向量',
          items: [
            '网格展示整体空间怎么动，向量展示某个具体点怎么动。',
            '当你想验证某个方向是否被拉伸、翻转或压扁时，自定义向量最直观。',
          ],
        },
      ],
    },
  }
}

function enTopics(inputDim: SpaceDim, outputDim: SpaceDim, usesThree: boolean): Record<MatrixHelpTopicId, HelpTopic> {
  const inputSpace = spaceName(inputDim)
  const outputSpace = spaceName(outputDim)
  const viewKind = usesThree ? '3D scene' : '2D canvas'

  return {
    overview: {
      eyebrow: 'Matrix module',
      title: 'What is this lab showing?',
      summary: (
        <>
          Treat a matrix as a machine that moves space: it takes a vector <Formula tex="v" /> and returns <Formula tex="Av" />. The picture shows how that machine moves the grid, basis vectors, unit shape, and custom vectors.
        </>
      ),
      sections: [
        {
          title: 'You do not need the formulas first',
          items: [
            'Each column tells where one basic direction lands.',
            'Stretching, rotation, shear, projection, collapse, and flips are geometric effects of the matrix.',
            'The numbers on the right summarize what the picture is doing.',
          ],
        },
        {
          title: 'A useful exploration order',
          items: [
            'Start with presets such as rotation, scale, reflection, and projection.',
            'Watch the i, j, and k basis vectors first, then notice how the whole grid follows.',
            'Read determinant, rank, and nullity after that; they describe area or volume scale and lost directions.',
          ],
        },
      ],
    },
    graph: {
      eyebrow: 'Reading the picture',
      title: `What does the ${viewKind} mean?`,
      summary: `The current picture is a linear map from ${inputSpace} to ${outputSpace}. It is not a function curve; it is the whole space after the matrix acts on it.`,
      sections: [
        {
          title: 'Colors and shapes',
          items: [
            'The gray grid is the original coordinate space; the transformed grid shows where that space lands.',
            'i, j, and k are basis vectors: unit arrows along the coordinate directions.',
            'The unit square or unit cube shows how area or volume changes.',
            'Custom vectors move from their input position to their output position; trails show the in-between motion.',
          ],
        },
        {
          title: 'What to look for',
          items: [
            'A denser grid means compression; a wider grid means expansion.',
            'If the unit shape collapses into a line or point, some directions were lost.',
            'If orientation flips, the determinant on the right is usually negative.',
          ],
        },
      ],
    },
    matrix: {
      eyebrow: 'Term',
      title: 'What is a matrix?',
      summary: (
        <>
          In this module, a matrix <Formula tex="A" /> is a table of numbers defining the rule <Formula tex="v\\mapsto Av" />. It tells space how to move.
        </>
      ),
      sections: [
        {
          title: 'Rows and columns',
          items: [
            `A ${outputDim}x${inputDim} matrix turns vectors in ${inputSpace} into vectors in ${outputSpace}.`,
            'The number of columns matches the number of input coordinates.',
            'The number of rows matches the number of output coordinates.',
            'Column 1 is where i lands, column 2 is where j lands, and column 3 is where k lands.',
          ],
        },
        {
          title: 'When you edit one entry',
          body: 'Each entry changes how strongly one output coordinate responds to one input direction. At first, watch the grid and basis vectors rather than doing every calculation by hand.',
        },
      ],
    },
    'linear-map': {
      eyebrow: 'Term',
      title: 'What is a linear map?',
      summary: 'A linear map is a disciplined transformation: it may stretch, rotate, shear, project, or embed, but it keeps straight lines straight and keeps the origin fixed.',
      sections: [
        {
          title: 'Why it looks like the whole sheet moves',
          items: [
            'The matrix applies one rule to every vector in the space.',
            'Once you know where the basis vectors land, every other point follows from linear combinations.',
          ],
        },
      ],
    },
    composition: {
      eyebrow: 'Term',
      title: 'Matrix sequence and composition',
      summary: (
        <>
          User order <Formula tex="[A_1,A_2,A_3]" /> means apply <Formula tex="A_1" /> first, then <Formula tex="A_2" />, then <Formula tex="A_3" />. The composed matrix is written <Formula tex="A_3A_2A_1" />.
        </>
      ),
      sections: [
        {
          title: 'Why the written order is reversed',
          body: (
            <>
              The vector is acted on from the right: <Formula tex="v\\mapsto A_1v\\mapsto A_2(A_1v)\\mapsto A_3(A_2(A_1v))" />. The panel still plays the steps in the order you chose.
            </>
          ),
        },
      ],
    },
    dimension: {
      eyebrow: 'Term',
      title: 'Input dimension, output dimension, and shape',
      summary: `${inputSpace} means inputs with ${inputDim} coordinates. ${outputSpace} means outputs with ${outputDim} coordinates.`,
      sections: [
        {
          title: 'Why dimensions must line up',
          items: [
            'A 3D to 2D matrix can compress a 3D vector onto a plane.',
            'A 2D to 3D matrix can embed a plane inside 3D space.',
            'If one step outputs 2D but the next expects 3D input, the sequence cannot connect.',
          ],
        },
      ],
    },
    basis: {
      eyebrow: 'Term',
      title: 'What are basis vectors?',
      summary: 'Basis vectors are the basic directions of the coordinate system. In 2D they are usually i and j; in 3D they are i, j, and k.',
      sections: [
        {
          title: 'Matrix columns are transformed basis vectors',
          items: [
            'Column 1 tells where i goes.',
            'Column 2 tells where j goes.',
            'Column 3, if present, tells where k goes.',
          ],
        },
        {
          title: 'Why that is enough',
          body: 'Any vector is built from weighted basis vectors. Once the new basis positions are known, every vector output is determined.',
        },
      ],
    },
    determinant: {
      eyebrow: 'Term',
      title: 'What does determinant mean in the picture?',
      summary: 'For square matrices, the determinant describes area or volume scale and whether orientation flips.',
      sections: [
        {
          title: 'How to read it',
          items: [
            'Determinant 2 means unit area or unit volume becomes twice as large.',
            'Determinant near 0 means the space collapses and the map is not invertible.',
            'A negative determinant means orientation flipped; use the absolute value for size.',
          ],
        },
      ],
    },
    'rank-nullity': {
      eyebrow: 'Term',
      title: 'What do rank and nullity say?',
      summary: 'Rank counts how many independent output directions remain. Nullity counts how many independent input directions collapse to zero.',
      sections: [
        {
          title: 'How to see it',
          items: [
            'Rank 2 means the result still spreads across a plane.',
            'Rank 1 means the result is only a line.',
            'Rank 0 means everything collapses to the origin.',
            'Higher nullity means more directions were erased by the matrix.',
          ],
        },
        {
          title: 'One core relationship',
          body: (
            <>
              For the input space: <Formula tex="\\operatorname{rank}(A)+\\operatorname{nullity}(A)=\\text{input dimension}" />.
            </>
          ),
        },
      ],
    },
    vector: {
      eyebrow: 'Term',
      title: 'What is a vector here?',
      summary: (
        <>
          A vector is an arrow or a coordinate from the origin. A matrix turns an input vector <Formula tex="v" /> into an output vector <Formula tex="Av" />.
        </>
      ),
      sections: [
        {
          title: 'Why add custom vectors?',
          items: [
            'The grid shows the whole-space motion; a vector shows one specific point.',
            'Custom vectors are the quickest way to test whether a direction stretches, flips, or collapses.',
          ],
        },
      ],
    },
  }
}

function spaceName(dim: SpaceDim): string {
  return dim === 2 ? 'R²' : 'R³'
}
