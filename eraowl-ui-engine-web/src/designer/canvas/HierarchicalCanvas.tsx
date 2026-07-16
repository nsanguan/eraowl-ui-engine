import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { useUIStore } from "../../store/useUIStore";
import { getComponentMeta } from "../palette/componentRegistry";
import { DroppableRegion } from "./DroppableRegion";

const ACCEPTED_CANVAS_TYPES = ["Region"];

export function HierarchicalCanvas() {
  const components = useUIStore((s) => s.components);
  const addComponent = useUIStore((s) => s.addComponent);
  const moveComponent = useUIStore((s) => s.moveComponent);
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
      if (data.type === "palette-item") {
        setActiveId(`palette-${data.componentType}`);
        setActiveType(data.componentType);
      } else {
        setActiveId(active.id as string);
        setActiveType(data.componentType);
      }
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
    const targetContainerType = overData.containerType;
    const targetId = overData.containerId;

    if (activeData.type === "palette-item") {
      if (targetContainerType === "canvas" && ACCEPTED_CANVAS_TYPES.includes(componentType)) {
        addComponent(componentType, getComponentMeta(componentType)?.defaultProps ?? {}, undefined, null);
      } else if (targetContainerType === "Region" && componentType === "GridRow") {
        addComponent(componentType, getComponentMeta(componentType)?.defaultProps ?? {}, undefined, targetId);
      } else if (targetContainerType === "GridRow" && componentType === "GridColumn") {
        addComponent(componentType, getComponentMeta(componentType)?.defaultProps ?? {}, undefined, targetId);
      } else if (targetContainerType === "GridColumn" && ["InputText", "Textarea", "Select", "Checkbox", "RadioGroup", "DatePicker", "NumberInput", "Lov", "LovSelect"].includes(componentType)) {
        addComponent(componentType, getComponentMeta(componentType)?.defaultProps ?? {}, undefined, targetId);
      }
    } else {
      if (activeData.type === "sortable-item") {
        const draggableType = activeData.componentType;
        if (targetContainerType === "canvas" && ACCEPTED_CANVAS_TYPES.includes(draggableType)) {
          moveComponent(active.id as string, null, 0);
        } else if (targetContainerType === "Region" && draggableType === "GridRow") {
          moveComponent(active.id as string, targetId, 0);
        } else if (targetContainerType === "GridRow" && draggableType === "GridColumn") {
          moveComponent(active.id as string, targetId, 0);
        } else if (targetContainerType === "GridColumn" && ["InputText", "Textarea", "Select", "Checkbox", "RadioGroup", "DatePicker", "NumberInput", "Lov", "LovSelect"].includes(draggableType)) {
          moveComponent(active.id as string, targetId, 0);
        }
      }
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
        <div
          className={`eods-canvas__content ${regions.length > 0 ? "eods-canvas__content--has-items" : ""}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedComponent(null);
            }
          }}
        >
          {regions.length === 0 ? (
            <DroppableRegion id="canvas-dropzone" isCanvasDropzone>
              <div className="eods-canvas__empty">
                <div className="eods-canvas__empty-icon">◻</div>
                <div className="eods-canvas__empty-text">
                  Drag Region components here
                </div>
                <div className="eods-canvas__empty-hint">
                  Only Region components can be placed directly on the canvas
                </div>
              </div>
            </DroppableRegion>
          ) : (
            regions.map((comp) => (
              <DroppableRegion key={comp.id} id={comp.id} component={comp}>
                {selectedComponentId === comp.id && (
                  <div className="canvas-component--selected-overlay" />
                )}
              </DroppableRegion>
            ))
          )}
        </div>
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
