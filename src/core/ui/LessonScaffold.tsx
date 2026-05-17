import type { ReactNode } from 'react'

type LessonScaffoldProps = {
  className?: string
  controlsClassName?: string
  mainClassName?: string
  explanationClassName?: string
  controls: ReactNode
  main: ReactNode
  explanation: ReactNode
}

export function LessonScaffold({
  className,
  controlsClassName,
  mainClassName,
  explanationClassName,
  controls,
  main,
  explanation,
}: LessonScaffoldProps) {
  return (
    <section className={joinClassNames('lesson-shell', className)}>
      <aside className={joinClassNames('lesson-shell-controls platform-card', controlsClassName)}>{controls}</aside>
      <main className={joinClassNames('lesson-shell-main', mainClassName)}>{main}</main>
      <aside className={joinClassNames('lesson-shell-explanation platform-card', explanationClassName)}>{explanation}</aside>
    </section>
  )
}

function joinClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ')
}
