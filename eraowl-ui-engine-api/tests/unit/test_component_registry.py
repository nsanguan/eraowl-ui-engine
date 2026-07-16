"""Unit tests for ComponentRegistry.validate_component_props — §6.4.

Tests that per-component JSON Schema files correctly validate (or reject)
component property dictionaries.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

from app.modules.ui_designer.components.registry import ComponentRegistry

# Path to the schemas directory
_SCHEMAS_DIR = Path(__file__).parent.parent.parent / "app" / "modules" / "ui_designer" / "components" / "schemas"


# ── Fixtures ───────────────────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def reset_registry() -> None:
    """Clear the in-memory cache before each test."""
    ComponentRegistry.clear_cache()
    yield
    ComponentRegistry.clear_cache()


# ── Schema file contract ──────────────────────────────────────────────────────


class TestSchemaFileContract:
    """Every *.schema.json file must be valid draft-2020-12 JSON Schema."""

    def test_all_schema_files_are_valid_json(self) -> None:
        """Each schema file must parse and validate as a JSON Schema."""
        for path in sorted(_SCHEMAS_DIR.glob("*.schema.json")):
            import json

            try:
                schema = json.loads(path.read_text())
            except json.JSONDecodeError as exc:
                pytest.fail(f"{path.name}: invalid JSON — {exc}")

            try:
                Draft202012Validator.check_schema(schema)
            except Exception as exc:
                pytest.fail(f"{path.name}: invalid JSON Schema — {exc}")

    def test_all_schema_files_have_additional_properties_false(self) -> None:
        """Every schema must lock down unknown properties."""
        import json

        for path in sorted(_SCHEMAS_DIR.glob("*.schema.json")):
            schema = json.loads(path.read_text())
            assert schema.get("additionalProperties") is False, (
                f"{path.name}: missing additionalProperties: false"
            )

    def test_all_schema_files_require_id(self) -> None:
        """Every schema must require at least the ``id`` property."""
        import json

        for path in sorted(_SCHEMAS_DIR.glob("*.schema.json")):
            schema = json.loads(path.read_text())
            required = schema.get("required", [])
            assert "id" in required, f"{path.name}: missing 'id' in required"

    def test_registry_discovers_all_schemas(self) -> None:
        """ComponentRegistry.list_names() must return all schema names."""
        ComponentRegistry.ensure_loaded()
        names = ComponentRegistry.list_names()
        expected_count = len(list(_SCHEMAS_DIR.glob("*.schema.json")))
        assert len(names) == expected_count


# ── Validate Component Props ──────────────────────────────────────────────────


class TestValidateComponentProps:
    """§6.4 — validate_component_props contract tests."""

    def test_valid_input_text_props(self) -> None:
        """Valid InputText properties pass validation."""
        props = {
            "id": "username",
            "label": "Username",
            "placeholder": "Enter username",
            "maxLength": 50,
        }
        valid, errors = ComponentRegistry.validate_component_props("inputtext", props)
        assert valid, f"Expected valid, got errors: {errors}"
        assert errors == []

    def test_input_text_rejects_unknown_property(self) -> None:
        """InputText must reject properties not in its schema."""
        props = {
            "id": "field1",
            "label": "Field",
            "unknownProp": "should not be allowed",
        }
        valid, errors = ComponentRegistry.validate_component_props("inputtext", props)
        assert not valid
        assert any("unknownProp" in e for e in errors)

    def test_lov_requires_resolver_name(self) -> None:
        """Lov component requires a resolverName."""
        props = {"id": "country_lov"}
        valid, errors = ComponentRegistry.validate_component_props("lov", props)
        assert not valid
        assert any("resolverName" in e for e in errors)

    def test_lov_valid_with_all_required(self) -> None:
        """Lov with required resolverName passes."""
        props = {"id": "country_lov", "resolverName": "countries", "labelField": "name"}
        valid, errors = ComponentRegistry.validate_component_props("lov", props)
        assert valid, f"Expected valid, got errors: {errors}"

    def test_lov_select_rejects_invalid_depends_on_type(self) -> None:
        """LovSelect's dependsOn must be an array of strings."""
        props = {
            "id": "city_select",
            "resolverName": "cities",
            "dependsOn": "not-an-array",
        }
        valid, errors = ComponentRegistry.validate_component_props("lov_select", props)
        assert not valid

    def test_button_requires_valid_variant(self) -> None:
        """Button only accepts known variants."""
        props = {"id": "btn1", "variant": "invalid_variant"}
        valid, errors = ComponentRegistry.validate_component_props("button", props)
        assert not valid
        assert any("variant" in e for e in errors)

    def test_button_valid_props(self) -> None:
        """Valid Button properties pass."""
        props = {"id": "save_btn", "label": "Save", "variant": "primary", "size": "md"}
        valid, errors = ComponentRegistry.validate_component_props("button", props)
        assert valid, f"Expected valid, got errors: {errors}"

    def test_region_accepts_direction_enum(self) -> None:
        """Region's direction must be row or column."""
        props = {"id": "r1", "title": "Main", "direction": "invalid"}
        valid, errors = ComponentRegistry.validate_component_props("region", props)
        assert not valid

    def test_region_valid_full(self) -> None:
        """Region with all valid props passes."""
        props = {
            "id": "r1",
            "title": "Main",
            "direction": "column",
            "gap": "16px",
            "padding": "24px",
            "wrap": True,
        }
        valid, errors = ComponentRegistry.validate_component_props("region", props)
        assert valid, f"Expected valid, got errors: {errors}"

    def test_image_requires_src(self) -> None:
        """Image component requires a src."""
        props = {"id": "img1", "alt": "No source"}
        valid, errors = ComponentRegistry.validate_component_props("image", props)
        assert not valid
        assert any("src" in e for e in errors)

    def test_unknown_component_is_valid(self) -> None:
        """Unknown component types accept any props (open validation)."""
        props = {"id": "x1", "anything": "goes"}
        valid, errors = ComponentRegistry.validate_component_props("unknown_type", props)
        assert valid
        assert errors == []

    def test_grid_row_rejects_negative_columns(self) -> None:
        """GridRow columns must be >= 1."""
        props = {"id": "gr1", "columns": 0}
        valid, errors = ComponentRegistry.validate_component_props("grid_row", props)
        assert not valid

    def test_charts_valid_chart_type(self) -> None:
        """Charts only accept known chartType values."""
        props = {"id": "ch1", "chartType": "invalid_type"}
        valid, errors = ComponentRegistry.validate_component_props("charts", props)
        assert not valid

    def test_charts_valid_props(self) -> None:
        """Charts with valid chartType passes."""
        props = {"id": "ch1", "chartType": "bar", "labels": ["Q1", "Q2"], "datasets": []}
        valid, errors = ComponentRegistry.validate_component_props("charts", props)
        assert valid, f"Expected valid, got errors: {errors}"

    def test_alert_valid_props(self) -> None:
        """Alert with all optional props passes."""
        props = {
            "id": "alert1",
            "title": "Success",
            "message": "Operation completed",
            "alertType": "success",
            "dismissible": True,
        }
        valid, errors = ComponentRegistry.validate_component_props("alert", props)
        assert valid, f"Expected valid, got errors: {errors}"

    def test_scroll_bar_valid_orientation(self) -> None:
        """ScrollBar orientation must be vertical or horizontal."""
        props = {"id": "sb1", "orientation": "diagonal"}
        valid, errors = ComponentRegistry.validate_component_props("scroll_bar", props)
        assert not valid

    def test_breadcrumb_valid_items(self) -> None:
        """Breadcrumb with valid items passes."""
        props = {
            "id": "bc1",
            "items": [
                {"label": "Home", "href": "/"},
                {"label": "Settings"},
            ],
        }
        valid, errors = ComponentRegistry.validate_component_props("breadcrumb", props)
        assert valid, f"Expected valid, got errors: {errors}"

    def test_metric_card_requires_label(self) -> None:
        """MetricCard requires a label."""
        props = {"id": "mc1", "value": 42}
        valid, errors = ComponentRegistry.validate_component_props("metric_card", props)
        assert not valid
        assert any("label" in e for e in errors)

    def test_static_content_requires_body(self) -> None:
        """StaticContent requires body."""
        props = {"id": "sc1"}
        valid, errors = ComponentRegistry.validate_component_props("static_content", props)
        assert not valid

    def test_validate_using_pascal_case_key(self) -> None:
        """Lookup is case-insensitive; PascalCase keys resolve too."""
        props = {"id": "btn1", "label": "Go", "variant": "primary"}
        valid, errors = ComponentRegistry.validate_component_props("Button", props)
        assert valid, f"Expected valid, got errors: {errors}"

    def test_unknown_schema_returns_empty_not_error(self) -> None:
        """Non-existent schema returns empty dict (accept all)."""
        schema = ComponentRegistry.get("nonexistent_component")
        assert schema == {}
