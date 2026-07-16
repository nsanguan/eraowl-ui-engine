"""Codegen target configuration – §8.3."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CodegenTargetConfig(BaseModel):
    """Per-target code generation settings."""

    framework: str = "react"
    component_import_path: str = "@/components"
    pages_output_dir: str = "src/pages"
    theme_output_dir: str = "src/theme"
    use_typescript: bool = True
    indent: int = 2
    line_ending: str = "\n"
    prettier: bool = True
    eslint: bool = True
    framework_options: dict = Field(default_factory=dict)
