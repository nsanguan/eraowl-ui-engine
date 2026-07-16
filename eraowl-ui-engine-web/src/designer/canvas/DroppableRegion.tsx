import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useUIStore } from "../../store/useUIStore";
import type { DesignComponent } from "../../store/useUIStore";
import { DroppableGridRow } from "./DroppableGridRow";
import { getComponentMeta } from "../palette/componentRegistry";

interface DroppableRegionProps {
  id: string;
  component?: DesignComponent;
  isCanvasDropzone?: boolean;
  children?: React.ReactNode;
}

export function DroppableRegion({
  id,
  component,
  isCanvasDropzone,
  children,
}: DroppableRegionProps) {
  const components = useUIStore((s) => s.components);
  const selectedComponentId = useUIStore((s) => s.selectedComponentId);
  const setSelectedComponent = useUIStore((s) => s.setSelectedComponent);
  const removeComponent = useUIStore((s) => s.removeComponent);

  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      containerType: "Region",
      containerId: component?.id ?? null,
    },
  });

  const gridRows = components.filter((c) => c.parentId === id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (component) {
      setSelectedComponent(component.id);
    }
  };

  if (isCanvasDropzone) {
    return (
      <div
        ref={setNodeRef}
        className={`region-dropzone ${isOver ? "region-dropzone--active" : ""}`}
        data-container-type="Region"
        data-container-id={id}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`canvas-region ${selectedComponentId === id ? "canvas-region--selected" : ""} ${isOver ? "canvas-region--dragover" : ""}`}
      data-container-type="Region"
      data-container-id={id}
      onClick={handleClick}
    >
      <div className="canvas-region__header">
        <span className="canvas-region__icon">{getComponentMeta("Region")?.icon}</span>
        <span className="canvas-region__name">{component?.name}</span>
        <span className="canvas-region__type">Region</span>
        <div className="canvas-region__actions">
          <button
            className="canvas-component__action-btn"
            title="Delete region"
            onClick={(e) => {
              e.stopPropagation();
              removeComponent(id);
            }}
          >
            ×
          </button>
        </div>
      </div>
      <div className="canvas-region__body">
        <SortableContext
          items={gridRows.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {gridRows.length === 0 ? (
            <div className="canvas-region__empty">
              Drop Grid Row here
            </div>
          ) : (
            gridRows.map((row) => (
              <DroppableGridRow key={row.id} component={row} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
