import { ChevronDown, CopyPlus, Plus, Sparkles } from 'lucide-react'
import type { AppCopy, Locale } from '../i18n.ts'
import { translateValidationMessage } from '../i18n.ts'
import { presets2d } from '../math/presets2d.ts'
import { presets3d, presetsR2ToR3, presetsR3ToR2 } from '../math/presets3d.ts'
import type { LinearMap, MapSequenceValidation } from '../math/types.ts'
import { MatrixInput } from './MatrixInput.tsx'

type Props = {
  copy: AppCopy
  locale: Locale
  maps: LinearMap[]
  validation: MapSequenceValidation
  onAdd: () => void
  onApplyPreset: (preset: LinearMap) => void
  onUpdate: (id: string, updater: (map: LinearMap) => LinearMap) => void
  onDelete: (id: string) => void
  onMove: (id: string, direction: -1 | 1) => void
}

export function MatrixSequencePanel({ copy, locale, maps, validation, onAdd, onApplyPreset, onUpdate, onDelete, onMove }: Props) {
  const presets = [...presets2d, ...presets3d, ...presetsR3ToR2, ...presetsR2ToR3]

  return (
    <section className="panel-section">
      <div className="section-heading">
        <h2>{copy.matrixSequence.title}</h2>
        <button className="mini-button" type="button" onClick={onAdd}>
          <Plus size={16} />
          {copy.matrixSequence.add}
        </button>
      </div>

      <div className="stack">
        {maps.map((map, index) => (
          <MatrixInput
            key={map.id}
            copy={copy.matrixInput}
            map={map}
            canMoveUp={index > 0}
            canMoveDown={index < maps.length - 1}
            onChange={(next) => onUpdate(map.id, () => next)}
            onDelete={() => onDelete(map.id)}
            onMove={(direction) => onMove(map.id, direction)}
          />
        ))}
      </div>

      {!validation.valid && (
        <div className="error-box" role="status">
          {validation.errors.map((error) => (
            <p key={error}>{translateValidationMessage(error, locale)}</p>
          ))}
        </div>
      )}

      <details className="preset-box collapsible-box">
        <summary>
          <span className="summary-title">
            <Sparkles size={16} />
            {copy.matrixSequence.presetTitle}
          </span>
          <ChevronDown className="summary-chevron" size={17} />
        </summary>
        <div className="preset-grid">
          {presets.map((preset) => (
            <button key={preset.id} type="button" onClick={() => onApplyPreset(preset)}>
              <CopyPlus size={14} />
              <span>{copy.matrixSequence.presetNames[preset.name] ?? preset.name}</span>
              <small>{preset.outputDim}x{preset.inputDim}</small>
            </button>
          ))}
        </div>
      </details>
    </section>
  )
}
