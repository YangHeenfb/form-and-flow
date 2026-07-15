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
    entryTitle: 'Notes',
    entryHint: 'Short observations connecting the canvas, readout, and notation.',
    openOverview: 'Notes',
    openGraph: 'Visual notes',
    close: 'Close notes',
  },
  zh: {
    entryTitle: '笔记',
    entryHint: '把画布、读数和符号联系起来的简短观察。',
    openOverview: '笔记',
    openGraph: '视觉笔记',
    close: '关闭笔记',
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
      eyebrow: '笔记',
      title: '矩阵作为空间运动',
      summary: (
        <>
          先把矩阵看成一台“移动空间的机器”：输入向量 <Formula tex="v" />，输出新向量 <Formula tex="Av" />。数字表是输入方式，空间怎么动是它的几何意义。
        </>
      ),
      sections: [
        {
          title: '观察',
          items: [
            '网格、基向量、单位形状和你添加的向量，会按同一个矩阵一起移动。',
            '每一列告诉你一个基础方向会被送到哪里。',
            '图像呈现几何变化，右侧读数保留同一变化的代数描述。',
          ],
        },
        {
          title: '结构关系',
          items: [
            `${basisNames} 的落点就是矩阵的各列。`,
            '单位形状显示面积或体积的伸缩与退化。',
            '行列式、秩和零化度把这些几何变化压缩成数值。',
          ],
        },
      ],
    },
    graph: {
      eyebrow: '视觉笔记',
      title: `${viewKind}中的线性映射`,
      summary: `当前图像表示一个从 ${inputSpace} 到 ${outputSpace} 的线性映射。你看到的不是函数曲线，而是网格、基向量、单位形状和向量这些代表性对象的变化。`,
      sections: [
        {
          title: '视觉编码',
          items: [
            '灰色网格是原来的坐标空间；彩色/变形后的网格是矩阵作用后的空间。',
            `${basisNames} 是基向量，也就是坐标轴方向上的单位箭头。`,
            '单位方形或单位立方体会显示面积/体积如何被拉伸、压缩或翻转。',
            '你添加的向量会从变换前的位置移动到输出位置。',
            '在 2D 视图中，轨迹显示逐项插值所选择的动画路径；最终落点才是当前矩阵映射的结果。',
          ],
        },
        {
          title: '结构变化',
          items: [
            '网格间距和夹角共同显示各方向上的伸缩与错切。',
            '单位形状被压成线或点时，说明某些方向的信息丢失了。',
            '对非奇异方阵，方向顺序翻转对应负行列式。',
          ],
        },
      ],
    },
    matrix: {
      eyebrow: '术语',
      title: '矩阵',
      summary: (
        <>
          在这个模块里，矩阵 <Formula tex="A" /> 是一个数字表，用来定义规则 <Formula tex="v" /> ↦ <Formula tex="Av" />。数字表是输入方式，空间运动是它的几何意义。
        </>
      ),
      sections: [
        {
          title: '形状与条目',
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
          title: '变化线索',
          items: [
            '第一列改变时，i 向量与整张网格会同步响应。',
            '第一行改变时，每个输出向量的第一个坐标都会受到影响。',
          ],
        },
      ],
    },
    'linear-map': {
      eyebrow: '术语',
      title: '线性映射',
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
          title: '变化线索',
          items: [
            '投影预设会让许多点同时压到一条线或一个平面。',
            '矩阵不能把图形整体右移，因为原点必须留在原点。',
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
          title: '变化线索',
          items: [
            '剪切后旋转与旋转后剪切通常会到达不同结果。',
            '这种顺序差异直接显示矩阵乘法通常不能交换。',
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
      title: '基向量',
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
          title: '变化线索',
          items: [
            '第一列放大时，i 与所有含 x 分量的向量一起变化。',
            '两列指向同一方向时，单位形状会向较低维度坍缩。',
          ],
        },
      ],
    },
    determinant: {
      eyebrow: '术语',
      title: '图像中的行列式',
      summary: '行列式只适用于方阵，比如 R² → R² 或 R³ → R³。它同时告诉你大小缩放和方向有没有翻转。',
      sections: [
        {
          title: '面积与方向',
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
          title: '变化线索',
          items: [
            '矩阵 [2 0; 0 1] 让单位方格宽度翻倍，面积变为 2 倍。',
            '一列逐渐成为另一列的倍数时，面积会接近 0。',
          ],
        },
      ],
    },
    'rank-nullity': {
      eyebrow: '术语',
      title: '秩与零化度',
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
          title: '变化线索',
          items: [
            '投影预设通常会降低秩，并让单位形状坍缩。',
            '所有列都为 0 时，零化度等于输入维度。',
          ],
        },
      ],
    },
    vector: {
      eyebrow: '术语',
      title: '向量',
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
      eyebrow: 'Notes',
      title: 'A matrix as motion of space',
      summary: (
        <>
          Treat a matrix as a machine that moves space: it takes a vector <Formula tex="v" /> and returns <Formula tex="Av" />. The table of numbers is how you enter the rule; the motion is its geometric meaning.
        </>
      ),
      sections: [
        {
          title: 'Observation',
          items: [
            'The grid, basis vectors, unit shape, and custom vectors all move by the same matrix.',
            'Each column tells where one basic direction lands.',
            'The picture carries the geometry; the readout keeps the same change in algebraic form.',
          ],
        },
        {
          title: 'Structural relations',
          items: [
            `The destinations of ${basisNames} are the matrix columns.`,
            'The unit shape records scaling, collapse, and orientation change.',
            'Determinant, rank, and nullity compress those geometric changes into numbers.',
          ],
        },
      ],
    },
    graph: {
      eyebrow: 'Visual notes',
      title: `The linear map in the ${viewKind}`,
      summary: `The current picture is a linear map from ${inputSpace} to ${outputSpace}. It is not a function curve; it shows representative objects such as the grid, basis vectors, unit shape, and vectors.`,
      sections: [
        {
          title: 'Visual encoding',
          items: [
            'The gray grid is the original coordinate space; the transformed grid shows where that space lands.',
            `${basisNames} are basis vectors: unit arrows along the coordinate directions.`,
            'The unit square or unit cube shows how area or volume changes.',
            'Custom vectors move from their input position to their output position.',
            'In the 2D view, trails follow the chosen entrywise interpolation; the endpoint is the result of the current matrix map.',
          ],
        },
        {
          title: 'Structural changes',
          items: [
            'Grid spacing and angles together show directional stretching, compression, and shear.',
            'If the unit shape collapses into a line or point, some directions were lost.',
            'For a nonsingular square map, an orientation flip corresponds to a negative determinant.',
          ],
        },
      ],
    },
    matrix: {
      eyebrow: 'Term',
      title: 'Matrix',
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
          title: 'What changes',
          items: [
            'Changing only the first column moves the i vector and the whole grid together.',
            'Changing only the first row alters the first coordinate of every output vector.',
          ],
        },
      ],
    },
    'linear-map': {
      eyebrow: 'Term',
      title: 'Linear map',
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
          title: 'What changes',
          items: [
            'A projection preset collapses many points onto one line or plane.',
            'A matrix cannot translate the whole picture to the right because the origin must stay fixed.',
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
          title: 'What changes',
          items: [
            'Shear-then-rotate and rotate-then-shear usually end at different results.',
            'That order dependence makes noncommutativity visible.',
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
      title: 'Basis vectors',
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
          title: 'What changes',
          items: [
            'Enlarging the first column moves i and every vector with an x component.',
            'When two columns point the same way, the unit shape collapses toward a lower dimension.',
          ],
        },
      ],
    },
    determinant: {
      eyebrow: 'Term',
      title: 'Determinant in the picture',
      summary: 'Determinant only applies to square maps such as R² → R² or R³ → R³. It tells both size scale and whether orientation flips.',
      sections: [
        {
          title: 'Interpretation',
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
          title: 'What changes',
          items: [
            'For [2 0; 0 1], the unit square doubles in width and area.',
            'As one column becomes a multiple of another, area approaches 0.',
          ],
        },
      ],
    },
    'rank-nullity': {
      eyebrow: 'Term',
      title: 'Rank and nullity',
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
          title: 'Geometric reading',
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
          title: 'What changes',
          items: [
            'Projection presets usually reduce rank and collapse the unit shape.',
            'When every column is 0, nullity equals the input dimension.',
          ],
        },
      ],
    },
    vector: {
      eyebrow: 'Term',
      title: 'Vector in this view',
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
