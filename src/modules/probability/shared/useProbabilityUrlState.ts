export function readSearchParams(search = typeof window === 'undefined' ? '' : window.location.search): URLSearchParams {
  return new URLSearchParams(search)
}

export function numberParam(params: URLSearchParams, key: string, fallback: number, min = -Infinity, max = Infinity): number {
  const raw = params.get(key)
  const value = raw === null ? Number.NaN : Number(raw)
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

export function integerParam(params: URLSearchParams, key: string, fallback: number, min = -Infinity, max = Infinity): number {
  return Math.round(numberParam(params, key, fallback, min, max))
}

export function stringParam<T extends string>(params: URLSearchParams, key: string, fallback: T, allowed: readonly T[]): T {
  const raw = params.get(key)
  return raw !== null && allowed.includes(raw as T) ? (raw as T) : fallback
}

export function booleanParam(params: URLSearchParams, key: string, fallback: boolean): boolean {
  const raw = params.get(key)
  if (raw === 'true') return true
  if (raw === 'false') return false
  return fallback
}

export function decodeBayesUrlState(search: string) {
  const params = readSearchParams(search)
  return {
    prior: numberParam(params, 'prior', 0.01, 0, 1),
    likelihood: numberParam(params, 'likelihood', 0.9, 0, 1),
    falseAlarm: numberParam(params, 'falseAlarm', 0.09, 0, 1),
    population: integerParam(params, 'population', 10000, 100, 10000),
  }
}

export function decodeBinomialUrlState(search: string) {
  const params = readSearchParams(search)
  return {
    n: integerParam(params, 'n', 10, 1, 100),
    p: numberParam(params, 'p', 0.5, 0, 1),
    k: integerParam(params, 'k', 5, 0, 100),
    mode: stringParam(params, 'binomialMode', 'exact', ['exact', 'at-most', 'at-least', 'between'] as const),
  }
}

export function decodeCltUrlState(search: string) {
  const params = readSearchParams(search)
  return {
    source: stringParam(params, 'source', 'die', ['die', 'biased-coin', 'uniform', 'exponential', 'skewed-discrete'] as const),
    sampleSize: integerParam(params, 'sampleSize', 30, 1, 100),
    samples: integerParam(params, 'samples', 5000, 1, 100000),
    seed: integerParam(params, 'seed', 123, 1, 2147483647),
  }
}
