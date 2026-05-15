import { useCallback, useMemo, useState } from 'react'
import { canonicalBridgeMatrix, validateMapSequence } from '../math/matrix.ts'
import { presets2d } from '../math/presets2d.ts'
import { presets3d, presetsR2ToR3, presetsR3ToR2 } from '../math/presets3d.ts'
import type { LinearMap, MapKind, SpaceDim, VectorState, ViewOptions } from '../math/types.ts'
import { resizeVector } from '../math/vector.ts'

function id(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
}

export function mapKindFromDims(inputDim: SpaceDim, outputDim: SpaceDim): MapKind {
  return `${inputDim}-${outputDim}` as MapKind
}

export function dimsFromMapKind(kind: MapKind): { inputDim: SpaceDim; outputDim: SpaceDim } {
  const [inputRaw, outputRaw] = kind.split('-').map(Number)
  return { inputDim: inputRaw as SpaceDim, outputDim: outputRaw as SpaceDim }
}

export function createMap(inputDim: SpaceDim, outputDim: SpaceDim, name = 'A'): LinearMap {
  return {
    id: id('map'),
    name,
    inputDim,
    outputDim,
    matrix: canonicalBridgeMatrix(outputDim, inputDim),
  }
}

function clonePreset(preset: LinearMap, name: string): LinearMap {
  return {
    ...preset,
    id: id('map'),
    name,
    matrix: preset.matrix.map((row) => [...row]),
  }
}

function defaultVectors(dim: SpaceDim): VectorState[] {
  return [
    {
      id: id('vector'),
      name: 'v1',
      dim,
      values: dim === 2 ? [2, 1] : [1.5, 1, 1],
      color: '#c88cff',
    },
    {
      id: id('vector'),
      name: 'v2',
      dim,
      values: dim === 2 ? [-1, 2] : [-1, 1.25, 1.5],
      color: '#9adf8f',
    },
  ]
}

const defaultViewOptions: ViewOptions = {
  showGrid: true,
  showBasis: true,
  showUnitShape: true,
  showVectors: true,
  showTrails: true,
}

export function useAppState() {
  const [maps, setMaps] = useState<LinearMap[]>(() => [clonePreset(presets2d[0], 'A1')])
  const [vectors, setVectors] = useState<VectorState[]>(() => defaultVectors(2))
  const [viewOptions, setViewOptions] = useState<ViewOptions>(defaultViewOptions)

  const validation = useMemo(() => validateMapSequence(maps), [maps])
  const inputDim = maps[0]?.inputDim ?? 2
  const outputDim = maps.at(-1)?.outputDim ?? inputDim
  const mapKind = mapKindFromDims(inputDim, outputDim)

  const setMapKind = useCallback((kind: MapKind) => {
    const dims = dimsFromMapKind(kind)
    const source =
      kind === '2-2'
        ? presets2d[0]
        : kind === '3-3'
          ? presets3d[0]
          : kind === '3-2'
            ? presetsR3ToR2[0]
            : presetsR2ToR3[0]
    setMaps([clonePreset(source, 'A1')])
    setVectors(defaultVectors(dims.inputDim))
  }, [])

  const updateMap = useCallback((mapId: string, updater: (map: LinearMap) => LinearMap) => {
    setMaps((current) => current.map((map) => (map.id === mapId ? updater(map) : map)))
  }, [])

  const addMap = useCallback(() => {
    setMaps((current) => {
      const last = current.at(-1)
      const input = last?.outputDim ?? 2
      const next = createMap(input, input, `A${current.length + 1}`)
      return [...current, next]
    })
  }, [])

  const deleteMap = useCallback((mapId: string) => {
    setMaps((current) => (current.length > 1 ? current.filter((map) => map.id !== mapId) : current))
  }, [])

  const moveMap = useCallback((mapId: string, direction: -1 | 1) => {
    setMaps((current) => {
      const index = current.findIndex((map) => map.id === mapId)
      const target = index + direction
      if (index < 0 || target < 0 || target >= current.length) {
        return current
      }
      const copy = [...current]
      ;[copy[index], copy[target]] = [copy[target], copy[index]]
      return copy.map((map, mapIndex) => ({ ...map, name: `A${mapIndex + 1}` }))
    })
  }, [])

  const applyPreset = useCallback((preset: LinearMap) => {
    setMaps((current) => [clonePreset(preset, 'A1'), ...current.slice(1)])
    setVectors((current) => current.map((vector) => ({ ...vector, dim: preset.inputDim, values: resizeVector(vector.values, preset.inputDim) })))
  }, [])

  const addVector = useCallback(() => {
    setVectors((current) => [
      ...current,
      {
        id: id('vector'),
        name: `v${current.length + 1}`,
        dim: inputDim,
        values: inputDim === 2 ? [1, -1] : [1, -1, 1],
        color: current.length % 2 === 0 ? '#c88cff' : '#9adf8f',
      },
    ])
  }, [inputDim])

  const updateVector = useCallback((vectorId: string, updater: (vector: VectorState) => VectorState) => {
    setVectors((current) => current.map((vector) => (vector.id === vectorId ? updater(vector) : vector)))
  }, [])

  const deleteVector = useCallback((vectorId: string) => {
    setVectors((current) => (current.length > 1 ? current.filter((vector) => vector.id !== vectorId) : current))
  }, [])

  const setViewOption = useCallback((key: keyof ViewOptions, value: boolean) => {
    setViewOptions((current) => ({ ...current, [key]: value }))
  }, [])

  return {
    maps,
    setMaps,
    vectors,
    setVectors,
    validation,
    inputDim,
    outputDim,
    mapKind,
    viewOptions,
    setMapKind,
    updateMap,
    addMap,
    deleteMap,
    moveMap,
    applyPreset,
    addVector,
    updateVector,
    deleteVector,
    setViewOption,
  }
}
