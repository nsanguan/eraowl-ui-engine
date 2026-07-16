"""SQLModel ORM models for the UI Designer module (§5.1).

Every model here must mirror the corresponding table in ``db/schema.sql``.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import Boolean, Column, Integer, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlmodel import Field, SQLModel


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(UTC)


# ── Pages ────────────────────────────────────────────────────────────────────

class Page(SQLModel, table=True):
    __tablename__ = "pages"

    id: str = Field(default_factory=_uuid, primary_key=True)
    tenant_id: str = Field(default="default", sa_column=Column(Text, nullable=False, server_default=text("'default'")))
    owner_id: uuid.UUID | None = Field(default=None, index=True)
    name: str = Field(sa_column=Column(Text, nullable=False))
    route: str = Field(default="/", sa_column=Column(Text, nullable=False, server_default=text("'/'")))
    description: str = Field(default="", sa_column=Column(Text, nullable=False, server_default=text("''")))
    schema_version: str = Field(default="1.0.0", sa_column=Column(Text, nullable=False, server_default=text("'1.0.0'")))
    is_active: bool = Field(default=True, sa_column=Column(Boolean, nullable=False, server_default=text("true")))
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)
    deleted_at: datetime | None = Field(default=None)


# ── Layouts ──────────────────────────────────────────────────────────────────

class PageLayout(SQLModel, table=True):
    __tablename__ = "page_layouts"

    id: str = Field(default_factory=_uuid, primary_key=True)
    page_id: str = Field(foreign_key="pages.id", index=True)
    version: int = Field(default=1, sa_column=Column(Integer, nullable=False, server_default=text("1")))
    layout_json: Any = Field(sa_column=Column(JSONB, nullable=False))
    is_published: bool = Field(default=False, sa_column=Column(Boolean, nullable=False, server_default=text("false")))
    created_by: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(default_factory=_now)


# ── Resolver Catalog ─────────────────────────────────────────────────────────

class ResolverCatalog(SQLModel, table=True):
    __tablename__ = "resolver_catalog"

    resolver_key: str = Field(sa_column=Column(Text, primary_key=True))
    description: str = Field(sa_column=Column(Text, nullable=False))
    param_schema: Any = Field(sa_column=Column(JSONB, nullable=False))
    registered_by: str = Field(sa_column=Column(Text, nullable=False))
    is_active: bool = Field(default=True, sa_column=Column(Boolean, nullable=False, server_default=text("true")))
    created_at: datetime = Field(default_factory=_now)


# ── Component Catalog ────────────────────────────────────────────────────────

class ComponentCatalog(SQLModel, table=True):
    __tablename__ = "component_catalog"

    component_type: str = Field(sa_column=Column(Text, primary_key=True))
    prop_schema: Any = Field(sa_column=Column(JSONB, nullable=False))
    template_options: Any = Field(default={}, sa_column=Column(JSONB, nullable=False, server_default=text("'{}'")))
    is_custom: bool = Field(default=False, sa_column=Column(Boolean, nullable=False, server_default=text("false")))
    registered_by: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(default_factory=_now)


# ── Theme Catalog ────────────────────────────────────────────────────────────

class ThemeCatalog(SQLModel, table=True):
    __tablename__ = "theme_catalog"

    theme_id: str = Field(sa_column=Column(Text, primary_key=True))
    tenant_id: str | None = Field(default=None, sa_column=Column(Text))
    display_name: str = Field(sa_column=Column(Text, nullable=False))
    description: str | None = Field(default=None, sa_column=Column(Text))
    base_tokens: Any = Field(sa_column=Column(JSONB, nullable=False))
    template_options: Any = Field(sa_column=Column(JSONB, nullable=False))
    is_default: bool = Field(default=False, sa_column=Column(Boolean, nullable=False, server_default=text("false")))
    is_active: bool = Field(default=True, sa_column=Column(Boolean, nullable=False, server_default=text("true")))
    schema_version: str = Field(default="1.0.0", sa_column=Column(Text, nullable=False, server_default=text("'1.0.0'")))
    created_by: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


# ── Theme Styles ─────────────────────────────────────────────────────────────

class ThemeStyle(SQLModel, table=True):
    __tablename__ = "theme_styles"

    style_id: str = Field(default_factory=_uuid, primary_key=True)
    theme_id: str = Field(foreign_key="theme_catalog.theme_id", index=True)
    tenant_id: str | None = Field(default=None, sa_column=Column(Text))
    style_key: str = Field(sa_column=Column(Text, nullable=False))
    display_name: str = Field(sa_column=Column(Text, nullable=False))
    delta_tokens: Any = Field(sa_column=Column(JSONB, nullable=False))
    is_default: bool = Field(default=False, sa_column=Column(Boolean, nullable=False, server_default=text("false")))
    created_by: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(default_factory=_now)


# ── Theme Overrides ──────────────────────────────────────────────────────────

class ThemeOverride(SQLModel, table=True):
    __tablename__ = "theme_overrides"

    override_id: str = Field(default_factory=_uuid, primary_key=True)
    theme_id: str = Field(foreign_key="theme_catalog.theme_id", index=True)
    style_id: str | None = Field(default=None, foreign_key="theme_styles.style_id")
    tenant_id: str = Field(sa_column=Column(Text, nullable=False))
    token_path: str = Field(sa_column=Column(Text, nullable=False))
    token_value: Any = Field(sa_column=Column(JSONB, nullable=False))
    created_by: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(default_factory=_now)


# ── Codegen Targets ──────────────────────────────────────────────────────────

class CodegenTarget(SQLModel, table=True):
    __tablename__ = "codegen_targets"

    id: str = Field(default_factory=_uuid, primary_key=True)
    page_id: str = Field(foreign_key="pages.id", index=True)
    project_root: str = Field(sa_column=Column(Text, nullable=False))
    target_subpath: str = Field(sa_column=Column(Text, nullable=False))
    allowed_write_globs: list[str] = Field(
        sa_column=Column(
            ARRAY(Text),
            nullable=False,
            server_default=text("ARRAY['apps/web/src/pages/generated/**','apps/web/src/components/generated/**']"),
        )
    )
    framework_detected: str | None = Field(default=None, sa_column=Column(Text))
    last_scanned_at: datetime | None = Field(default=None)
    last_generated_at: datetime | None = Field(default=None)
    last_commit_sha: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(default_factory=_now)


# ── Codegen Runs ─────────────────────────────────────────────────────────────

class CodegenRun(SQLModel, table=True):
    __tablename__ = "codegen_runs"

    id: str = Field(default_factory=_uuid, primary_key=True)
    codegen_target_id: str = Field(foreign_key="codegen_targets.id", index=True)
    dry_run: bool = Field(sa_column=Column(Boolean, nullable=False))
    diff_summary: str | None = Field(default=None, sa_column=Column(Text))
    files_changed: list[str] | None = Field(default=None, sa_column=Column(ARRAY(Text)))
    approved_by: str | None = Field(default=None, sa_column=Column(Text))
    status: str = Field(default="pending", sa_column=Column(Text, nullable=False, server_default=text("'pending'")))
    created_at: datetime = Field(default_factory=_now)
