#!/usr/bin/env node
/**
 * tsx-decompiler.mjs — AST-based TSX-to-element-tree converter.
 *
 * Reads a .tsx file, parses it with @babel/parser (TypeScript + JSX),
 * walks the AST to find JSX elements, class names, inline styles,
 * and common EraOwl UI patterns (data-component, data-type attrs).
 *
 * Usage:
 *   node scripts/tsx-decompiler.mjs --file /path/to/Component.tsx
 *
 * Output: JSON-Lines structure to stdout.
 *   { "elements": [ ... ], "imports": [ ... ], "hooks": [ ... ] }
 */
import { parse } from "@babel/parser";
import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";

// ── Known EraOwl component aliases ─────────────────────────────────────
const COMPONENT_MAP = {
  Region: "Region",
  region: "Region",
  Standard: "Standard",
  GridRow: "GridRow",
  gridRow: "GridRow",
  GridColumn: "GridColumn",
  gridColumn: "GridColumn",
  FlexboxContainer: "FlexboxContainer",
  ContentBlock: "ContentBlock",
  ContentRow: "ContentRow",
  Hero: "Hero",
  Image: "Image",
  HelpText: "HelpText",
  Collapsible: "Collapsible",
  InlineDialog: "InlineDialog",
  ButtonContainer: "ButtonContainer",
  TitleBar: "TitleBar",
  TabsContainer: "TabsContainer",
  RegionDisplaySelector: "RegionDisplaySelector",
  StaticContent: "StaticContent",
  Button: "Button",
  IconButton: "IconButton",
  ButtonGroup: "ButtonGroup",
  InputText: "InputText",
  Textarea: "Textarea",
  Select: "Select",
  Checkbox: "Checkbox",
  RadioGroup: "RadioGroup",
  DatePicker: "DatePicker",
  NumberInput: "NumberInput",
  Lov: "Lov",
  LovSelect: "LovSelect",
  ClassicReport: "ClassicReport",
  InteractiveReport: "InteractiveReport",
  InteractiveGrid: "InteractiveGrid",
  ColumnToggleReport: "ColumnToggleReport",
  ReflowReport: "ReflowReport",
  ContextualInfo: "ContextualInfo",
  ValueAttributePairs: "ValueAttributePairs",
  CardRegions: "CardRegions",
  CardTemplates: "CardTemplates",
  Calendar: "Calendar",
  Carousel: "Carousel",
  Charts: "Charts",
  MetricCard: "MetricCard",
  Comments: "Comments",
  Timeline: "Timeline",
  Tree: "Tree",
  Wizard: "Wizard",
  Alert: "Alert",
  Badge: "Badge",
  BadgesList: "BadgesList",
  Avatar: "Avatar",
  Breadcrumb: "Breadcrumb",
  LinksList: "LinksList",
  ListView: "ListView",
  MediaList: "MediaList",
  MenuBar: "MenuBar",
  MenuPopup: "MenuPopup",
  NavigationBar: "NavigationBar",
  ScrollBar: "ScrollBar",
  Link: "Link",
  FormField: "FormField",
};

/** Classes that map to a component type (CSS-based detection). */
const CSS_CLASS_MAP = [
  { pattern: /(^| )eods-region([ -]|$)/i, type: "Region" },
  { pattern: /(^| )eods-standard([ -]|$)/i, type: "Standard" },
  { pattern: /(^| )eods-grid-row([ -]|$)/i, type: "GridRow" },
  { pattern: /(^| )eods-grid-col([ -]|$)/i, type: "GridColumn" },
  { pattern: /(^| )eods-flexbox([ -]|$)/i, type: "FlexboxContainer" },
  { pattern: /(^| )eods-content-block([ -]|$)/i, type: "ContentBlock" },
  { pattern: /(^| )eods-content-row([ -]|$)/i, type: "ContentRow" },
  { pattern: /(^| )eods-hero([ -]|$)/i, type: "Hero" },
  { pattern: /(^| )eods-button([ -]|$)/i, type: "Button" },
  { pattern: /(^| )eods-input([ -]|$)/i, type: "InputText" },
  { pattern: /(^| )eods-textarea([ -]|$)/i, type: "Textarea" },
  { pattern: /(^| )eods-select([ -]|$)/i, type: "Select" },
  { pattern: /(^| )eods-checkbox([ -]|$)/i, type: "Checkbox" },
  { pattern: /(^| )eods-radio([ -]|$)/i, type: "RadioGroup" },
  { pattern: /(^| )eods-datepicker([ -]|$)/i, type: "DatePicker" },
  { pattern: /(^| )eods-number([ -]|$)/i, type: "NumberInput" },
  { pattern: /(^| )eods-lov([ -]|$)/i, type: "Lov" },
  { pattern: /(^| )eods-lov-select([ -]|$)/i, type: "LovSelect" },
  { pattern: /(^| )eods-report([ -]|$)/i, type: "ClassicReport" },
  { pattern: /(^| )eods-chart([ -]|$)/i, type: "Charts" },
  { pattern: /(^| )eods-alert([ -]|$)/i, type: "Alert" },
  { pattern: /(^| )eods-badge([ -]|$)/i, type: "Badge" },
  { pattern: /(^| )eods-avatar([ -]|$)/i, type: "Avatar" },
  { pattern: /(^| )eods-nav([ -]|$)/i, type: "NavigationBar" },
  { pattern: /(^| )eods-tabs([ -]|$)/i, type: "TabsContainer" },
  { pattern: /(^| )eods-menu([ -]|$)/i, type: "MenuBar" },
];

/** HTML standard elements that map to EraOwl types. */
const HTML_TAG_MAP = {
  select: "Select",
  input: (attrs) => {
    const type = attrs.type || "text";
    if (type === "checkbox") return "Checkbox";
    if (type === "radio") return "RadioGroup";
    if (type === "number") return "NumberInput";
    if (type === "date") return "DatePicker";
    return "InputText";
  },
  textarea: "Textarea",
  button: "Button",
  img: "Image",
  a: "Link",
};

// ── Helpers ─────────────────────────────────────────────────────────────

function extractString(node) {
  if (!node) return "";
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "TemplateLiteral") {
    return node.quasis.map((q) => q.value.raw).join("");
  }
  return "";
}

function extractExpression(expr) {
  if (!expr) return null;
  if (expr.type === "StringLiteral") return { kind: "literal", value: expr.value };
  if (expr.type === "NumericLiteral") return { kind: "literal", value: String(expr.value) };
  if (expr.type === "BooleanLiteral") return { kind: "literal", value: String(expr.value) };
  if (expr.type === "NullLiteral") return { kind: "literal", value: null };
  if (expr.type === "Identifier") return { kind: "ref", value: expr.name };
  if (expr.type === "MemberExpression") {
    const obj = extractExpression(expr.object);
    const prop = extractExpression(expr.property);
    return { kind: "member", value: `${obj?.value || ""}.${prop?.value || ""}` };
  }
  if (expr.type === "ObjectExpression") {
    const props = {};
    for (const prop of expr.properties) {
      if (prop.type === "ObjectProperty" || prop.type === "SpreadElement") {
        if (prop.type === "SpreadElement") continue;
        const key = prop.key.name || extractString(prop.key);
        props[key] = extractExpression(prop.value);
      }
    }
    return { kind: "object", value: props };
  }
  if (expr.type === "ArrayExpression") {
    return {
      kind: "array",
      value: expr.elements.filter(Boolean).map(extractExpression),
    };
  }
  if (expr.type === "TemplateLiteral") {
    return { kind: "template", value: extractString(expr) };
  }
  if (expr.type === "ConditionalExpression") {
    return { kind: "conditional", value: `${extractExpression(expr.alternate)?.value || ""}` };
  }
  return { kind: "complex", value: null };
}

function extractClassName(node) {
  if (!node) return "";
  // Handle our wrapper format from extractAttrs
  if (node.kind === "literal") return node.value || "";
  if (node.kind === "template") return node.value || "";
  // Handle raw AST nodes
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "TemplateLiteral") return extractString(node);
  if (node.type === "ConditionalExpression") {
    const cons = extractClassName(node.consequent);
    const alt = extractClassName(node.alternate);
    return cons || alt || "";
  }
  return "";
}

function extractCallExpression(node) {
  if (!node || node.type !== "CallExpression") return null;
  const callee = node.callee;
  let name = "";
  if (callee.type === "Identifier") name = callee.name;
  else if (callee.type === "MemberExpression") {
    name = `${extractExpression(callee.object)?.value || ""}.${callee.property?.name || ""}`;
  }
  const args = (node.arguments || []).map((a) => extractExpression(a));
  return { name, args };
}

// ── Core: Walk JSX elements ─────────────────────────────────────────────

let _idCounter = 0;
function nextId() {
  _idCounter++;
  return `rev-${_idCounter}`;
}

function extractAttrs(attrs) {
  const result = {};
  for (const attr of attrs || []) {
    if (attr.type === "JSXSpreadAttribute") continue;
    const name = attr.name?.name || "";
    const val = attr.value;
    if (!val) {
      result[name] = { kind: "bool", value: true };
    } else if (val.type === "StringLiteral") {
      result[name] = { kind: "literal", value: val.value };
    } else if (val.type === "JSXExpressionContainer") {
      result[name] = extractExpression(val.expression);
    }
  }
  return result;
}

function extractInlineStyle(styleNode) {
  if (!styleNode) return {};
  if (styleNode.kind === "literal" && typeof styleNode.value === "string") {
    const styles = {};
    for (const pair of styleNode.value.split(";")) {
      const [k, ...v] = pair.split(":");
      if (k && v.length) {
        const key = k.trim();
        const val = v.join(":").trim();
        if (key && val) {
          // Convert camelCase CSS keys
          const jsKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          styles[jsKey] = val;
        }
      }
    }
    return styles;
  }
  if (styleNode.kind === "object" && typeof styleNode.value === "object") {
    const styles = {};
    for (const [k, v] of Object.entries(styleNode.value)) {
      if (v && typeof v === "object" && v.value != null) {
        styles[k] = String(v.value);
      }
    }
    return styles;
  }
  return {};
}

function matchClassToComponent(className) {
  if (!className) return null;
  for (const { pattern, type } of CSS_CLASS_MAP) {
    if (pattern.test(className)) return type;
  }
  return null;
}

function detectDataSourceFromHook(callName, args) {
  // Pattern: useData('lov:someKey') or useQuery('fetchSomething', ...)
  if (!callName) return null;
  const lower = callName.toLowerCase();
  if (
    lower === "usedata" ||
    lower === "uselov" ||
    lower === "usequery" ||
    lower.includes("lov") ||
    lower.includes("fetch")
  ) {
    const firstArg = args?.[0];
    if (firstArg && firstArg.value) {
      return { dataSourceRef: String(firstArg.value), dataSourceType: "REGISTERED_QUERY" };
    }
  }
  return null;
}

function walkJsx(node, hooks) {
  if (!node || typeof node !== "object") return null;

  // JSXElement
  if (node.type === "JSXElement") {
    const opening = node.openingElement;
    const tagName = opening.name;
    let jsxTagName = "";

    if (tagName.type === "JSXIdentifier") {
      jsxTagName = tagName.name;
    } else if (tagName.type === "JSXMemberExpression") {
      jsxTagName = `${tagName.object?.name || ""}.${tagName.property?.name || ""}`;
    } else if (tagName.type === "JSXNamespacedName") {
      jsxTagName = `${tagName.namespace?.name || ""}:${tagName.name?.name || ""}`;
    }

    const attrs = extractAttrs(opening.attributes);
    const isSelfClosing = opening.selfClosing;

    // Extract className
    const className = attrs.className ? extractClassName(attrs.className) : "";

    // Extract inline styles
    const styleAttr = attrs.style ? extractInlineStyle(attrs.style) : {};

    // Determine the EraOwl component type
    let compType = null;
    let props = {};

    // Priority 1: explicit data-component or data-type attribute
    const dataComponent = attrs["data-component"];
    const dataType = attrs["data-type"];

    if (dataComponent && dataComponent.value) {
      compType = COMPONENT_MAP[dataComponent.value] || dataComponent.value;
    }
    if (!compType && dataType && dataType.value) {
      compType = COMPONENT_MAP[dataType.value] || dataType.value;
    }

    // Priority 2: JSX tag name matches a known component
    if (!compType) {
      compType = COMPONENT_MAP[jsxTagName] || null;
      if (jsxTagName in COMPONENT_MAP) {
        props._tagName = jsxTagName;
      }
    }

    // Priority 3: className-based detection
    if (!compType) {
      compType = matchClassToComponent(className);
    }

    // Priority 4: HTML standard tag mapping
    if (!compType) {
      const htmlTag = HTML_TAG_MAP[jsxTagName.toLowerCase()];
      if (typeof htmlTag === "function") {
        compType = htmlTag(attrs);
      } else if (htmlTag) {
        compType = htmlTag;
      }
    }

    // If it's a plain <div> with no recognizable pattern, treat as "ContentBlock"
    if (!compType && jsxTagName.toLowerCase() === "div") {
      compType = "ContentBlock";
    }

    // Extract standard props
    const extractedProps = {};
    const label = attrs.label?.value || attrs["aria-label"]?.value || "";
    const id = attrs.id?.value || "";
    const placeholder = attrs.placeholder?.value || "";
    const title = attrs.title?.value || "";

    if (label) extractedProps.label = label;
    if (id) extractedProps.id = id;
    if (placeholder) extractedProps.placeholder = placeholder;
    if (title) extractedProps.title = title;

    // Extract fontSize / fontColor from inline styles
    if (styleAttr.fontSize) extractedProps.fontSize = styleAttr.fontSize;
    if (styleAttr.color) extractedProps.fontColor = styleAttr.color;
    if (styleAttr.fontColor) extractedProps.fontColor = styleAttr.fontColor;

    // Extract options for Select/RadioGroup
    if (attrs.options) {
      const opts = attrs.options;
      if (opts.kind === "array" && Array.isArray(opts.value)) {
        extractedProps.options = opts.value.map((o) => {
          if (o && o.value != null) return String(o.value);
          return "";
        });
      }
    }

    // Extract dataSource from data- attributes
    const dataSourceRef = attrs["data-source-ref"];
    if (dataSourceRef && dataSourceRef.value) {
      extractedProps.dataSource = {
        dataSourceRef: String(dataSourceRef.value),
        dataSourceType: "REGISTERED_QUERY",
      };
    }

    props = { ...props, ...extractedProps };

    // Recurse children
    const children = [];
    for (const child of node.children || []) {
      if (child.type === "JSXText") {
        const text = child.value.trim();
        if (text) {
          children.push({ kind: "text", value: text });
        }
      } else if (child.type === "JSXElement") {
        const sub = walkJsx(child, hooks);
        if (sub) children.push(sub);
      } else if (child.type === "JSXExpressionContainer") {
        const expr = child.expression;
        if (expr.type === "JSXElement") {
          const sub = walkJsx(expr, hooks);
          if (sub) children.push(sub);
        } else if (expr.type === "ConditionalExpression") {
          // Handle ternary: {condition ? <A /> : <B />}
          if (expr.consequent.type === "JSXElement") {
            const sub = walkJsx(expr.consequent, hooks);
            if (sub) children.push(sub);
          }
          if (expr.alternate.type === "JSXElement") {
            const sub = walkJsx(expr.alternate, hooks);
            if (sub) children.push(sub);
          }
        } else if (expr.type === "LogicalExpression" && expr.right.type === "JSXElement") {
          const sub = walkJsx(expr.right, hooks);
          if (sub) children.push(sub);
        }
      }
    }

    const element = {
      id: nextId(),
      tagName: jsxTagName,
      componentType: compType,
      className: className || null,
      props: Object.keys(extractedProps).length > 0 ? extractedProps : null,
      styles: styleAttr && Object.keys(styleAttr).length > 0 ? styleAttr : null,
      children: children.length > 0 ? children : null,
      selfClosing: isSelfClosing,
    };

    return element;
  }

  return null;
}

function collectComponentImports(ast) {
  const imports = [];
  for (const node of ast.program.body) {
    if (node.type === "ImportDeclaration") {
      const specifiers = (node.specifiers || []).map((s) => {
        if (s.type === "ImportDefaultSpecifier") return { kind: "default", name: s.local.name };
        if (s.type === "ImportSpecifier") return { kind: "named", name: s.local.name, imported: s.imported.name };
        return { kind: "namespace", name: s.local.name };
      });
      imports.push({
        source: node.source.value,
        specifiers,
      });
    }
  }
  return imports;
}

function collectHookCalls(ast) {
  const hooks = [];

  function walk(node, depth = 0) {
    if (!node || typeof node !== "object" || depth > 500) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }
    if (node.type === "CallExpression") {
      const info = extractCallExpression(node);
      if (info) {
        const ds = detectDataSourceFromHook(info.name, info.args);
        if (ds) {
          hooks.push({ callName: info.name, ...ds, args: info.args });
        }
      }
    }
    for (const key of Object.keys(node)) {
      if (key === "leadingComments" || key === "trailingComments" || key === "innerComments") continue;
      try {
        walk(node[key], depth + 1);
      } catch {
        // circular ref guard
      }
    }
  }

  walk(ast);
  return hooks;
}

// ── Main ────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  let filePath = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" && i + 1 < args.length) {
      filePath = args[i + 1];
      i++;
    }
  }

  if (!filePath) {
    console.error("Usage: node tsx-decompiler.mjs --file <path/to/component.tsx>");
    process.exit(1);
  }

  try {
    const code = readFileSync(filePath, "utf-8");
    const ast = parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx", "decorators", "optionalChaining", "nullishCoalescingOperator"],
      errorRecovery: true,
    });

    const imports = collectComponentImports(ast);
    const hooks = collectHookCalls(ast);

    // Walk top-level statements for JSX elements
    const elements = [];
    for (const stmt of ast.program.body) {
      if (stmt.type === "FunctionDeclaration" || stmt.type === "VariableDeclaration" || stmt.type === "ExportDefaultDeclaration" || stmt.type === "ExportNamedDeclaration") {
        let decl = stmt;
        if (stmt.type === "ExportDefaultDeclaration" || stmt.type === "ExportNamedDeclaration") {
          decl = stmt.declaration;
        }
        // Walk the function body or variable init
        if (decl.type === "FunctionDeclaration" || decl.type === "ArrowFunctionExpression") {
          const body = decl.body;
          if (body.type === "BlockStatement") {
            for (const bStmt of body.body) {
              if (bStmt.type === "ReturnStatement" && bStmt.argument) {
                const el = walkJsx(bStmt.argument, hooks);
                if (el) elements.push(el);
              }
              // Also look for JSX in VariableDeclarators inside function body
              if (bStmt.type === "VariableDeclaration") {
                for (const d of bStmt.declarations) {
                  if (d.init && (d.init.type === "JSXElement" || d.init.type === "CallExpression")) {
                    // Handle JSX directly
                    if (d.init.type === "JSXElement") {
                      const el = walkJsx(d.init, hooks);
                      if (el) elements.push(el);
                    }
                  }
                }
              }
            }
          } else if (body.type === "JSXElement") {
            const el = walkJsx(body, hooks);
            if (el) elements.push(el);
          }
        }
        if (decl && decl.init && decl.init.type === "JSXElement") {
          const el = walkJsx(decl.init, hooks);
          if (el) elements.push(el);
        }
        // Arrow function with implicit return
        if (decl && decl.type === "ArrowFunctionExpression" && decl.body.type === "JSXElement") {
          const el = walkJsx(decl.body, hooks);
          if (el) elements.push(el);
        }
      }
    }

    // If no elements found via body walking, try a blanket walk of the entire AST
    if (elements.length === 0) {
      const allNodes = [];

      function blanketWalk(node) {
        if (!node || typeof node !== "object") return;
        if (node.type === "JSXElement") {
          allNodes.push(node);
          return;
        }
        if (Array.isArray(node)) {
          for (const item of node) blanketWalk(item);
          return;
        }
        for (const key of Object.keys(node)) {
          if (key === "leadingComments" || key === "trailingComments" || key === "innerComments") continue;
          try {
            blanketWalk(node[key]);
          } catch { /* noop */ }
        }
      }

      blanketWalk(ast);
      // Only take the top-level roots (not nested inside other JSX)
      for (const jsxNode of allNodes) {
        const el = walkJsx(jsxNode, hooks);
        if (el) elements.push(el);
      }
    }

    const output = {
      filePath,
      elements,
      imports,
      hooks,
    };

    console.log(JSON.stringify(output));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message, stack: err.stack }));
    process.exit(1);
  }
}

main();
