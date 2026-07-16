from __future__ import annotations

import re
from typing import Any

from app.modules.ui_designer.codegen.scanner import ProjectScanner

_SAFE_ID_RE = re.compile(r"^[A-Za-z0-9_-]+$")


def sanitize_identifier(value: str, max_len: int = 64) -> str:
    """Whitelist ``[A-Za-z0-9_-]``; reject anything else.

    Returns a validated, length-truncated identifier. Raises ValueError if
    the value is empty or contains illegal characters.
    """
    if not value:
        raise ValueError("identifier must not be empty")
    cleaned = re.sub(r"[^A-Za-z0-9_-]", "", value)
    if not cleaned:
        raise ValueError(f"identifier '{value}' contains no allowed characters")
    return cleaned[:max_len]


def sanitize_class_name(value: str, max_len: int = 64) -> str:
    """Sanitize a component id into a safe PascalCase class name."""
    # First strip to whitelist, then PascalCase.
    comp = sanitize_identifier(value, max_len)
    class_name = "".join(part[:1].upper() + part[1:] for part in comp.split("-") if part)
    if not class_name:
        raise ValueError(f"class name for '{value}' resolved to empty")
    return class_name


class CodeGenerator:
    def __init__(self, project_root: str, target_subpath: str):
        self.scanner = ProjectScanner(project_root)
        self.target_subpath = target_subpath

    def _validate_id(self, comp_id: str) -> None:
        if not comp_id or not re.match(r"^[A-Za-z0-9_-]+$", comp_id):
            raise ValueError(f"invalid component id: {comp_id!r}")

    def _walk_components(self, components: list[dict[str, Any]], depth: int = 0) -> list[dict[str, Any]]:
        """Recursively flatten a tree of components (handles nested containers)."""
        result: list[dict[str, Any]] = []
        for comp in components:
            self._validate_id(comp.get("id", ""))
            result.append(comp)
            # Recurse into nested children (GridRow → GridColumn → InputText etc.)
            children = comp.get("components", [])
            if children:
                result.extend(self._walk_components(children, depth + 1))
        return result

    def _region_children(self, region: dict[str, Any], all_components: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Return the direct children of *region* from the flat list."""
        region_id = region.get("id", "")
        return [c for c in all_components if c.get("parentId") == region_id]

    def generate_component(
        self,
        component: dict[str, Any],
        convention: dict[str, Any],
        children: list[dict[str, Any]] | None = None,
    ) -> str:
        comp_id = component.get("id", "")
        comp_type = component.get("type", "div")

        self._validate_id(comp_id)

        class_name = sanitize_class_name(comp_id)
        safe_comp_id = sanitize_identifier(comp_id)

        # Generate child elements recursively if this is a container.
        child_jsx = ""
        if children:
            child_jsx = "\n".join(
                f"        {{/* child: {c.get('id', '?')} */}}"
                for c in children
            )
            if child_jsx:
                child_jsx = "\n" + child_jsx + "\n"

        return (
            "import { FC } from 'react'\n"
            "\n"
            f"interface {class_name}Props {{\n"
            "  className?: string\n"
            "}\n"
            "\n"
            f"export const {class_name}: FC<{class_name}Props> = ({{ className }}) => {{\n"
            "  return (\n"
            f'    <div className={{className}} data-component="{safe_comp_id}">\n'
            f"      {{/* {comp_type} */}}{child_jsx}"
            "    </div>\n"
            "  )\n"
            "}\n"
        )

    def generate_page(self, page_data: dict[str, Any]) -> dict[str, str]:
        files: dict[str, str] = {}
        layout = page_data.get("layout_json", {}) if isinstance(page_data, dict) else {}

        regions = layout.get("regions", [])

        # Collect every component from the entire tree, recursively.
        all_components: list[dict[str, Any]] = []
        for region in regions:
            region_components = region.get("components", [])
            all_components.extend(self._walk_components(region_components))

        # Generate one file per component.
        for component in all_components:
            comp_id = component.get("id", "")
            self._validate_id(comp_id)
            filename = f"{sanitize_identifier(comp_id)}.tsx"
            filepath = f"{self.target_subpath}/{filename}"

            files[filepath] = self.generate_component(component, {})

        return files
