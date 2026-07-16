"""Shared base CRUD service with soft-delete support."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Generic, TypeVar

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel

ModelT = TypeVar("ModelT", bound=SQLModel)


class BaseCRUDService(Generic[ModelT]):
    """Minimal CRUD operations with soft-delete for SQLModel tables."""

    model: type[ModelT]

    async def list_all(self, db: AsyncSession, *, include_deleted: bool = False) -> list[ModelT]:
        stmt = select(self.model)
        if not include_deleted and hasattr(self.model, "deleted_at"):
            stmt = stmt.where(self.model.deleted_at.is_(None))  # type: ignore[attr-defined]
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_or_404(self, db: AsyncSession, record_id: str) -> ModelT:
        stmt = select(self.model).where(self.model.id == record_id)  # type: ignore[attr-defined]
        result = await db.execute(stmt)
        obj = result.scalar_one_or_none()
        if obj is None:
            raise HTTPException(status_code=404, detail=f"{self.model.__name__} {record_id} not found")
        return obj

    async def soft_delete(self, db: AsyncSession, record_id: str) -> None:
        obj = await self.get_or_404(db, record_id)
        if hasattr(obj, "deleted_at"):
            obj.deleted_at = datetime.now(UTC)
            await db.flush()
        else:
            await db.delete(obj)
            await db.flush()
