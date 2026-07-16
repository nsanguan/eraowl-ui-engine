"""Tests for layout schema validation."""

import json

import pytest

from app.schema_validation.validator import validate_layout


def _valid_layout() -> dict:
    return {
        "id": "layout-1",
        "root": {
            "id": "root-region",
            "type": "Region",
            "props": {"direction": "column"},
            "children": [
                {
                    "id": "header",
                    "type": "Component",
                    "props": {"componentName": "Header"},
                }
            ],
        },
    }


def test_valid_layout_passes():
    validate_layout(_valid_layout())


def test_valid_layout_from_json_string():
    validate_layout(json.dumps(_valid_layout()))


def test_missing_required_fields_fails():
    with pytest.raises(Exception):
        validate_layout({"root": _valid_layout()["root"]})


def test_invalid_type_fails():
    data = _valid_layout()
    data["root"]["type"] = "InvalidType"
    with pytest.raises(Exception):
        validate_layout(data)
