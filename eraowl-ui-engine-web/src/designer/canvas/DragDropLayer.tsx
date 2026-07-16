import type { ReactNode } from "react";

interface DragDropLayerProps {
  children: ReactNode;
}

export function DragDropLayer({ children }: DragDropLayerProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData("component-type");
    if (componentType) {
      // TODO: dispatch ADD_COMPONENT action to UI store
      console.log("Dropped component:", componentType);
    }
  };

  return (
    <div
      className="eods-drag-drop-layer"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
}
