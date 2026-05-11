import {
  applyMatrixToVector,
  canonicalBridgeMatrix,
  getBasisVectors,
  lerpMatrix,
  matrixShape,
} from '../../math/matrix.ts'
import type { Matrix } from '../../math/types.ts'
import type { RenderPayload } from '../RendererAdapter.ts'

type Point2 = [number, number]

export class Canvas2DRenderer {
  render(canvas: HTMLCanvasElement, payload: RenderPayload): void {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const devicePixelRatio = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.floor(rect.width * devicePixelRatio))
    canvas.height = Math.max(1, Math.floor(rect.height * devicePixelRatio))
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

    const width = rect.width
    const height = rect.height
    const scale = (Math.min(width, height) / 9) * payload.viewZoom
    const center: Point2 = [width / 2 + payload.viewPan.x, height / 2 + payload.viewPan.y]

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = payload.theme.surfaceMode === 'dark' ? '#0d141c' : '#f8fafc'
    ctx.fillRect(0, 0, width, height)

    if (payload.inputDim === 2 && payload.outputDim === 2) {
      this.renderR2ToR2(ctx, payload, center, scale)
    } else if (payload.outputDim === 2) {
      this.renderOutputPlane(ctx, payload, center, scale)
    }
  }

  private renderR2ToR2(
    ctx: CanvasRenderingContext2D,
    payload: RenderPayload,
    center: Point2,
    scale: number,
  ): void {
    const toScreen = createProjector(center, scale)
    const { matrix, options, theme } = payload

    if (options.showGrid) {
      drawGrid(ctx, toScreen, theme.colors.grid, 0.45)
      drawTransformedGrid(ctx, matrix, toScreen, theme.colors.transformedGrid)
    }

    drawAxes(ctx, toScreen, theme.colors.axis)

    if (options.showUnitShape) {
      drawPolygon(
        ctx,
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ].map((point) => applyMatrixToVector(matrix, point) as Point2),
        toScreen,
        theme.colors.unitShape,
      )
    }

    if (options.showBasis) {
      const basis = getBasisVectors(matrix)
      drawArrow(ctx, [0, 0], basis[0] as Point2, toScreen, theme.colors.vectorI, 'T(i)')
      drawArrow(ctx, [0, 0], basis[1] as Point2, toScreen, theme.colors.vectorJ, 'T(j)')
    }

    if (options.showVectors) {
      drawVectors(ctx, payload, toScreen)
    }
  }

  private renderOutputPlane(
    ctx: CanvasRenderingContext2D,
    payload: RenderPayload,
    center: Point2,
    scale: number,
  ): void {
    const toScreen = createProjector(center, scale)
    const { matrix, options, theme } = payload

    if (options.showGrid) {
      drawGrid(ctx, toScreen, theme.colors.grid, 0.55)
    }
    drawAxes(ctx, toScreen, theme.colors.axis)

    if (options.showBasis) {
      const basis = getBasisVectors(matrix)
      const colors = [theme.colors.vectorI, theme.colors.vectorJ, theme.colors.vectorK]
      basis.forEach((basisVector, index) => {
        drawArrow(ctx, [0, 0], basisVector as Point2, toScreen, colors[index], `T(${basisLabel(index)})`)
      })
    }

    if (options.showVectors) {
      drawVectors(ctx, payload, toScreen)
    }
  }
}

function drawVectors(
  ctx: CanvasRenderingContext2D,
  payload: RenderPayload,
  toScreen: (point: Point2) => Point2,
): void {
  const { inputDim, matrix, options, vectors, theme } = payload
  vectors
    .filter((vector) => vector.dim === inputDim)
    .forEach((vector) => {
      const transformed = applyMatrixToVector(matrix, vector.values) as Point2
      if (options.showTrails && matrixShape(matrix).rows === 2) {
        const bridge = canonicalBridgeMatrix(2, inputDim)
        const samples = Array.from({ length: 18 }, (_, index) => index / 17)
        const points = samples.map((sample) => applyMatrixToVector(lerpMatrix(bridge, matrix, sample), vector.values) as Point2)
        drawPolyline(ctx, points, toScreen, vector.color ?? theme.colors.inputVector, 0.3)
      }
      drawArrow(ctx, [0, 0], transformed, toScreen, vector.color ?? theme.colors.inputVector, `T(${vector.name})`)
    })
}

function drawTransformedGrid(
  ctx: CanvasRenderingContext2D,
  matrix: Matrix,
  toScreen: (point: Point2) => Point2,
  color: string,
): void {
  for (let line = -5; line <= 5; line += 1) {
    const horizontal: Point2[] = []
    const vertical: Point2[] = []
    for (let value = -5; value <= 5; value += 0.25) {
      horizontal.push(applyMatrixToVector(matrix, [value, line]) as Point2)
      vertical.push(applyMatrixToVector(matrix, [line, value]) as Point2)
    }
    drawPolyline(ctx, horizontal, toScreen, color, line === 0 ? 0.55 : 0.35)
    drawPolyline(ctx, vertical, toScreen, color, line === 0 ? 0.55 : 0.35)
  }
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  toScreen: (point: Point2) => Point2,
  color: string,
  alpha: number,
): void {
  ctx.save()
  ctx.strokeStyle = color
  ctx.globalAlpha = alpha
  ctx.lineWidth = 1
  ctx.setLineDash([4, 6])
  for (let line = -5; line <= 5; line += 1) {
    drawLine(ctx, [-5, line], [5, line], toScreen)
    drawLine(ctx, [line, -5], [line, 5], toScreen)
  }
  ctx.restore()
}

function drawAxes(ctx: CanvasRenderingContext2D, toScreen: (point: Point2) => Point2, color: string): void {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1.5
  ctx.setLineDash([])
  drawLine(ctx, [-5, 0], [5, 0], toScreen)
  drawLine(ctx, [0, -5], [0, 5], toScreen)
  ctx.font = '13px system-ui'
  ctx.fillText('x', ...toScreen([5.12, -0.25]))
  ctx.fillText('y', ...toScreen([0.18, 5.12]))
  ctx.restore()
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Point2[],
  toScreen: (point: Point2) => Point2,
  color: string,
): void {
  ctx.save()
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.2
  ctx.beginPath()
  points.forEach((point, index) => {
    const [x, y] = toScreen(point)
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 0.75
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  start: Point2,
  end: Point2,
  toScreen: (point: Point2) => Point2,
  color: string,
  label: string,
): void {
  const [sx, sy] = toScreen(start)
  const [ex, ey] = toScreen(end)
  const angle = Math.atan2(ey - sy, ex - sx)
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2.5
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.lineTo(ex, ey)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(ex, ey)
  ctx.lineTo(ex - 10 * Math.cos(angle - Math.PI / 7), ey - 10 * Math.sin(angle - Math.PI / 7))
  ctx.lineTo(ex - 10 * Math.cos(angle + Math.PI / 7), ey - 10 * Math.sin(angle + Math.PI / 7))
  ctx.closePath()
  ctx.fill()
  ctx.font = '600 13px system-ui'
  ctx.fillText(label, ex + 8, ey - 8)
  ctx.restore()
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  from: Point2,
  to: Point2,
  project: (point: Point2) => Point2,
): void {
  const [x1, y1] = project(from)
  const [x2, y2] = project(to)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  points: Point2[],
  project: (point: Point2) => Point2,
  color: string,
  alpha: number,
): void {
  if (points.length < 2) {
    return
  }
  ctx.save()
  ctx.strokeStyle = color
  ctx.globalAlpha = alpha
  ctx.lineWidth = 1.2
  ctx.beginPath()
  points.forEach((point, index) => {
    const [x, y] = project(point)
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.stroke()
  ctx.restore()
}

function createProjector(center: Point2, scale: number): (point: Point2) => Point2 {
  return ([x, y]) => [center[0] + x * scale, center[1] - y * scale]
}

function basisLabel(index: number): string {
  return ['i', 'j', 'k'][index] ?? `e${index + 1}`
}
