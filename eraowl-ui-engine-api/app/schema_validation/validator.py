"""JSON Schema validation wrapper using jsonschema library."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, cast

from jsonschema import Draft202012Validator

_SCHEMA_DIR = Path(__file__).parent


def _load_schema(name: str) -> dict[str, Any]:
    path = _SCHEMA_DIR / name
    return cast(dict[str, Any], json.loads(path.read_text()))


# Canonical component `type` enum pulled from layout_schema_v1.json.
# Source of truth for AI prompt templates and the render engine contract.
_LAYOUT_SCHEMA = _load_schema("layout_schema_v1.json")
COMPONENT_TYPES: list[str] = list(
    _LAYOUT_SCHEMA["$defs"]["component"]["properties"]["type"]["enum"]
)


def validate_layout(layout_json: str | dict[str, Any]) -> None:
    """Validate a layout tree against layout_schema_v1.json.

    Raises ``ValidationError`` on invalid input.
    """
    schema = _load_schema("layout_schema_v1.json")
    data = json.loads(layout_json) if isinstance(layout_json, str) else layout_json
    Draft202012Validator(schema).validate(data)


def validate_layout_json(layout_json: str | dict[str, Any]) -> list[str]:
    """Validate a layout tree and return a list of human-readable error strings.

    Returns an empty list when the layout is valid. Used by the AI endpoints so
    malformed AI output is surfaced (and can be rejected) instead of reaching
    the codegen writer path.
    """
    schema = _load_schema("layout_schema_v1.json")
    data = json.loads(layout_json) if isinstance(layout_json, str) else layout_json
    validator = Draft202012Validator(schema)
    return [
        f"{'/'.join(str(p) for p in e.absolute_path) or '<root>'}: {e.message}"
        for e in validator.iter_errors(data)
    ]


def validate_theme(theme_json: str | dict[str, Any]) -> None:
    """Validate a theme bundle against theme_schema_v1.json."""
    schema = _load_schema("theme_schema_v1.json")
    data = json.loads(theme_json) if isinstance(theme_json, str) else theme_json
    Draft202012Validator(schema).validate(data)


def validate_with_schema(data: Any, schema: dict[str, Any]) -> None:
    """Generic validation against an arbitrary JSON Schema."""
    Draft202012Validator(schema).validate(data)
