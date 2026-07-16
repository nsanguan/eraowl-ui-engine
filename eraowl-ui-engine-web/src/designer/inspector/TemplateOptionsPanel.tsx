import { useUIStore } from "../../store/useUIStore";

interface TemplateOptionsPanelProps {
  componentId: string;
}

export function TemplateOptionsPanel({ componentId }: TemplateOptionsPanelProps) {
  const layout = useUIStore((s) => s.currentLayout);
  const updateComponentOptions = useUIStore((s) => s.updateComponentOptions);

  const component = layout?.components?.find((c) => c.id === componentId);
  if (!component) return null;

  const options = component.templateOptions ?? {};

  const handleChange = (key: string, value: string | boolean) => {
    updateComponentOptions(componentId, { [key]: value });
  };

  return (
    <div className="eods-template-options">
      {Object.entries(options).map(([key, val]) => (
        <label key={key} className="eods-template-options__field">
          <span>{key}</span>
          {typeof val === "boolean" ? (
            <input
              type="checkbox"
              checked={val}
              onChange={(e) => handleChange(key, e.target.checked)}
            />
          ) : (
            <input
              type="text"
              value={String(val)}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          )}
        </label>
      ))}
      {Object.keys(options).length === 0 && (
        <p className="eods-template-options__empty">
          No template options available for this component type.
        </p>
      )}
    </div>
  );
}
