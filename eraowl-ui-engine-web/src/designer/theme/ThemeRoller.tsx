import { useThemeRollerStore } from "./useThemeRollerStore";
import { ThemeStylePicker } from "./ThemeStylePicker";

export function ThemeRoller() {
  const draftTokens = useThemeRollerStore((s) => s.draftTokens);
  const setDraftToken = useThemeRollerStore((s) => s.setDraftToken);
  const resetDraft = useThemeRollerStore((s) => s.resetDraft);

  return (
    <aside className="eods-theme-roller">
      <h3>Theme Roller</h3>
      <ThemeStylePicker />

      <div className="eods-theme-roller__tokens">
        {Object.entries(draftTokens).map(([key, value]) => (
          <label key={key} className="eods-theme-roller__field">
            <span>{key}</span>
            <input
              type="text"
              value={String(value)}
              onChange={(e) => setDraftToken(key, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="eods-theme-roller__actions">
        <button onClick={() => resetDraft()}>Reset</button>
      </div>
    </aside>
  );
}
