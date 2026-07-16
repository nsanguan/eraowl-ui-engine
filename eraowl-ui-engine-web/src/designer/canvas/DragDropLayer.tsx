import { useState, type ReactNode } from "react";
import { useUIStore } from "../../store/useUIStore";
import { getComponentMeta } from "../palette/componentRegistry";

interface DragDropLayerProps {
  children: ReactNode;
}

export function DragDropLayer({ children }: DragDropLayerProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const addComponent = useUIStore((s) => s.addComponent);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const componentType = e.dataTransfer.getData("component-type");
    if (componentType) {
      const meta = getComponentMeta(componentType);
      if (meta) {
        addComponent(componentType, meta.defaultProps, meta.name);
      }
    }
  };

  return (
    <div
      className={`designer-canvas-wrapper ${isDragOver ? "designer-canvas-wrapper--dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
}
