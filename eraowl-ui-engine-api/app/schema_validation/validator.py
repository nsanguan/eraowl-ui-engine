"""JSON Schema validation wrapper using jsonschema library."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, ValidationError

_SCHEMA_DIR = Path(__file__).parent


def _load_schema(name: str) -> dict[str, Any]:
    path = _SCHEMA_DIR / name
    return json.loads(path.read_text())


def validate_layout(layout_json: str | dict[str, Any]) -> None:
    """Validate a layout tree against layout_schema_v1.json.

    Raises ``ValidationError`` on invalid input.
    """
    schema = _load_schema("layout_schema_v1.json")
    data = json.loads(layout_json) if isinstance(layout_json, str) else layout_json
    Draft202012Validator(schema).validate(data)


def validate_theme(theme_json: str | dict[str, Any]) -> None:
    """Validate a theme bundle against theme_schema_v1.json."""
    schema = _load_schema("theme_schema_v1.json")
    data = json.loads(theme_json) if isinstance(theme_json, str) else theme_json
    Draft202012Validator(schema).validate(data)


def validate_with_schema(data: Any, schema: dict[str, Any]) -> None:
    """Generic validation against an arbitrary JSON Schema."""
    Draft202012Validator(schema).validate(data)
