import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { ThreeRenderPayload } from '../render/RendererAdapter.ts'
import {
  resolveProjectedLabelLayout,
  threeSceneStructureSignature,
  updateLineSegments,
  type ProjectedLabel,
} from '../render/three3d/Three3DRenderer.ts'
import { neutralLightTheme } from '../state/useThemeState.ts'

function payload(): ThreeRenderPayload {
  return {
    matrix: [[2, 0, 0], [0, 1, 0], [0, 0, 1]],
    visualMatrix: [[2, 0, 0], [0, 1, 0], [0, 0, 1]],
    inputDim: 3,
    outputDim: 3,
    vectors: [{ id: 'v1', name: 'v1', dim: 3, values: [1, 2, 3], color: '#ff00ff' }],
    options: { showGrid: true, showBasis: true, showUnitShape: true, showVectors: true, showTrails: true },
    theme: neutralLightTheme,
    viewZoom: 1,
    viewPan: { x: 0, y: 0 },
  }
}

describe('Three3DRenderer incremental scene contract', () => {
  it('keeps the scene structure stable across animation-only changes', () => {
    const initial = payload()
    const frame = {
      ...initial,
      matrix: [[1.25, 0, 0], [0, 1, 0], [0, 0, 1]],
      visualMatrix: [[1.25, 0, 0], [0, 1, 0], [0, 0, 1]],
      vectors: [{ ...initial.vectors[0], values: [3, 2, 1] }],
      options: { ...initial.options, showGrid: false },
    }
    expect(threeSceneStructureSignature(frame)).toBe(threeSceneStructureSignature(initial))
    expect(threeSceneStructureSignature({ ...frame, outputDim: 2 })).not.toBe(threeSceneStructureSignature(initial))
    expect(threeSceneStructureSignature({ ...frame, vectors: [{ ...frame.vectors[0], name: 'renamed' }] })).not.toBe(threeSceneStructureSignature(initial))
  })

  it('updates an existing position buffer when point count is unchanged', () => {
    const line = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial())
    updateLineSegments(line, [[0, 0, 0], [1, 0, 0]])
    const firstAttribute = line.geometry.getAttribute('position')
    updateLineSegments(line, [[0, 0, 0], [2, 0, 0]])
    const secondAttribute = line.geometry.getAttribute('position')

    expect(secondAttribute).toBe(firstAttribute)
    expect(Array.from(secondAttribute.array)).toEqual([0, 0, 0, 2, 0, 0])
  })

  it('prioritizes user-vector labels and hides a basis label when no collision-free placement exists', () => {
    const labels: ProjectedLabel[] = [
      { id: 'basis-i', role: 'basis', anchorX: 50, anchorY: 50, width: 82, height: 28, order: 1 },
      { id: 'vector-v1', role: 'user-vector', anchorX: 50, anchorY: 50, width: 82, height: 28, order: 0 },
    ]
    const first = resolveProjectedLabelLayout(labels, 112, 74)
    const second = resolveProjectedLabelLayout(labels, 112, 74)

    expect(first).toEqual(second)
    expect(first.find((label) => label.id === 'vector-v1')?.visible).toBe(true)
    expect(first.find((label) => label.id === 'basis-i')?.visible).toBe(false)
  })

  it('keeps separated user-vector and basis labels visible', () => {
    const labels: ProjectedLabel[] = [
      { id: 'vector-v1', role: 'user-vector', anchorX: 90, anchorY: 90, width: 60, height: 24, order: 0 },
      { id: 'basis-i', role: 'basis', anchorX: 250, anchorY: 180, width: 52, height: 20, order: 1 },
    ]
    const placements = resolveProjectedLabelLayout(labels, 360, 260)
    expect(placements.every((label) => label.visible)).toBe(true)
  })
})
