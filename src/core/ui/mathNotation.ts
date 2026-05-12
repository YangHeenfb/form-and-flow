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

type ExpressionTexOptions = {
  emptyTex?: string
}

type TexToken =
  | { type: 'number'; value: string }
  | { type: 'identifier'; value: string }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' | '^' }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'comma'; value: ',' }

type TexNode =
  | { type: 'number'; value: string }
  | { type: 'variable'; name: string }
  | { type: 'unary'; value: TexNode }
  | { type: 'binary'; op: '+' | '-' | '*' | '/' | '^'; left: TexNode; right: TexNode }
  | { type: 'call'; name: string; args: TexNode[] }

const functionTexNames: Record<string, string> = {
  sin: '\\sin',
  cos: '\\cos',
  tan: '\\tan',
  asin: '\\arcsin',
  acos: '\\arccos',
  atan: '\\arctan',
  log: '\\log',
  ln: '\\ln',
}

export function expressionToTex(expression: string, options: ExpressionTexOptions = {}): string {
  const normalized = normalizeExpressionTexInput(expression)
  if (!normalized) return options.emptyTex ?? '\\text{empty}'

  try {
    return texNodeToTex(new ExpressionTexParser(tokenizeExpressionTex(normalized)).parse())
  } catch {
    return fallbackExpressionToTex(normalized)
  }
}

function normalizeExpressionTexInput(input: string): string {
  let normalized = input
    .trim()
    .replaceAll('π', 'pi')
    .replaceAll('−', '-')
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('√', 'sqrt')
    .replaceAll('²', '^2')
    .replaceAll('³', '^3')

  normalized = normalized.replace(/\b(sin|cos|tan|asin|acos|atan|ln|log|exp|sqrt|abs|min|max)\s+([a-zA-Z][a-zA-Z0-9]*)\b/g, '$1($2)')
  normalized = normalized.replace(/\bsqrt\s*([a-zA-Z][a-zA-Z0-9]*)\b/g, 'sqrt($1)')
  return normalized
}

function tokenizeExpressionTex(input: string): TexToken[] {
  const tokens: TexToken[] = []
  let index = 0
  while (index < input.length) {
    const char = input[index]
    if (/\s/.test(char)) {
      index += 1
      continue
    }
    if (/[0-9.]/.test(char)) {
      const match = input.slice(index).match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i)
      if (!match) throw new Error('Invalid number.')
      tokens.push({ type: 'number', value: match[0] })
      index += match[0].length
      continue
    }
    if (/[a-z_]/i.test(char)) {
      const match = input.slice(index).match(/^[a-z_][a-z0-9_]*/i)
      if (!match) throw new Error('Invalid identifier.')
      tokens.push({ type: 'identifier', value: match[0] })
      index += match[0].length
      continue
    }
    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', value: char })
      index += 1
      continue
    }
    if (char === ',') {
      tokens.push({ type: 'comma', value: char })
      index += 1
      continue
    }
    if (char === '+' || char === '-' || char === '*' || char === '/' || char === '^') {
      tokens.push({ type: 'operator', value: char })
      index += 1
      continue
    }
    throw new Error(`Unsupported token "${char}".`)
  }
  return tokens
}

class ExpressionTexParser {
  private index = 0
  private readonly tokens: TexToken[]

  constructor(tokens: TexToken[]) {
    this.tokens = tokens
  }

  parse(): TexNode {
    const expression = this.parseExpression(0)
    if (this.peek()) throw new Error('Unexpected trailing token.')
    return expression
  }

  private parseExpression(minPrecedence: number): TexNode {
    let left = this.parsePrefix()
    while (true) {
      const token = this.peek()
      if (token?.type !== 'operator') break
      const precedence = texPrecedence(token.value)
      if (precedence < minPrecedence) break
      const operator = this.consume()?.value as '+' | '-' | '*' | '/' | '^'
      const right = this.parseExpression(precedence + (operator === '^' ? 0 : 1))
      left = { type: 'binary', op: operator, left, right }
    }
    return left
  }

  private parsePrefix(): TexNode {
    const token = this.consume()
    if (!token) throw new Error('Unexpected end of expression.')
    if (token.type === 'number') return { type: 'number', value: token.value }
    if (token.type === 'operator' && token.value === '-') return { type: 'unary', value: this.parseExpression(3) }
    if (token.type === 'identifier') {
      const next = this.peek()
      if (next?.type === 'paren' && next.value === '(') {
        this.consume()
        const args: TexNode[] = []
        if (!(this.peek()?.type === 'paren' && this.peek()?.value === ')')) {
          while (true) {
            args.push(this.parseExpression(0))
            if (this.peek()?.type !== 'comma') break
            this.consume()
          }
        }
        this.expectParen(')')
        return { type: 'call', name: token.value, args }
      }
      return { type: 'variable', name: token.value }
    }
    if (token.type === 'paren' && token.value === '(') {
      const value = this.parseExpression(0)
      this.expectParen(')')
      return value
    }
    throw new Error('Unexpected token.')
  }

  private expectParen(value: '(' | ')') {
    const token = this.consume()
    if (token?.type !== 'paren' || token.value !== value) throw new Error(`Expected "${value}".`)
  }

  private peek(): TexToken | undefined {
    return this.tokens[this.index]
  }

  private consume(): TexToken | undefined {
    const token = this.tokens[this.index]
    this.index += 1
    return token
  }
}

function texPrecedence(operator: '+' | '-' | '*' | '/' | '^'): number {
  if (operator === '+' || operator === '-') return 1
  if (operator === '*' || operator === '/') return 2
  return 3
}

function nodePrecedence(node: TexNode): number {
  if (node.type === 'binary') return texPrecedence(node.op)
  if (node.type === 'unary') return 3
  return 4
}

function texNodeToTex(node: TexNode, parentPrecedence = 0, side: 'left' | 'right' = 'left'): string {
  if (node.type === 'number') return node.value
  if (node.type === 'variable') return variableToTex(node.name)
  if (node.type === 'unary') {
    const value = texNodeToTex(node.value, nodePrecedence(node))
    return maybeWrap(`-${value}`, node, parentPrecedence, side)
  }
  if (node.type === 'call') return callToTex(node)

  if (node.op === '/') {
    return maybeWrap(`\\frac{${texNodeToTex(node.left)}}{${texNodeToTex(node.right)}}`, node, parentPrecedence, side)
  }
  if (node.op === '^') {
    const base = nodePrecedence(node.left) < nodePrecedence(node) ? `\\left(${texNodeToTex(node.left)}\\right)` : texNodeToTex(node.left, nodePrecedence(node), 'left')
    return maybeWrap(`${base}^{${texNodeToTex(node.right)}}`, node, parentPrecedence, side)
  }
  if (node.op === '*') {
    const left = texNodeToTex(node.left, nodePrecedence(node), 'left')
    const right = texNodeToTex(node.right, nodePrecedence(node), 'right')
    return maybeWrap(`${left}\\,${right}`, node, parentPrecedence, side)
  }

  const left = texNodeToTex(node.left, nodePrecedence(node), 'left')
  const right = texNodeToTex(node.right, nodePrecedence(node), 'right')
  return maybeWrap(`${left}${node.op}${right}`, node, parentPrecedence, side)
}

function maybeWrap(tex: string, node: TexNode, parentPrecedence: number, side: 'left' | 'right'): string {
  const ownPrecedence = nodePrecedence(node)
  const needsAssociativeWrap = side === 'right' && node.type === 'binary' && (node.op === '+' || node.op === '-') && ownPrecedence === parentPrecedence
  if (ownPrecedence < parentPrecedence || needsAssociativeWrap) {
    return `\\left(${tex}\\right)`
  }
  return tex
}

function callToTex(node: Extract<TexNode, { type: 'call' }>): string {
  const args = node.args.map((arg) => texNodeToTex(arg))
  if (node.name === 'sqrt') return `\\sqrt{${args[0] ?? ''}}`
  if (node.name === 'abs') return `\\left|${args[0] ?? ''}\\right|`
  if (node.name === 'exp') return `e^{${args[0] ?? ''}}`
  if (node.name === 'min' || node.name === 'max') return `\\${node.name}\\left(${args.join(',')}\\right)`
  return `${functionTexNames[node.name] ?? `\\operatorname{${node.name}}`}\\left(${args.join(',')}\\right)`
}

function variableToTex(name: string): string {
  if (name === 'pi') return '\\pi'
  if (name === 'e') return 'e'
  const subscript = /^([A-Za-z]+)_?(\d+)$/.exec(name)
  if (subscript) return `${subscript[1]}_{${subscript[2]}}`
  return name.replace(/_/g, '\\_')
}

function fallbackExpressionToTex(expression: string): string {
  return expression
    .replace(/\s+/g, '')
    .replace(/\bpi\b/g, '\\pi')
    .replace(/\bsin\(/g, '\\sin(')
    .replace(/\bcos\(/g, '\\cos(')
    .replace(/\btan\(/g, '\\tan(')
    .replace(/\basin\(/g, '\\arcsin(')
    .replace(/\bacos\(/g, '\\arccos(')
    .replace(/\batan\(/g, '\\arctan(')
    .replace(/\blog\(/g, '\\log(')
    .replace(/\bln\(/g, '\\ln(')
    .replace(/\bexp\(/g, '\\exp(')
    .replace(/\bsqrt\(([^()]+)\)/g, '\\sqrt{$1}')
    .replace(/\babs\(([^()]+)\)/g, '\\left|$1\\right|')
    .replace(/\*/g, '\\,')
    .replace(/\^([a-zA-Z0-9.]+)/g, '^{$1}')
    .replace(/\^\(([^()]+)\)/g, '^{$1}')
}
