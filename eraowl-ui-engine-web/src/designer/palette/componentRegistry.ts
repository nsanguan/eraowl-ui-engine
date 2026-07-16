export interface ComponentMeta {
  type: string;
  name: string;
  icon: string;
  category: "layout" | "form" | "data" | "action" | "navigation";
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
    description: "Container for grouping child components (APEX Standard compatible)",
    defaultProps: {},
  },
  {
    type: "Standard",
    name: "Standard",
    icon: "▣",
    category: "layout",
    description: "APEX Standard region template — generic content container",
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
  {
    type: "FlexboxContainer",
    name: "Flexbox Container",
    icon: "⬘",
    category: "layout",
    description: "Flexible layout with direction, align, justify options",
    defaultProps: { direction: "row" },
  },
  {
    type: "ContentBlock",
    name: "Content Block",
    icon: "▬",
    category: "layout",
    description: "Simple content block with title and body",
    defaultProps: {},
  },
  {
    type: "ContentRow",
    name: "Content Row",
    icon: "☰",
    category: "layout",
    description: "Row with selection column, icon, description, and actions",
    defaultProps: {},
  },
  {
    type: "Hero",
    name: "Hero",
    icon: "★",
    category: "layout",
    description: "Hero banner with icon, heading, and buttons",
    defaultProps: {},
  },
  {
    type: "Image",
    name: "Image",
    icon: "🖼",
    category: "layout",
    description: "Single image display",
    defaultProps: { src: "" },
  },
  {
    type: "HelpText",
    name: "Help Text",
    icon: "?",
    category: "layout",
    description: "Page-level help content block",
    defaultProps: {},
  },
  {
    type: "Collapsible",
    name: "Collapsible",
    icon: "▼",
    category: "layout",
    description: "Toggle region content visibility",
    defaultProps: { collapsed: true },
  },
  {
    type: "InlineDialog",
    name: "Inline Dialog",
    icon: "⬜",
    category: "layout",
    description: "Modal dialog displayed on the current page",
    defaultProps: { open: false },
  },
  {
    type: "ButtonContainer",
    name: "Button Container",
    icon: "▤",
    category: "layout",
    description: "Toolbar for organizing buttons and actions",
    defaultProps: {},
  },
  {
    type: "TitleBar",
    name: "Title Bar",
    icon: "—",
    category: "layout",
    description: "Groups breadcrumbs, page title, and primary actions",
    defaultProps: {},
  },
  {
    type: "TabsContainer",
    name: "Tabs Container",
    icon: "≡",
    category: "layout",
    description: "Tabbed container for organizing content",
    defaultProps: {},
  },
  {
    type: "RegionDisplaySelector",
    name: "Region Display Selector",
    icon: "⊙",
    category: "layout",
    description: "Show/hide toggle for page regions",
    defaultProps: {},
  },
  {
    type: "StaticContent",
    name: "Static Content",
    icon: "¶",
    category: "layout",
    description: "Raw HTML content display",
    defaultProps: { body: "" },
  },
  {
    type: "PlasqlDynamicContent",
    name: "PL/SQL Dynamic Content",
    icon: "⚡",
    category: "layout",
    description: "Dynamically rendered HTML content",
    defaultProps: { body: "" },
  },

  // Form
  {
    type: "FormField",
    name: "Form Field",
    icon: "▭",
    category: "form",
    description: "Form field wrapper with label, input, and help text",
    defaultProps: { label: "Field" },
  },
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
  {
    type: "LovSelect",
    name: "LOV Select",
    icon: "⇊",
    category: "form",
    description: "Cascading LOV dropdown",
    defaultProps: { resolverKey: "", dependsOn: "" },
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
    type: "ClassicReport",
    name: "Classic Report",
    icon: "▦",
    category: "data",
    description: "Tabular data report",
    defaultProps: { columns: [] },
  },
  {
    type: "InteractiveReport",
    name: "Interactive Report",
    icon: "⊞",
    category: "data",
    description: "Report with search, sort, and column controls",
    defaultProps: { columns: [] },
  },
  {
    type: "InteractiveGrid",
    name: "Interactive Grid",
    icon: "⊟",
    category: "data",
    description: "Editable data grid with inline editing",
    defaultProps: { columns: [] },
  },
  {
    type: "ColumnToggleReport",
    name: "Column Toggle Report",
    icon: "☷",
    category: "data",
    description: "Report with responsive column chooser",
    defaultProps: { columns: [] },
  },
  {
    type: "ReflowReport",
    name: "Reflow Report",
    icon: "⋮",
    category: "data",
    description: "Vertical card-style data display for small screens",
    defaultProps: { columns: [] },
  },
  {
    type: "ContextualInfo",
    name: "Contextual Info",
    icon: "ℹ",
    category: "data",
    description: "Key-value information display",
    defaultProps: {},
  },
  {
    type: "ValueAttributePairs",
    name: "Value Attribute Pairs",
    icon: "≣",
    category: "data",
    description: "Attribute-value pair display",
    defaultProps: {},
  },
  {
    type: "CardRegions",
    name: "Card Regions",
    icon: "▢",
    category: "data",
    description: "APEX Card Regions — present info in small blocks",
    defaultProps: {},
  },
  {
    type: "CardTemplates",
    name: "Card Templates",
    icon: "▣",
    category: "data",
    description: "Style reports/lists as card templates",
    defaultProps: {},
  },
  {
    type: "Calendar",
    name: "Calendar",
    icon: "📅",
    category: "data",
    description: "Calendar display based on Full Calendar",
    defaultProps: {},
  },
  {
    type: "Carousel",
    name: "Carousel",
    icon: "❮❯",
    category: "data",
    description: "Slideshow carousel of sub-regions",
    defaultProps: {},
  },
  {
    type: "Charts",
    name: "Charts",
    icon: "📊",
    category: "data",
    description: "JET-based data visualizations",
    defaultProps: { chartType: "bar" },
  },
  {
    type: "MetricCard",
    name: "Metric Card",
    icon: "◆",
    category: "data",
    description: "Single key metric display with label and value",
    defaultProps: { label: "Metric", value: 0 },
  },
  {
    type: "Comments",
    name: "Comments",
    icon: "💬",
    category: "data",
    description: "User comments and status updates display",
    defaultProps: {},
  },
  {
    type: "Timeline",
    name: "Timeline",
    icon: "⏱",
    category: "data",
    description: "Vertical timeline of recent activity",
    defaultProps: {},
  },
  {
    type: "Tree",
    name: "Tree",
    icon: "🌳",
    category: "data",
    description: "Hierarchical navigation tree",
    defaultProps: {},
  },
  {
    type: "Wizard",
    name: "Wizard",
    icon: "➡",
    category: "data",
    description: "Multi-step wizard container",
    defaultProps: {},
  },

  // Feedback / Display
  {
    type: "Alert",
    name: "Alert",
    icon: "⚠",
    category: "data",
    description: "Displays alerts, confirmations, and action-oriented messages",
    defaultProps: { alertType: "info" },
  },
  {
    type: "Badge",
    name: "Badge",
    icon: "⊕",
    category: "data",
    description: "Content badge with variant styling",
    defaultProps: { label: "New", variant: "neutral" },
  },
  {
    type: "BadgesList",
    name: "Badges List",
    icon: "⊞",
    category: "data",
    description: "List of badge counters",
    defaultProps: {},
  },
  {
    type: "Avatar",
    name: "Avatar",
    icon: "👤",
    category: "data",
    description: "Displays icon, image, or initials",
    defaultProps: { size: "md", shape: "circle" },
  },
  {
    type: "MetricCard",
    name: "Metric Card",
    icon: "◆",
    category: "data",
    description: "Displays a key value with label",
    defaultProps: { label: "Metric", value: 0 },
  },

  // Navigation
  {
    type: "Link",
    name: "Link",
    icon: "🔗",
    category: "navigation",
    description: "Hyperlink",
    defaultProps: { label: "Link", href: "#" },
  },
  {
    type: "Breadcrumb",
    name: "Breadcrumb",
    icon: "›",
    category: "navigation",
    description: "Hierarchical navigation path",
    defaultProps: {},
  },
  {
    type: "LinksList",
    name: "Links List",
    icon: "≡",
    category: "navigation",
    description: "Navigation links list with badges and icons",
    defaultProps: {},
  },
  {
    type: "ListView",
    name: "List View",
    icon: "☰",
    category: "navigation",
    description: "Mobile-style list view with search and dividers",
    defaultProps: {},
  },
  {
    type: "MediaList",
    name: "Media List",
    icon: "▤",
    category: "navigation",
    description: "List with icon, heading, description, and badge",
    defaultProps: {},
  },
  {
    type: "MenuBar",
    name: "Menu Bar",
    icon: "≡",
    category: "navigation",
    description: "Horizontal menu bar control",
    defaultProps: {},
  },
  {
    type: "MenuPopup",
    name: "Menu Popup",
    icon: "▾",
    category: "navigation",
    description: "Popup menu triggered by a button",
    defaultProps: {},
  },
  {
    type: "NavigationBar",
    name: "Navigation Bar",
    icon: "—",
    category: "navigation",
    description: "Top navigation bar",
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
    type: "ButtonGroup",
    name: "Button Group",
    icon: "⊞",
    category: "action",
    description: "Group of buttons appearing as a single control",
    defaultProps: {},
  },
  // Utility
  {
    type: "ScrollBar",
    name: "Scroll Bar",
    icon: "⇳",
    category: "layout",
    description: "Scrollable container with custom vertical or horizontal scrollbar",
    defaultProps: { orientation: "vertical", height: "300px", thickness: "thin" },
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
  canvas: ["Region", "Standard", "Hero", "ContentBlock", "ContentRow", "FlexboxContainer", "ButtonContainer", "TabsContainer", "TitleBar", "Collapsible", "InlineDialog", "HelpText", "Image", "StaticContent", "PlasqlDynamicContent", "RegionDisplaySelector", "Wizard", "ScrollBar"],
  region: ["GridRow", "FlexboxContainer", "ContentBlock", "ContentRow", "ButtonContainer", "Collapsible", "TabsContainer", "TitleBar", "Standard", "Hero", "InlineDialog", "ScrollBar"],
  standard: ["GridRow", "FlexboxContainer", "ContentBlock", "ContentRow", "ButtonContainer"],
  gridrow: ["GridColumn"],
  gridcol: ALLOWED_DROP_TYPES.filter(
    (t) => !["Region", "Standard", "GridRow", "GridColumn", "FlexboxContainer", "TabsContainer", "Canvas", "region", "gridrow", "gridcol"].includes(t),
  ),
  flexboxcontainer: ALLOWED_DROP_TYPES.filter(
    (t) => !["Region", "Standard", "GridRow", "GridColumn", "Canvas"].includes(t),
  ),
  tabscontainer: ["Region", "Standard", "ContentBlock", "ButtonContainer", "Hero"],
  collapsible: ALLOWED_DROP_TYPES.filter(
    (t) => !["Region", "Standard", "GridRow", "GridColumn", "Canvas"].includes(t),
  ),
  wizard: ["Region", "Standard", "ContentBlock", "ButtonContainer"],
};

export function canDropInto(
  containerType: string,
  componentType: string,
): boolean {
  const accepted = CONTAINER_ACCEPTS[containerType];
  return !!accepted && accepted.includes(componentType);
}
