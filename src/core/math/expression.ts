export type CompiledExpression = {
  expression: string
  evaluate: (scope: Record<string, number>) => number | null
}

type Token =
  | { type: 'number'; value: number }
  | { type: 'identifier'; value: string }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' | '^' }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'comma'; value: ',' }

type AstNode =
  | { type: 'number'; value: number }
  | { type: 'variable'; name: string }
  | { type: 'unary'; op: '-'; value: AstNode }
  | { type: 'binary'; op: '+' | '-' | '*' | '/' | '^'; left: AstNode; right: AstNode }
  | { type: 'call'; name: string; args: AstNode[] }

export type CompileExpressionOptions = {
  variables: string[]
  aliases?: Record<string, string>
}

const allowedFunctions: Record<string, (...args: number[]) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  exp: Math.exp,
  log: Math.log,
  ln: Math.log,
  sqrt: Math.sqrt,
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
  min: Math.min,
  max: Math.max,
}

const constants: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
}

export function compileExpression(expression: string, options: CompileExpressionOptions): CompiledExpression {
  const tokens = tokenize(expression)
  const parser = new Parser(tokens, options)
  const ast = parser.parse()
  return {
    expression,
    evaluate: (scope) => {
      try {
        const value = evaluateAst(ast, scope, options)
        return Number.isFinite(value) ? value : null
      } catch {
        return null
      }
    },
  }
}

export function safeEvaluate(compiled: CompiledExpression, scope: Record<string, number>): number | null {
  return compiled.evaluate(scope)
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let index = 0
  while (index < input.length) {
    const char = input[index]
    if (/\s/.test(char)) {
      index += 1
      continue
    }
    if (/[0-9.]/.test(char)) {
      const match = input.slice(index).match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i)
      if (!match) {
        throw new Error('Invalid number.')
      }
      tokens.push({ type: 'number', value: Number(match[0]) })
      index += match[0].length
      continue
    }
    if (/[a-z_]/i.test(char)) {
      const match = input.slice(index).match(/^[a-z_][a-z0-9_]*/i)
      if (!match) {
        throw new Error('Invalid identifier.')
      }
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

class Parser {
  private index = 0
  private readonly tokens: Token[]
  private readonly options: CompileExpressionOptions

  constructor(tokens: Token[], options: CompileExpressionOptions) {
    this.tokens = tokens
    this.options = options
  }

  parse(): AstNode {
    const expression = this.parseExpression(0)
    if (this.peek()) {
      throw new Error('Unexpected trailing token.')
    }
    return expression
  }

  private parseExpression(minPrecedence: number): AstNode {
    let left = this.parsePrefix()
    while (true) {
      const token = this.peek()
      if (token?.type !== 'operator') {
        break
      }
      const precedence = getPrecedence(token.value)
      if (precedence < minPrecedence) {
        break
      }
      const operator = this.consume().value as '+' | '-' | '*' | '/' | '^'
      const right = this.parseExpression(precedence + (operator === '^' ? 0 : 1))
      left = { type: 'binary', op: operator, left, right }
    }
    return left
  }

  private parsePrefix(): AstNode {
    const token = this.consume()
    if (!token) {
      throw new Error('Unexpected end of expression.')
    }
    if (token.type === 'number') {
      return { type: 'number', value: token.value }
    }
    if (token.type === 'operator' && token.value === '-') {
      return { type: 'unary', op: '-', value: this.parseExpression(3) }
    }
    if (token.type === 'identifier') {
      const next = this.peek()
      if (next?.type === 'paren' && next.value === '(') {
        this.consume()
        const args: AstNode[] = []
        if (!(this.peek()?.type === 'paren' && this.peek()?.value === ')')) {
          while (true) {
            args.push(this.parseExpression(0))
            if (this.peek()?.type === 'comma') {
              this.consume()
              continue
            }
            break
          }
        }
        this.expectParen(')')
        if (!allowedFunctions[token.value]) {
          throw new Error(`Function "${token.value}" is not allowed.`)
        }
        return { type: 'call', name: token.value, args }
      }
      const name = this.options.aliases?.[token.value] ?? token.value
      if (!this.options.variables.includes(name) && constants[name] === undefined) {
        throw new Error(`Variable "${token.value}" is not allowed.`)
      }
      return { type: 'variable', name }
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
    if (token?.type !== 'paren' || token.value !== value) {
      throw new Error(`Expected "${value}".`)
    }
  }

  private peek(): Token | undefined {
    return this.tokens[this.index]
  }

  private consume(): Token {
    const token = this.tokens[this.index]
    this.index += 1
    return token
  }
}

function getPrecedence(operator: '+' | '-' | '*' | '/' | '^'): number {
  if (operator === '+' || operator === '-') {
    return 1
  }
  if (operator === '*' || operator === '/') {
    return 2
  }
  return 3
}

function evaluateAst(node: AstNode, scope: Record<string, number>, options: CompileExpressionOptions): number {
  switch (node.type) {
    case 'number':
      return node.value
    case 'variable': {
      const name = options.aliases?.[node.name] ?? node.name
      if (constants[name] !== undefined) {
        return constants[name]
      }
      const value = scope[name]
      if (!Number.isFinite(value)) {
        throw new Error(`Missing variable "${name}".`)
      }
      return value
    }
    case 'unary':
      return -evaluateAst(node.value, scope, options)
    case 'binary': {
      const left = evaluateAst(node.left, scope, options)
      const right = evaluateAst(node.right, scope, options)
      if (node.op === '+') return left + right
      if (node.op === '-') return left - right
      if (node.op === '*') return left * right
      if (node.op === '/') return left / right
      return left ** right
    }
    case 'call':
      return allowedFunctions[node.name](...node.args.map((arg) => evaluateAst(arg, scope, options)))
  }
}
