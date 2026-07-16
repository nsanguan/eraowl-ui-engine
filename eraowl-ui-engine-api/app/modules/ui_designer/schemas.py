"""Pydantic request / response DTOs for the UI Designer module.

All ``*Read`` models carry ``from_attributes=True`` so that
:meth:`model_validate` works with SQLModel ORM instances.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

# ── Pages ────────────────────────────────────────────────────────────────────


class PageCreate(BaseModel):
    name: str
    route: str = "/"
    description: str = ""
    tenant_id: str = "default"


class PageUpdate(BaseModel):
    name: str | None = None
    route: str | None = None
    description: str | None = None
    is_active: bool | None = None


class PageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    name: str
    route: str
    description: str
    schema_version: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PageList(BaseModel):
    items: list[PageRead]
    total: int


# ── Layouts ──────────────────────────────────────────────────────────────────


class LayoutCreate(BaseModel):
    page_id: str
    layout_json: dict[str, Any] = Field(..., description="Layout tree object (§5.2)")


class LayoutRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    page_id: str
    version: int
    layout_json: dict[str, Any]
    is_published: bool
    created_by: str | None
    created_at: datetime


# ── Resolvers ────────────────────────────────────────────────────────────────


class ResolverCatalogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    resolver_key: str
    description: str
    param_schema: dict[str, Any]
    registered_by: str
    is_active: bool


class ResolverResolveRequest(BaseModel):
    resolver_name: str
    params: dict[str, Any] = {}


class ResolverResolveResponse(BaseModel):
    data: Any


# ── Components ───────────────────────────────────────────────────────────────


class ComponentCatalogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    component_type: str
    prop_schema: dict[str, Any]
    template_options: dict[str, Any]
    is_custom: bool
    registered_by: str | None


# ── Themes ───────────────────────────────────────────────────────────────────


class ThemeCatalogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    theme_id: str
    tenant_id: str | None
    display_name: str
    description: str | None
    base_tokens: dict[str, Any]
    template_options: dict[str, Any]
    is_default: bool
    is_active: bool


class ThemeStyleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    style_id: str
    theme_id: str
    tenant_id: str | None
    style_key: str
    display_name: str
    delta_tokens: dict[str, Any]
    is_default: bool


class ThemeOverrideRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    override_id: str
    theme_id: str
    style_id: str | None
    tenant_id: str
    token_path: str
    token_value: Any


# ── Codegen ──────────────────────────────────────────────────────────────────


class CodegenTargetCreate(BaseModel):
    page_id: str
    project_root: str
    target_subpath: str
    allowed_write_globs: list[str] = [
        "apps/web/src/pages/generated/**",
        "apps/web/src/components/generated/**",
    ]


class CodegenTargetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    page_id: str
    project_root: str
    target_subpath: str
    allowed_write_globs: list[str]
    framework_detected: str | None
    last_scanned_at: datetime | None
    last_generated_at: datetime | None
    last_commit_sha: str | None
    created_at: datetime


class CodegenRunRequest(BaseModel):
    codegen_target_id: str
    dry_run: bool = True


class CodegenRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    codegen_target_id: str
    dry_run: bool
    diff_summary: str | None
    files_changed: list[str] | None
    approved_by: str | None
    status: str
    created_at: datetime
