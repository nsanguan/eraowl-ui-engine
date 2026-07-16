"""FastAPI router for Pages & Layouts.

§6.3 — Every endpoint requires Auth/RBAC.
§9.1 Rule 2 — Every new endpoint must have Depends(require_role(...))
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user, is_admin, require_role, user_id
from app.modules.ui_designer.schemas import (
    LayoutCreate,
    LayoutRead,
    PageCreate,
    PageList,
    PageRead,
    PageUpdate,
)
from app.modules.ui_designer.service import LayoutService, PageService
from app.schema_validation.validator import validate_layout

router = APIRouter()

_page_svc = PageService()
_layout_svc = LayoutService()


# ── Pages ────────────────────────────────────────────────────────────────────

@router.get("/pages", response_model=PageList)
async def list_pages(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    offset: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(50, ge=1, le=200, description="Pagination limit"),
) -> PageList:
    items, total = await _page_svc.list_paginated(
        db, offset=offset, limit=limit, owner_id=user_id(user), is_admin=is_admin(user)
    )
    return PageList(items=[PageRead.model_validate(i) for i in items], total=total)


@router.post(
    "/pages",
    response_model=PageRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("ui_designer.editor", "ui_designer.admin"))],
)
async def create_page(
    payload: PageCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> PageRead:
    page = await _page_svc.create(db, payload, owner_id=user_id(user))
    return PageRead.model_validate(page)


@router.get("/pages/{page_id}", response_model=PageRead)
async def get_page(
    page_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> PageRead:
    page = await _page_svc.get_scoped(db, page_id, owner_id=user_id(user), is_admin=is_admin(user))
    if page is None:
        raise HTTPException(status_code=404)
    return PageRead.model_validate(page)


@router.patch(
    "/pages/{page_id}",
    response_model=PageRead,
    dependencies=[Depends(require_role("ui_designer.editor", "ui_designer.admin"))],
)
async def update_page(
    page_id: str,
    payload: PageUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> PageRead:
    page = await _page_svc.update(db, page_id, payload, owner_id=user_id(user), is_admin=is_admin(user))
    if page is None:
        raise HTTPException(status_code=404)
    return PageRead.model_validate(page)


@router.delete(
    "/pages/{page_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role("ui_designer.admin"))],
)
async def delete_page(
    page_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> None:
    await _page_svc.soft_delete_scoped(db, page_id, owner_id=user_id(user), is_admin=is_admin(user))


# ── Layouts ──────────────────────────────────────────────────────────────────

@router.post(
    "/layouts",
    response_model=LayoutRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("ui_designer.editor", "ui_designer.admin"))],
)
async def create_layout(
    payload: LayoutCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> LayoutRead:
    # §6 Security Contract: validate layout_json against JSON Schema before persisting
    validate_layout(payload.layout_json)
    layout = await _layout_svc.create(db, payload, created_by=user.get("sub"))
    return LayoutRead.model_validate(layout)


@router.get("/layouts/{page_id}/latest", response_model=LayoutRead)
async def get_latest_layout(
    page_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> LayoutRead:
    layout = await _layout_svc.get_latest(db, page_id)
    if layout is None:
        raise HTTPException(status_code=404)
    return LayoutRead.model_validate(layout)
