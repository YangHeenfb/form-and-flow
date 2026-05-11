import { Contrast } from 'lucide-react'
import type { AppCopy } from '../i18n.ts'
import type { ColorPreset, ThemeSettings } from '../math/types.ts'

type Props = {
  copy: AppCopy['themePanel']
  theme: ThemeSettings
  onColorPresetChange: (preset: ColorPreset) => void
  onColorChange: (key: keyof ThemeSettings['colors'], value: string) => void
  onIncludeThemeChange: (value: boolean) => void
}

const colorFields: Array<keyof ThemeSettings['colors']> = [
  'grid',
  'transformedGrid',
  'axis',
  'vectorI',
  'vectorJ',
  'vectorK',
  'inputVector',
  'unitShape',
]

export function ThemePanel({
  copy,
  theme,
  onColorPresetChange,
  onColorChange,
  onIncludeThemeChange,
}: Props) {
  return (
    <section className="panel-section">
      <div className="section-heading">
        <h2>{copy.title}</h2>
      </div>
      <div className="preset-row">
        <button type="button" className={theme.colorPreset === 'neutral' ? 'active' : ''} onClick={() => onColorPresetChange('neutral')}>
          {copy.neutral}
        </button>
        <button
          type="button"
          className={theme.colorPreset === 'high-contrast' ? 'active' : ''}
          onClick={() => onColorPresetChange('high-contrast')}
        >
          <Contrast size={15} />
          {copy.highContrast}
        </button>
      </div>
      <div className="color-grid">
        {colorFields.map((field) => (
          <label key={field}>
            <span>{copy.colorLabels[field]}</span>
            <input type="color" value={theme.colors[field]} onChange={(event) => onColorChange(field, event.target.value)} />
          </label>
        ))}
      </div>
      <label className="checkbox-line">
        <input
          type="checkbox"
          checked={theme.includeThemeInShareLink}
          onChange={(event) => onIncludeThemeChange(event.target.checked)}
        />
        {copy.includeInShare}
      </label>
    </section>
  )
}
