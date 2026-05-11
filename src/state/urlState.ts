import type { LinearMap, ThemeSettings, VectorState } from '../math/types.ts'

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

export type ShareState = {
  maps: LinearMap[]
  vectors: VectorState[]
  theme?: ThemeSettings
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let encoded = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index]
    const second = bytes[index + 1] ?? 0
    const third = bytes[index + 2] ?? 0
    const chunk = (first << 16) | (second << 8) | third
    encoded += alphabet[(chunk >> 18) & 63]
    encoded += alphabet[(chunk >> 12) & 63]
    if (index + 1 < bytes.length) {
      encoded += alphabet[(chunk >> 6) & 63]
    }
    if (index + 2 < bytes.length) {
      encoded += alphabet[chunk & 63]
    }
  }
  return encoded
}

function fromBase64Url(value: string): string {
  const bytes: number[] = []
  for (let index = 0; index < value.length; index += 4) {
    const first = alphabet.indexOf(value[index])
    const second = alphabet.indexOf(value[index + 1])
    const third = value[index + 2] ? alphabet.indexOf(value[index + 2]) : 0
    const fourth = value[index + 3] ? alphabet.indexOf(value[index + 3]) : 0
    if (first < 0 || second < 0 || third < 0 || fourth < 0) {
      throw new Error('Invalid base64url payload.')
    }
    const chunk = (first << 18) | (second << 12) | (third << 6) | fourth
    bytes.push((chunk >> 16) & 255)
    if (index + 2 < value.length) {
      bytes.push((chunk >> 8) & 255)
    }
    if (index + 3 < value.length) {
      bytes.push(chunk & 255)
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes))
}

export function encodeUrlState(state: ShareState): string {
  return toBase64Url(JSON.stringify(state))
}

export function decodeUrlState(search: string): ShareState | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
  const raw = params.get('state')
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(fromBase64Url(raw)) as ShareState
    if (Array.isArray(parsed.maps) && Array.isArray(parsed.vectors)) {
      return parsed
    }
  } catch {
    return null
  }
  return null
}

export function buildShareSearch(state: ShareState): string {
  const params = new URLSearchParams()
  params.set('state', encodeUrlState(state))
  return `?${params.toString()}`
}

export function updateBrowserUrl(state: ShareState): string {
  const search = buildShareSearch(state)
  const url = `${window.location.pathname}${search}`
  window.history.replaceState(null, '', url)
  return `${window.location.origin}${url}`
}
