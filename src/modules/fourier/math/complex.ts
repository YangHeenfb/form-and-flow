import type { Complex } from '../fourierTypes.ts'

export function complex(re: number, im: number): Complex {
  return { re, im }
}

export function add(a: Complex, b: Complex): Complex {
  return complex(a.re + b.re, a.im + b.im)
}

export function sub(a: Complex, b: Complex): Complex {
  return complex(a.re - b.re, a.im - b.im)
}

export function mul(a: Complex, b: Complex): Complex {
  return complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re)
}

export function scale(z: Complex, scalar: number): Complex {
  return complex(z.re * scalar, z.im * scalar)
}

export function div(a: Complex, b: Complex): Complex {
  const denominator = magnitudeSquared(b)
  if (denominator === 0) return complex(0, 0)
  return complex((a.re * b.re + a.im * b.im) / denominator, (a.im * b.re - a.re * b.im) / denominator)
}

export function conj(z: Complex): Complex {
  return complex(z.re, -z.im)
}

export function magnitude(z: Complex): number {
  return Math.hypot(z.re, z.im)
}

export function magnitudeSquared(z: Complex): number {
  return z.re * z.re + z.im * z.im
}

export function phase(z: Complex): number {
  return Math.atan2(z.im, z.re)
}

export function expi(theta: number): Complex {
  return complex(Math.cos(theta), Math.sin(theta))
}

export function fromPolar(radius: number, theta: number): Complex {
  return scale(expi(theta), radius)
}

export function nearlyEqualComplex(a: Complex, b: Complex, epsilon = 1e-9): boolean {
  return Math.abs(a.re - b.re) <= epsilon && Math.abs(a.im - b.im) <= epsilon
}

export function formatComplex(z: Complex): string {
  const re = formatNumber(z.re)
  const im = formatNumber(Math.abs(z.im))
  const sign = z.im < 0 ? '-' : '+'
  return `${re} ${sign} ${im}i`
}

function formatNumber(value: number): string {
  if (Math.abs(value) < 1e-10) return '0'
  return String(Math.round(value * 1000) / 1000)
}
