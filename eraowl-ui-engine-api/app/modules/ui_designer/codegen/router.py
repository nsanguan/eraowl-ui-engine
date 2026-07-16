"""FastAPI router for codegen-targets endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.modules.ui_designer.schemas import CodegenRunRead, CodegenRunRequest, CodegenTargetCreate, CodegenTargetRead
from app.modules.ui_designer.models import CodegenTarget, CodegenRun

router = APIRouter(prefix="/codegen-targets")


@router.get("", response_model=list[CodegenTargetRead])
async def list_targets(db: Annotated[AsyncSession, Depends(get_db)]) -> list[CodegenTarget]:
    from sqlalchemy import select
    result = await db.execute(select(CodegenTarget))
    return list(result.scalars().all())


@router.post("", response_model=CodegenTargetRead, status_code=201)
async def create_target(
    payload: CodegenTargetCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CodegenTarget:
    target = CodegenTarget(**payload.model_dump())
    db.add(target)
    await db.flush()
    return target


@router.post("/run", response_model=CodegenRunRead, status_code=201)
async def run_codegen(
    payload: CodegenRunRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CodegenRun:
    run = CodegenRun(
        target_id=payload.target_id,
        page_ids=",".join(payload.page_ids),
        status="pending",
    )
    db.add(run)
    await db.flush()
    return run
