import { useState } from 'react'

const STYLE_PRESETS = [
  { key: 'vita', displayName: 'Vita' },
  { key: 'vita-slate', displayName: 'Vita - Slate' },
  { key: 'vita-red', displayName: 'Vita - Red' },
]

interface ThemeStylePickerProps {
  value?: string
  onChange: (styleRef: string) => void
}

export function ThemeStylePicker({ value, onChange }: ThemeStylePickerProps) {
  const [selected, setSelected] = useState(value ?? 'vita')

  const handleChange = (styleKey: string) => {
    setSelected(styleKey)
    onChange(`eut.${styleKey}`)
  }

  return (
    <div className="theme-style-picker">
      <h3>Theme Style</h3>
      {STYLE_PRESETS.map((preset) => (
        <button
          key={preset.key}
          className={`theme-style-picker__btn ${selected === preset.key ? 'active' : ''}`}
          onClick={() => handleChange(preset.key)}
        >
          {preset.displayName}
        </button>
      ))}
    </div>
  )
}
