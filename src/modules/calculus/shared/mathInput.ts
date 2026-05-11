export const calculusFunctionNames = ['sin', 'cos', 'tan', 'ln', 'log', 'exp', 'sqrt', 'abs'] as const

export function normalizeMathInput(input: string): string {
  let normalized = input
    .trim()
    .replaceAll('π', 'pi')
    .replaceAll('−', '-')
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('√', 'sqrt')
    .replaceAll('²', '^2')
    .replaceAll('³', '^3')

  normalized = normalized.replace(/\b(sin|cos|tan|ln|log|exp|sqrt|abs)\s+([a-zA-Z][a-zA-Z0-9]*)\b/g, '$1($2)')
  normalized = normalized.replace(/\bsqrt\s*([a-zA-Z][a-zA-Z0-9]*)\b/g, 'sqrt($1)')

  return normalized
}

export function completeBareFunctionInput(input: string, variable = 'x'): string {
  const normalized = normalizeMathInput(input)
  const lower = normalized.toLowerCase()
  if (calculusFunctionNames.includes(lower as (typeof calculusFunctionNames)[number])) {
    return `${lower}(${variable})`
  }
  return normalized
}
