import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { useUIStore } from "../../store/useUIStore";
import { getComponentMeta } from "../palette/componentRegistry";
import { DroppableRegion } from "./DroppableRegion";

export function HierarchicalCanvas() {
  const components = useUIStore((s) => s.components);
  const addComponent = useUIStore((s) => s.addComponent);
  const selectedComponentId = useUIStore((s) => s.selectedComponentId);
  const setSelectedComponent = useUIStore((s) => s.setSelectedComponent);
  const canvasZoom = useUIStore((s) => s.canvasZoom);
  const showGrid = useUIStore((s) => s.showGrid);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const regions = components.filter((c) => c.parentId === null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    if (data) {
      setActiveId(active.id as string);
      setActiveType(data.componentType);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    const componentType = activeData.componentType;
    const containerType = overData.containerType;
    const containerId = overData.containerId;

    if (!componentType || !containerType) return;

    const defaultProps = getComponentMeta(componentType)?.defaultProps ?? {};

    if (containerType === "canvas" && componentType === "Region") {
      addComponent(componentType, defaultProps, undefined, null);
    } else if (containerType === "region" && componentType === "GridRow") {
      addComponent(componentType, defaultProps, undefined, containerId);
    } else if (containerType === "gridrow" && componentType === "GridColumn") {
      addComponent(componentType, defaultProps, undefined, containerId);
    } else if (
      containerType === "gridcol" &&
      ["InputText", "Textarea", "Select", "Checkbox", "RadioGroup", "DatePicker", "NumberInput", "Lov", "LovSelect"].includes(componentType)
    ) {
      addComponent(componentType, defaultProps, undefined, containerId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
              regions.map((comp) => (
                <DroppableRegion key={comp.id} component={comp}>
                  {selectedComponentId === comp.id && (
                    <div className="canvas-component--selected-overlay" />
                  )}
                </DroppableRegion>
              ))
            )}
          </div>
        </CanvasDropZone>
      </div>

      <DragOverlay>
        {activeId && activeType ? (
          <div className="drag-overlay">
            {getComponentMeta(activeType)?.icon} {getComponentMeta(activeType)?.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
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
