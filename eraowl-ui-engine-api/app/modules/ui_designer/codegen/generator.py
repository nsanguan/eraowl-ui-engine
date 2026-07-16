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

    def generate_component(self, component: dict[str, Any], convention: dict[str, Any]) -> str:
        comp_id = component.get("id", "")
        comp_type = component.get("type", "div")

        if not comp_id or not re.match(r"^[A-Za-z0-9_-]+$", comp_id):
            raise ValueError(f"invalid component id: {comp_id!r}")

        class_name = sanitize_class_name(comp_id)
        safe_comp_id = sanitize_identifier(comp_id)

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
            f"      {{/* {comp_type} */}}\n"
            "    </div>\n"
            "  )\n"
            "}\n"
        )

    def generate_page(self, page_data: dict[str, Any]) -> dict[str, str]:
        files: dict[str, str] = {}
        layout = page_data.get("layout_json", {})

        for region in layout.get("regions", []):
            for component in region.get("components", []):
                comp_id = component.get("id", "")
                if not comp_id or not re.match(r"^[A-Za-z0-9_-]+$", comp_id):
                    raise ValueError(f"invalid component id: {comp_id!r}")
                filename = f"{sanitize_identifier(comp_id)}.tsx"
                filepath = f"{self.target_subpath}/{filename}"
                files[filepath] = self.generate_component(component, {})

        return files
