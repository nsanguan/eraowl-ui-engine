from __future__ import annotations

import json
import re
from typing import Any

from app.modules.ui_designer.codegen.scanner import ProjectScanner

_SAFE_ID_RE = re.compile(r"^[A-Za-z0-9_-]+$")


def sanitize_identifier(value: str, max_len: int = 64) -> str:
    if not value:
        raise ValueError("identifier must not be empty")
    cleaned = re.sub(r"[^A-Za-z0-9_-]", "", value)
    if not cleaned:
        raise ValueError(f"identifier '{value}' contains no allowed characters")
    return cleaned[:max_len]


def sanitize_class_name(value: str, max_len: int = 64) -> str:
    comp = sanitize_identifier(value, max_len)
    class_name = "".join(part[:1].upper() + part[1:] for part in comp.split("-") if part)
    if not class_name:
        raise ValueError(f"class name for '{value}' resolved to empty")
    return class_name


# Component types that can contain children
_CONTAINER_TYPES = frozenset({"region", "gridrow", "gridcolumn", "card"})

# Map component types to a React-compatible tag name (used in generated JSX comments)
_COMPONENT_LABEL: dict[str, str] = {
    "region": "Region",
    "standard": "Standard",
    "gridrow": "GridRow",
    "gridcolumn": "GridColumn",
    "card": "Card",
    "cardregions": "CardRegions",
    "inputtext": "InputText",
    "textarea": "Textarea",
    "select": "Select",
    "checkbox": "Checkbox",
    "radiogroup": "RadioGroup",
    "datepicker": "DatePicker",
    "numberinput": "NumberInput",
    "lov": "LOV",
    "lov_select": "LOVSelect",
    "table": "ClassicReport",
    "classicreport": "ClassicReport",
    "button": "Button",
    "iconbutton": "IconButton",
    "link": "Link",
    "contentblock": "ContentBlock",
    "contentrow": "ContentRow",
    "flexboxcontainer": "FlexboxContainer",
    "hero": "Hero",
    "image": "Image",
    "helptext": "HelpText",
    "collapsible": "Collapsible",
    "inlinedialog": "InlineDialog",
    "buttoncontainer": "ButtonContainer",
    "titlebar": "TitleBar",
    "tabscontainer": "TabsContainer",
    "regiondisplayselector": "RegionDisplaySelector",
    "staticcontent": "StaticContent",
    "plasqldynamiccontent": "PlasqlDynamicContent",
    "alert": "Alert",
    "badge": "Badge",
    "badgeslist": "BadgesList",
    "breadcrumb": "Breadcrumb",
    "linkslist": "LinksList",
    "listview": "ListView",
    "medialist": "MediaList",
    "menubar": "MenuBar",
    "menupopup": "MenuPopup",
    "navigationbar": "NavigationBar",
    "tree": "Tree",
    "wizard": "Wizard",
    "interactivereport": "InteractiveReport",
    "interactivegrid": "InteractiveGrid",
    "columntogglereport": "ColumnToggleReport",
    "reflowreport": "ReflowReport",
    "contextualinfo": "ContextualInfo",
    "valueattributepairs": "ValueAttributePairs",
    "calendar": "Calendar",
    "carousel": "Carousel",
    "charts": "Charts",
    "cardtemplates": "CardTemplates",
    "comments": "Comments",
    "metriccard": "MetricCard",
    "timeline": "Timeline",
    "avatar": "Avatar",
    "buttongroup": "ButtonGroup",
    "formfield": "FormField",
    "scrollbar": "ScrollBar",
}


def _is_container(comp_type: str) -> bool:
    return comp_type.lower() in _CONTAINER_TYPES


def _component_label(comp_type: str) -> str:
    return _COMPONENT_LABEL.get(comp_type.lower(), comp_type)


class CodeGenerator:
    def __init__(self, project_root: str, target_subpath: str):
        self.scanner = ProjectScanner(project_root)
        self.target_subpath = target_subpath

    def _validate_id(self, comp_id: str) -> None:
        if not comp_id or not re.match(r"^[A-Za-z0-9_-]+$", comp_id):
            raise ValueError(f"invalid component id: {comp_id!r}")

    def _generate_component_jsx(
        self,
        component: dict[str, Any],
        children: list[dict[str, Any]] | None = None,
        depth: int = 0,
    ) -> str:
        """Recursively build JSX for a single component and its children.

        Container components (region, gridrow, gridcolumn, card) render their
        children inline. Leaf components render as self-closing elements.
        """
        comp_id = component.get("id", "")
        comp_type = component.get("type", "div")
        self._validate_id(comp_id)

        indent = "  " * (depth + 1)
        safe_id = sanitize_identifier(comp_id)
        label = _component_label(comp_type)

        # Optional props extracted for the generated JSX
        extra_props = ""
        template_options = component.get("templateOptions")
        if template_options:
            opts_json = json.dumps(template_options)
            extra_props = f" templateOptions={{{opts_json}}}"

        style_ref = component.get("styleRef")
        if style_ref:
            # styleRef follows pattern "theme_id.style_key" (e.g. "eut.vita-red")
            # — only sanitize unsafe chars, preserve the dot separator
            safe_style_ref = re.sub(r"[^A-Za-z0-9_.-]", "", str(style_ref))
            extra_props += f' styleRef="{safe_style_ref}"'

        # Container components: open + children + close
        if _is_container(comp_type) and children:
            child_jsx = "\n".join(
                self._generate_component_jsx(child, _get_children(child, children), depth + 1)
                for child in children
            )
            return (
                f"{indent}<div data-component=\"{safe_id}\" data-type=\"{label}\"{extra_props}>\n"
                f"{child_jsx}\n"
                f"{indent}</div>"
            )

        # Leaf component: self-closing element with props
        return f"{indent}<div data-component=\"{safe_id}\" data-type=\"{label}\"{extra_props} />"

    def generate_page(self, page_data: dict[str, Any]) -> dict[str, str]:
        files: dict[str, str] = {}
        layout = page_data.get("layout_json", {}) if isinstance(page_data, dict) else {}

        regions = layout.get("regions", [])

        # Collect every component from the entire tree, recursively.
        all_components: list[dict[str, Any]] = []
        for region in regions:
            region_components = region.get("components", [])
            all_components.extend(self._walk_components(region_components))

        # Generate one file per component that actually contains data.
        for component in all_components:
            comp_id = component.get("id", "")
            self._validate_id(comp_id)

            # Find children of this component
            children = [c for c in all_components if c.get("parentId") == comp_id] or \
                       [c for c in all_components if c.get("parent_id") == comp_id]

            filename = f"{sanitize_identifier(comp_id)}.tsx"
            filepath = f"{self.target_subpath}/{filename}"

            # Generate the component JSX tree rooted at this component
            jsx_body = self._generate_component_jsx(
                component,
                children or self._get_descendants(comp_id, all_components),
            )

            class_name = sanitize_class_name(comp_id)

            files[filepath] = (
                "import { FC } from 'react'\n"
                "\n"
                f"interface {class_name}Props {{\n"
                "  className?: string\n"
                "}\n"
                "\n"
                f"export const {class_name}: FC<{class_name}Props> = ({{ className }}) => {{\n"
                "  return (\n"
                f"{jsx_body}\n"
                "  )\n"
                "}\n"
            )

        return files

    def _get_descendants(self, parent_id: str, all_components: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Return direct children of *parent_id* from the flat list.

        First tries ``parentId`` / ``parent_id`` fields (flat model from
        the designer store). Falls back to the component's own ``components``
        array (nested tree from layout_json).
        """
        by_parent = [c for c in all_components
                     if c.get("parentId") == parent_id or c.get("parent_id") == parent_id]
        if by_parent:
            return by_parent
        # Fallback: find the component in the tree and return its direct children
        for comp in all_components:
            if comp.get("id") == parent_id:
                children = comp.get("components", [])
                return list(children) if children else []
        return []

    def _walk_components(self, components: list[dict[str, Any]], depth: int = 0) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for comp in components:
            self._validate_id(comp.get("id", ""))
            result.append(comp)
            children = comp.get("components", [])
            if children:
                result.extend(self._walk_components(children, depth + 1))
        return result

    def generate_component(
        self,
        component: dict[str, Any],
        convention: dict[str, Any],
        children: list[dict[str, Any]] | None = None,
    ) -> str:
        """Legacy single-component generator — delegates to _generate_component_jsx."""
        return self._generate_component_jsx(component, children)


def _get_children(comp: dict[str, Any], all_components: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return direct children of *comp* from a flat list (by parentId or nested components)."""
    comp_id = comp.get("id", "")
    children_from_parent = [c for c in all_components if c.get("parentId") == comp_id or c.get("parent_id") == comp_id]
    if children_from_parent:
        return children_from_parent
    children = comp.get("components", [])
    return list(children) if children else []
