# GLOBAL_DESIGN.md — EraOwl UI Engine Design System

This document defines the global design language, component patterns, and visual standards for the EraOwl UI Engine.

---

## 1. Design Principles

### 1.1 Core Principles

| Principle | Description |
|-----------|-------------|
| **Declarative First** | UI defined as JSON, not imperative code |
| **Token-Driven** | All colors, fonts, spacing via design tokens (CSS variables) |
| **Themeable** | Full visual customization without code changes |
| **Accessible** | WCAG 2.1 AA compliance built-in |
| **Responsive** | Mobile-first, fluid layouts |

### 1.2 Design Token Hierarchy

```
EUT Base Tokens (foundation)
    ↓
Theme Style Delta (vita, vita-red, vita-slate)
    ↓
Component styleRef (per-component override)
    ↓
Template Options (declarative variant selection)
```

Precedence: `component.styleRef > page.styleRef > tenant default`

---

## 2. Design Tokens

### 2.1 Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--eut-color-primary` | `#6366f1` | Primary actions, links, focus |
| `--eut-color-primary-hover` | `#4f46e5` | Hover state |
| `--eut-color-secondary` | `#64748b` | Secondary actions |
| `--eut-color-background` | `#ffffff` | Page background |
| `--eut-color-surface` | `#f8fafc` | Card/panel background |
| `--eut-color-error` | `#ef4444` | Error states |
| `--eut-color-success` | `#22c55e` | Success states |
| `--eut-color-warning` | `#f59e0b` | Warning states |
| `--eut-color-text` | `#0f172a` | Primary text |
| `--eut-color-text-secondary` | `#64748b` | Secondary text |
| `--eut-color-border` | `#e2e8f0` | Borders |
| `--eut-color-border-focus` | `#6366f1` | Focus rings |

### 2.2 Typography Tokens

| Token | Value |
|-------|-------|
| `--eut-typography-font-family` | `Inter, system-ui, sans-serif` |
| `--eut-typography-font-size-xs` | `12px` |
| `--eut-typography-font-size-sm` | `14px` |
| `--eut-typography-font-size-md` | `16px` |
| `--eut-typography-font-size-lg` | `20px` |
| `--eut-typography-font-size-xl` | `24px` |
| `--eut-typography-font-weight-normal` | `400` |
| `--eut-typography-font-weight-medium` | `500` |
| `--eut-typography-font-weight-semibold` | `600` |

### 2.3 Spacing Tokens

| Token | Value |
|-------|-------|
| `--eut-spacing-xs` | `4px` |
| `--eut-spacing-sm` | `8px` |
| `--eut-spacing-md` | `16px` |
| `--eut-spacing-lg` | `24px` |
| `--eut-spacing-xl` | `32px` |

### 2.4 Border Radius Tokens

| Token | Value |
|-------|-------|
| `--eut-radius-sm` | `4px` |
| `--eut-radius-md` | `8px` |
| `--eut-radius-lg` | `12px` |
| `--eut-radius-full` | `9999px` |

### 2.5 Shadow Tokens

| Token | Value |
|-------|-------|
| `--eut-shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--eut-shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` |
| `--eut-shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` |

---

## 3. Component Patterns

### 3.1 Component Interface

Every component must accept:

```typescript
interface BaseComponentProps {
  id: string;
  type: string;
  styleRef?: string;
  templateOptions?: Record<string, string | boolean>;
  dependsOn?: string[];
  children?: ReactNode;
}
```

### 3.2 Component Categories

| Category | Components | Purpose |
|----------|-----------|---------|
| **Layout** | Region, Grid, Stack | Structure and arrangement |
| **Form** | Input, Select, Checkbox, DatePicker | Data entry |
| **Data** | Lov, LovSelect, Table, Chart | Data display |
| **Navigation** | Tabs, Breadcrumb, Menu | Wayfinding |
| **Feedback** | Alert, Toast, Progress | Status communication |

### 3.3 Template Options Pattern

Template options are declarative enums/booleans that control component variants:

```json
{
  "variant": "outlined" | "filled" | "standard",
  "size": "small" | "medium" | "large",
  "dense": true | false,
  "fullWidth": true | false
}
```

**Rules:**
- Options are declared in `templateOptions` JSON, never inline CSS
- Each option maps to a CSS class: `eut-opt-{key}-{value}`
- Component reads options and applies appropriate classes

### 3.4 Cascading LOV Pattern

Parent-child dropdown dependencies:

```json
{
  "id": "country_select",
  "type": "lov_select",
  "lovSource": "countries",
  "dependsOn": []
},
{
  "id": "city_select",
  "type": "lov_select",
  "lovSource": "cities_by_country",
  "dependsOn": ["country_select"]
}
```

**Rules:**
- Child clears when parent changes
- Child disabled until all dependencies are defined
- Data fetched via ResolverRegistry, not raw queries

---

## 4. Theme System

### 4.1 EUT Theme Structure

```
src/themes/eut/
├── tokens.base.json           # Foundation tokens
├── templateOptions.json       # Available template options
└── styles/
    ├── vita.json              # Default style
    ├── vita-red.json          # Red accent variant
    └── vita-slate.json        # Slate/neutral variant
```

### 4.2 Theme Style Delta

Each style defines only what changes from base:

```json
{
  "styleKey": "vita-red",
  "displayName": "Vita Red",
  "delta": {
    "color": {
      "primary": "#dc2626",
      "primary-hover": "#b91c1c"
    }
  }
}
```

### 4.3 Runtime Theme Injection

The `RuntimeThemeProvider` injects CSS variables at runtime:

```tsx
<RuntimeThemeProvider themeBundle={themeBundle}>
  {children}
</RuntimeThemeProvider>
```

CSS variables are injected via inline `style` attribute on a wrapper div, cascading to all children.

### 4.4 Theme Cascade Resolution

1. Load base tokens (`tokens.base.json`)
2. Apply theme style delta (e.g., `vita-red.json`)
3. Apply page-level `styleRef` override
4. Apply component-level `styleRef` override
5. Apply `templateOptions` class mappings

---

## 5. Layout JSON Schema

### 5.1 Page Layout Structure

```json
{
  "schemaVersion": "1.0.0",
  "styleRef": "vita-red",
  "regions": [
    {
      "id": "header",
      "title": "Header",
      "components": [...]
    }
  ]
}
```

### 5.2 Component Definition

```json
{
  "id": "unique-id",
  "type": "lov_select",
  "position": { "x": 0, "y": 0, "width": 200, "height": 40 },
  "styleRef": "compact",
  "templateOptions": {
    "variant": "outlined",
    "size": "small"
  },
  "dependsOn": ["parent_field"],
  "dataSource": {
    "dataSourceRef": "resolver_key",
    "dataSourceType": "REGISTERED_QUERY"
  },
  "validation": {
    "required": true,
    "minLength": 2
  }
}
```

---

## 6. Designer Layout

### 6.1 Canvas

- Drag-and-drop from component palette
- Grid snapping (optional)
- Visual selection with property inspector binding
- Zoom/pan controls

### 6.2 Property Inspector

- Context-sensitive: shows properties for selected component
- Template Options as toggle/dropdown controls
- Style Ref picker (shows available theme styles)
- Live preview on change

### 6.3 Theme Roller

- Live theme style switching
- Color picker for primary/secondary/accent
- Typography preview
- Density toggle (compact/cozy/comfortable)

### 6.4 JSON Editor

- Monaco Editor with JSON Schema validation
- Syntax highlighting for layout_json
- Diff view for changes

---

## 7. Accessibility

### 7.1 Requirements

- All interactive elements must have visible focus indicators
- Color contrast ratio minimum 4.5:1 for text
- All form inputs must have associated labels
- ARIA roles for custom components
- Keyboard navigation support

### 7.2 Focus Management

```css
:focus-visible {
  outline: 2px solid var(--eut-color-border-focus);
  outline-offset: 2px;
}
```

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Columns |
|------------|-------|---------|
| Mobile | < 640px | 1 |
| Tablet | 640px - 1024px | 2-4 |
| Desktop | > 1024px | 4-12 |

---

## 9. Animation & Transitions

### 9.1 Default Transitions

```css
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
```

### 9.2 Motion Principles

- **Purposeful** — Animations communicate state changes
- **Subtle** — Duration 150-300ms, no exaggerated easing
- **Consistent** — Same component type uses same animation
- **Reduced Motion** — Respect `prefers-reduced-motion`

---

## 10. Dark Mode

### 10.1 Token Mapping

| Light Token | Dark Token |
|-------------|------------|
| `--eut-color-background` | `#0f172a` |
| `--eut-color-surface` | `#1e293b` |
| `--eut-color-text` | `#f8fafc` |
| `--eut-color-border` | `#334155` |

### 10.2 Implementation

Dark mode is a Theme Style variant, not a separate theme. Toggle via:

```json
{
  "templateOptions": {
    "colorScheme": "dark"
  }
}
```

---

## 11. Design Tokens File Format

### 11.1 Base Tokens (`tokens.base.json`)

```json
{
  "color": { "primary": "#6366f1", ... },
  "radius": { "sm": "4px", ... },
  "spacing": { "xs": "4px", ... },
  "typography": { "font-family": "Inter, ...", ... },
  "shadow": { "sm": "...", ... }
}
```

### 11.2 Style Delta (`styles/vita-red.json`)

```json
{
  "styleKey": "vita-red",
  "displayName": "Vita Red",
  "baseStyle": "vita",
  "delta": {
    "color": { "primary": "#dc2626" }
  }
}
```

### 11.3 Generated CSS

Run `npm run build:theme-css` to generate CSS files from JSON tokens:

```css
[data-eut-theme="vita-red"] {
  --eut-color-primary: #dc2626;
  --eut-color-primary-hover: #b91c1c;
}
```

---

## 12. File Organization

```
src/themes/eut/
├── tokens.base.json              # Foundation tokens
├── templateOptions.json          # Available options
└── styles/
    ├── vita.json                 # Default style
    ├── vita-red.json             # Red variant
    └── vita-slate.json           # Slate variant

src/styles/
├── eods-tokens.css               # Static tokens CSS
├── eut-runtime.css               # Runtime theme base
├── eut-theme-vita.css            # Generated
├── eut-theme-vita-red.css        # Generated
└── eut-theme-vita-slate.css      # Generated
```
