import { useUIStore } from "../../store/useUIStore";
import { getComponentMeta } from "../palette/componentRegistry";

const STYLE_FIELDS_FOR_DATA = ["Lov", "LovSelect"];
const STYLE_FIELDS_FOR_FORM = ["InputText", "Textarea", "Select", "Checkbox", "RadioGroup", "DatePicker", "NumberInput"];

export function PropertyInspector() {
  const selectedComponentId = useUIStore((s) => s.selectedComponentId);
  const components = useUIStore((s) => s.components);
  const updateComponent = useUIStore((s) => s.updateComponent);
  const removeComponent = useUIStore((s) => s.removeComponent);
  const setSelectedComponent = useUIStore((s) => s.setSelectedComponent);

  const selected = components.find((c) => c.id === selectedComponentId);

  if (!selected) {
    return (
      <div className="property-inspector property-inspector--empty">
        <p>Select a component on the canvas to inspect its properties.</p>
      </div>
    );
  }

  const meta = getComponentMeta(selected.type);
  const showStyleOverrides = STYLE_FIELDS_FOR_DATA.includes(selected.type) || STYLE_FIELDS_FOR_FORM.includes(selected.type);

  return (
    <aside className="property-inspector">
      <div className="property-inspector__header">
        <h3 className="property-inspector__title">
          {meta?.icon} {selected.type}
        </h3>
        <button
          className="property-inspector__close"
          onClick={() => setSelectedComponent(null)}
          title="Deselect"
        >
          ×
        </button>
      </div>

      <div className="property-inspector__body">
        {/* General */}
        <div className="property-inspector__section">
          <div className="property-inspector__section-title">General</div>

          <div className="property-inspector__field">
            <label className="property-inspector__label">Name</label>
            <input
              className="property-inspector__input"
              value={selected.name}
              onChange={(e) =>
                updateComponent(selected.id, { name: e.target.value })
              }
            />
          </div>

          <div className="property-inspector__field">
            <label className="property-inspector__label">Type</label>
            <input
              className="property-inspector__input"
              value={selected.type}
              disabled
            />
          </div>
        </div>

        {/* Component-specific props */}
        <div className="property-inspector__section">
          <div className="property-inspector__section-title">Properties</div>
          {Object.keys(selected.props).length === 0 ? (
            <p style={{ fontSize: "12px", color: "var(--eut-color-text-secondary)" }}>
              No configurable properties.
            </p>
          ) : (
            Object.entries(selected.props).map(([key, value]) => (
              <div className="property-inspector__field" key={key}>
                <label className="property-inspector__label">{key}</label>
                {typeof value === "boolean" ? (
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        updateComponent(selected.id, {
                          props: { ...selected.props, [key]: e.target.checked },
                        })
                      }
                    />
                    {key}
                  </label>
                ) : typeof value === "number" ? (
                  <input
                    className="property-inspector__input"
                    type="number"
                    value={value}
                    onChange={(e) =>
                      updateComponent(selected.id, {
                        props: {
                          ...selected.props,
                          [key]: Number(e.target.value),
                        },
                      })
                    }
                  />
                ) : typeof value === "string" ? (
                  <input
                    className="property-inspector__input"
                    value={value}
                    onChange={(e) =>
                      updateComponent(selected.id, {
                        props: { ...selected.props, [key]: e.target.value },
                      })
                    }
                  />
                ) : (
                  <input
                    className="property-inspector__input"
                    value={JSON.stringify(value)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        updateComponent(selected.id, {
                          props: { ...selected.props, [key]: parsed },
                        });
                      } catch {
                        // ignore invalid JSON
                      }
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Style overrides */}
        <div className="property-inspector__section">
          <div className="property-inspector__section-title">
            Style Overrides
          </div>
          <div className="property-inspector__field">
            <label className="property-inspector__label">styleRef</label>
            <input
              className="property-inspector__input"
              value={(selected.props["styleRef"] as string) ?? ""}
              placeholder="e.g. button-primary"
              onChange={(e) =>
                updateComponent(selected.id, {
                  props: { ...selected.props, styleRef: e.target.value },
                })
              }
            />
          </div>

          {showStyleOverrides && (
            <>
              <div className="property-inspector__field">
                <label className="property-inspector__label">fontSize</label>
                <input
                  className="property-inspector__input"
                  type="text"
                  value={(selected.props["fontSize"] as string) ?? ""}
                  placeholder="e.g. 14px, 1rem"
                  onChange={(e) =>
                    updateComponent(selected.id, {
                      props: { ...selected.props, fontSize: e.target.value },
                    })
                  }
                />
              </div>
              <div className="property-inspector__field">
                <label className="property-inspector__label">fontColor</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    className="property-inspector__input"
                    type="color"
                    value={(selected.props["fontColor"] as string) || "#000000"}
                    onChange={(e) =>
                      updateComponent(selected.id, {
                        props: { ...selected.props, fontColor: e.target.value },
                      })
                    }
                    style={{ width: "40px", height: "32px", padding: "2px", cursor: "pointer" }}
                  />
                  <input
                    className="property-inspector__input"
                    type="text"
                    value={(selected.props["fontColor"] as string) ?? ""}
                    placeholder="e.g. #333333"
                    onChange={(e) =>
                      updateComponent(selected.id, {
                        props: { ...selected.props, fontColor: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="property-inspector__footer">
        <button
          className="property-inspector__delete-btn"
          onClick={() => removeComponent(selected.id)}
        >
          Delete Component
        </button>
      </div>
    </aside>
  );
}
