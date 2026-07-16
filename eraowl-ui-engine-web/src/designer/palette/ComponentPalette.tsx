import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { getComponentsByCategory, type ComponentMeta } from "./componentRegistry";

const categoryLabels: Record<string, string> = {
  layout: "Layout",
  form: "Form",
  data: "Data",
  action: "Action",
};

function DraggablePaletteItem({ meta }: { meta: ComponentMeta }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${meta.type}`,
    data: {
      type: "palette-item",
      componentType: meta.type,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`component-palette__item ${isDragging ? "component-palette__item--dragging" : ""}`}
      title={meta.description}
    >
      <div className="component-palette__item-icon">
        {meta.icon}
      </div>
      <div className="component-palette__item-info">
        <div className="component-palette__item-name">
          {meta.name}
        </div>
        <div className="component-palette__item-desc">
          {meta.description}
        </div>
      </div>
    </div>
  );
}

export function ComponentPalette() {
  const [search, setSearch] = useState("");
  const categories = getComponentsByCategory();
  const searchLower = search.toLowerCase();

  return (
    <aside className="component-palette">
      <div className="component-palette__header">Components</div>
      <div className="component-palette__search">
        <input
          className="component-palette__search-input"
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="component-palette__list">
        {(["layout", "form", "data", "action"] as const).map((cat) => {
          const items = (categories[cat] ?? []).filter(
            (c) =>
              !search ||
              c.name.toLowerCase().includes(searchLower) ||
              c.description.toLowerCase().includes(searchLower),
          );
          if (items.length === 0) return null;
          return (
            <div key={cat}>
              <div className="component-palette__category">
                {categoryLabels[cat]}
              </div>
              {items.map((meta) => (
                <DraggablePaletteItem key={meta.type} meta={meta} />
              ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
