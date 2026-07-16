interface RegionDisplaySelectorProps {
  id?: string;
  type?: "region-display-selector" | "RegionDisplaySelector";
  visible?: boolean;
  label?: string;
  onToggle?: () => void;
  templateOptions?: Record<string, string | boolean | number>;
  [key: string]: unknown;
}

export function RegionDisplaySelector({ id, visible = true, label, onToggle, templateOptions }: RegionDisplaySelectorProps) {
  return (
    <div
      id={id}
      data-eut-component="region-display-selector"
      className="eut-region-display-selector"
    >
      <label className="eut-region-display-selector__label">
        <input
          type="checkbox"
          checked={visible}
          onChange={() => onToggle?.()}
          className="eut-region-display-selector__checkbox"
        />
        {label && <span className="eut-region-display-selector__text">{label}</span>}
      </label>
    </div>
  );
}
