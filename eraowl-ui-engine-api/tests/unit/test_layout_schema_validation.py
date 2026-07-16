"""Contract tests — §5.2 JSON Schema layout_v1.

Tests that malformed layout_json is rejected by the schema validator.
"""

import json
import pytest
from pathlib import Path

SCHEMA_PATH = Path(__file__).parent.parent.parent / "app" / "schema_validation" / "layout_schema_v1.json"


@pytest.fixture
def layout_schema():
    """Load the layout JSON schema."""
    return json.loads(SCHEMA_PATH.read_text())


class TestLayoutSchemaValidation:
    """§5.2 — Malformed layout_json must be rejected."""

    def test_valid_minimal_layout(self, layout_schema):
        """Minimal valid layout passes."""
        import jsonschema

        valid = {
            "schemaVersion": "1.0.0",
            "regions": [
                {
                    "id": "region_1",
                    "title": "Main",
                    "components": [],
                }
            ],
        }
        jsonschema.validate(valid, layout_schema)

    def test_missing_schema_version_rejected(self, layout_schema):
        """Missing schemaVersion is rejected."""
        import jsonschema

        invalid = {
            "regions": [{"id": "r1", "title": "R", "components": []}]
        }
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(invalid, layout_schema)

    def test_missing_regions_rejected(self, layout_schema):
        """Missing regions array is rejected."""
        import jsonschema

        invalid = {"schemaVersion": "1.0.0"}
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(invalid, layout_schema)

    def test_invalid_component_type_rejected(self, layout_schema):
        """Component with unknown type is rejected."""
        import jsonschema

        invalid = {
            "schemaVersion": "1.0.0",
            "regions": [
                {
                    "id": "r1",
                    "title": "R",
                    "components": [
                        {
                            "id": "c1",
                            "type": "UnknownComponent",
                            "position": {"x": 0, "y": 0, "width": 100, "height": 40},
                        }
                    ],
                }
            ],
        }
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(invalid, layout_schema)

    def test_missing_component_position_rejected(self, layout_schema):
        """Component without position is rejected."""
        import jsonschema

        invalid = {
            "schemaVersion": "1.0.0",
            "regions": [
                {
                    "id": "r1",
                    "title": "R",
                    "components": [
                        {"id": "c1", "type": "Region"}
                    ],
                }
            ],
        }
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(invalid, layout_schema)

    def test_invalid_position_negative_rejected(self, layout_schema):
        """Position with negative values is rejected."""
        import jsonschema

        invalid = {
            "schemaVersion": "1.0.0",
            "regions": [
                {
                    "id": "r1",
                    "title": "R",
                    "components": [
                        {
                            "id": "c1",
                            "type": "Region",
                            "position": {"x": -1, "y": 0, "width": 100, "height": 40},
                        }
                    ],
                }
            ],
        }
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(invalid, layout_schema)

    def test_valid_depends_on(self, layout_schema):
        """Valid depends_on array passes."""
        import jsonschema

        valid = {
            "schemaVersion": "1.0.0",
            "regions": [
                {
                    "id": "r1",
                    "title": "R",
                    "components": [
                        {
                            "id": "c1",
                            "type": "LovSelect",
                            "position": {"x": 0, "y": 0, "width": 200, "height": 40},
                            "depends_on": ["country_select"],
                        }
                    ],
                }
            ],
        }
        jsonschema.validate(valid, layout_schema)

    def test_valid_style_ref(self, layout_schema):
        """Valid styleRef pattern passes."""
        import jsonschema

        valid = {
            "schemaVersion": "1.0.0",
            "styleRef": "eut.vita-slate",
            "regions": [{"id": "r1", "title": "R", "components": []}],
        }
        jsonschema.validate(valid, layout_schema)

    def test_invalid_style_ref_pattern_rejected(self, layout_schema):
        """Invalid styleRef pattern is rejected."""
        import jsonschema

        invalid = {
            "schemaVersion": "1.0.0",
            "styleRef": "invalid_style_ref",
            "regions": [{"id": "r1", "title": "R", "components": []}],
        }
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(invalid, layout_schema)
