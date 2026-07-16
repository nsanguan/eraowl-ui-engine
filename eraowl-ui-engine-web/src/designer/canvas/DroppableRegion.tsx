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
  component: DesignComponent;
  children?: React.ReactNode;
}

export function DroppableRegion({ component, children }: DroppableRegionProps) {
  const components = useUIStore((s) => s.components);
  const selectedComponentId = useUIStore((s) => s.selectedComponentId);
  const setSelectedComponent = useUIStore((s) => s.setSelectedComponent);
  const removeComponent = useUIStore((s) => s.removeComponent);

  const { setNodeRef, isOver } = useDroppable({
    id: `region-${component.id}`,
    data: {
      containerType: "region",
      containerId: component.id,
    },
  });

  const gridRows = components.filter((c) => c.parentId === component.id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedComponent(component.id);
  };

  return (
    <div
      ref={setNodeRef}
      className={`canvas-region ${selectedComponentId === component.id ? "canvas-region--selected" : ""} ${isOver ? "canvas-region--dragover" : ""}`}
      onClick={handleClick}
    >
      <div className="canvas-region__header">
        <span className="canvas-region__icon">{getComponentMeta("Region")?.icon}</span>
        <span className="canvas-region__name">{component.name}</span>
        <span className="canvas-region__type">Region</span>
        <div className="canvas-region__actions">
          <button
            className="canvas-component__action-btn"
            title="Delete region"
            onClick={(e) => {
              e.stopPropagation();
              removeComponent(component.id);
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
      {children}
    </div>
  );
}
