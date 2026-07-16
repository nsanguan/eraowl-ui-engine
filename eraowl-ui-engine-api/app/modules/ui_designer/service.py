"""Business-logic service for Pages & Layouts."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from fastapi import HTTPException, status
from sqlalchemy import func, select

from app.modules.ui_designer.models import Page, PageLayout
from app.shared.base_crud import BaseCRUDService

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

    from app.modules.ui_designer.schemas import LayoutCreate, PageCreate, PageUpdate

logger = logging.getLogger(__name__)


def _as_owner_uuid(owner_id: str | None) -> uuid.UUID | None:
    """Coerce a JWT subject into a UUID, or ``None`` if absent.

    Raises :class:`ValueError` when ``owner_id`` is present but not a valid
    UUID — this prevents silent disablement of owner scoping that would occur
    if we returned ``None`` for a malformed subject claim.
    """
    if owner_id is None:
        return None
    try:
        return uuid.UUID(str(owner_id))
    except (ValueError, AttributeError, TypeError):
        logger.warning("Invalid owner_id UUID value: %r", owner_id)
        raise ValueError(f"Invalid owner_id: {owner_id!r} is not a valid UUID") from None


class PageService(BaseCRUDService[Page]):
    model = Page

    async def create(self, db: AsyncSession, payload: PageCreate, *, owner_id: str | None = None) -> Page:
        page = Page(**payload.model_dump(), owner_id=_as_owner_uuid(owner_id))
        db.add(page)
        await db.flush()
        return page

    async def get_scoped(
        self,
        db: AsyncSession,
        page_id: str,
        *,
        owner_id: str | None,
        is_admin: bool = False,
    ) -> Page | None:
        """Fetch a non-deleted page visible to the caller.

        Admins see all pages. Non-admins only see pages they own. Returns None
        when the page does not exist within the caller's scope (callers map this
        to 404 to avoid leaking the existence of other users' pages).
        """
        stmt = select(Page).where(Page.id == page_id, Page.deleted_at is None)  # type: ignore[arg-type]
        if not is_admin:
            stmt = stmt.where(Page.owner_id == _as_owner_uuid(owner_id))  # type: ignore[arg-type]
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def update(
        self,
        db: AsyncSession,
        page_id: str,
        payload: PageUpdate,
        *,
        owner_id: str | None,
        is_admin: bool = False,
    ) -> Page | None:
        page = await self.get_or_404(db, page_id)
        if not is_admin and page.owner_id != _as_owner_uuid(owner_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this page")
        for k, v in payload.model_dump(exclude_unset=True).items():
            setattr(page, k, v)
        page.updated_at = datetime.now(UTC)
        await db.flush()
        return page

    async def soft_delete_scoped(
        self,
        db: AsyncSession,
        page_id: str,
        *,
        owner_id: str | None,
        is_admin: bool = False,
    ) -> None:
        page = await self.get_or_404(db, page_id)
        if not is_admin and page.owner_id != _as_owner_uuid(owner_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this page")
        if page.deleted_at is None:
            page.deleted_at = datetime.now(UTC)
            await db.flush()

    async def list_paginated(
        self,
        db: AsyncSession,
        *,
        offset: int = 0,
        limit: int = 50,
        include_deleted: bool = False,
        owner_id: str | None = None,
        is_admin: bool = False,
    ) -> tuple[list[Page], int]:
        """Return a page of results and total count, scoped to the caller.

        Admins see all pages; non-admins are filtered by ``owner_id``.
        """
        base = select(Page)
        if not include_deleted:
            base = base.where(Page.deleted_at is None)  # type: ignore[arg-type]
        if not is_admin:
            base = base.where(Page.owner_id == _as_owner_uuid(owner_id))  # type: ignore[arg-type]

        count_stmt = select(func.count()).select_from(base.subquery())
        total = (await db.execute(count_stmt)).scalar_one()

        rows_stmt = base.order_by(Page.created_at.desc()).offset(offset).limit(limit)  # type: ignore[attr-defined]
        result = await db.execute(rows_stmt)
        return list(result.scalars().all()), total

    async def list_by_route(
        self,
        db: AsyncSession,
        route_prefix: str,
        *,
        include_deleted: bool = False,
        owner_id: str | None = None,
        is_admin: bool = False,
    ) -> list[Page]:
        """Return pages whose route starts with ``route_prefix``.

        Admins see all matching pages; non-admins are scoped to pages they own.
        By default, soft-deleted pages are excluded.
        """
        stmt = select(Page).where(Page.route.startswith(route_prefix))  # type: ignore[arg-type]
        if not include_deleted:
            stmt = stmt.where(Page.deleted_at is None)  # type: ignore[arg-type]
        if not is_admin:
            stmt = stmt.where(Page.owner_id == _as_owner_uuid(owner_id))  # type: ignore[arg-type]
        result = await db.execute(stmt)
        return list(result.scalars().all())


class LayoutService:
    async def create(self, db: AsyncSession, payload: LayoutCreate, created_by: str | None = None) -> PageLayout:
        # Determine the next version for this page.
        stmt = (
            select(func.max(PageLayout.version))
            .where(PageLayout.page_id == payload.page_id)  # type: ignore[arg-type]
        )
        result = await db.execute(stmt)
        max_version = result.scalar_one() or 0

        layout = PageLayout(
            page_id=payload.page_id,
            version=max_version + 1,
            layout_json=payload.layout_json,
            created_by=created_by,
        )
        db.add(layout)
        await db.flush()
        return layout

    async def get_latest(self, db: AsyncSession, page_id: str) -> PageLayout | None:
        stmt = (
            select(PageLayout)
            .where(PageLayout.page_id == page_id)  # type: ignore[arg-type]
            .order_by(PageLayout.version.desc())  # type: ignore[attr-defined]
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
