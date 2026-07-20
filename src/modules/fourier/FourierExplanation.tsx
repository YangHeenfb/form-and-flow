import { Formula } from '../../core/ui/Formula.tsx'
import { TermButton } from '../../core/ui/LearningHelp.tsx'
import type { FourierExplanationModel } from './fourierExplanation.ts'

export type FourierValueRow = {
  label: string
  value: string
}

type Props = {
  model: FourierExplanationModel
  values: FourierValueRow[]
  formulaTex: string
  formulaLabel: string
  notes: string[]
  terms?: Array<{ id: string; label: string }>
  onTerm?: (term: string) => void
}

export function FourierExplanation({ model, values, formulaTex, formulaLabel, notes, terms = [], onTerm }: Props) {
  return (
    <>
      <section className="fourier-intuition-section">
        <h2>{model.coreLabel}</h2>
        <ol className="fourier-intuition-steps">
          {model.steps.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong>
              <span>{step.body}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="fourier-intuition-section fourier-current-state">
        <h2>{model.currentLabel}</h2>
        <p aria-live="polite">{model.current}</p>
      </section>

      <section className="fourier-intuition-section fourier-continue-section">
        <h2>{model.continueLabel}</h2>
        <a className="fourier-continue-link" href={model.nextHref}>{model.nextAction}</a>
      </section>

      <details className="fourier-precision-details">
        <summary>{model.detailsLabel}</summary>
        <div className="fourier-precision-content">
          <h3>{model.readingsLabel}</h3>
          <dl>
            {values.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          <h3>{model.formulaLabel}</h3>
          <p className="formula-text formula-card">
            <Formula tex={formulaTex} block label={formulaLabel} />
          </p>
          <h3>{model.notesLabel}</h3>
          {notes.map((note) => <p className="input-help" key={note}>{note}</p>)}
          {terms.length > 0 && onTerm && (
            <div className="fourier-term-links" aria-label={model.termsLabel}>
              <span>{model.termsLabel}</span>
              <div>
                {terms.map((term) => <TermButton key={term.id} onClick={() => onTerm(term.id)}>{term.label}</TermButton>)}
              </div>
            </div>
          )}
        </div>
      </details>
    </>
  )
}
