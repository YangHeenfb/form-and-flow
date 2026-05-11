import { useMemo } from 'react'
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
      aria-label={label ?? tex}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
