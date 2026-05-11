import { calculusManifest } from '../modules/calculus/manifest.ts'
import { complexPlaneManifest } from '../modules/complex-plane/manifest.ts'
import { convolutionManifest } from '../modules/convolution/manifest.ts'
import { differentialEquationsManifest } from '../modules/differential-equations/manifest.ts'
import { fourierManifest } from '../modules/fourier/manifest.ts'
import { fourierSeriesManifest } from '../modules/fourier-series/manifest.ts'
import { groupTheoryManifest } from '../modules/group-theory/manifest.ts'
import { matrixManifest } from '../modules/matrix/manifest.ts'
import { neuralNetworksManifest } from '../modules/neural-networks/manifest.ts'
import { numberTheoryFractalsManifest } from '../modules/number-theory-fractals/manifest.ts'
import { optimizationManifest } from '../modules/optimization/manifest.ts'
import { probabilityManifest } from '../modules/probability/manifest.ts'
import { topologyManifest } from '../modules/topology/manifest.ts'
import { vectorFieldManifest } from '../modules/vector-field/manifest.ts'
import type { ModuleDefinition } from './moduleTypes.ts'

export const moduleRegistry: ModuleDefinition[] = [
  matrixManifest,
  calculusManifest,
  fourierManifest,
  differentialEquationsManifest,
  probabilityManifest,
  convolutionManifest,
  complexPlaneManifest,
  optimizationManifest,
  neuralNetworksManifest,
  vectorFieldManifest,
  fourierSeriesManifest,
  groupTheoryManifest,
  topologyManifest,
  numberTheoryFractalsManifest,
]

export function getModuleById(id: string): ModuleDefinition | undefined {
  return moduleRegistry.find((module) => module.id === id)
}
