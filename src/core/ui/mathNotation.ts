export function spaceText(dim: number): string {
  return dim === 2 ? 'R²' : dim === 3 ? 'R³' : `R^${dim}`
}

export function spaceTex(dim: number): string {
  return `\\mathbb{R}^{${dim}}`
}

export function indexedNameTex(name: string): string {
  const match = /^([A-Za-z]+)(\d+)$/.exec(name)
  if (match) {
    return `${match[1]}_{${match[2]}}`
  }
  return name.replace(/_/g, '\\_')
}
