import "../designer/designer.css";
import { DesignerToolbar } from "../designer/toolbar/DesignerToolbar";
import { ComponentPalette } from "../designer/palette/ComponentPalette";
import { HierarchicalCanvas } from "../designer/canvas/HierarchicalCanvas";
import { PropertyInspector } from "../designer/inspector/PropertyInspector";

export function DesignerPage() {
  return (
    <div className="designer-page">
      <DesignerToolbar />
      <div className="designer-panels">
        <ComponentPalette />
        <HierarchicalCanvas />
        <PropertyInspector />
      </div>
    </div>
  );
}
