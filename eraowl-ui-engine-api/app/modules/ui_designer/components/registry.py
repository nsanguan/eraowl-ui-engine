"""Component property-schema registry — §6.4 Component Registry.

Loads per-component JSON Schema files from ``schemas/``, caches them,
and provides validation of component properties against those schemas.
Can optionally back-fill from the ``ComponentCatalog`` DB table for
runtime-registered custom components.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import TYPE_CHECKING, Any

from jsonschema import Draft202012Validator

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

_SCHEMAS_DIR = Path(__file__).parent / "schemas"

# ── Cache ──────────────────────────────────────────────────────────────────────
# In-memory cache: component_type -> prop_schema dict
_prop_schemas: dict[str, dict[str, Any]] = {}
_loaded_from_db = False


class ComponentRegistry:
    """Registry that caches component property schemas and validates props.

    Two-tier resolution:
      1. Filesystem — JSON Schema files in ``schemas/*.schema.json``
         (built-in, shipped with the codebase).
      2. Database — ``ComponentCatalog`` rows loaded on first miss
         (custom components registered at runtime).
    """

    # ── Filesystem loading ────────────────────────────────────────────────

    @classmethod
    def _load_fs_schemas(cls) -> dict[str, dict[str, Any]]:
        """Load all ``*.schema.json`` files from the schemas directory."""
        schemas: dict[str, dict[str, Any]] = {}
        if not _SCHEMAS_DIR.is_dir():
            logger.warning("Schemas directory not found: %s", _SCHEMAS_DIR)
            return schemas
        for path in sorted(_SCHEMAS_DIR.glob("*.schema.json")):
            name = path.stem.removesuffix(".schema")
            # Normalize: remove underscores so "input_text" becomes "inputtext"
            # matching the component type lowercase convention.
            normalized = name.replace("_", "")
            try:
                schemas[normalized] = json.loads(path.read_text())
            except (json.JSONDecodeError, OSError) as exc:
                logger.error("Failed to load schema %s: %s", path.name, exc)
        return schemas

    # ── DB loading (lazy, on first miss) ──────────────────────────────────

    @classmethod
    async def _load_db_schemas(cls, db: AsyncSession | None) -> dict[str, dict[str, Any]]:
        """Load custom schemas from the ComponentCatalog DB table (lazy)."""
        global _loaded_from_db
        schemas: dict[str, dict[str, Any]] = {}
        if db is None or _loaded_from_db:
            return schemas
        try:
            from sqlalchemy import select

            from app.modules.ui_designer.components.models import ComponentCatalog

            stmt = select(ComponentCatalog).where(ComponentCatalog.is_custom.is_(True))  # type: ignore[attr-defined]
            result = await db.execute(stmt)
            for row in result.scalars().all():
                schemas[row.component_type.lower()] = row.prop_schema
            _loaded_from_db = True
        except Exception as exc:
            logger.warning("Failed to load DB component schemas: %s", exc)
        return schemas

    # ── Public API ────────────────────────────────────────────────────────

    @classmethod
    def ensure_loaded(cls) -> None:
        """Warm the filesystem cache if empty."""
        if not _prop_schemas:
            _prop_schemas.update(cls._load_fs_schemas())

    @classmethod
    def get(cls, component_type: str, db: AsyncSession | None = None) -> dict[str, Any]:
        """Return the prop_schema for *component_type*, or an empty dict."""
        key = component_type.lower().replace("_", "")
        # Check filesystem cache first
        if not _prop_schemas:
            _prop_schemas.update(cls._load_fs_schemas())
        schema = _prop_schemas.get(key)
        if schema is not None:
            return schema
        # Lazy DB load on first miss (blocking — caller should warm at startup)
        import asyncio

        try:
            loop = asyncio.get_running_loop()
            if loop.is_running() and db is not None:
                asyncio.ensure_future(cls._load_db_schemas(db))
        except RuntimeError:
            pass
        # Return empty rather than raise — caller decides how to handle
        return _prop_schemas.get(key, {})

    @classmethod
    def list_names(cls) -> list[str]:
        """Return sorted list of all known component type names."""
        cls.ensure_loaded()
        return sorted(_prop_schemas.keys())

    @classmethod
    def list_all(cls) -> dict[str, dict[str, Any]]:
        """Return full type -> schema mapping."""
        cls.ensure_loaded()
        return dict(_prop_schemas)

    @classmethod
    def register_schema(cls, component_type: str, schema: dict[str, Any]) -> None:
        """Register (or update) a schema in the in-memory cache.

        Does **not** persist — use ``ComponentCatalog`` DB table for that.
        """
        _prop_schemas[component_type.lower()] = schema

    @classmethod
    def validate_component_props(
        cls,
        component_type: str,
        props: dict[str, Any],
        db: AsyncSession | None = None,
    ) -> tuple[bool, list[str]]:
        """Validate *props* against the registered schema for *component_type*.

        Returns ``(is_valid, [error_strings])``.
        The empty-list means valid.
        """
        schema = cls.get(component_type, db=db)
        if not schema:
            # No specific schema — accept any props (open validation)
            return True, []

        validator = Draft202012Validator(schema)
        errors: list[str] = []
        for error in validator.iter_errors(props):
            path = "/".join(str(p) for p in error.absolute_path) or "<root>"
            errors.append(f"{path}: {error.message}")
        return len(errors) == 0, errors

    @classmethod
    def validate_component_type(cls, component_type: str) -> bool:
        """Check whether *component_type* is a known, registered type."""
        cls.ensure_loaded()
        return component_type.lower() in _prop_schemas

    @classmethod
    def clear_cache(cls) -> None:
        """Clear the in-memory cache (useful in tests)."""
        global _loaded_from_db
        _prop_schemas.clear()
        _loaded_from_db = False
