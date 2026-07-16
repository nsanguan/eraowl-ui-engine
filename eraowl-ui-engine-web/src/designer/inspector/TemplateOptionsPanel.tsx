import { useUIStore } from "../../store/useUIStore";

interface TemplateOptionsPanelProps {
  componentId: string;
}

export function TemplateOptionsPanel({ componentId }: TemplateOptionsPanelProps) {
  const selectedComponentId = useUIStore((s) => s.selectedComponentId);
  const setSelectedComponent = useUIStore((s) => s.setSelectedComponent);

  if (selectedComponentId !== componentId) return null;

  return (
    <div className="eods-template-options">
      <div className="eods-template-options__header">
        <h3>Component Options</h3>
        <button onClick={() => setSelectedComponent(null)}>Deselect</button>
      </div>
      <p>Component ID: {componentId}</p>
    </div>
  );
}
