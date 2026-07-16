import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useUIStore } from "../../store/useUIStore";
import type { DesignComponent } from "../../store/useUIStore";
import { FieldComponent } from "./FieldComponent";
import { getComponentMeta } from "../palette/componentRegistry";

interface DroppableGridColumnProps {
  component: DesignComponent;
}

export function DroppableGridColumn({ component }: DroppableGridColumnProps) {
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
      componentType: "GridColumn",
    },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${component.id}`,
    data: {
      containerType: "GridColumn",
      containerId: component.id,
    },
  });

  const fields = components.filter((c) => c.parentId === component.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    flex: `1 1 ${100 / Math.max(components.filter((c) => c.parentId === component.parentId).length, 1)}%`,
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
      className={`canvas-grid-col ${selectedComponentId === component.id ? "canvas-grid-col--selected" : ""} ${isOver ? "canvas-grid-col--dragover" : ""}`}
      data-container-type="GridColumn"
      data-container-id={component.id}
      onClick={handleClick}
    >
      <div className="canvas-grid-col__header">
        <span className="canvas-grid-col__icon">{getComponentMeta("GridColumn")?.icon}</span>
        <span className="canvas-grid-col__name">{component.name}</span>
        <div className="canvas-grid-col__actions">
          <button
            className="canvas-component__action-btn"
            title="Delete column"
            onClick={(e) => {
              e.stopPropagation();
              removeComponent(component.id);
            }}
          >
            ×
          </button>
        </div>
      </div>
      <div className="canvas-grid-col__body">
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {fields.length === 0 ? (
            <div className="canvas-grid-col__empty">
              Drop field components here
            </div>
          ) : (
            fields.map((field) => (
              <FieldComponent key={field.id} component={field} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
