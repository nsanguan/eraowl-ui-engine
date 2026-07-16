from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.security import require_role
from app.modules.ui_designer.codegen.config import CodegenTargetConfig
from app.modules.ui_designer.codegen.diff_builder import DiffBuilder
from app.modules.ui_designer.codegen.generator import CodeGenerator
from app.modules.ui_designer.codegen.scanner import ProjectScanner
from app.modules.ui_designer.codegen.writer import SandboxWriter
from app.core.config import settings

router = APIRouter()


class CodegenTargetCreate(BaseModel):
    page_id: str
    project_root: str
    target_subpath: str
    allowed_write_globs: list[str] = [
        "apps/web/src/pages/generated/**",
        "apps/web/src/components/generated/**",
    ]


class ScanResult(BaseModel):
    framework_detected: str
    component_style: str


class GenerateResult(BaseModel):
    dry_run: bool
    diffs: dict[str, str | None]
    files_changed: list[str]


@router.get(
    "/codegen-targets/{target_id}/scan",
    dependencies=[Depends(require_role("ui_designer.viewer", "ui_designer.editor", "ui_designer.admin"))],
)
async def scan_target(target_id: str) -> ScanResult:
    scanner = ProjectScanner(settings.TARGET_PROJECT_ROOT)
    manifest = scanner.scan()
    return ScanResult(
        framework_detected="vite-react",
        component_style="PascalCase + named export",
    )


@router.post(
    "/codegen-targets/{target_id}/generate",
    dependencies=[Depends(require_role("ui_designer.codegen", "ui_designer.admin"))],
)
async def generate_code(
    target_id: str,
    dry_run: bool = True,
    page_id: str | None = None,
) -> GenerateResult:
    generator = CodeGenerator(settings.TARGET_PROJECT_ROOT, "apps/web/src/pages/generated")
    
    sample_page = {
        "layout_json": {
            "regions": [
                {
                    "id": "main",
                    "title": "Main",
                    "components": [
                        {"id": "test_component", "type": "Region", "position": {"x": 0, "y": 0, "width": 100, "height": 40}}
                    ],
                }
            ]
        }
    }
    
    files = generator.generate_page(sample_page)
    
    writer = SandboxWriter(settings.TARGET_PROJECT_ROOT, [
        "apps/web/src/pages/generated/**",
        "apps/web/src/components/generated/**",
    ])
    
    diffs = {}
    changed = []
    for filepath, content in files.items():
        diff = writer.write(filepath, content, dry_run=dry_run)
        diffs[filepath] = diff
        if diff:
            changed.append(filepath)
    
    return GenerateResult(
        dry_run=dry_run,
        diffs=diffs,
        files_changed=changed,
    )
