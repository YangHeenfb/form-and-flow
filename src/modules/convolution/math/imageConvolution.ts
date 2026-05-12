import type { BoundaryMode, OperationMode } from '../convolutionTypes.ts'

export type Kernel2D = number[][]

export type ImageConvolutionOptions = {
  mode: OperationMode
  boundaryMode: BoundaryMode
  normalize: boolean
  preserveAlpha: boolean
  grayscaleBeforeApply?: boolean
}

export function validateKernel2D(kernel: Kernel2D): boolean {
  if (kernel.length === 0) return false
  const width = kernel[0]?.length ?? 0
  return width > 0 && kernel.every((row) => row.length === width && row.every(Number.isFinite))
}

export function flipKernel2D(kernel: Kernel2D): Kernel2D {
  return kernel.map((row) => [...row]).reverse().map((row) => row.reverse())
}

export function normalizeKernel2D(kernel: Kernel2D): Kernel2D {
  const sum = kernel.flat().reduce((total, value) => total + value, 0)
  if (Math.abs(sum) < 1e-12) return kernel.map((row) => row.map(safeNumber))
  return kernel.map((row) => row.map((value) => safeNumber(value) / sum))
}

export function applyKernelToImageData(imageData: ImageData, kernel: Kernel2D, options: ImageConvolutionOptions): ImageData {
  const safeKernel = prepareKernel(kernel, options)
  const source = options.grayscaleBeforeApply ? grayscaleImageData(imageData) : imageData
  const output = new Uint8ClampedArray(imageData.data.length)
  for (let y = 0; y < imageData.height; y += 1) {
    for (let x = 0; x < imageData.width; x += 1) {
      const pixel = applyKernelAtPixel(source, x, y, safeKernel, { ...options, mode: 'correlation', normalize: false })
      const offset = (y * imageData.width + x) * 4
      output[offset] = clampPixel(pixel[0])
      output[offset + 1] = clampPixel(pixel[1])
      output[offset + 2] = clampPixel(pixel[2])
      output[offset + 3] = options.preserveAlpha ? imageData.data[offset + 3] : clampPixel(pixel[3])
    }
  }
  return makeImageData(output, imageData.width, imageData.height)
}

export function applyKernelAtPixel(imageData: ImageData, x: number, y: number, kernel: Kernel2D, options: ImageConvolutionOptions): [number, number, number, number] {
  const safeKernel = prepareKernel(kernel, options)
  const kernelHeight = safeKernel.length
  const kernelWidth = safeKernel[0]?.length ?? 0
  const centerY = Math.floor(kernelHeight / 2)
  const centerX = Math.floor(kernelWidth / 2)
  const total = [0, 0, 0, 0]
  for (let row = 0; row < kernelHeight; row += 1) {
    for (let column = 0; column < kernelWidth; column += 1) {
      const sample = getPixelWithBoundaryMode(imageData, x + column - centerX, y + row - centerY, options.boundaryMode)
      const weight = safeKernel[row][column]
      total[0] += sample[0] * weight
      total[1] += sample[1] * weight
      total[2] += sample[2] * weight
      total[3] += sample[3] * weight
    }
  }
  return [total[0], total[1], total[2], total[3]]
}

export function getPixelWithBoundaryMode(imageData: ImageData, x: number, y: number, boundaryMode: BoundaryMode): [number, number, number, number] {
  let sampleX = x
  let sampleY = y
  if (boundaryMode === 'zero' && (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height)) return [0, 0, 0, 0]
  if (boundaryMode === 'clamp') {
    sampleX = Math.max(0, Math.min(imageData.width - 1, x))
    sampleY = Math.max(0, Math.min(imageData.height - 1, y))
  }
  if (boundaryMode === 'wrap') {
    sampleX = wrap(x, imageData.width)
    sampleY = wrap(y, imageData.height)
  }
  if (sampleX < 0 || sampleY < 0 || sampleX >= imageData.width || sampleY >= imageData.height) return [0, 0, 0, 0]
  const offset = (sampleY * imageData.width + sampleX) * 4
  return [imageData.data[offset], imageData.data[offset + 1], imageData.data[offset + 2], imageData.data[offset + 3]]
}

export function clampPixel(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(255, Math.round(value)))
}

export function makeIdentityKernel3(): Kernel2D {
  return [
    [0, 0, 0],
    [0, 1, 0],
    [0, 0, 0],
  ]
}

export function makeBoxBlurKernel3(): Kernel2D {
  return normalizeKernel2D([
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ])
}

export function makeGaussianBlurKernel3(): Kernel2D {
  return normalizeKernel2D([
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1],
  ])
}

export function makeSharpenKernel3(): Kernel2D {
  return [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ]
}

export function makeEdgeDetectKernel3(): Kernel2D {
  return [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
  ]
}

export function makeEmbossKernel3(): Kernel2D {
  return [
    [-2, -1, 0],
    [-1, 1, 1],
    [0, 1, 2],
  ]
}

export function makeSobelXKernel3(): Kernel2D {
  return [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ]
}

export function makeSobelYKernel3(): Kernel2D {
  return [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ]
}

function prepareKernel(kernel: Kernel2D, options: ImageConvolutionOptions): Kernel2D {
  const safeKernel = validateKernel2D(kernel) ? kernel : makeIdentityKernel3()
  const oriented = options.mode === 'convolution' ? flipKernel2D(safeKernel) : safeKernel.map((row) => [...row])
  return options.normalize ? normalizeKernel2D(oriented) : oriented.map((row) => row.map(safeNumber))
}

function grayscaleImageData(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  for (let offset = 0; offset < data.length; offset += 4) {
    const luminance = Math.round(0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2])
    data[offset] = luminance
    data[offset + 1] = luminance
    data[offset + 2] = luminance
  }
  return makeImageData(data, imageData.width, imageData.height)
}

function makeImageData(data: Uint8ClampedArray, width: number, height: number): ImageData {
  if (typeof ImageData !== 'undefined') return new ImageData(data as ImageDataArray, width, height)
  return { data, width, height, colorSpace: 'srgb' } as ImageData
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0
}

function wrap(value: number, size: number): number {
  return ((value % size) + size) % size
}
