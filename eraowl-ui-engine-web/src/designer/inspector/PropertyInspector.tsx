import { useUIStore } from "../../store/useUIStore";
import { TemplateOptionsPanel } from "./TemplateOptionsPanel";

export function PropertyInspector() {
  const selectedComponentId = useUIStore((s) => s.selectedComponentId);

  if (!selectedComponentId) {
    return (
      <div className="eods-inspector eods-inspector--empty">
        <p>Select a component on the canvas to inspect its properties.</p>
      </div>
    );
  }

  return (
    <aside className="eods-inspector">
      <h3>Properties</h3>
      <TemplateOptionsPanel componentId={selectedComponentId} />
    </aside>
  );
}
