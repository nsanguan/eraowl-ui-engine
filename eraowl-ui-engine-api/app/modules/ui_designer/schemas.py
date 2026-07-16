"""Pydantic request / response DTOs for the UI Designer module."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ── Pages ────────────────────────────────────────────────────────────────────

class PageCreate(BaseModel):
    name: str
    route: str = "/"
    description: str = ""


class PageUpdate(BaseModel):
    name: str | None = None
    route: str | None = None
    description: str | None = None


class PageRead(BaseModel):
    id: str
    name: str
    route: str
    description: str
    created_at: datetime
    updated_at: datetime


class PageList(BaseModel):
    items: list[PageRead]
    total: int


# ── Layouts ──────────────────────────────────────────────────────────────────

class LayoutCreate(BaseModel):
    page_id: str
    layout_json: str = Field(..., description="JSON-serialised layout tree (§5.2)")


class LayoutRead(BaseModel):
    id: str
    page_id: str
    version: int
    layout_json: str
    created_at: datetime


# ── Resolvers ────────────────────────────────────────────────────────────────

class ResolverCatalogRead(BaseModel):
    id: str
    name: str
    module_path: str
    input_schema: str
    output_schema: str


class ResolverResolveRequest(BaseModel):
    resolver_name: str
    params: dict[str, Any] = {}


class ResolverResolveResponse(BaseModel):
    data: Any


# ── Components ───────────────────────────────────────────────────────────────

class ComponentCatalogRead(BaseModel):
    id: str
    name: str
    category: str
    prop_schema: str
    default_props: str


# ── Themes ───────────────────────────────────────────────────────────────────

class ThemeCatalogRead(BaseModel):
    id: str
    name: str
    description: str


class ThemeStyleRead(BaseModel):
    id: str
    theme_id: str
    style_json: str


class ThemeOverrideRead(BaseModel):
    id: str
    theme_id: str
    component_name: str
    override_json: str


# ── Codegen ──────────────────────────────────────────────────────────────────

class CodegenTargetCreate(BaseModel):
    project_path: str
    framework: str = "react"
    config_json: str = "{}"


class CodegenTargetRead(BaseModel):
    id: str
    project_path: str
    framework: str
    config_json: str
    created_at: datetime


class CodegenRunRequest(BaseModel):
    target_id: str
    page_ids: list[str]


class CodegenRunRead(BaseModel):
    id: str
    target_id: str
    status: str
    diff_json: str | None
    created_at: datetime
