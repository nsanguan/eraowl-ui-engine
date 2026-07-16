from __future__ import annotations

from pathlib import Path

from app.modules.ui_designer.codegen.scanner import ProjectScanner


class CodeGenerator:
    def __init__(self, project_root: str, target_subpath: str):
        self.scanner = ProjectScanner(project_root)
        self.target_subpath = target_subpath

    def generate_component(self, component: dict, convention: dict) -> str:
        comp_type = component.get("type", "div")
        comp_id = component.get("id", "unknown")
        class_name = comp_id.title().replace("-", "")

        return (
            "import { FC } from 'react'\n"
            "\n"
            f"interface {class_name}Props {{\n"
            "  className?: string\n"
            "}\n"
            "\n"
            f"export const {class_name}: FC<{class_name}Props> = ({{ className }}) => {{\n"
            "  return (\n"
            f'    <div className={{className}} data-component="{comp_id}">\n'
            f"      {{/* {comp_type} */}}\n"
            "    </div>\n"
            "  )\n"
            "}\n"
        )

    def generate_page(self, page_data: dict) -> dict[str, str]:
        files: dict[str, str] = {}
        layout = page_data.get("layout_json", {})
        
        for region in layout.get("regions", []):
            for component in region.get("components", []):
                comp_id = component.get("id", "unknown")
                filename = f"{comp_id}.tsx"
                filepath = f"{self.target_subpath}/{filename}"
                files[filepath] = self.generate_component(component, {})
        
        return files
