import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import "../designer/designer.css";
import { DesignerToolbar } from "../designer/toolbar/DesignerToolbar";
import { ComponentPalette } from "../designer/palette/ComponentPalette";
import { CanvasArea } from "../designer/canvas/CanvasArea";
import { PropertyInspector } from "../designer/inspector/PropertyInspector";
import { useUIStore } from "../store/useUIStore";
import {
  getComponentMeta,
  canDropInto,
} from "../designer/palette/componentRegistry";

export function DesignerPage() {
  const addComponent = useUIStore((s) => s.addComponent);
  const moveComponent = useUIStore((s) => s.moveComponent);
  const reorderWithinParent = useUIStore((s) => s.reorderWithinParent);
  const getChildren = useUIStore((s) => s.getChildren);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

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

    const componentType = activeData.componentType as string | undefined;
    const containerType = overData.containerType as string | undefined;
    const containerId = overData.containerId as string | null | undefined;

    if (!componentType || !containerType) return;

    // Case 1: dragging an existing canvas component (reorder / move)
    if (activeData.type === "sortable-item") {
      const draggedId = active.id as string;
      const overId = over.id as string;

      if (draggedId === overId) return;

      const childIds = getChildren(containerId ?? null).map((c) => c.id);
      let targetIndex = childIds.indexOf(overId);

      // Dropped onto a container droppable (not a specific child) → append
      const isOverContainer =
        !overData.type || overData.type === "container";
      if (isOverContainer || targetIndex === -1) {
        targetIndex = childIds.length;
      }

      // Determine if the move stays within the same parent
      const currentComponent = useUIStore
        .getState()
        .components.find((c) => c.id === draggedId);
      const sameParent =
        currentComponent?.parentId === (containerId ?? null);

      if (sameParent) {
        // adjust index because removal shifts positions
        const before = childIds.indexOf(draggedId);
        if (before !== -1 && before < targetIndex) {
          targetIndex -= 1;
        }
        reorderWithinParent(draggedId, targetIndex);
      } else {
        moveComponent(draggedId, containerId ?? null, targetIndex);
      }
      return;
    }

    // Case 2: dragging a palette item → add new component
    if (activeData.type !== "palette-item") return;
    if (!canDropInto(containerType, componentType)) return;

    const defaultProps = getComponentMeta(componentType)?.defaultProps ?? {};
    addComponent(componentType, defaultProps, undefined, containerId ?? null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="designer-page">
        <DesignerToolbar />
        <div className="designer-panels">
          <ComponentPalette />
          <CanvasArea />
          <PropertyInspector />
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
