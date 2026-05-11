export function rectangularWindow(samples: number[]): number[] {
  return [...samples]
}

export function hannWindow(samples: number[]): number[] {
  const denominator = Math.max(1, samples.length - 1)
  return samples.map((sample, index) => sample * 0.5 * (1 - Math.cos((2 * Math.PI * index) / denominator)))
}

export function hammingWindow(samples: number[]): number[] {
  const denominator = Math.max(1, samples.length - 1)
  return samples.map((sample, index) => sample * (0.54 - 0.46 * Math.cos((2 * Math.PI * index) / denominator)))
}
