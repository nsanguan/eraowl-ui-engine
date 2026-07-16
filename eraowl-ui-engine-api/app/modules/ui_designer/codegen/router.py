from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from app.core.config import settings
from app.core.db import get_db
from app.core.security import get_current_user, require_role
from app.modules.ui_designer.codegen.generator import CodeGenerator
from app.modules.ui_designer.codegen.scanner import ProjectScanner
from app.modules.ui_designer.codegen.writer import SandboxWriter
from app.modules.ui_designer.models import CodegenRun, CodegenTarget
from app.schema_validation.validator import validate_layout_json

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

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


class GenerateRequest(BaseModel):
    page_id: str | None = None
    layout: dict[str, Any] | None = None


class GenerateResult(BaseModel):
    dry_run: bool
    diffs: dict[str, str | None]
    files_changed: list[str]
    run_id: str | None = None


async def _get_target(db: AsyncSession, target_id: str) -> CodegenTarget:
    stmt = select(CodegenTarget).where(CodegenTarget.id == target_id)  # type: ignore[arg-type]
    result = await db.execute(stmt)
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"CodegenTarget {target_id} not found",
        )
    return target


async def _detect_framework(scanner: ProjectScanner) -> str:
    """Detect project framework based on config files in the project root."""
    manifest = scanner.scan()
    config_files = {f.rel_path for f in manifest.files}

    if "next.config.js" in config_files or "next.config.ts" in config_files:
        return "nextjs"
    if "vite.config.ts" in config_files or "vite.config.js" in config_files:
        return "vite-react"
    if "angular.json" in config_files:
        return "angular"
    if "vue.config.js" in config_files or "nuxt.config.ts" in config_files:
        return "vue"
    if "package.json" in config_files:
        return "react (unknown bundler)"
    return "unknown"


@router.get(
    "/codegen-targets/{target_id}/scan",
    dependencies=[Depends(require_role("ui_designer.viewer", "ui_designer.editor", "ui_designer.admin"))],
)
async def scan_target(target_id: str) -> ScanResult:
    scanner = ProjectScanner(settings.TARGET_PROJECT_ROOT)
    scanner.scan()
    framework = await _detect_framework(scanner)
    return ScanResult(
        framework_detected=framework,
        component_style="PascalCase + named export",
    )


@router.post(
    "/codegen-targets/{target_id}/generate",
    dependencies=[Depends(require_role("ui_designer.codegen", "ui_designer.admin"))],
)
async def generate_code(
    target_id: str,
    payload: GenerateRequest | None = None,
    dry_run: bool = True,
    db: Annotated[AsyncSession, Depends(get_db)] = None,  # type: ignore[assignment]
    user: Annotated[dict[str, Any], Depends(get_current_user)] = None,  # type: ignore[assignment]
) -> GenerateResult:
    target = await _get_target(db, target_id)

    page_id = None
    if payload is not None:
        page_id = payload.page_id

    layout = None
    if payload is not None and payload.layout is not None:
        layout = payload.layout
    elif page_id is not None:
        # Load the real latest layout for the page.
        from app.modules.ui_designer.service import LayoutService

        latest = await LayoutService().get_latest(db, page_id)
        if latest is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No layout found for page {page_id}",
            )
        layout = {"layout_json": latest.layout_json}

    if layout is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either `layout` or `page_id` must be provided",
        )

    # §6 Security Contract: validate layout_json against JSON Schema before codegen
    layout_json = layout.get("layout_json", layout)
    errors = validate_layout_json(layout_json)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Layout failed schema validation", "errors": errors},
        )

    created_by = (user or {}).get("sub") or (user or {}).get("email") or (user or {}).get("user_id")

    generator = CodeGenerator(target.project_root, target.target_subpath)
    files = generator.generate_page(layout)

    writer = SandboxWriter(target.project_root, target.allowed_write_globs)

    run = CodegenRun(
        codegen_target_id=target.id,
        dry_run=dry_run,
        status="pending",
        files_changed=list(files.keys()),
        diff_summary=f"created_by={created_by}" if created_by else None,
    )
    db.add(run)
    await db.flush()

    diffs: dict[str, str | None] = {}
    changed: list[str] = []
    try:
        for filepath, content in files.items():
            diff = writer.write(filepath, content, dry_run=dry_run)
            diffs[filepath] = diff
            if diff:
                changed.append(filepath)
        run.files_changed = changed or list(files.keys())
        run.diff_summary = f"{len(changed)} file(s) changed (dry_run={dry_run})"
        run.status = "completed" if dry_run else "completed"
    except Exception as exc:  # noqa: BLE001
        run.status = "failed"
        run.diff_summary = f"error: {exc}"
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"codegen failed: {exc}",
        ) from None

    await db.commit()
    return GenerateResult(
        dry_run=dry_run,
        diffs=diffs,
        files_changed=changed,
        run_id=run.id,
    )
