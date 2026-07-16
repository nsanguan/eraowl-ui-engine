import { useState } from "react";
import { getComponentsByCategory } from "./componentRegistry";

const categoryLabels: Record<string, string> = {
  layout: "Layout",
  form: "Form",
  data: "Data",
  action: "Action",
};

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
                <div
                  key={meta.type}
                  className="component-palette__item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("component-type", meta.type);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
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
              ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
