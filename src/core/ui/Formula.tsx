import { Fragment, useMemo, type ReactNode } from 'react'
import { renderToString } from 'katex'
import 'katex/dist/katex.min.css'

type Props = {
  tex: string
  block?: boolean
  label?: string
}

export function Formula({ tex, block = false, label }: Props) {
  const html = useMemo(
    () =>
      renderToString(tex, {
        displayMode: block,
        throwOnError: false,
        strict: false,
      }),
    [block, tex],
  )

  return (
    <span
      className={`formula-render${block ? ' block' : ''}`}
      role="img"
      aria-label={label ?? tex}
      tabIndex={block ? 0 : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

const inlineFormulaPattern =
  /(f'\(x_?0\)|m_h|x_?0|y'\s*=\s*f\(t,y\)|R[²³]|[PCEAHfgxyu]\s*\([^)]{1,36}\)|[abxy]\[[^\]]{1,12}\]|x\^[a-zA-Z0-9]+|u[ₜₓ]+|[αβλσθω]|f\s*=\s*\d+)/g

export function MathText({ text }: { text: string }) {
  const parts = text.split(inlineFormulaPattern)
  if (parts.length === 1) return <>{text}</>

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null
        if (!part.match(inlineFormulaPattern)) return <Fragment key={index}>{part}</Fragment>
        return <Formula key={index} tex={toInlineTex(part)} label={part} />
      })}
    </>
  )
}

export function renderMathText(node: ReactNode): ReactNode {
  return typeof node === 'string' ? <MathText text={node} /> : node
}

function toInlineTex(value: string) {
  return value
    .replace(/u([ₜₓ]+)/g, (_, subscript: string) => `u_{${subscript.replace(/ₜ/g, 't').replace(/ₓ/g, 'x')}}`)
    .replace(/f'\(x_?0\)/g, "f'(x_0)")
    .replace(/\bx_?0\b/g, 'x_0')
    .replace(/R²/g, '\\mathbb{R}^2')
    .replace(/R³/g, '\\mathbb{R}^3')
    .replace(/∩/g, '\\cap ')
    .replace(/≤/g, '\\le ')
    .replace(/≥/g, '\\ge ')
    .replace(/≈/g, '\\approx ')
    .replace(/Σ/g, '\\sum ')
    .replace(/∫/g, '\\int ')
    .replace(/α/g, '\\alpha ')
    .replace(/β/g, '\\beta ')
    .replace(/λ/g, '\\lambda ')
    .replace(/σ/g, '\\sigma ')
    .replace(/θ/g, '\\theta ')
    .replace(/ω/g, '\\omega ')
    .replace(/ₜ/g, '_t')
    .replace(/ₓ/g, '_x')
    .replace(/\|/g, '\\mid ')
    .replace(/非\s*([A-Z])/g, '\\operatorname{not}\\,$1')
    .replace(/not\s+([A-Z])/g, '\\operatorname{not}\\,$1')
    .replace(/([abxy])\[([^\]]+)\]/g, '$1_{$2}')
    .replace(/([a-zA-Z])\^([a-zA-Z0-9]+)/g, '$1^{$2}')
}
