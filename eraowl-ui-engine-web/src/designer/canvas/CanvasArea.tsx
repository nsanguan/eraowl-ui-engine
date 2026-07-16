import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useUIStore } from "../../store/useUIStore";
import { DroppableRegion } from "./DroppableRegion";

export function CanvasArea() {
  const components = useUIStore((s) => s.components);
  const selectedComponentId = useUIStore((s) => s.selectedComponentId);
  const setSelectedComponent = useUIStore((s) => s.setSelectedComponent);
  const canvasZoom = useUIStore((s) => s.canvasZoom);
  const showGrid = useUIStore((s) => s.showGrid);

  const regions = components.filter((c) => c.parentId === null);

  return (
    <div
      className="eods-canvas"
      data-eut-theme="vita"
      style={{ transform: `scale(${canvasZoom})`, position: "relative" }}
    >
      {showGrid && <div className="eods-canvas__grid" />}
      <CanvasDropZone>
        <div
          className={`eods-canvas__content ${regions.length > 0 ? "eods-canvas__content--has-items" : ""}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedComponent(null);
            }
          }}
        >
          {regions.length === 0 ? (
            <div className="eods-canvas__empty">
              <div className="eods-canvas__empty-icon">◻</div>
              <div className="eods-canvas__empty-text">
                Drag Region components here
              </div>
              <div className="eods-canvas__empty-hint">
                Only Region components can be placed directly on the canvas
              </div>
            </div>
          ) : (
            <SortableContext
              items={regions.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {regions.map((comp) => (
                <DroppableRegion key={comp.id} component={comp}>
                  {selectedComponentId === comp.id && (
                    <div className="canvas-component--selected-overlay" />
                  )}
                </DroppableRegion>
              ))}
            </SortableContext>
          )}
        </div>
      </CanvasDropZone>
    </div>
  );
}

function CanvasDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-dropzone",
    data: {
      containerType: "canvas",
      containerId: null,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`canvas-dropzone ${isOver ? "canvas-dropzone--active" : ""}`}
    >
      {children}
    </div>
  );
}
