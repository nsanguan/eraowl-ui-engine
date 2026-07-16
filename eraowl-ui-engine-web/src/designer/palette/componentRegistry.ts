export interface ComponentMeta {
  type: string;
  name: string;
  icon: string;
  category: "layout" | "form" | "data" | "action";
  description: string;
  defaultProps: Record<string, unknown>;
}

export const componentRegistry: ComponentMeta[] = [
  // Layout
  {
    type: "Region",
    name: "Region",
    icon: "◻",
    category: "layout",
    description: "Container for grouping child components",
    defaultProps: {},
  },
  {
    type: "GridRow",
    name: "Grid Row",
    icon: "⊞",
    category: "layout",
    description: "Horizontal grid row container",
    defaultProps: {},
  },
  {
    type: "GridColumn",
    name: "Grid Column",
    icon: "⊟",
    category: "layout",
    description: "Vertical grid column container",
    defaultProps: {},
  },

  // Form
  {
    type: "InputText",
    name: "Input Text",
    icon: "T",
    category: "form",
    description: "Single-line text input",
    defaultProps: { placeholder: "" },
  },
  {
    type: "Textarea",
    name: "Textarea",
    icon: "¶",
    category: "form",
    description: "Multi-line text input",
    defaultProps: { placeholder: "", rows: 4 },
  },
  {
    type: "Select",
    name: "Select",
    icon: "▾",
    category: "form",
    description: "Dropdown select input",
    defaultProps: { placeholder: "Select...", options: [] },
  },
  {
    type: "Checkbox",
    name: "Checkbox",
    icon: "☑",
    category: "form",
    description: "Toggle checkbox",
    defaultProps: { label: "Checkbox" },
  },
  {
    type: "RadioGroup",
    name: "Radio Group",
    icon: "◉",
    category: "form",
    description: "Radio button group",
    defaultProps: { options: [] },
  },
  {
    type: "DatePicker",
    name: "Date Picker",
    icon: "📅",
    category: "form",
    description: "Date selection input",
    defaultProps: { placeholder: "Select date" },
  },
  {
    type: "NumberInput",
    name: "Number Input",
    icon: "#",
    category: "form",
    description: "Numeric input field",
    defaultProps: { min: 0, max: 9999, step: 1 },
  },

  // Data
  {
    type: "Lov",
    name: "LOV",
    icon: "☰",
    category: "data",
    description: "List of Values picker",
    defaultProps: { resolverKey: "" },
  },
  {
    type: "LovSelect",
    name: "LOV Select",
    icon: "⇊",
    category: "data",
    description: "Cascading LOV dropdown",
    defaultProps: { resolverKey: "", dependsOn: "" },
  },
  {
    type: "Table",
    name: "Table",
    icon: "▦",
    category: "data",
    description: "Data table with columns",
    defaultProps: { columns: [] },
  },
  {
    type: "Card",
    name: "Card",
    icon: "▢",
    category: "data",
    description: "Card container for content",
    defaultProps: {},
  },

  // Action
  {
    type: "Button",
    name: "Button",
    icon: "⬜",
    category: "action",
    description: "Action button",
    defaultProps: { label: "Button", variant: "primary" },
  },
  {
    type: "IconButton",
    name: "Icon Button",
    icon: "⚙",
    category: "action",
    description: "Button with icon only",
    defaultProps: { icon: "⚙" },
  },
  {
    type: "Link",
    name: "Link",
    icon: "🔗",
    category: "action",
    description: "Hyperlink",
    defaultProps: { label: "Link", href: "#" },
  },
];

export function getComponentMeta(type: string): ComponentMeta | undefined {
  return componentRegistry.find((c) => c.type === type);
}

export function getComponentsByCategory(): Record<string, ComponentMeta[]> {
  const categories: Record<string, ComponentMeta[]> = {};
  for (const meta of componentRegistry) {
    const existing = categories[meta.category];
    if (existing) {
      existing.push(meta);
    } else {
      categories[meta.category] = [meta];
    }
  }
  return categories;
}

// ─── Drop Rules (single source of truth) ──────────────────────────
// Every component type that can be placed on the canvas.
export const ALLOWED_DROP_TYPES: string[] = componentRegistry.map((c) => c.type);

// Maps a container type to the set of component types it accepts.
const CONTAINER_ACCEPTS: Record<string, string[]> = {
  canvas: ["Region"],
  region: ["GridRow"],
  gridrow: ["GridColumn"],
  gridcol: ALLOWED_DROP_TYPES.filter(
    (t) => !["Region", "GridRow", "GridColumn"].includes(t),
  ),
};

export function canDropInto(
  containerType: string,
  componentType: string,
): boolean {
  const accepted = CONTAINER_ACCEPTS[containerType];
  return !!accepted && accepted.includes(componentType);
}
