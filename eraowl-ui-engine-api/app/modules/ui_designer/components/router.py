"""FastAPI router for Component Catalog — §6.4.

Endpoints for listing registered component types and registering new
custom components.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.db import get_db
from app.core.security import get_current_user, require_role

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

# ── Schemas ────────────────────────────────────────────────────────────────────


class ComponentCatalogEntry(BaseModel):
    """Public representation of a registered component."""

    component_type: str
    display_name: str
    category: str
    icon: str
    prop_schema: dict[str, Any]
    is_custom: bool


class RegisterComponentRequest(BaseModel):
    """Payload for registering a new custom component."""

    component_type: str
    prop_schema: dict[str, Any]
    display_name: str = ""
    category: str = "data"
    icon: str = ""
    template_options: dict[str, Any] = {}


class RegisterComponentResponse(BaseModel):
    """Confirmation of a successful registration."""

    component_type: str
    message: str


# ── Endpoints ──────────────────────────────────────────────────────────────────


@router.get(
    "/components",
    dependencies=[Depends(require_role("ui_designer.viewer", "ui_designer.editor", "ui_designer.admin"))],
)
async def list_components(
    _user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ComponentCatalogEntry]:
    """Return every registered component type with its property schema.

    Merges filesystem (built-in) schemas with database (custom) entries.
    """
    # ── Ensure filesystem cache is warm ────────────────────────────────────
    from app.modules.ui_designer.components.registry import ComponentRegistry

    ComponentRegistry.ensure_loaded()

    # ── Load built-in entries from filesystem ──────────────────────────────
    entries: dict[str, ComponentCatalogEntry] = {}
    for name, schema in ComponentRegistry.list_all().items():
        title = schema.get("title", name)
        entries[name] = ComponentCatalogEntry(
            component_type=title,
            display_name=title,
            category=_guess_category(name),
            icon="",
            prop_schema=schema,
            is_custom=False,
        )

    # ── Merge DB-registered custom components ──────────────────────────────
    try:
        from sqlalchemy import select

        from app.modules.ui_designer.components.models import ComponentCatalog

        stmt = select(ComponentCatalog)
        result = await db.execute(stmt)
        for row in result.scalars().all():
            key = row.component_type.lower()
            entries[key] = ComponentCatalogEntry(
                component_type=row.component_type,
                display_name=row.display_name or row.component_type,
                category=row.category or _guess_category(key),
                icon=row.icon or "",
                prop_schema=row.prop_schema,
                is_custom=row.is_custom,
            )
    except Exception:
        # DB may not have the table yet (fresh migration) — skip gracefully
        pass

    # Sort by component_type for deterministic ordering
    return sorted(entries.values(), key=lambda e: e.component_type)


@router.post(
    "/components/register",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role("ui_designer.admin"))],
)
async def register_component(
    payload: RegisterComponentRequest,
    _user: Annotated[dict[str, Any], Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RegisterComponentResponse:
    """Register a new custom component type.

    This is an admin-only endpoint. The ``prop_schema`` is validated to
    ensure it is well-formed JSON Schema, then persisted to the
    ``ComponentCatalog`` table and cached in the in-memory registry.
    """
    from jsonschema import Draft202012Validator

    from app.modules.ui_designer.components.models import ComponentCatalog
    from app.modules.ui_designer.components.registry import ComponentRegistry

    component_type = payload.component_type.strip()
    if not component_type:
        raise HTTPException(status_code=422, detail="component_type must not be empty")

    # Validate that the prop_schema is well-formed JSON Schema
    try:
        Draft202012Validator.check_schema(payload.prop_schema)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid JSON Schema: {exc}",
        ) from exc

    # Persist to DB
    created_by = (_user or {}).get("sub") or (_user or {}).get("email") or (_user or {}).get("user_id")
    record = ComponentCatalog(
        component_type=component_type,
        prop_schema=payload.prop_schema,
        template_options=payload.template_options,
        display_name=payload.display_name or component_type,
        category=payload.category,
        icon=payload.icon,
        is_custom=True,
        registered_by=created_by,
    )
    db.add(record)
    try:
        await db.flush()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Component '{component_type}' already registered: {exc}",
        ) from exc

    # Warm the in-memory cache so subsequent validations pick it up
    ComponentRegistry.register_schema(component_type, payload.prop_schema)

    return RegisterComponentResponse(
        component_type=component_type,
        message=f"Component '{component_type}' registered successfully",
    )


# ── Helpers ────────────────────────────────────────────────────────────────────


def _guess_category(name: str) -> str:
    """Infer component category from its filesystem schema file name."""
    layout_keywords = {
        "region", "standard", "grid", "flexbox", "content", "hero",
        "image", "help", "collapsible", "inline", "button_container",
        "title_bar", "tabs", "region_display", "static", "plasql",
        "scroll",
    }
    form_keywords = {
        "form_field", "input", "textarea", "select", "checkbox",
        "radio", "date", "number",
    }
    data_keywords = {
        "lov", "report", "grid", "column_toggle", "reflow",
        "contextual", "value_attribute", "card", "calendar",
        "carousel", "charts", "comments", "metric", "timeline",
        "tree", "wizard", "badge", "avatar", "alert",
    }
    navigation_keywords = {
        "breadcrumb", "links", "list_view", "media", "menu", "nav",
        "link",
    }
    action_keywords = {
        "button",
    }

    lower = name.lower()
    if any(kw in lower for kw in layout_keywords):
        return "layout"
    if any(kw in lower for kw in form_keywords):
        return "form"
    if any(kw in lower for kw in data_keywords):
        return "data"
    if any(kw in lower for kw in navigation_keywords):
        return "navigation"
    if any(kw in lower for kw in action_keywords):
        return "action"
    return "data"
