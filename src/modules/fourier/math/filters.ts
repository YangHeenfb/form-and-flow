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
  if (filterConfig.type === 'low-pass') return applyLowPass(spectrum, filterConfig.cutoff)
  if (filterConfig.type === 'high-pass') return applyHighPass(spectrum, filterConfig.cutoff)
  if (filterConfig.type === 'band-pass') return applyBandPass(spectrum, filterConfig.lowCutoff, filterConfig.highCutoff)
  if (filterConfig.type === 'band-stop') return applyBandStop(spectrum, filterConfig.lowCutoff, filterConfig.highCutoff)
  return applyMagnitudeThreshold(spectrum, filterConfig.threshold)
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
