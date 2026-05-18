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
    entryTitle: 'Reference notes',
    entryHint: 'Use short notes when a symbol or picture is unfamiliar.',
    openOverview: 'Reference',
    openGraph: 'Graph notes',
    close: 'Close reference',
  },
  zh: {
    entryTitle: '参考',
    entryHint: '遇到矩阵、基向量、行列式或秩这些概念时，可以打开简短参考。',
    openOverview: '参考',
    openGraph: '图像说明',
    close: '关闭参考',
  },
}

export function getMatrixHelpTopics(locale: Locale, inputDim: SpaceDim, outputDim: SpaceDim, usesThree: boolean): Record<MatrixHelpTopicId, HelpTopic> {
  return locale === 'zh' ? zhTopics(inputDim, outputDim, usesThree) : enTopics(inputDim, outputDim, usesThree)
}

function zhTopics(inputDim: SpaceDim, outputDim: SpaceDim, usesThree: boolean): Record<MatrixHelpTopicId, HelpTopic> {
  const inputSpace = spaceName(inputDim)
  const outputSpace = spaceName(outputDim)
  const viewKind = usesThree ? '三维场景' : '二维画布'
  const basisNames = inputDim === 2 ? 'i、j' : 'i、j、k'
  const basisColumnItems =
    inputDim === 2
      ? ['第 1 列告诉你 i 变成什么。', '第 2 列告诉你 j 变成什么。']
      : ['第 1 列告诉你 i 变成什么。', '第 2 列告诉你 j 变成什么。', '第 3 列告诉你 k 变成什么。']

  return {
    overview: {
      eyebrow: '矩阵模块',
      title: '这个实验到底在做什么？',
      summary: (
        <>
          先把矩阵看成一台“移动空间的机器”：输入向量 <Formula tex="v" />，输出新向量 <Formula tex="Av" />。数字表是输入方式，空间怎么动是它的几何意义。
        </>
      ),
      sections: [
        {
          title: '你在看什么',
          items: [
            '网格、基向量、单位形状和你添加的向量，会按同一个矩阵一起移动。',
            '每一列告诉你一个基础方向会被送到哪里。',
            '图像先给直觉，右侧数字帮你确认直觉。',
          ],
        },
        {
          title: '读图顺序',
          items: [
            `先看 ${basisNames} 这些基向量去了哪里。`,
            '再看单位方格或单位立方体有没有变大、压扁或翻面。',
            '再看你添加的向量最后落在哪里。',
            '最后看行列式、秩和零化度是否印证观察。',
          ],
        },
        {
          title: '试试看',
          items: [
            '只改第一列，观察 i 向量和网格怎样变化。',
            '换一个投影或反射预设，再打开右侧数字对照。',
          ],
        },
      ],
    },
    graph: {
      eyebrow: '图像阅读',
      title: `${viewKind}里每个东西代表什么？`,
      summary: `当前图像表示一个从 ${inputSpace} 到 ${outputSpace} 的线性映射。你看到的不是函数曲线，而是网格、基向量、单位形状和向量这些代表性对象的变化。`,
      sections: [
        {
          title: '颜色和形状',
          items: [
            '灰色网格是原来的坐标空间；彩色/变形后的网格是矩阵作用后的空间。',
            `${basisNames} 是基向量，也就是坐标轴方向上的单位箭头。`,
            '单位方形或单位立方体会显示面积/体积如何被拉伸、压缩或翻转。',
            '你添加的向量会从变换前的位置移动到输出位置。',
            '在 2D 视图中，轨迹会显示向量从起点到当前结果的大致路径。',
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
        {
          title: '试试看',
          items: [
            '先关掉向量，只看网格和基向量。',
            '再打开向量，检查具体点是否跟着同一套规则移动。',
          ],
        },
      ],
    },
    matrix: {
      eyebrow: '术语',
      title: '矩阵是什么？',
      summary: (
        <>
          在这个模块里，矩阵 <Formula tex="A" /> 是一个数字表，用来定义规则 <Formula tex="v" /> ↦ <Formula tex="Av" />。数字表是输入方式，空间运动是它的几何意义。
        </>
      ),
      sections: [
        {
          title: '形状怎么读',
          items: [
            `${outputDim}×${inputDim} 表示行数 × 列数，也就是输出维度 × 输入维度。`,
            `它会把 ${inputSpace} 的向量映射到 ${outputSpace} 的向量。`,
            '列数对应输入有几个坐标；行数对应输出有几个坐标。',
          ],
        },
        {
          title: '看列最直观',
          items: [
            ...basisColumnItems,
            '列数看输入方向：2D 输入有 i、j；3D 输入有 i、j、k。',
          ],
        },
        {
          title: '看行像计算',
          items: [
            '第 1 行算输出的第一个坐标。',
            '第 2 行算输出的第二个坐标。',
            outputDim === 3 ? '第 3 行算输出的第三个坐标。' : '如果只有 2 行，输出就只有两个坐标。',
          ],
        },
        {
          title: '改一个数字会怎样',
          body: (
            <>
              每个数字都在回答：“某个输入方向，会给某个输出坐标贡献多少？”例如 <Formula tex="a_{21}" /> 是第一列第二行，表示 i 变换后的第二个坐标。
            </>
          ),
        },
        {
          title: '试试看',
          items: [
            '只改第一列，观察 i 向量和整张网格怎么变。',
            '只改第一行，观察输出的第一个坐标怎么受影响。',
          ],
        },
      ],
    },
    'linear-map': {
      eyebrow: '术语',
      title: '线性映射是什么意思？',
      summary: '线性映射是一种很规矩的变换：它可以拉伸、旋转、剪切、投影或压扁；直线仍会变成直线或被压成点；原点一定还在原点。它不会做整体平移。',
      sections: [
        {
          title: '为什么图像看起来像“整张纸”在动',
          items: [
            '矩阵不是只移动一个点，而是对空间里每个向量都使用同一条规则。',
            '只要知道基向量被送到哪里，其他所有点的位置都能由线性组合自动确定。',
          ],
        },
        {
          title: '试试看',
          items: [
            '找一个投影预设，观察很多点被压到同一条线或平面。',
            '尝试把图形整体右移：矩阵做不到，因为原点必须留在原点。',
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
              写成乘法时，向量站在最右边，所以它会先遇到最右边的矩阵：<Formula tex="v" /> → <Formula tex="A_1v" /> → <Formula tex="A_2(A_1v)" /> → <Formula tex="A_3(A_2(A_1v))" />。界面按你的顺序播放，公式按乘法规则写。
            </>
          ),
        },
        {
          title: '试试看',
          items: [
            '先剪切再旋转，然后交换顺序。',
            '如果结果不一样，这就是矩阵乘法通常不能交换的原因。',
          ],
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
            '一个 2D 到 3D 的矩阵会把两个输入方向放到三维输出里。',
            '如果秩是 2，它像把一张平面放进 3D；秩更低时会退化成线或点。',
            '如果前一步输出是 2D，下一步却要求 3D 输入，中间就接不上，系统会提示维度错误。',
          ],
        },
      ],
    },
    basis: {
      eyebrow: '术语',
      title: '基向量是什么？为什么看它？',
      summary: `基向量是输入坐标系统的基础方向。当前输入是 ${inputSpace}，所以要看 ${basisNames}。`,
      sections: [
        {
          title: '矩阵的列就是基向量的去向',
          items: basisColumnItems,
        },
        {
          title: '为什么这足够了',
          body: '任意向量都可以由基向量加权拼出来。只要知道基向量的新位置，任意向量的新位置也就确定了。',
        },
        {
          title: '试试看',
          items: [
            '把第一列改大，观察 i 和所有含有 x 分量的向量。',
            '把两列改成相同方向，观察单位形状是否被压扁。',
          ],
        },
      ],
    },
    determinant: {
      eyebrow: '术语',
      title: '行列式在图上代表什么？',
      summary: '行列式只适用于方阵，比如 R² → R² 或 R³ → R³。它同时告诉你大小缩放和方向有没有翻转。',
      sections: [
        {
          title: '怎么读行列式',
          items: [
            '|det(A)|：面积或体积变成几倍。',
            'det(A) 的正负号：方向顺序有没有被翻过来。',
            'det(A)=2：单位面积或单位体积变成 2 倍。',
            'det(A)=-2：大小还是 2 倍，但方向翻转。',
            'det(A)=0：空间被压到更低维，信息丢失，不能完整反推。',
          ],
        },
        {
          title: '它不告诉你什么',
          items: [
            '行列式不告诉你具体旋转了多少。',
            '它也不告诉你图形最后长什么样。',
            '很多不同矩阵可以有同一个行列式。',
          ],
        },
        {
          title: '试试看',
          items: [
            '把 2D 矩阵改成 [2 0; 0 1]，单位方格宽度翻倍，面积变成 2 倍。',
            '把其中一列改成另一列的倍数，观察面积怎样接近 0。',
          ],
        },
      ],
    },
    'rank-nullity': {
      eyebrow: '术语',
      title: '秩和零化度在说什么？',
      summary: '秩：结果还能占住几个方向。零化度：有几个输入方向被矩阵完全抹掉。',
      sections: [
        {
          title: '把输入方向分两类',
          items: [
            '一类还能在输出里看见，这些贡献给“秩”。',
            '一类被矩阵完全压成 0，这些贡献给“零化度”。',
            '两类加起来，就是原来的输入维度。',
          ],
        },
        {
          title: '在图上看',
          items: [
            '秩为 2：结果仍能铺成一个平面。',
            '秩为 1：结果只剩一条线。',
            '秩为 0：所有东西都压到原点。',
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
        {
          title: '试试看',
          items: [
            '选择投影预设，观察秩是否变小。',
            '把所有列改成 0，观察零化度是否等于输入维度。',
          ],
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
            '这里填的是变换前的坐标；矩阵作用后，它会跟着空间移动到 Av。',
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
  const basisNames = inputDim === 2 ? 'i and j' : 'i, j, and k'
  const basisColumnItems =
    inputDim === 2
      ? ['Column 1 tells where i goes.', 'Column 2 tells where j goes.']
      : ['Column 1 tells where i goes.', 'Column 2 tells where j goes.', 'Column 3 tells where k goes.']

  return {
    overview: {
      eyebrow: 'Matrix module',
      title: 'What is this lab showing?',
      summary: (
        <>
          Treat a matrix as a machine that moves space: it takes a vector <Formula tex="v" /> and returns <Formula tex="Av" />. The table of numbers is how you enter the rule; the motion is its geometric meaning.
        </>
      ),
      sections: [
        {
          title: 'Notes',
          items: [
            'The grid, basis vectors, unit shape, and custom vectors all move by the same matrix.',
            'Each column tells where one basic direction lands.',
            'The picture gives intuition first; the numbers on the right help confirm it.',
          ],
        },
        {
          title: 'Reading order',
          items: [
            `First watch where ${basisNames} land.`,
            'Then check whether the unit square or cube grows, collapses, or flips.',
            'Then follow any custom vector you added.',
            'Finally, use determinant, rank, and nullity to confirm your observation.',
          ],
        },
        {
          title: 'Try this',
          items: [
            'Change only the first column and watch the i vector and grid.',
            'Switch to a projection or reflection preset, then compare the right-side numbers.',
          ],
        },
      ],
    },
    graph: {
      eyebrow: 'Reading the picture',
      title: `What does the ${viewKind} mean?`,
      summary: `The current picture is a linear map from ${inputSpace} to ${outputSpace}. It is not a function curve; it shows representative objects such as the grid, basis vectors, unit shape, and vectors.`,
      sections: [
        {
          title: 'Colors and shapes',
          items: [
            'The gray grid is the original coordinate space; the transformed grid shows where that space lands.',
            `${basisNames} are basis vectors: unit arrows along the coordinate directions.`,
            'The unit square or unit cube shows how area or volume changes.',
            'Custom vectors move from their input position to their output position.',
            'In the 2D view, trails show the approximate path from the start to the current result.',
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
        {
          title: 'Try this',
          items: [
            'Hide vectors first and read only the grid and basis vectors.',
            'Turn vectors back on and check that specific points follow the same rule.',
          ],
        },
      ],
    },
    matrix: {
      eyebrow: 'Term',
      title: 'What is a matrix?',
      summary: (
        <>
          In this module, a matrix <Formula tex="A" /> is a table of numbers defining the rule <Formula tex="v" /> ↦ <Formula tex="Av" />. The table is the input format; the space motion is the geometry.
        </>
      ),
      sections: [
        {
          title: 'Shape',
          items: [
            `${outputDim}x${inputDim} means output × input.`,
            `It turns vectors in ${inputSpace} into vectors in ${outputSpace}.`,
            'Columns match input coordinates; rows match output coordinates.',
          ],
        },
        {
          title: 'Columns are most visual',
          items: [
            ...basisColumnItems,
            'Column count follows input directions: 2D input has i and j; 3D input has i, j, and k.',
          ],
        },
        {
          title: 'Rows are calculation',
          items: [
            'Row 1 computes the first output coordinate.',
            'Row 2 computes the second output coordinate.',
            outputDim === 3 ? 'Row 3 computes the third output coordinate.' : 'With only 2 rows, the output has only two coordinates.',
          ],
        },
        {
          title: 'When you edit one entry',
          body: (
            <>
              Each number answers: “How much does one input direction contribute to one output coordinate?” For example, <Formula tex="a_{21}" /> is row 2, column 1: the second coordinate of the transformed i vector.
            </>
          ),
        },
        {
          title: 'Try this',
          items: [
            'Change only the first column and watch the i vector and whole grid.',
            'Change only the first row and watch the first output coordinate.',
          ],
        },
      ],
    },
    'linear-map': {
      eyebrow: 'Term',
      title: 'What is a linear map?',
      summary: 'A linear map is a disciplined transformation: it may stretch, rotate, shear, project, or collapse. Lines stay lines or collapse to points, and the origin stays fixed. It does not translate everything.',
      sections: [
        {
          title: 'Why it looks like the whole sheet moves',
          items: [
            'The matrix applies one rule to every vector in the space.',
            'Once you know where the basis vectors land, every other point follows from linear combinations.',
          ],
        },
        {
          title: 'Try this',
          items: [
            'Choose a projection preset and watch many points collapse onto one line or plane.',
            'Try to move the whole picture right: a matrix cannot do that because the origin must stay fixed.',
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
              In multiplication, the vector sits on the right, so it meets the rightmost matrix first: <Formula tex="v" /> → <Formula tex="A_1v" /> → <Formula tex="A_2(A_1v)" /> → <Formula tex="A_3(A_2(A_1v))" />. The panel plays your order; the formula follows multiplication order.
            </>
          ),
        },
        {
          title: 'Try this',
          items: [
            'Shear first and rotate second, then swap the order.',
            'If the result changes, you are seeing why matrix multiplication usually does not commute.',
          ],
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
            'A 2D to 3D matrix sends two input directions into 3D output.',
            'If rank is 2, it behaves like a plane placed in 3D; lower rank degenerates to a line or point.',
            'If one step outputs 2D but the next expects 3D input, the sequence cannot connect.',
          ],
        },
      ],
    },
    basis: {
      eyebrow: 'Term',
      title: 'What are basis vectors?',
      summary: `Basis vectors are the basic directions of the input coordinate system. The current input is ${inputSpace}, so watch ${basisNames}.`,
      sections: [
        {
          title: 'Matrix columns are transformed basis vectors',
          items: basisColumnItems,
        },
        {
          title: 'Why that is enough',
          body: 'Any vector is built from weighted basis vectors. Once the new basis positions are known, every vector output is determined.',
        },
        {
          title: 'Try this',
          items: [
            'Make the first column larger and watch i plus vectors with x components.',
            'Make two columns point the same way and watch whether the unit shape collapses.',
          ],
        },
      ],
    },
    determinant: {
      eyebrow: 'Term',
      title: 'What does determinant mean in the picture?',
      summary: 'Determinant only applies to square maps such as R² → R² or R³ → R³. It tells both size scale and whether orientation flips.',
      sections: [
        {
          title: 'How to read it',
          items: [
            '|det(A)| is how many times area or volume changes.',
            'The sign of det(A) says whether direction order flipped.',
            'det(A)=2 means unit area or volume becomes twice as large.',
            'det(A)=-2 still has size scale 2, but orientation flips.',
            'det(A)=0 means space collapsed to lower dimension, so information was lost.',
          ],
        },
        {
          title: 'What it does not tell you',
          items: [
            'It does not tell the exact rotation angle.',
            'It does not tell the final shape by itself.',
            'Many different matrices can share the same determinant.',
          ],
        },
        {
          title: 'Try this',
          items: [
            'Set a 2D matrix to [2 0; 0 1]. The unit square doubles in width and area.',
            'Make one column a multiple of another and watch area move toward 0.',
          ],
        },
      ],
    },
    'rank-nullity': {
      eyebrow: 'Term',
      title: 'What do rank and nullity say?',
      summary: 'Rank says how many directions the result can still occupy. Nullity says how many input directions the matrix completely erases.',
      sections: [
        {
          title: 'Split input directions into two groups',
          items: [
            'One group is still visible in the output; it contributes to rank.',
            'The other group collapses to 0; it contributes to nullity.',
            'Together they add up to the original input dimension.',
          ],
        },
        {
          title: 'How to see it',
          items: [
            'Rank 2 means the result still spreads across a plane.',
            'Rank 1 means the result is only a line.',
            'Rank 0 means everything collapses to the origin.',
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
        {
          title: 'Try this',
          items: [
            'Choose a projection preset and watch whether rank decreases.',
            'Set every column to 0 and check that nullity equals the input dimension.',
          ],
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
            'You enter the vector before the transformation; after the matrix acts, it moves with the space to Av.',
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
