import type { FilterConfig, FourierCoefficient, Spectrum } from '../fourierTypes.ts'
import { complex } from './complex.ts'
import { reconstructSamples } from './reconstruction.ts'

export function applyLowPass(spectrum: Spectrum, cutoff: number): Spectrum {
  return mapSpectrum(spectrum, (coefficient) => Math.abs(coefficient.frequency) <= cutoff)
}

export function applyHighPass(spectrum: Spectrum, cutoff: number): Spectrum {
  return mapSpectrum(spectrum, (coefficient) => Math.abs(coefficient.frequency) >= cutoff)
}

export function applyBandPass(spectrum: Spectrum, lowCutoff: number, highCutoff: number): Spectrum {
  const low = Math.min(Math.abs(lowCutoff), Math.abs(highCutoff))
  const high = Math.max(Math.abs(lowCutoff), Math.abs(highCutoff))
  return mapSpectrum(spectrum, (coefficient) => Math.abs(coefficient.frequency) >= low && Math.abs(coefficient.frequency) <= high)
}

export function applyBandStop(spectrum: Spectrum, lowCutoff: number, highCutoff: number): Spectrum {
  const low = Math.min(Math.abs(lowCutoff), Math.abs(highCutoff))
  const high = Math.max(Math.abs(lowCutoff), Math.abs(highCutoff))
  return mapSpectrum(spectrum, (coefficient) => Math.abs(coefficient.frequency) < low || Math.abs(coefficient.frequency) > high)
}

export function applyMagnitudeThreshold(spectrum: Spectrum, threshold: number): Spectrum {
  return mapSpectrum(spectrum, (coefficient) => coefficient.magnitude >= threshold)
}

export function reconstructFilteredSignal(spectrum: Spectrum, filterConfig: FilterConfig, sampleCount: number): number[] {
  return reconstructSamples(applyFilter(spectrum, filterConfig).coefficients, sampleCount)
}

export function applyFilter(spectrum: Spectrum, filterConfig: FilterConfig): Spectrum {
  return mapSpectrum(spectrum, (coefficient) => filterKeepsCoefficient(coefficient, filterConfig))
}

export function filterKeepsCoefficient(coefficient: FourierCoefficient, filterConfig: FilterConfig): boolean {
  const frequency = Math.abs(coefficient.frequency)
  if (filterConfig.type === 'low-pass') return frequency <= Math.abs(filterConfig.cutoff)
  if (filterConfig.type === 'high-pass') return frequency >= Math.abs(filterConfig.cutoff)
  if (filterConfig.type === 'band-pass') {
    const low = Math.min(Math.abs(filterConfig.lowCutoff), Math.abs(filterConfig.highCutoff))
    const high = Math.max(Math.abs(filterConfig.lowCutoff), Math.abs(filterConfig.highCutoff))
    return frequency >= low && frequency <= high
  }
  if (filterConfig.type === 'band-stop') {
    const low = Math.min(Math.abs(filterConfig.lowCutoff), Math.abs(filterConfig.highCutoff))
    const high = Math.max(Math.abs(filterConfig.lowCutoff), Math.abs(filterConfig.highCutoff))
    return frequency < low || frequency > high
  }
  return coefficient.magnitude >= filterConfig.threshold
}

function mapSpectrum(spectrum: Spectrum, keep: (coefficient: FourierCoefficient) => boolean): Spectrum {
  return {
    ...spectrum,
    coefficients: spectrum.coefficients.map((coefficient) => {
      if (keep(coefficient)) return coefficient
      return {
        ...coefficient,
        value: complex(0, 0),
        magnitude: 0,
        phase: 0,
      }
    }),
  }
}
