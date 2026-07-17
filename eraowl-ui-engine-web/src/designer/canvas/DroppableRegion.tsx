import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useUIStore } from "../../store/useUIStore";
import type { DesignComponent } from "../../store/useUIStore";
import { DroppableGridRow } from "./DroppableGridRow";
import { FieldComponent } from "./FieldComponent";
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: component.id,
    data: {
      type: "sortable-item",
      componentType: "Region",
      containerType: "region",
      containerId: component.id,
    },
  });

  const allChildren = components.filter((c) => c.parentId === component.id);
  const gridRows = allChildren.filter((c) => c.type === "GridRow");
  const directChildren = allChildren.filter((c) => c.type !== "GridRow");

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
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
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
        {allChildren.length === 0 ? (
          <div className="canvas-region__empty">
            Drag in Grid Row for layout, or drop form/data/action components directly
          </div>
        ) : (
          <>
            <SortableContext
              items={gridRows.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              {gridRows.length > 0 ? (
                gridRows.map((row) => (
                  <DroppableGridRow key={row.id} component={row} />
                ))
              ) : (
                <div className="canvas-region__hint">
                  Grid Row lets you arrange components in columns
                </div>
              )}
            </SortableContext>
            {directChildren.length > 0 && (
              <div className="canvas-region__direct-items">
                {directChildren.map((child) => (
                  <FieldComponent
                    key={child.id}
                    component={child}
                    containerType="region"
                    containerId={component.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {children}
    </div>
  );
}
