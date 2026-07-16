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
import { getComponentMeta } from "../designer/palette/componentRegistry";

const FIELD_TYPES = ["InputText", "Textarea", "Select", "Checkbox", "RadioGroup", "DatePicker", "NumberInput", "Lov", "LovSelect"];

export function DesignerPage() {
  const addComponent = useUIStore((s) => s.addComponent);

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

    const componentType = activeData.componentType;
    const containerType = overData.containerType;
    const containerId = overData.containerId;

    if (!componentType || !containerType) return;

    const defaultProps = getComponentMeta(componentType)?.defaultProps ?? {};

    // Canvas accepts Region
    if (containerType === "canvas" && componentType === "Region") {
      addComponent(componentType, defaultProps, undefined, null);
    }
    // Region accepts GridRow
    else if (containerType === "region" && componentType === "GridRow") {
      addComponent(componentType, defaultProps, undefined, containerId);
    }
    // GridRow accepts GridColumn
    else if (containerType === "gridrow" && componentType === "GridColumn") {
      addComponent(componentType, defaultProps, undefined, containerId);
    }
    // GridColumn accepts field components
    else if (containerType === "gridcol" && FIELD_TYPES.includes(componentType)) {
      addComponent(componentType, defaultProps, undefined, containerId);
    }
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
