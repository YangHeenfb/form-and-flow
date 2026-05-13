import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { applyMatrixToVector } from '../../math/matrix.ts'
import type { Matrix, ThreeCameraView } from '../../math/types.ts'
import type { ThreeRenderPayload } from '../RendererAdapter.ts'

type Point3 = [number, number, number]

export class Three3DRenderer {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  private readonly controls: OrbitControls
  private readonly container: HTMLElement
  private width = 1
  private height = 1
  private cameraView: ThreeCameraView = 'free'

  constructor(container: HTMLElement) {
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.container.appendChild(this.renderer.domElement)
    this.camera.position.set(5, 4, 6)
    this.camera.lookAt(0, 0, 0)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enableZoom = false
    this.controls.addEventListener('change', () => this.renderer.render(this.scene, this.camera))
  }

  render(payload: ThreeRenderPayload, cameraView: ThreeCameraView = 'free'): void {
    this.resize()
    this.applyCameraView(cameraView)
    this.applyViewZoom(payload.viewZoom)
    this.scene.clear()
    this.scene.background = new THREE.Color(payload.theme.surfaceMode === 'dark' ? '#0d141c' : '#f8fafc')

    const light = new THREE.DirectionalLight(0xffffff, payload.theme.surfaceMode === 'dark' ? 1.2 : 1.5)
    light.position.set(5, 6, 7)
    this.scene.add(light)
    this.scene.add(new THREE.AmbientLight(0xffffff, payload.theme.surfaceMode === 'dark' ? 0.35 : 0.6))

    if (payload.options.showGrid) {
      this.addReferenceGrid(payload)
      this.addTransformedGrid(payload)
    }

    this.addAxes(payload)

    if (payload.options.showUnitShape) {
      this.addUnitShape(payload)
    }
    if (payload.options.showBasis) {
      this.addBasis(payload)
    }
    if (payload.options.showVectors) {
      this.addVectors(payload)
    }

    if (payload.inputDim === 3 && payload.outputDim === 2) {
      this.addOutputPlane(payload)
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  exportPng(): string {
    return this.renderer.domElement.toDataURL('image/png')
  }

  resetCamera(): void {
    this.cameraView = 'free'
    this.controls.enabled = true
    this.camera.position.set(5, 4, 6)
    this.camera.up.set(0, 1, 0)
    this.camera.zoom = 1
    this.controls.target.set(0, 0, 0)
    this.controls.update()
    this.camera.lookAt(0, 0, 0)
    this.camera.updateProjectionMatrix()
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.controls.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private resize(): void {
    const rect = this.container.getBoundingClientRect()
    const nextWidth = Math.max(1, Math.floor(rect.width))
    const nextHeight = Math.max(1, Math.floor(rect.height))
    if (nextWidth === this.width && nextHeight === this.height) {
      return
    }
    this.width = nextWidth
    this.height = nextHeight
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height, false)
  }

  private applyCameraView(cameraView: ThreeCameraView): void {
    if (cameraView === this.cameraView && cameraView === 'free') {
      this.controls.enabled = true
      return
    }

    this.cameraView = cameraView
    this.controls.enabled = cameraView === 'free'
    if (cameraView === 'free') {
      return
    }

    const distance = 7
    const positions: Record<Exclude<ThreeCameraView, 'free'>, Point3> = {
      x: [distance, 0, 0],
      y: [0, distance, 0],
      z: [0, 0, distance],
    }
    this.camera.position.set(...positions[cameraView])
    this.camera.up.set(0, 1, 0)
    if (cameraView === 'y') {
      this.camera.up.set(0, 0, 1)
    }
    this.camera.lookAt(0, 0, 0)
    this.controls.target.set(0, 0, 0)
    this.camera.updateProjectionMatrix()
  }

  private applyViewZoom(viewZoom: number): void {
    const zoom = Math.max(0.25, Math.min(2.5, viewZoom))
    if (Math.abs(this.camera.zoom - zoom) < 1e-6) {
      return
    }
    this.camera.zoom = zoom
    this.camera.updateProjectionMatrix()
  }

  private addReferenceGrid(payload: ThreeRenderPayload): void {
    const grid = new THREE.GridHelper(10, 10, payload.theme.colors.grid, payload.theme.colors.grid)
    grid.material.transparent = true
    grid.material.opacity = 0.45
    this.scene.add(grid)
  }

  private addTransformedGrid(payload: ThreeRenderPayload): void {
    const points: Point3[] = []
    for (let line = -4; line <= 4; line += 1) {
      for (let value = -4; value < 4; value += 0.5) {
        points.push(transformPoint(payload.visualMatrix, [value, line, 0], payload.inputDim))
        points.push(transformPoint(payload.visualMatrix, [value + 0.5, line, 0], payload.inputDim))
        points.push(transformPoint(payload.visualMatrix, [line, value, 0], payload.inputDim))
        points.push(transformPoint(payload.visualMatrix, [line, value + 0.5, 0], payload.inputDim))
      }
    }
    this.scene.add(lineSegments(points, payload.theme.colors.transformedGrid, 0.5))
  }

  private addAxes(payload: ThreeRenderPayload): void {
    const axisColor = payload.theme.colors.axis
    const points: Point3[] = [
      [-5, 0, 0],
      [5, 0, 0],
      [0, -5, 0],
      [0, 5, 0],
      [0, 0, -5],
      [0, 0, 5],
    ]
    this.scene.add(lineSegments(points, axisColor, 0.9))
  }

  private addOutputPlane(payload: ThreeRenderPayload): void {
    const geometry = new THREE.PlaneGeometry(6, 6)
    const material = new THREE.MeshBasicMaterial({
      color: payload.theme.colors.unitShape,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    })
    const plane = new THREE.Mesh(geometry, material)
    this.scene.add(plane)
  }

  private addUnitShape(payload: ThreeRenderPayload): void {
    const corners = payload.inputDim === 3 ? unitCubeCorners() : unitSquareCorners()
    const edges = payload.inputDim === 3 ? cubeEdges() : squareEdges()
    const points: Point3[] = []
    edges.forEach(([a, b]) => {
      points.push(transformPoint(payload.visualMatrix, corners[a], payload.inputDim))
      points.push(transformPoint(payload.visualMatrix, corners[b], payload.inputDim))
    })
    this.scene.add(lineSegments(points, payload.theme.colors.unitShape, 0.95, 2))
  }

  private addBasis(payload: ThreeRenderPayload): void {
    const colors = [payload.theme.colors.vectorI, payload.theme.colors.vectorJ, payload.theme.colors.vectorK]
    for (let index = 0; index < payload.inputDim; index += 1) {
      const values = Array.from({ length: payload.inputDim }, (_, col) => (col === index ? 1 : 0))
      const end = transformPoint(payload.visualMatrix, values, payload.inputDim)
      this.scene.add(arrow(end, colors[index], `basis-${index}`))
    }
  }

  private addVectors(payload: ThreeRenderPayload): void {
    payload.vectors
      .filter((vector) => vector.dim === payload.inputDim)
      .forEach((vector) => {
        const output = applyMatrixToVector(payload.visualMatrix, vector.values) as Point3
        this.scene.add(arrow(output, vector.color ?? payload.theme.colors.inputVector, vector.name))
      })
  }
}

function transformPoint(matrix: Matrix, values: number[], inputDim: number): Point3 {
  const output = applyMatrixToVector(matrix, values.slice(0, inputDim))
  return [output[0] ?? 0, output[1] ?? 0, output[2] ?? 0]
}

function arrow(end: Point3, color: string, name: string): THREE.Object3D {
  const vector = new THREE.Vector3(...end)
  const length = vector.length()
  if (length < 1e-6) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 16),
      new THREE.MeshBasicMaterial({ color }),
    )
    dot.name = name
    return dot
  }
  const helper = new THREE.ArrowHelper(vector.clone().normalize(), new THREE.Vector3(0, 0, 0), length, color, 0.18, 0.1)
  helper.name = name
  return helper
}

function lineSegments(points: Point3[], color: string, opacity: number, lineWidth = 1): THREE.LineSegments {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point)))
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, linewidth: lineWidth })
  return new THREE.LineSegments(geometry, material)
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
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ]
}

function squareEdges(): Array<[number, number]> {
  return [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ]
}
