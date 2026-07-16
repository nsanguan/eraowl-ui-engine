"""SQLModel ORM for the Component Catalog — §6.4 Component Registry.

Table ``ui_designer.ui_component_catalog`` stores every component type
the system recognises, along with its JSON Schema property constraints,
template options, and registration metadata.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import Boolean, Column, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(UTC)


class ComponentCatalog(SQLModel, table=True):
    """Registered UI component type with its property schema.

    This is the backend authority for what component types exist,
    what properties they accept, and whether they are built-in or
    custom-registered at runtime.
    """

    __tablename__ = "ui_component_catalog"  # noqa: E501
    __table_args__ = {"schema": "ui_designer"}

    component_type: str = Field(
        sa_column=Column(Text, primary_key=True),
        description="Canonical PascalCase type name, e.g. 'Region', 'LovSelect'",
    )
    prop_schema: Any = Field(
        sa_column=Column(JSONB, nullable=False),
        description="JSON Schema (draft-2020-12) describing valid properties for this component",
    )
    template_options: Any = Field(
        default={},
        sa_column=Column(JSONB, nullable=False, server_default=text("'{}'")),
        description="Available template option definitions ({key: {type, enum, default}})",
    )
    display_name: str = Field(
        default="",
        sa_column=Column(Text, nullable=False, server_default=text("''")),
        description="Human-readable display name",
    )
    category: str = Field(
        default="data",
        sa_column=Column(Text, nullable=False, server_default=text("'data'")),
        description="Component category: layout, form, data, navigation, action",
    )
    icon: str = Field(
        default="",
        sa_column=Column(Text, nullable=False, server_default=text("''")),
        description="Optional icon identifier for the designer palette",
    )
    is_custom: bool = Field(
        default=False,
        sa_column=Column(Boolean, nullable=False, server_default=text("false")),
        description="True if registered at runtime (not a built-in component)",
    )
    registered_by: str | None = Field(
        default=None,
        sa_column=Column(Text),
        description="User or system that registered this component",
    )
    created_at: datetime = Field(
        default_factory=_now,
        sa_column=Column(Text, server_default=text("now()")),
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(Text, server_default=text("now()")),
    )
