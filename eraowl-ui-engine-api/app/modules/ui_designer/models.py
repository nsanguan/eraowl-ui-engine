"""SQLModel ORM models for the UI Designer module (§5.1)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Text
from sqlmodel import Field, SQLModel


def _uuid() -> str:
    return str(uuid.uuid4())


# ── Pages ────────────────────────────────────────────────────────────────────

class Page(SQLModel, table=True):
    __tablename__ = "pages"

    id: str = Field(default_factory=_uuid, primary_key=True)
    name: str = Field(sa_column=Column(Text, nullable=False))
    route: str = Field(default="/", sa_column=Column(Text, nullable=False))
    description: str = Field(default="", sa_column=Column(Text))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = Field(default=None)


# ── Layouts ──────────────────────────────────────────────────────────────────

class PageLayout(SQLModel, table=True):
    __tablename__ = "page_layouts"

    id: str = Field(default_factory=_uuid, primary_key=True)
    page_id: str = Field(foreign_key="pages.id", index=True)
    version: int = Field(default=1)
    layout_json: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ── Resolver Catalog ─────────────────────────────────────────────────────────

class ResolverCatalog(SQLModel, table=True):
    __tablename__ = "resolver_catalog"

    id: str = Field(default_factory=_uuid, primary_key=True)
    name: str = Field(sa_column=Column(Text, nullable=False, unique=True))
    module_path: str = Field(sa_column=Column(Text, nullable=False))
    input_schema: str = Field(sa_column=Column(Text, nullable=False))
    output_schema: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ── Component Catalog ────────────────────────────────────────────────────────

class ComponentCatalog(SQLModel, table=True):
    __tablename__ = "component_catalog"

    id: str = Field(default_factory=_uuid, primary_key=True)
    name: str = Field(sa_column=Column(Text, nullable=False, unique=True))
    category: str = Field(default="basic", sa_column=Column(Text))
    prop_schema: str = Field(sa_column=Column(Text, nullable=False))
    default_props: str = Field(default="{}", sa_column=Column(Text))
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ── Theme ────────────────────────────────────────────────────────────────────

class ThemeCatalog(SQLModel, table=True):
    __tablename__ = "theme_catalog"

    id: str = Field(default_factory=_uuid, primary_key=True)
    name: str = Field(sa_column=Column(Text, nullable=False, unique=True))
    description: str = Field(default="", sa_column=Column(Text))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ThemeStyle(SQLModel, table=True):
    __tablename__ = "theme_styles"

    id: str = Field(default_factory=_uuid, primary_key=True)
    theme_id: str = Field(foreign_key="theme_catalog.id", index=True)
    style_json: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ThemeOverride(SQLModel, table=True):
    __tablename__ = "theme_overrides"

    id: str = Field(default_factory=_uuid, primary_key=True)
    theme_id: str = Field(foreign_key="theme_catalog.id", index=True)
    component_name: str = Field(sa_column=Column(Text, nullable=False))
    override_json: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ── Codegen ──────────────────────────────────────────────────────────────────

class CodegenTarget(SQLModel, table=True):
    __tablename__ = "codegen_targets"

    id: str = Field(default_factory=_uuid, primary_key=True)
    project_path: str = Field(sa_column=Column(Text, nullable=False))
    framework: str = Field(default="react", sa_column=Column(Text))
    config_json: str = Field(default="{}", sa_column=Column(Text))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CodegenRun(SQLModel, table=True):
    __tablename__ = "codegen_runs"

    id: str = Field(default_factory=_uuid, primary_key=True)
    target_id: str = Field(foreign_key="codegen_targets.id", index=True)
    page_ids: str = Field(sa_column=Column(Text, nullable=False))
    status: str = Field(default="pending", sa_column=Column(Text))
    diff_json: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(default_factory=datetime.utcnow)
