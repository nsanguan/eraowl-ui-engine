import { useThemeRollerStore } from './useThemeRollerStore'

export function ThemeRoller() {
  const { draftTokens, setDraftToken, resetDraft } = useThemeRollerStore()

  const colorPresets = [
    { name: 'Primary', path: 'color.primary', default: '#6366f1' },
    { name: 'Secondary', path: 'color.secondary', default: '#64748b' },
    { name: 'Background', path: 'color.background', default: '#ffffff' },
    { name: 'Text', path: 'color.text', default: '#0f172a' },
  ]

  return (
    <div className="theme-roller">
      <h3>Theme Roller</h3>
      {colorPresets.map((preset) => (
        <div key={preset.path} className="theme-roller__field">
          <label>{preset.name}</label>
          <input
            type="color"
            value={String(draftTokens[preset.path] ?? preset.default)}
            onChange={(e) => setDraftToken(preset.path, e.target.value)}
          />
        </div>
      ))}
      <button onClick={resetDraft}>Reset</button>
    </div>
  )
}
