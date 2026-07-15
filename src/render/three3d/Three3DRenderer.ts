import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { applyMatrixToVector } from '../../math/matrix.ts'
import type { Matrix, ThemeSurfaceMode, ThreeCameraView } from '../../math/types.ts'
import type { ThreeRenderPayload } from '../RendererAdapter.ts'

type Point3 = [number, number, number]
export type ThreeLabelRole = 'basis' | 'user-vector'

export type ProjectedLabel = {
  id: string
  role: ThreeLabelRole
  anchorX: number
  anchorY: number
  width: number
  height: number
  order: number
}

export type ProjectedLabelPlacement = ProjectedLabel & {
  visible: boolean
  centerX: number
  centerY: number
}

type MutableArrow = {
  id: string
  role: ThreeLabelRole
  group: THREE.Group
  helper: THREE.ArrowHelper
  zeroDot: THREE.Mesh | null
  endpoint: THREE.Mesh | null
  label: THREE.Sprite
  labelAnchor: THREE.Vector3
  headLength: number
  headWidth: number
}

type SceneParts = {
  referenceGrid: THREE.GridHelper
  transformedGrid: THREE.LineSegments
  axes: THREE.LineSegments
  unitShape: THREE.LineSegments
  basis: MutableArrow[]
  vectors: MutableArrow[]
  outputPlane: THREE.Mesh | null
}

export function threeSceneStructureSignature(payload: ThreeRenderPayload): string {
  return JSON.stringify({
    inputDim: payload.inputDim,
    outputDim: payload.outputDim,
    surfaceMode: payload.theme.surfaceMode,
    colorPreset: payload.theme.colorPreset,
    colors: payload.theme.colors,
    vectors: payload.vectors
      .filter((vector) => vector.dim === payload.inputDim)
      .map((vector) => ({ id: vector.id, name: vector.name, dim: vector.dim, color: vector.color })),
  })
}

export class Three3DRenderer {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  private readonly controls: OrbitControls
  private readonly container: HTMLElement
  private readonly staticGroup = new THREE.Group()
  private readonly dynamicGroup = new THREE.Group()
  private readonly directionalLight = new THREE.DirectionalLight(0xffffff, 1.5)
  private readonly ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  private readonly handleControlsChange: () => void
  private width = 1
  private height = 1
  private cameraView: ThreeCameraView = 'free'
  private structureSignature = ''
  private parts: SceneParts | null = null
  private latestPayload: ThreeRenderPayload | null = null
  private suppressControlsRender = false

  constructor(container: HTMLElement) {
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.container.appendChild(this.renderer.domElement)
    this.camera.position.set(5, 4, 6)
    this.camera.lookAt(0, 0, 0)
    this.directionalLight.position.set(5, 6, 7)
    this.scene.add(this.directionalLight, this.ambientLight, this.staticGroup, this.dynamicGroup)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enableZoom = false
    this.handleControlsChange = () => {
      if (!this.suppressControlsRender) {
        this.layoutLabels()
        this.renderer.render(this.scene, this.camera)
      }
    }
    this.controls.addEventListener('change', this.handleControlsChange)
  }

  render(payload: ThreeRenderPayload, cameraView: ThreeCameraView = 'free'): void {
    this.latestPayload = payload
    this.resize()
    this.applyCameraView(cameraView)
    this.applyViewZoom(payload.viewZoom)

    const nextSignature = threeSceneStructureSignature(payload)
    if (nextSignature !== this.structureSignature || !this.parts) {
      this.rebuildScene(payload)
      this.structureSignature = nextSignature
    }

    this.updateVisibility(payload)
    this.updateDynamicGeometry(payload)
    this.suppressControlsRender = true
    this.controls.update()
    this.suppressControlsRender = false
    this.layoutLabels()
    this.renderer.render(this.scene, this.camera)
  }

  exportPng(): string {
    if (this.latestPayload) this.render(this.latestPayload, this.cameraView)
    return this.renderer.domElement.toDataURL('image/png')
  }

  resetCamera(): void {
    this.cameraView = 'free'
    this.controls.enabled = true
    this.camera.position.set(5, 4, 6)
    this.camera.up.set(0, 1, 0)
    this.camera.zoom = 1
    this.controls.target.set(0, 0, 0)
    this.suppressControlsRender = true
    this.controls.update()
    this.suppressControlsRender = false
    this.camera.lookAt(0, 0, 0)
    this.camera.updateProjectionMatrix()
    this.layoutLabels()
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.controls.removeEventListener('change', this.handleControlsChange)
    this.controls.dispose()
    disposeGroup(this.staticGroup)
    disposeGroup(this.dynamicGroup)
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private rebuildScene(payload: ThreeRenderPayload): void {
    disposeGroup(this.staticGroup)
    disposeGroup(this.dynamicGroup)

    this.scene.background = new THREE.Color(payload.theme.colors.background)
    this.directionalLight.intensity = payload.theme.surfaceMode === 'dark' ? 1.2 : 1.5
    this.ambientLight.intensity = payload.theme.surfaceMode === 'dark' ? 0.35 : 0.6

    const referenceGrid = new THREE.GridHelper(10, 10, payload.theme.colors.grid, payload.theme.colors.grid)
    referenceGrid.material.transparent = true
    referenceGrid.material.opacity = 0.45
    this.staticGroup.add(referenceGrid)

    const axes = lineSegments(
      [
        [-5, 0, 0],
        [5, 0, 0],
        [0, -5, 0],
        [0, 5, 0],
        [0, 0, -5],
        [0, 0, 5],
      ],
      payload.theme.colors.axis,
      0.9,
    )
    this.staticGroup.add(axes)

    let outputPlane: THREE.Mesh | null = null
    if (payload.inputDim === 3 && payload.outputDim === 2) {
      outputPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshBasicMaterial({
          color: payload.theme.colors.unitShape,
          transparent: true,
          opacity: 0.08,
          side: THREE.DoubleSide,
        }),
      )
      this.staticGroup.add(outputPlane)
    }

    const transformedGrid = lineSegments([], payload.theme.colors.transformedGrid, 0.5)
    const unitShape = lineSegments([], payload.theme.colors.unitShape, 0.95, 2)
    this.dynamicGroup.add(transformedGrid, unitShape)

    const basisColors = [payload.theme.colors.vectorI, payload.theme.colors.vectorJ, payload.theme.colors.vectorK]
    const basis = Array.from({ length: payload.inputDim }, (_, index) => {
      const mutable = createMutableArrow({
        id: `basis-${index}`,
        role: 'basis',
        color: basisColors[index],
        label: `T(${basisLabel(index)})`,
        surfaceMode: payload.theme.surfaceMode,
        emphasized: false,
        headLength: 0.18,
        headWidth: 0.1,
      })
      this.dynamicGroup.add(mutable.group)
      return mutable
    })

    const vectors = payload.vectors
      .filter((vector) => vector.dim === payload.inputDim)
      .map((vector) => {
        const mutable = createMutableArrow({
          id: `vector-${vector.id}`,
          role: 'user-vector',
          color: vector.color ?? payload.theme.colors.inputVector,
          label: `T(${vector.name})`,
          surfaceMode: payload.theme.surfaceMode,
          emphasized: true,
          headLength: 0.28,
          headWidth: 0.16,
        })
        this.dynamicGroup.add(mutable.group)
        return mutable
      })

    this.parts = { referenceGrid, transformedGrid, axes, unitShape, basis, vectors, outputPlane }
  }

  private updateVisibility(payload: ThreeRenderPayload): void {
    if (!this.parts) return
    this.parts.referenceGrid.visible = payload.options.showGrid
    this.parts.transformedGrid.visible = payload.options.showGrid
    this.parts.unitShape.visible = payload.options.showUnitShape
    this.parts.basis.forEach((item) => { item.group.visible = payload.options.showBasis })
    this.parts.vectors.forEach((item) => { item.group.visible = payload.options.showVectors })
  }

  private updateDynamicGeometry(payload: ThreeRenderPayload): void {
    if (!this.parts) return
    updateLineSegments(this.parts.transformedGrid, transformedGridPoints(payload))
    updateLineSegments(this.parts.unitShape, unitShapePoints(payload))

    this.parts.basis.forEach((item, index) => {
      const values = Array.from({ length: payload.inputDim }, (_, col) => (col === index ? 1 : 0))
      updateMutableArrow(item, transformPoint(payload.visualMatrix, values, payload.inputDim))
    })

    const visibleVectors = payload.vectors.filter((vector) => vector.dim === payload.inputDim)
    this.parts.vectors.forEach((item, index) => {
      const output = applyMatrixToVector(payload.visualMatrix, visibleVectors[index].values) as Point3
      updateMutableArrow(item, [output[0] ?? 0, output[1] ?? 0, output[2] ?? 0])
    })
  }

  private layoutLabels(): void {
    if (!this.parts || this.width <= 1 || this.height <= 1) return
    const arrows = [...this.parts.vectors, ...this.parts.basis].filter((arrow) => arrow.group.visible)
    const projectedLabels: ProjectedLabel[] = []
    const projectedAnchors = new Map<string, THREE.Vector3>()

    arrows.forEach((arrow, order) => {
      const projected = arrow.labelAnchor.clone().project(this.camera)
      if (!Number.isFinite(projected.x) || !Number.isFinite(projected.y) || projected.z < -1 || projected.z > 1) {
        arrow.label.visible = false
        return
      }
      const anchorX = (projected.x * 0.5 + 0.5) * this.width
      const anchorY = (-projected.y * 0.5 + 0.5) * this.height
      const size = projectedLabelSize(arrow, this.camera, this.height)
      projectedLabels.push({
        id: arrow.id,
        role: arrow.role,
        anchorX,
        anchorY,
        width: size.width,
        height: size.height,
        order,
      })
      projectedAnchors.set(arrow.id, projected)
    })

    const placements = resolveProjectedLabelLayout(projectedLabels, this.width, this.height)
    const placementById = new Map(placements.map((placement) => [placement.id, placement]))
    arrows.forEach((arrow) => {
      const placement = placementById.get(arrow.id)
      const projected = projectedAnchors.get(arrow.id)
      arrow.label.visible = Boolean(placement?.visible && projected)
      if (!placement?.visible || !projected) return
      projected.x = (placement.centerX / this.width) * 2 - 1
      projected.y = -((placement.centerY / this.height) * 2 - 1)
      arrow.label.position.copy(projected.unproject(this.camera))
    })
  }

  private resize(): void {
    const rect = this.container.getBoundingClientRect()
    const nextWidth = Math.max(1, Math.floor(rect.width))
    const nextHeight = Math.max(1, Math.floor(rect.height))
    if (nextWidth === this.width && nextHeight === this.height) return
    this.width = nextWidth
    this.height = nextHeight
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height, false)
  }

  private applyCameraView(cameraView: ThreeCameraView): void {
    if (cameraView === this.cameraView) {
      this.controls.enabled = cameraView === 'free'
      return
    }

    this.cameraView = cameraView
    this.controls.enabled = cameraView === 'free'
    if (cameraView === 'free') return

    const distance = 7
    const positions: Record<Exclude<ThreeCameraView, 'free'>, Point3> = {
      x: [distance, 0, 0],
      y: [0, distance, 0],
      z: [0, 0, distance],
    }
    this.camera.position.set(...positions[cameraView])
    this.camera.up.set(0, 1, 0)
    if (cameraView === 'y') this.camera.up.set(0, 0, 1)
    this.camera.lookAt(0, 0, 0)
    this.controls.target.set(0, 0, 0)
    this.camera.updateProjectionMatrix()
  }

  private applyViewZoom(viewZoom: number): void {
    const zoom = Math.max(0.25, Math.min(2.5, viewZoom))
    if (Math.abs(this.camera.zoom - zoom) < 1e-6) return
    this.camera.zoom = zoom
    this.camera.updateProjectionMatrix()
  }
}

function transformedGridPoints(payload: ThreeRenderPayload): Point3[] {
  const points: Point3[] = []
  for (let line = -4; line <= 4; line += 1) {
    for (let value = -4; value < 4; value += 0.5) {
      points.push(transformPoint(payload.visualMatrix, [value, line, 0], payload.inputDim))
      points.push(transformPoint(payload.visualMatrix, [value + 0.5, line, 0], payload.inputDim))
      points.push(transformPoint(payload.visualMatrix, [line, value, 0], payload.inputDim))
      points.push(transformPoint(payload.visualMatrix, [line, value + 0.5, 0], payload.inputDim))
    }
  }
  return points
}

function unitShapePoints(payload: ThreeRenderPayload): Point3[] {
  const corners = payload.inputDim === 3 ? unitCubeCorners() : unitSquareCorners()
  const edges = payload.inputDim === 3 ? cubeEdges() : squareEdges()
  const points: Point3[] = []
  edges.forEach(([a, b]) => {
    points.push(transformPoint(payload.visualMatrix, corners[a], payload.inputDim))
    points.push(transformPoint(payload.visualMatrix, corners[b], payload.inputDim))
  })
  return points
}

function transformPoint(matrix: Matrix, values: number[], inputDim: number): Point3 {
  const output = applyMatrixToVector(matrix, values.slice(0, inputDim))
  return [output[0] ?? 0, output[1] ?? 0, output[2] ?? 0]
}

function createMutableArrow({
  id,
  role,
  color,
  label,
  surfaceMode,
  emphasized,
  headLength,
  headWidth,
}: {
  id: string
  role: ThreeLabelRole
  color: string
  label: string
  surfaceMode: ThemeSurfaceMode
  emphasized: boolean
  headLength: number
  headWidth: number
}): MutableArrow {
  const group = new THREE.Group()
  const helper = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    1,
    color,
    headLength,
    headWidth,
  )
  group.add(helper)

  const zeroDot = emphasized
    ? null
    : new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshBasicMaterial({ color }))
  if (zeroDot) group.add(zeroDot)

  const endpoint = emphasized
    ? new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 18, 18),
        new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false }),
      )
    : null
  if (endpoint) {
    endpoint.renderOrder = 21
    group.add(endpoint)
  }

  const labelSprite = vectorLabel(label, color, surfaceMode, role)
  labelSprite.renderOrder = emphasized ? 22 : 20
  group.add(labelSprite)
  if (emphasized) keepVisible(group)

  return {
    id,
    role,
    group,
    helper,
    zeroDot,
    endpoint,
    label: labelSprite,
    labelAnchor: new THREE.Vector3(),
    headLength,
    headWidth,
  }
}

function updateMutableArrow(arrow: MutableArrow, end: Point3): void {
  const vector = new THREE.Vector3(...end)
  const length = vector.length()
  const hasLength = length >= 1e-6
  arrow.helper.visible = hasLength
  if (hasLength) {
    arrow.helper.setDirection(vector.clone().normalize())
    arrow.helper.setLength(length, arrow.headLength, arrow.headWidth)
  }
  if (arrow.zeroDot) arrow.zeroDot.visible = !hasLength
  if (arrow.endpoint) arrow.endpoint.position.copy(vector)
  arrow.labelAnchor.copy(labelAnchorPosition(vector))
  arrow.label.position.copy(arrow.labelAnchor)
}

function vectorLabel(text: string, color: string, surfaceMode: ThemeSurfaceMode, role: ThreeLabelRole): THREE.Sprite {
  const isUserVector = role === 'user-vector'
  const paddingX = isUserVector ? 18 : 14
  const font = `${isUserVector ? 600 : 550} ${isUserVector ? 28 : 24}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return new THREE.Sprite()
  context.font = font
  const metrics = context.measureText(text)
  const width = Math.ceil(metrics.width + paddingX * 2)
  const height = isUserVector ? 48 : 42
  canvas.width = width
  canvas.height = height
  context.font = font
  context.textBaseline = 'middle'
  context.fillStyle = surfaceMode === 'dark'
    ? `rgba(13, 20, 28, ${isUserVector ? 0.84 : 0.68})`
    : `rgba(248, 250, 252, ${isUserVector ? 0.88 : 0.72})`
  drawRoundedRect(context, 0, 0, width, height, 12)
  context.fill()
  context.strokeStyle = color
  context.globalAlpha = isUserVector ? 0.76 : 0.48
  context.lineWidth = isUserVector ? 3 : 2
  drawRoundedRect(context, 1.5, 1.5, width - 3, height - 3, 10)
  context.stroke()
  context.globalAlpha = 1
  context.fillStyle = color
  context.fillText(text, paddingX, height / 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: isUserVector ? 1 : 0.84,
    depthTest: false,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(material)
  const labelHeight = isUserVector ? 0.28 : 0.22
  sprite.scale.set((labelHeight * width) / height, labelHeight, 1)
  sprite.renderOrder = 20
  return sprite
}

function labelAnchorPosition(vector: THREE.Vector3): THREE.Vector3 {
  if (vector.length() < 1e-6) return new THREE.Vector3(0.08, 0.08, 0.08)
  const direction = vector.clone().normalize()
  return vector.clone().add(direction.multiplyScalar(0.12))
}

function projectedLabelSize(arrow: MutableArrow, camera: THREE.PerspectiveCamera, viewportHeight: number): { width: number; height: number } {
  const distance = Math.max(0.5, camera.position.distanceTo(arrow.labelAnchor))
  const fovRadians = THREE.MathUtils.degToRad(camera.fov)
  const projectedHeight = (arrow.label.scale.y * viewportHeight * camera.zoom) / (2 * Math.tan(fovRadians / 2) * distance)
  const minHeight = arrow.role === 'user-vector' ? 24 : 19
  const maxHeight = arrow.role === 'user-vector' ? 42 : 32
  const height = Math.max(minHeight, Math.min(maxHeight, projectedHeight))
  const aspect = arrow.label.scale.y > 0 ? arrow.label.scale.x / arrow.label.scale.y : 2
  return { width: height * aspect, height }
}

export function resolveProjectedLabelLayout(
  labels: ProjectedLabel[],
  viewportWidth: number,
  viewportHeight: number,
): ProjectedLabelPlacement[] {
  const viewportPadding = 6
  const collisionPadding = 4
  const placedBoxes: LabelBox[] = []
  const placements = new Map<string, ProjectedLabelPlacement>()
  const sorted = [...labels].sort((left, right) => {
    if (left.role !== right.role) return left.role === 'user-vector' ? -1 : 1
    return left.order - right.order
  })

  sorted.forEach((label) => {
    const candidates = labelPlacementCandidates(label)
    const validCandidates = candidates
      .map(({ centerX, centerY }) => labelBox(label, centerX, centerY))
      .filter((box) => isInsideViewport(box, viewportWidth, viewportHeight, viewportPadding))
    const collisionFree = validCandidates.find((box) => placedBoxes.every((placed) => !boxesOverlap(box, placed, collisionPadding)))
    const bestUserFallback = label.role === 'user-vector'
      ? validCandidates.reduce<LabelBox | null>((best, box) => {
          if (!best) return box
          return overlapArea(box, placedBoxes) < overlapArea(best, placedBoxes) ? box : best
        }, null) ?? clampLabelBox(
          labelBox(label, candidates[0].centerX, candidates[0].centerY),
          viewportWidth,
          viewportHeight,
          viewportPadding,
        )
      : null
    const selected = collisionFree ?? bestUserFallback
    if (!selected) {
      placements.set(label.id, { ...label, visible: false, centerX: label.anchorX, centerY: label.anchorY })
      return
    }
    placedBoxes.push(selected)
    placements.set(label.id, { ...label, visible: true, centerX: selected.centerX, centerY: selected.centerY })
  })

  return labels.map((label) => placements.get(label.id) ?? {
    ...label,
    visible: false,
    centerX: label.anchorX,
    centerY: label.anchorY,
  })
}

type LabelBox = {
  centerX: number
  centerY: number
  left: number
  right: number
  top: number
  bottom: number
}

function labelPlacementCandidates(label: ProjectedLabel): Array<{ centerX: number; centerY: number }> {
  const gap = label.role === 'user-vector' ? 11 : 8
  const horizontal = label.width / 2 + gap
  const vertical = label.height / 2 + gap
  const candidates = [
    { centerX: label.anchorX + horizontal, centerY: label.anchorY - vertical },
    { centerX: label.anchorX + horizontal, centerY: label.anchorY + vertical },
    { centerX: label.anchorX - horizontal, centerY: label.anchorY - vertical },
    { centerX: label.anchorX - horizontal, centerY: label.anchorY + vertical },
    { centerX: label.anchorX, centerY: label.anchorY - vertical },
    { centerX: label.anchorX, centerY: label.anchorY + vertical },
  ]
  const rotation = Math.abs(label.order) % candidates.length
  return [...candidates.slice(rotation), ...candidates.slice(0, rotation)]
}

function labelBox(label: ProjectedLabel, centerX: number, centerY: number): LabelBox {
  return {
    centerX,
    centerY,
    left: centerX - label.width / 2,
    right: centerX + label.width / 2,
    top: centerY - label.height / 2,
    bottom: centerY + label.height / 2,
  }
}

function isInsideViewport(box: LabelBox, width: number, height: number, padding: number): boolean {
  return box.left >= padding && box.right <= width - padding && box.top >= padding && box.bottom <= height - padding
}

function clampLabelBox(box: LabelBox, width: number, height: number, padding: number): LabelBox {
  const boxWidth = box.right - box.left
  const boxHeight = box.bottom - box.top
  const centerX = Math.max(padding + boxWidth / 2, Math.min(width - padding - boxWidth / 2, box.centerX))
  const centerY = Math.max(padding + boxHeight / 2, Math.min(height - padding - boxHeight / 2, box.centerY))
  return {
    centerX,
    centerY,
    left: centerX - boxWidth / 2,
    right: centerX + boxWidth / 2,
    top: centerY - boxHeight / 2,
    bottom: centerY + boxHeight / 2,
  }
}

function boxesOverlap(left: LabelBox, right: LabelBox, padding: number): boolean {
  return !(
    left.right + padding <= right.left
    || left.left >= right.right + padding
    || left.bottom + padding <= right.top
    || left.top >= right.bottom + padding
  )
}

function overlapArea(box: LabelBox, placedBoxes: LabelBox[]): number {
  return placedBoxes.reduce((total, placed) => {
    const width = Math.max(0, Math.min(box.right, placed.right) - Math.max(box.left, placed.left))
    const height = Math.max(0, Math.min(box.bottom, placed.bottom) - Math.max(box.top, placed.top))
    return total + width * height
  }, 0)
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const boundedRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + boundedRadius, y)
  context.lineTo(x + width - boundedRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + boundedRadius)
  context.lineTo(x + width, y + height - boundedRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - boundedRadius, y + height)
  context.lineTo(x + boundedRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - boundedRadius)
  context.lineTo(x, y + boundedRadius)
  context.quadraticCurveTo(x, y, x + boundedRadius, y)
  context.closePath()
}

function keepVisible(object: THREE.Object3D): void {
  object.traverse((child) => {
    child.renderOrder = Math.max(child.renderOrder, 20)
    const material = (child as THREE.Mesh | THREE.Line).material
    if (!material) return
    const materials = Array.isArray(material) ? material : [material]
    materials.forEach((item) => {
      item.depthTest = false
      item.depthWrite = false
    })
  })
}

function lineSegments(points: Point3[], color: string, opacity: number, lineWidth = 1): THREE.LineSegments {
  const geometry = new THREE.BufferGeometry()
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, linewidth: lineWidth })
  const line = new THREE.LineSegments(geometry, material)
  updateLineSegments(line, points)
  return line
}

export function updateLineSegments(line: THREE.LineSegments, points: Point3[]): void {
  const requiredLength = points.length * 3
  const current = line.geometry.getAttribute('position') as THREE.BufferAttribute | undefined
  let attribute = current
  if (!attribute || attribute.array.length !== requiredLength) {
    attribute = new THREE.Float32BufferAttribute(new Float32Array(requiredLength), 3)
    line.geometry.setAttribute('position', attribute)
  }
  const values = attribute.array as Float32Array
  points.forEach((point, index) => {
    const offset = index * 3
    values[offset] = point[0]
    values[offset + 1] = point[1]
    values[offset + 2] = point[2]
  })
  attribute.needsUpdate = true
  if (points.length > 0) line.geometry.computeBoundingSphere()
}

function disposeGroup(group: THREE.Group): void {
  const children = [...group.children]
  children.forEach((child) => {
    child.traverse((object) => {
      const mesh = object as THREE.Object3D & {
        geometry?: THREE.BufferGeometry
        material?: THREE.Material | THREE.Material[]
      }
      mesh.geometry?.dispose()
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : []
      materials.forEach((material) => {
        const mappedMaterial = material as THREE.Material & { map?: THREE.Texture }
        mappedMaterial.map?.dispose()
        material.dispose()
      })
    })
    group.remove(child)
  })
}

function unitCubeCorners(): Point3[] {
  return [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1],
  ]
}

function unitSquareCorners(): Point3[] {
  return [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
  ]
}

function cubeEdges(): Array<[number, number]> {
  return [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ]
}

function squareEdges(): Array<[number, number]> {
  return [[0, 1], [1, 2], [2, 3], [3, 0]]
}

function basisLabel(index: number): string {
  return ['i', 'j', 'k'][index] ?? `e${index + 1}`
}
