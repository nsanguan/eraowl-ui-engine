"""Business-logic service stubs for Pages & Layouts."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.ui_designer.models import Page, PageLayout
from app.modules.ui_designer.schemas import LayoutCreate, PageCreate, PageUpdate
from app.shared.base_crud import BaseCRUDService


class PageService(BaseCRUDService[Page]):
    model = Page

    async def create(self, db: AsyncSession, payload: PageCreate) -> Page:
        page = Page(**payload.model_dump())
        db.add(page)
        await db.flush()
        return page

    async def update(self, db: AsyncSession, page_id: str, payload: PageUpdate) -> Page | None:
        page = await self.get_or_404(db, page_id)
        for k, v in payload.model_dump(exclude_unset=True).items():
            setattr(page, k, v)
        await db.flush()
        return page

    async def list_by_route(self, db: AsyncSession, route_prefix: str) -> list[Page]:
        stmt = select(Page).where(Page.route.startswith(route_prefix))
        result = await db.execute(stmt)
        return list(result.scalars().all())


class LayoutService:
    async def create(self, db: AsyncSession, payload: LayoutCreate) -> PageLayout:
        layout = PageLayout(**payload.model_dump())
        db.add(layout)
        await db.flush()
        return layout

    async def get_latest(self, db: AsyncSession, page_id: str) -> PageLayout | None:
        stmt = (
            select(PageLayout)
            .where(PageLayout.page_id == page_id)
            .order_by(PageLayout.version.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
