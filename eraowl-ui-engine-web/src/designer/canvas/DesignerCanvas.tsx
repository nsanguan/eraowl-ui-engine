import { useUIStore } from "../../store/useUIStore";
import { DragDropLayer } from "./DragDropLayer";

export function DesignerCanvas() {
  const layout = useUIStore((s) => s.currentLayout);

  if (!layout) {
    return (
      <div className="eods-canvas eods-canvas--empty">
        <p>No layout loaded. Create or load a page to begin designing.</p>
      </div>
    );
  }

  return (
    <DragDropLayer>
      <div className="eods-canvas" data-eut-theme="vita">
        <pre>{JSON.stringify(layout, null, 2)}</pre>
      </div>
    </DragDropLayer>
  );
}
