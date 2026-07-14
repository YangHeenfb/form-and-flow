import { gzipSync } from 'node:zlib'
import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const manifest = JSON.parse(readFileSync(join(dist, '.vite', 'manifest.json'), 'utf8'))

const gzipBytes = (file) => gzipSync(readFileSync(join(dist, file))).byteLength
const formatKb = (bytes) => `${(bytes / 1024).toFixed(2)} KB gzip`
const fail = (message) => {
  console.error(`Bundle budget failed: ${message}`)
  process.exitCode = 1
}

const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry)
if (!entryKey) throw new Error('Vite manifest does not contain an application entry.')

function staticGraph(startKey) {
  const visited = new Set()
  const visit = (key) => {
    if (visited.has(key)) return
    visited.add(key)
    for (const dependency of manifest[key]?.imports ?? []) visit(dependency)
  }
  visit(startKey)
  return visited
}

const entryGraph = staticGraph(entryKey)
const initialJsBytes = [...entryGraph]
  .map((key) => manifest[key]?.file)
  .filter((file) => file?.endsWith('.js'))
  .reduce((total, file) => total + gzipBytes(file), 0)

if (initialJsBytes > 110 * 1024) {
  fail(`initial JavaScript is ${formatKb(initialJsBytes)}; budget is 110 KB gzip.`)
}

for (const forbidden of ['vendor-katex', 'vendor-three']) {
  const present = [...entryGraph].some((key) => manifest[key]?.name === forbidden)
  if (present) fail(`${forbidden} is part of the initial static dependency graph.`)
}

const matrixKey = Object.keys(manifest).find((key) => key.endsWith('/MatrixModuleAdapter.tsx'))
if (!matrixKey) throw new Error('MatrixModuleAdapter is missing from the Vite manifest.')
const matrixGraph = staticGraph(matrixKey)
if ([...matrixGraph].some((key) => manifest[key]?.name === 'vendor-three')) {
  fail('the two-dimensional Matrix entry statically imports Three.js.')
}

const moduleEntries = Object.entries(manifest).filter(
  ([key, value]) => key.startsWith('src/modules/') && value.isDynamicEntry && value.file?.endsWith('.js'),
)
for (const [key, value] of moduleEntries) {
  const size = gzipBytes(value.file)
  if (size > 80 * 1024) fail(`${key} is ${formatKb(size)}; explorer business chunk budget is 80 KB gzip.`)
}

const logoBytes = statSync(join(root, 'public', 'brand', 'form-flow-logo.png')).size
if (logoBytes > 32 * 1024) fail(`navigation logo is ${(logoBytes / 1024).toFixed(2)} KB; budget is 32 KB.`)

console.log(`Initial JavaScript: ${formatKb(initialJsBytes)} / 110 KB`)
console.log(`Matrix 2D static graph: Three.js excluded`)
console.log(`Largest module entry: ${formatKb(Math.max(...moduleEntries.map(([, value]) => gzipBytes(value.file))))} / 80 KB`)
console.log(`Navigation logo: ${(logoBytes / 1024).toFixed(2)} KB / 32 KB`)

if (process.exitCode) process.exit(process.exitCode)
