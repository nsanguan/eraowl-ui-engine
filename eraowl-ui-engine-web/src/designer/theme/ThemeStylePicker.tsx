import { useThemeStyle } from "../../render-engine/hooks/useThemeStyle";

const PRESETS = ["vita", "vita-slate", "vita-red"] as const;

export function ThemeStylePicker() {
  const { data: currentStyle } = useThemeStyle("vita");

  return (
    <div className="eods-theme-style-picker">
      <h4>Theme Style Preset</h4>
      <div className="eods-theme-style-picker__list">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            className={`eods-theme-style-picker__item ${
              currentStyle?.name === preset ? "eods-theme-style-picker__item--active" : ""
            }`}
            onClick={() => {
              // TODO: dispatch SET_THEME_STYLE to UI store
              console.log("Select theme style:", preset);
            }}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
