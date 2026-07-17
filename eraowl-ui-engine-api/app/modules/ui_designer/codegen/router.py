from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc, select

from app.core.db import get_db
from app.core.security import get_current_user, require_role
from app.modules.ui_designer.codegen.decompiler import ParseError as DecompParseError
from app.modules.ui_designer.codegen.decompiler import SecurityError, TsxDecompiler
from app.modules.ui_designer.codegen.generator import CodeGenerator
from app.modules.ui_designer.codegen.scanner import ProjectScanner
from app.modules.ui_designer.codegen.writer import SandboxWriter
from app.modules.ui_designer.models import CodegenRun, CodegenTarget
from app.modules.ui_designer.schemas import CodegenTargetCreate, CodegenTargetRead
from app.schema_validation.validator import validate_layout_json

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

router = APIRouter()


class ReverseEngineerRequest(BaseModel):
    file_path: str
    """Absolute path to the .tsx file to decompile (must be under the target's project_root)."""


class ReverseEngineerResult(BaseModel):
    layout_json: dict[str, Any]
    """Validated layout JSON conforming to layout_schema_v1.json."""


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


# ── CRUD Endpoints ───────────────────────────────────────────────────────────


@router.post(
    "/codegen-targets",
    status_code=status.HTTP_201_CREATED,
    response_model=CodegenTargetRead,
    dependencies=[Depends(require_role("ui_designer.editor", "ui_designer.admin"))],
)
async def create_codegen_target(
    payload: CodegenTargetCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> CodegenTarget:
    """Register a new codegen target for a page."""
    # Validate that project_root is an absolute path
    from pathlib import Path

    p = Path(payload.project_root)
    if not p.is_absolute():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="project_root must be an absolute path",
        )

    target = CodegenTarget(
        page_id=payload.page_id,
        project_root=payload.project_root,
        target_subpath=payload.target_subpath,
        allowed_write_globs=payload.allowed_write_globs or [
            "apps/web/src/pages/generated/**",
            "apps/web/src/components/generated/**",
        ],
    )
    db.add(target)
    await db.commit()
    await db.refresh(target)
    logger.info("Created codegen target %s for page %s", target.id, target.page_id)
    return target


@router.get(
    "/codegen-targets",
    dependencies=[Depends(require_role("ui_designer.viewer", "ui_designer.editor", "ui_designer.admin"))],
)
async def list_codegen_targets(
    page_id: str | None = Query(None, description="Filter by page ID"),
    db: Annotated[AsyncSession, Depends(get_db)] = None,  # type: ignore[assignment]
    user: Annotated[dict[str, Any], Depends(get_current_user)] = None,  # type: ignore[assignment]
) -> list[CodegenTargetRead]:
    """List codegen targets scoped to pages owned by the caller.

    Admins see all targets. Non-admins only see targets for pages they own.
    """
    from app.core.security import is_admin
    from app.modules.ui_designer.models import Page

    stmt = select(CodegenTarget).order_by(desc(CodegenTarget.created_at))

    if page_id:
        stmt = stmt.where(CodegenTarget.page_id == page_id)

    # Owner scoping via join to pages table
    if not is_admin(user):
        owner_id_str = user.get("sub")
        if owner_id_str:
            try:
                owner_uuid = uuid.UUID(str(owner_id_str))
            except (ValueError, AttributeError, TypeError):
                owner_uuid = None
            if owner_uuid is not None:
                stmt = stmt.join(Page, CodegenTarget.page_id == Page.id).where(  # type: ignore[arg-type]
                    Page.owner_id == owner_uuid  # type: ignore[arg-type]
                )

    result = await db.execute(stmt)
    targets = result.scalars().all()
    return [CodegenTargetRead.model_validate(t) for t in targets]


@router.get(
    "/codegen-targets/{target_id}",
    response_model=CodegenTargetRead,
    dependencies=[Depends(require_role("ui_designer.viewer", "ui_designer.editor", "ui_designer.admin"))],
)
async def get_codegen_target(
    target_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> CodegenTarget:
    """Get a single codegen target by ID."""
    return await _get_target(db, target_id)


@router.delete(
    "/codegen-targets/{target_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role("ui_designer.admin"))],
)
async def delete_codegen_target(
    target_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> None:
    """Delete a codegen target."""
    target = await _get_target(db, target_id)
    await db.delete(target)
    await db.commit()
    logger.info("Deleted codegen target %s", target_id)


# ── Reverse Engineering Endpoint ─────────────────────────────────────────


@router.post(
    "/codegen-targets/{target_id}/reverse-engineer",
    response_model=ReverseEngineerResult,
    dependencies=[Depends(require_role("ui_designer.codegen", "ui_designer.admin"))],
)
async def reverse_engineer(
    target_id: str,
    payload: ReverseEngineerRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> ReverseEngineerResult:
    """Decompile a legacy .tsx file into a validated layout_json.

    The file must be within the target's project_root. The resulting layout
    is schema-validated and ready to load into the Designer canvas.
    """
    target = await _get_target(db, target_id)
    project_root = target.project_root

    try:
        decompiler = TsxDecompiler()
        layout = decompiler.decompile(
            file_path=payload.file_path,
            project_root=project_root,
        )
    except SecurityError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from None
    except DecompParseError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from None
    except Exception as exc:
        logger.exception("Reverse engineering failed for %s", payload.file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reverse engineering failed: {exc}",
        ) from None

    return ReverseEngineerResult(layout_json=layout)


# ── Scan Endpoint ────────────────────────────────────────────────────────────


@router.get(
    "/codegen-targets/{target_id}/scan",
    dependencies=[Depends(require_role("ui_designer.viewer", "ui_designer.editor", "ui_designer.admin"))],
)
async def scan_target(
    target_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> ScanResult:
    """Scan a codegen target's project root to detect framework & convention.

    Loads the target from DB to use its actual project_root, then updates
    the target record with the detected framework.
    """
    target = await _get_target(db, target_id)
    scanner = ProjectScanner(target.project_root)
    framework = await _detect_framework(scanner)

    # Persist detection result back to the target record
    target.framework_detected = framework
    target.last_scanned_at = datetime.now(UTC)
    db.add(target)
    await db.commit()

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

    layout: dict[str, Any] | None = None
    if payload is not None and payload.layout is not None:
        # payload.layout may be a raw layout {"schemaVersion": ..., "regions": [...]}
        # or already wrapped {"layout_json": {...}}. Normalize to unwrapped form.
        raw = payload.layout
        layout = raw.get("layout_json", raw)
    elif page_id is not None:
        # Load the real latest layout for the page.
        from app.modules.ui_designer.service import LayoutService

        latest = await LayoutService().get_latest(db, page_id)
        if latest is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No layout found for page {page_id}",
            )
        layout = latest.layout_json

    if layout is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either `layout` or `page_id` must be provided",
        )

    # §6 Security Contract: validate layout_json against JSON Schema before codegen
    errors = validate_layout_json(layout)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Layout failed schema validation", "errors": errors},
        )

    created_by = (user or {}).get("sub") or (user or {}).get("email") or (user or {}).get("user_id")

    generator = CodeGenerator(target.project_root, target.target_subpath)
    files = generator.generate_page({"layout_json": layout})

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
