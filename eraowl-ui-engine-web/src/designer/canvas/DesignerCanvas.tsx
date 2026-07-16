import { useUIStore } from "../../store/useUIStore";
import { DragDropLayer } from "./DragDropLayer";

export function DesignerCanvas() {
  const selectedComponentId = useUIStore((s) => s.selectedComponentId);
  const canvasZoom = useUIStore((s) => s.canvasZoom);
  const showGrid = useUIStore((s) => s.showGrid);

  return (
    <DragDropLayer>
      <div 
        className="eods-canvas" 
        data-eut-theme="vita"
        style={{ transform: `scale(${canvasZoom})`, position: 'relative' }}
      >
        {showGrid && <div className="eods-canvas__grid" />}
        <div className="eods-canvas__content">
          {selectedComponentId ? (
            <div>Selected: {selectedComponentId}</div>
          ) : (
            <p>No component selected.</p>
          )}
        </div>
      </div>
    </DragDropLayer>
  );
}
