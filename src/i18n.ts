import type { SpaceDim, ThemeSettings, ViewOptions } from './math/types.ts'

export type Locale = 'en' | 'zh'

function spacePlain(dim: number): string {
  return dim === 2 ? 'R²' : dim === 3 ? 'R³' : `R^${dim}`
}

type ViewOptionKey = keyof ViewOptions
type ThemeColorKey = keyof ThemeSettings['colors']

export type AppCopy = {
  top: {
    eyebrow: string
    title: string
    darkApp: string
    lightApp: string
    languageLabel: string
    switchToChinese: string
    switchToEnglish: string
  }
  views: {
    title: (inputDim: SpaceDim, outputDim: SpaceDim) => string
    subtitle: (inputDim: SpaceDim, outputDim: SpaceDim) => string
    canvas2dTitle: string
    canvas2dSubtitle: string
    trueR2Title: string
    trueR2Subtitle: string
  }
  visualization: {
    focus: string
    exitFocus: string
    matrices: string
    vectors: string
    theme: string
    explanation: string
    controls: string
    exportPng: string
    autoHideHud: string
    closePanel: string
  }
  matrixSequence: {
    title: string
    add: string
    help: string
    presetTitle: string
    presetSummary: string
    presetNames: Record<string, string>
  }
  matrixInput: {
    input: string
    output: string
    moveUp: (name: string) => string
    moveDown: (name: string) => string
    deleteMap: (name: string) => string
    stepNote: (step: number) => string
  }
  vectorPanel: {
    title: string
    add: string
    help: (dim: SpaceDim) => string
    mismatch: (name: string, vectorDim: SpaceDim, requiredDim: SpaceDim) => string
  }
  vectorInput: {
    colorTitle: string
    deleteVector: (name: string) => string
  }
  themePanel: {
    title: string
    neutral: string
    highContrast: string
    lowContrastWarning: string
    colorLabels: Record<ThemeColorKey, string>
  }
  controls: {
    play: string
    pause: string
    reset: string
    resetView: string
    exportPng: string
    progress: string
    speed: string
    zoom: string
    playbackMode: string
    combined: string
    step: string
    viewLabels: Record<ViewOptionKey, string>
  }
  threeView: {
    cameraLabel: string
    free: string
    x: string
    y: string
    z: string
    webglUnavailable: string
  }
  explanation: {
    mappingType: string
    mappingAria: string
    mappingSummary: string
    sceneSummary: (inputDim: SpaceDim, outputDim: SpaceDim, mapCount: number, vectorCount: number) => string
    mappingHints: Record<'2-2' | '3-3' | '3-2' | '2-3', string>
    title: string
    sequence: (names: string, composedName: string, inputDim: SpaceDim, outputDim: SpaceDim) => string
    fixDimensions: string
    dimensionCheck: string
    currentDimensions: string
    inputDimension: string
    outputDimension: string
    matrixShape: string
    finalMatrix: string
    areaScale: string
    volumeScale: string
    determinant: string
    notInvertible: string
    orientationFlipped: string
    rankAndNullity: string
    rank: string
    nullity: string
    imageDimension: string
    compressionRank2: string
    compressionRank1: string
    compressionRank0: string
    transformedBasis: string
    r3ToR2BasisNote: string
    r2ToR3BasisNote: string
    transformedVectors: string
    vectorMismatch: (name: string, vectorDim: SpaceDim, requiredDim: SpaceDim) => string
    stepMatrices: string
    afterStep: (step: number) => string
  }
}

const presetNameZh: Record<string, string> = {
  Identity: '恒等映射',
  Scale: '缩放',
  'Rotation 45 degrees': '旋转 45 度',
  Shear: '错切',
  Reflection: '反射',
  Projection: '投影',
  'Singular matrix': '奇异矩阵',
  'Orientation flip': '取向翻转',
  'Rotate around x axis': '绕 x 轴旋转',
  'Rotate around y axis': '绕 y 轴旋转',
  'Rotate around z axis': '绕 z 轴旋转',
  'Projection to xy plane': '投影到 xy 平面',
  'Drop z': '舍弃 z',
  'Drop y': '舍弃 y',
  'Oblique projection': '斜投影',
  'Rank 1 collapse': '秩 1 压缩',
  'Zero map': '零映射',
  'Embed into xy plane': '嵌入 xy 平面',
  'Embed into tilted plane': '嵌入倾斜平面',
}

const identityPresetNames: Record<string, string> = Object.fromEntries(
  Object.keys(presetNameZh).map((name) => [name, name]),
)

export const appCopy: Record<Locale, AppCopy> = {
  en: {
    top: {
      eyebrow: 'Linear Algebra Workspace',
      title: 'Matrix Motion',
      darkApp: 'Dark App',
      lightApp: 'Light App',
      languageLabel: 'Language',
      switchToChinese: '中文',
      switchToEnglish: 'English',
    },
    views: {
      title: (inputDim, outputDim) => {
        if (inputDim === 3 && outputDim === 2) {
          return `${spacePlain(3)} → ${spacePlain(2)} Bridge View`
        }
        if (inputDim === 2 && outputDim === 3) {
          return `${spacePlain(2)} → ${spacePlain(3)} Embedded View`
        }
        return `${spacePlain(inputDim)} → ${spacePlain(outputDim)} View`
      },
      subtitle: (inputDim, outputDim) => {
        if (inputDim === 3 && outputDim === 2) {
          return 'The output plane is embedded in 3D as z = 0, so Av appears as (Av.x, Av.y, 0).'
        }
        if (inputDim === 2 && outputDim === 3) {
          return `The 2D input plane unfolds into ${spacePlain(3)} according to the current 3x2 matrix.`
        }
        return 'The 3D grid, basis, unit shape, and vectors are computed from the current linear map.'
      },
      canvas2dTitle: `${spacePlain(2)} → ${spacePlain(2)} Canvas`,
      canvas2dSubtitle: 'The grid, basis, unit square, and vectors all use the current animation matrix T(t).',
      trueR2Title: `True ${spacePlain(2)} Output Coordinates`,
      trueR2Subtitle: 'The final vector Av is drawn as (x, y); the 3D bridge embeds it as (x, y, 0).',
    },
    visualization: {
      focus: 'Focus',
      exitFocus: 'Exit focus',
      matrices: 'Matrices',
      vectors: 'Vectors',
      theme: 'Theme',
      explanation: 'Explanation',
      controls: 'Controls',
      exportPng: 'Export PNG',
      autoHideHud: 'Auto-hide HUD',
      closePanel: 'Close panel',
    },
    matrixSequence: {
      title: 'Matrix Sequence',
      add: 'Add',
      help: 'User order [A, B, C] means first A, then B, then C. The composed matrix is CBA.',
      presetTitle: 'Preset Library',
      presetSummary: 'Expand to apply common maps',
      presetNames: identityPresetNames,
    },
    matrixInput: {
      input: 'Input',
      output: 'Output',
      moveUp: (name) => `Move ${name} up`,
      moveDown: (name) => `Move ${name} down`,
      deleteMap: (name) => `Delete ${name}`,
      stepNote: (step) => `Step ${step}: this map acts after all maps above it.`,
    },
    vectorPanel: {
      title: 'Vectors',
      add: 'Add',
      help: (dim) => `Input vectors must live in ${spacePlain(dim)}, matching the first matrix input dimension.`,
      mismatch: (name, vectorDim, requiredDim) => `${name} was ${spacePlain(vectorDim)}; editing it here will resize it to ${spacePlain(requiredDim)}.`,
    },
    vectorInput: {
      colorTitle: 'Vector color',
      deleteVector: (name) => `Delete ${name}`,
    },
    themePanel: {
      title: 'Drawing Colors',
      neutral: 'Neutral',
      highContrast: 'High Contrast',
      lowContrastWarning: 'Low contrast warning: some axes, grids, vectors, or labels may be hard to read.',
      colorLabels: {
        grid: 'Grid',
        transformedGrid: 'Transformed grid',
        axis: 'Axis',
        vectorI: 'i vector',
        vectorJ: 'j vector',
        vectorK: 'k vector',
        inputVector: 'Default vector',
        unitShape: 'Unit shape',
      },
    },
    controls: {
      play: 'Play',
      pause: 'Pause',
      reset: 'Reset animation',
      resetView: 'Reset view',
      exportPng: 'Export PNG',
      progress: 'Playback progress',
      speed: 'Speed',
      zoom: 'Zoom',
      playbackMode: 'Playback mode',
      combined: 'Combined',
      step: 'Step',
      viewLabels: {
        showGrid: 'Grid',
        showBasis: 'Basis',
        showUnitShape: 'Unit shape',
        showVectors: 'Vectors',
        showTrails: 'Trails',
      },
    },
    threeView: {
      cameraLabel: '3D camera view',
      free: 'Free',
      x: 'X',
      y: 'Y',
      z: 'Z',
      webglUnavailable: '3D rendering needs WebGL. The rest of the lesson and numeric explanation are still available.',
    },
    explanation: {
      mappingType: 'Mapping Type',
      mappingAria: 'Current mapping type',
      mappingSummary: 'Read-only summary of the current matrix sequence.',
      sceneSummary: (inputDim, outputDim, mapCount, vectorCount) =>
        `Scene summary: ${mapCount} matrix step${mapCount === 1 ? '' : 's'} map ${spacePlain(inputDim)} to ${spacePlain(outputDim)} with ${vectorCount} input vector${vectorCount === 1 ? '' : 's'} visible when dimensions match.`,
      mappingHints: {
        '2-2': '2x2 square map',
        '3-3': '3x3 square map',
        '3-2': '2x3 compression',
        '2-3': '3x2 embedding',
      },
      title: 'Explanation',
      sequence: (names, composedName, inputDim, outputDim) =>
        `The sequence applies ${names} in user order. The final matrix is ${composedName}, mapping ${spacePlain(inputDim)} to ${spacePlain(outputDim)}.`,
      fixDimensions: 'Fix the sequence dimensions to preview the composed transformation.',
      dimensionCheck: 'Dimension Check',
      currentDimensions: 'Current Dimensions',
      inputDimension: 'Input dimension',
      outputDimension: 'Output dimension',
      matrixShape: 'Matrix shape',
      finalMatrix: 'Final Matrix',
      areaScale: 'Area Scale',
      volumeScale: 'Volume Scale',
      determinant: 'determinant',
      notInvertible: 'The determinant is close to 0, so this map is not invertible.',
      orientationFlipped: 'The determinant is negative, so orientation is flipped.',
      rankAndNullity: 'Rank And Nullity',
      rank: 'rank',
      nullity: 'nullity',
      imageDimension: 'image dimension',
      compressionRank2: `${spacePlain(3)} is compressed onto the 2D output plane.`,
      compressionRank1: `${spacePlain(3)} is compressed onto a line in the output plane.`,
      compressionRank0: 'Every vector is collapsed to the zero vector.',
      transformedBasis: 'Transformed Basis',
      r3ToR2BasisNote: `The i, j, and k columns each land in true ${spacePlain(2)} output coordinates.`,
      r2ToR3BasisNote: `The i and j columns each land in ${spacePlain(3)}, defining the embedded output plane.`,
      transformedVectors: 'Transformed Vectors',
      vectorMismatch: (name, vectorDim, requiredDim) => `${name} is ${spacePlain(vectorDim)}; it must be ${spacePlain(requiredDim)}.`,
      stepMatrices: 'Step Matrices',
      afterStep: (step) => `After step ${step}`,
    },
  },
  zh: {
    top: {
      eyebrow: '线性代数工作区',
      title: '矩阵运动',
      darkApp: '深色界面',
      lightApp: '浅色界面',
      languageLabel: '语言',
      switchToChinese: '中文',
      switchToEnglish: 'English',
    },
    views: {
      title: (inputDim, outputDim) => {
        if (inputDim === 3 && outputDim === 2) {
          return `${spacePlain(3)} → ${spacePlain(2)} 桥接视图`
        }
        if (inputDim === 2 && outputDim === 3) {
          return `${spacePlain(2)} → ${spacePlain(3)} 嵌入视图`
        }
        return `${spacePlain(inputDim)} → ${spacePlain(outputDim)} 视图`
      },
      subtitle: (inputDim, outputDim) => {
        if (inputDim === 3 && outputDim === 2) {
          return '输出平面嵌入三维场景的 z = 0 平面，Av 显示为 (Av.x, Av.y, 0)。'
        }
        if (inputDim === 2 && outputDim === 3) {
          return `二维输入平面会按照当前 3x2 矩阵展开到 ${spacePlain(3)}。`
        }
        return '三维网格、基向量、单位形状和向量都由当前线性映射计算。'
      },
      canvas2dTitle: `${spacePlain(2)} → ${spacePlain(2)} 画布`,
      canvas2dSubtitle: '网格、基向量、单位方格和向量都使用当前动画矩阵 T(t)。',
      trueR2Title: `真实 ${spacePlain(2)} 输出坐标`,
      trueR2Subtitle: '最终向量 Av 按 (x, y) 绘制；三维桥接视图把它嵌入为 (x, y, 0)。',
    },
    visualization: {
      focus: '专注视图',
      exitFocus: '退出专注视图',
      matrices: '矩阵',
      vectors: '向量',
      theme: '主题',
      explanation: '解释',
      controls: '控制',
      exportPng: '导出 PNG',
      autoHideHud: '自动隐藏控制栏',
      closePanel: '关闭面板',
    },
    matrixSequence: {
      title: '矩阵序列',
      add: '添加',
      help: '用户顺序 [A, B, C] 表示先作用 A，再作用 B，再作用 C；合成矩阵是 CBA。',
      presetTitle: '预设库',
      presetSummary: '展开后应用常见映射',
      presetNames: presetNameZh,
    },
    matrixInput: {
      input: '输入',
      output: '输出',
      moveUp: (name) => `上移 ${name}`,
      moveDown: (name) => `下移 ${name}`,
      deleteMap: (name) => `删除 ${name}`,
      stepNote: (step) => `第 ${step} 步：这个映射会在上方所有映射之后作用。`,
    },
    vectorPanel: {
      title: '向量',
      add: '添加',
      help: (dim) => `输入向量必须属于 ${spacePlain(dim)}，与第一个矩阵的输入维度一致。`,
      mismatch: (name, vectorDim, requiredDim) => `${name} 原本是 ${spacePlain(vectorDim)}；在这里编辑会把它调整为 ${spacePlain(requiredDim)}。`,
    },
    vectorInput: {
      colorTitle: '向量颜色',
      deleteVector: (name) => `删除 ${name}`,
    },
    themePanel: {
      title: '绘图颜色',
      neutral: '中性',
      highContrast: '高对比',
      lowContrastWarning: '低对比提醒：部分坐标轴、网格、向量或标签可能不易辨认。',
      colorLabels: {
        grid: '网格',
        transformedGrid: '变换后网格',
        axis: '坐标轴',
        vectorI: 'i 向量',
        vectorJ: 'j 向量',
        vectorK: 'k 向量',
        inputVector: '默认向量',
        unitShape: '单位形状',
      },
    },
    controls: {
      play: '播放',
      pause: '暂停',
      reset: '重置动画',
      resetView: '重置视图',
      exportPng: '导出 PNG',
      progress: '播放进度',
      speed: '速度',
      zoom: '缩放',
      playbackMode: '播放模式',
      combined: '合成',
      step: '分步',
      viewLabels: {
        showGrid: '网格',
        showBasis: '基向量',
        showUnitShape: '单位形状',
        showVectors: '向量',
        showTrails: '轨迹',
      },
    },
    threeView: {
      cameraLabel: '3D 视角',
      free: '自由',
      x: 'X',
      y: 'Y',
      z: 'Z',
      webglUnavailable: '3D 渲染需要 WebGL；章节内容和数值解释仍可继续使用。',
    },
    explanation: {
      mappingType: '映射类型',
      mappingAria: '当前映射类型',
      mappingSummary: '当前矩阵序列的只读摘要。',
      sceneSummary: (inputDim, outputDim, mapCount, vectorCount) =>
        `场景摘要：${mapCount} 个矩阵步骤把 ${spacePlain(inputDim)} 映射到 ${spacePlain(outputDim)}；维度匹配时会显示 ${vectorCount} 个输入向量。`,
      mappingHints: {
        '2-2': '2x2 方阵映射',
        '3-3': '3x3 方阵映射',
        '3-2': '2x3 压缩映射',
        '2-3': '3x2 嵌入映射',
      },
      title: '解释',
      sequence: (names, composedName, inputDim, outputDim) =>
        `序列会按用户顺序依次作用 ${names}。最终矩阵是 ${composedName}，表示从 ${spacePlain(inputDim)} 到 ${spacePlain(outputDim)} 的映射。`,
      fixDimensions: '请先修正序列维度，才能预览合成变换。',
      dimensionCheck: '维度检查',
      currentDimensions: '当前维度',
      inputDimension: '输入维度',
      outputDimension: '输出维度',
      matrixShape: '矩阵形状',
      finalMatrix: '最终矩阵',
      areaScale: '面积缩放',
      volumeScale: '体积缩放',
      determinant: '行列式',
      notInvertible: '行列式接近 0，因此这个映射不可逆。',
      orientationFlipped: '行列式为负，因此空间取向被翻转。',
      rankAndNullity: '秩与零化度',
      rank: '秩',
      nullity: '零化度',
      imageDimension: '像空间维度',
      compressionRank2: '三维空间被压缩到二维输出平面。',
      compressionRank1: '三维空间被压缩到输出平面中的一条线。',
      compressionRank0: '所有向量都被压成零向量。',
      transformedBasis: '变换后的基向量',
      r3ToR2BasisNote: `i、j、k 三列分别落在真实的 ${spacePlain(2)} 输出坐标中。`,
      r2ToR3BasisNote: `i、j 两列分别落在 ${spacePlain(3)} 中，并定义嵌入后的输出平面。`,
      transformedVectors: '变换后的向量',
      vectorMismatch: (name, vectorDim, requiredDim) => `${name} 是 ${spacePlain(vectorDim)}；它必须是 ${spacePlain(requiredDim)}。`,
      stepMatrices: '分步矩阵',
      afterStep: (step) => `第 ${step} 步后`,
    },
  },
}

export function translateValidationMessage(message: string, locale: Locale): string {
  if (locale === 'en') {
    return message
  }

  const followMismatch = message.match(/^(.+) cannot follow (.+): .+\.inputDim is ([23]), but .+\.outputDim is ([23])\.$/)
  if (followMismatch) {
    return `${followMismatch[1]} 不能接在 ${followMismatch[2]} 后面：输入维度是 ${followMismatch[3]}，但前一个输出维度是 ${followMismatch[4]}。`
  }

  const inputMismatch = message.match(/^(.+) input dimension must be 2 or 3\.$/)
  if (inputMismatch) {
    return `${inputMismatch[1]} 的输入维度必须是 2 或 3。`
  }

  const outputMismatch = message.match(/^(.+) output dimension must be 2 or 3\.$/)
  if (outputMismatch) {
    return `${outputMismatch[1]} 的输出维度必须是 2 或 3。`
  }

  const rowCountMismatch = message.match(/^(.+) must have ([23]) rows because outputDim is ([23])\.$/)
  if (rowCountMismatch) {
    return `${rowCountMismatch[1]} 必须有 ${rowCountMismatch[2]} 行，因为 outputDim 是 ${rowCountMismatch[3]}。`
  }

  const rowSizeMismatch = message.match(/^(.+) row (\d+) must have ([23]) values\.$/)
  if (rowSizeMismatch) {
    return `${rowSizeMismatch[1]} 第 ${rowSizeMismatch[2]} 行必须有 ${rowSizeMismatch[3]} 个值。`
  }

  const nonFinite = message.match(/^(.+) contains a non-finite value\.$/)
  if (nonFinite) {
    return `${nonFinite[1]} 包含非有限数值。`
  }

  const expectedRows = message.match(/^Expected ([23]) rows, received (\d+)\.$/)
  if (expectedRows) {
    return `应有 ${expectedRows[1]} 行，实际收到 ${expectedRows[2]} 行。`
  }

  const rowValues = message.match(/^Row (\d+) must contain ([23]) values\.$/)
  if (rowValues) {
    return `第 ${rowValues[1]} 行必须包含 ${rowValues[2]} 个值。`
  }

  if (message === 'Every matrix entry must be a finite number.') {
    return '每个矩阵元素都必须是有限数值。'
  }

  const vectorDimension = message.match(/^Vector must live in R([23]); received R([23])\.$/)
  if (vectorDimension) {
    return `向量必须属于 R${vectorDimension[1]}；实际收到 R${vectorDimension[2]}。`
  }

  if (message === 'Every vector entry must be a finite number.') {
    return '每个向量元素都必须是有限数值。'
  }

  return message
}
