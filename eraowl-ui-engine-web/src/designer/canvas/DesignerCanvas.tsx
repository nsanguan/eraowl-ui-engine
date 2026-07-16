import { useUIStore } from "../../store/useUIStore";
import { DragDropLayer } from "./DragDropLayer";
import { getComponentMeta } from "../palette/componentRegistry";

function ComponentPreview({ type }: { type: string }) {
  const meta = getComponentMeta(type);
  if (!meta) return <span>{type}</span>;

  switch (type) {
    case "InputText":
      return (
        <input
          type="text"
          placeholder="Text input"
          disabled
          style={{ width: "100%", padding: "4px 8px", border: "1px solid var(--eut-color-border)", borderRadius: "var(--eut-radius-sm)" }}
        />
      );
    case "Textarea":
      return (
        <textarea
          placeholder="Textarea"
          disabled
          rows={3}
          style={{ width: "100%", padding: "4px 8px", border: "1px solid var(--eut-color-border)", borderRadius: "var(--eut-radius-sm)", resize: "none" }}
        />
      );
    case "Select":
      return (
        <select disabled style={{ width: "100%", padding: "4px 8px", border: "1px solid var(--eut-color-border)", borderRadius: "var(--eut-radius-sm)" }}>
          <option>Select...</option>
        </select>
      );
    case "Checkbox":
      return (
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <input type="checkbox" disabled /> Checkbox
        </label>
      );
    case "RadioGroup":
      return (
        <div style={{ display: "flex", gap: "12px", fontSize: "13px" }}>
          <label><input type="radio" disabled /> Option A</label>
          <label><input type="radio" disabled /> Option B</label>
        </div>
      );
    case "DatePicker":
      return (
        <input
          type="date"
          disabled
          style={{ padding: "4px 8px", border: "1px solid var(--eut-color-border)", borderRadius: "var(--eut-radius-sm)" }}
        />
      );
    case "NumberInput":
      return (
        <input
          type="number"
          disabled
          style={{ width: "120px", padding: "4px 8px", border: "1px solid var(--eut-color-border)", borderRadius: "var(--eut-radius-sm)" }}
        />
      );
    case "Button":
      return (
        <button disabled style={{ padding: "4px 12px", background: "var(--eut-color-primary)", color: "#fff", border: "none", borderRadius: "var(--eut-radius-sm)", cursor: "default" }}>
          Button
        </button>
      );
    case "IconButton":
      return (
        <button disabled style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--eut-color-border)", borderRadius: "var(--eut-radius-sm)", cursor: "default" }}>
          ⚙
        </button>
      );
    case "Link":
      return (
        <span style={{ color: "var(--eut-color-primary)", textDecoration: "underline", cursor: "default" }}>Link</span>
      );
    default:
      return (
        <div style={{ padding: "8px", border: "1px dashed var(--eut-color-border)", borderRadius: "var(--eut-radius-sm)", textAlign: "center", color: "var(--eut-color-text-secondary)", fontSize: "12px" }}>
          {meta.icon} {meta.name}
        </div>
      );
  }
}

export function DesignerCanvas() {
  const selectedComponentId = useUIStore((s) => s.selectedComponentId);
  const setSelectedComponent = useUIStore((s) => s.setSelectedComponent);
  const components = useUIStore((s) => s.components);
  const canvasZoom = useUIStore((s) => s.canvasZoom);
  const showGrid = useUIStore((s) => s.showGrid);
  const removeComponent = useUIStore((s) => s.removeComponent);

  return (
    <DragDropLayer>
      <div
        className="eods-canvas"
        data-eut-theme="vita"
        style={{ transform: `scale(${canvasZoom})`, position: "relative" }}
      >
        {showGrid && <div className="eods-canvas__grid" />}
        <div
          className={`eods-canvas__content ${components.length > 0 ? "eods-canvas__content--has-items" : ""}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedComponent(null);
            }
          }}
        >
          {components.length === 0 ? (
            <div className="eods-canvas__empty">
              <div className="eods-canvas__empty-icon">◻</div>
              <div className="eods-canvas__empty-text">
                Drag components here
              </div>
              <div className="eods-canvas__empty-hint">
                Select components from the palette on the left
              </div>
            </div>
          ) : (
            components.map((comp) => (
              <div
                key={comp.id}
                className={`canvas-component ${selectedComponentId === comp.id ? "canvas-component--selected" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedComponent(comp.id);
                }}
              >
                <div className="canvas-component__label">
                  {comp.name}
                  <span style={{ opacity: 0.5, marginLeft: 6 }}>({comp.type})</span>
                </div>
                <div className="canvas-component__preview">
                  <ComponentPreview type={comp.type} />
                </div>
                <div className="canvas-component__actions">
                  <button
                    className="canvas-component__action-btn"
                    title="Delete component"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeComponent(comp.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DragDropLayer>
  );
}
