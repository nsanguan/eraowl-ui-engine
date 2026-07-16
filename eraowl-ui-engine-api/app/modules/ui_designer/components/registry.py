"""Component prop-schema registry (backend mirror of component schemas)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_SCHEMAS_DIR = Path(__file__).parent / "schemas"


class ComponentPropSchemaRegistry:
    """Registry that loads JSON Schema files for each component."""

    _schemas: dict[str, dict[str, Any]] = {}

    @classmethod
    def load_all(cls) -> None:
        for path in _SCHEMAS_DIR.glob("*.schema.json"):
            name = path.stem.removesuffix(".schema")
            cls._schemas[name] = json.loads(path.read_text())

    @classmethod
    def get(cls, component_name: str) -> dict[str, Any]:
        if component_name not in cls._schemas:
            cls.load_all()
        return cls._schemas.get(component_name, {})

    @classmethod
    def list_names(cls) -> list[str]:
        if not cls._schemas:
            cls.load_all()
        return sorted(cls._schemas.keys())
