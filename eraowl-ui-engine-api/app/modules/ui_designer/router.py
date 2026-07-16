"""FastAPI router for Pages & Layouts.

§6.3 — Every endpoint requires Auth/RBAC.
§9.1 Rule 2 — Every new endpoint must have Depends(require_role(...))
"""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user, require_role
from app.modules.ui_designer.schemas import (
    LayoutCreate,
    LayoutRead,
    PageCreate,
    PageList,
    PageRead,
    PageUpdate,
)
from app.modules.ui_designer.service import LayoutService, PageService

router = APIRouter()

_page_svc = PageService()
_layout_svc = LayoutService()


# ── Pages ────────────────────────────────────────────────────────────────────

@router.get("/pages", response_model=PageList)
async def list_pages(
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[dict, Depends(get_current_user)],
) -> PageList:
    items = await _page_svc.list_all(db)
    return PageList(items=[PageRead.model_validate(i) for i in items], total=len(items))


@router.post(
    "/pages",
    response_model=PageRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("ui_designer.editor", "ui_designer.admin"))],
)
async def create_page(
    payload: PageCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PageRead:
    page = await _page_svc.create(db, payload)
    return PageRead.model_validate(page)


@router.get("/pages/{page_id}", response_model=PageRead)
async def get_page(
    page_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[dict, Depends(get_current_user)],
) -> PageRead:
    page = await _page_svc.get_or_404(db, page_id)
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
) -> PageRead:
    page = await _page_svc.update(db, page_id, payload)
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
) -> None:
    await _page_svc.soft_delete(db, page_id)


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
) -> LayoutRead:
    layout = await _layout_svc.create(db, payload)
    return LayoutRead.model_validate(layout)


@router.get("/layouts/{page_id}/latest", response_model=LayoutRead)
async def get_latest_layout(
    page_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[dict, Depends(get_current_user)],
) -> LayoutRead:
    layout = await _layout_svc.get_latest(db, page_id)
    if layout is None:
        raise HTTPException(status_code=404)
    return LayoutRead.model_validate(layout)
