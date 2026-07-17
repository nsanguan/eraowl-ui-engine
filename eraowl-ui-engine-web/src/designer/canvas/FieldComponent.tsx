import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useUIStore } from "../../store/useUIStore";
import type { DesignComponent } from "../../store/useUIStore";
import { getComponentMeta } from "../palette/componentRegistry";

interface FieldComponentProps {
  component: DesignComponent;
  containerType?: string;
  containerId?: string;
}

function ComponentPreview({ type, props }: { type: string; props: Record<string, unknown> }) {
  switch (type) {
    case "InputText":
      return (
        <input
          type="text"
          placeholder={(props.placeholder as string) || "Text input"}
          disabled
          style={{
            width: "100%",
            padding: "4px 8px",
            border: "1px solid var(--eut-color-border)",
            borderRadius: "var(--eut-radius-sm)",
            fontSize: props.fontSize as string,
            color: props.fontColor as string,
          }}
        />
      );
    case "Textarea":
      return (
        <textarea
          placeholder={(props.placeholder as string) || "Textarea"}
          disabled
          rows={(props.rows as number) || 3}
          style={{
            width: "100%",
            padding: "4px 8px",
            border: "1px solid var(--eut-color-border)",
            borderRadius: "var(--eut-radius-sm)",
            resize: "none",
            fontSize: props.fontSize as string,
            color: props.fontColor as string,
          }}
        />
      );
    case "Select":
      return (
        <select
          disabled
          style={{
            width: "100%",
            padding: "4px 8px",
            border: "1px solid var(--eut-color-border)",
            borderRadius: "var(--eut-radius-sm)",
            fontSize: props.fontSize as string,
            color: props.fontColor as string,
          }}
        >
          <option>{(props.placeholder as string) || "Select..."}</option>
        </select>
      );
    case "Checkbox":
      return (
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <input type="checkbox" disabled /> {(props.label as string) || "Checkbox"}
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
          style={{
            padding: "4px 8px",
            border: "1px solid var(--eut-color-border)",
            borderRadius: "var(--eut-radius-sm)",
            fontSize: props.fontSize as string,
            color: props.fontColor as string,
          }}
        />
      );
    case "NumberInput":
      return (
        <input
          type="number"
          disabled
          style={{
            width: "120px",
            padding: "4px 8px",
            border: "1px solid var(--eut-color-border)",
            borderRadius: "var(--eut-radius-sm)",
            fontSize: props.fontSize as string,
            color: props.fontColor as string,
          }}
        />
      );
    case "Lov":
      return (
        <div style={{ display: "flex", gap: "4px" }}>
          <input
            type="text"
            placeholder="Search..."
            disabled
            style={{
              flex: 1,
              padding: "4px 8px",
              border: "1px solid var(--eut-color-border)",
              borderRadius: "var(--eut-radius-sm)",
              fontSize: props.fontSize as string,
              color: props.fontColor as string,
            }}
          />
          <button
            disabled
            style={{
              padding: "4px 8px",
              background: "var(--eut-color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--eut-radius-sm)",
              cursor: "default",
            }}
          >
            ...
          </button>
        </div>
      );
    case "LovSelect":
      return (
        <select
          disabled
          style={{
            width: "100%",
            padding: "4px 8px",
            border: "1px solid var(--eut-color-border)",
            borderRadius: "var(--eut-radius-sm)",
            fontSize: props.fontSize as string,
            color: props.fontColor as string,
          }}
        >
          <option>Select...</option>
        </select>
      );
    default:
      return (
        <div style={{
          padding: "8px",
          border: "1px dashed var(--eut-color-border)",
          borderRadius: "var(--eut-radius-sm)",
          textAlign: "center",
          color: "var(--eut-color-text-secondary)",
          fontSize: "12px",
        }}>
          {getComponentMeta(type)?.icon} {getComponentMeta(type)?.name}
        </div>
      );
  }
}

export function FieldComponent({ component, containerType, containerId }: FieldComponentProps) {
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
  } = useSortable({
    id: component.id,
    data: {
      type: "sortable-item",
      componentType: component.type,
      containerType: containerType ?? "",
      containerId: containerId ?? null,
    },
  });

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
      className={`canvas-field ${selectedComponentId === component.id ? "canvas-field--selected" : ""}`}
      onClick={handleClick}
    >
      <div className="canvas-field__label">{component.name}</div>
      <div className="canvas-field__preview">
        <ComponentPreview type={component.type} props={component.props} />
      </div>
      <div className="canvas-field__actions">
        <button
          className="canvas-component__action-btn"
          title="Delete field"
          onClick={(e) => {
            e.stopPropagation();
            removeComponent(component.id);
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
