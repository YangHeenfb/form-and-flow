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
  const lowContrast = hasLowContrast(theme)

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
      {lowContrast && (
        <p className="low-contrast-warning" role="status">
          {copy.lowContrastWarning}
        </p>
      )}
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

function hasLowContrast(theme: ThemeSettings): boolean {
  const background = theme.surfaceMode === 'dark' ? '#0d141c' : '#f8fafc'
  return colorFields.some((field) => contrastRatio(theme.colors[field], background) < (field === 'grid' ? 2 : 3))
}

function contrastRatio(foreground: string, background: string): number {
  const fg = relativeLuminance(hexToRgb(foreground))
  const bg = relativeLuminance(hexToRgb(background))
  const light = Math.max(fg, bg)
  const dark = Math.min(fg, bg)
  return (light + 0.05) / (dark + 0.05)
}

function relativeLuminance([red, green, blue]: [number, number, number]): number {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized.padEnd(6, '0').slice(0, 6)
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}
