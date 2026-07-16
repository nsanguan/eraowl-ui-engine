import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useUIStore } from "../../store/useUIStore";
import type { DesignComponent } from "../../store/useUIStore";
import { DroppableGridColumn } from "./DroppableGridColumn";
import { getComponentMeta } from "../palette/componentRegistry";

interface DroppableGridRowProps {
  component: DesignComponent;
}

export function DroppableGridRow({ component }: DroppableGridRowProps) {
  const components = useUIStore((s) => s.components);
  const selectedComponentId = useUIStore((s) => s.selectedComponentId);
  const setSelectedComponent = useUIStore((s) => s.setSelectedComponent);
  const removeComponent = useUIStore((s) => s.removeComponent);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: component.id,
    data: {
      type: "sortable-item",
      componentType: "GridRow",
    },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${component.id}`,
    data: {
      containerType: "gridrow",
      containerId: component.id,
    },
  });

  const gridColumns = components.filter((c) => c.parentId === component.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedComponent(component.id);
  };

  return (
    <div
      ref={(node) => {
        setSortableRef(node);
        setDroppableRef(node);
      }}
      style={style}
      {...attributes}
      {...listeners}
      className={`canvas-grid-row ${selectedComponentId === component.id ? "canvas-grid-row--selected" : ""} ${isOver ? "canvas-grid-row--dragover" : ""}`}
      data-container-type="GridRow"
      data-container-id={component.id}
      onClick={handleClick}
    >
      <div className="canvas-grid-row__header">
        <span className="canvas-grid-row__icon">{getComponentMeta("GridRow")?.icon}</span>
        <span className="canvas-grid-row__name">{component.name}</span>
        <div className="canvas-grid-row__actions">
          <button
            className="canvas-component__action-btn"
            title="Delete row"
            onClick={(e) => {
              e.stopPropagation();
              removeComponent(component.id);
            }}
          >
            ×
          </button>
        </div>
      </div>
      <div className="canvas-grid-row__body">
        <SortableContext
          items={gridColumns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          {gridColumns.length === 0 ? (
            <div className="canvas-grid-row__empty">
              Drop Grid Column here
            </div>
          ) : (
            gridColumns.map((col) => (
              <DroppableGridColumn key={col.id} component={col} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
