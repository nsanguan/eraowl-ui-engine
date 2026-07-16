"""Contract tests — §5.3 Theme JSON Schema.

Tests that malformed theme bundles are rejected.
"""

import json
from pathlib import Path

import pytest

SCHEMA_PATH = Path(__file__).parent.parent.parent / "app" / "schema_validation" / "theme_schema_v1.json"


@pytest.fixture
def theme_schema():
    """Load the theme JSON schema."""
    return json.loads(SCHEMA_PATH.read_text())


class TestThemeSchemaValidation:
    """§5.3 — Malformed theme bundles must be rejected."""

    def test_valid_theme(self, theme_schema):
        """Valid theme passes."""
        import jsonschema

        valid = {
            "themeId": "eut",
            "displayName": "EODS Universal Theme",
            "tokens": {
                "color": {
                    "bg": "#ffffff",
                    "fg": "#0f172a",
                    "accent": "#6366f1",
                    "muted": "#64748b",
                },
                "radius": {"sm": "4px", "md": "8px", "lg": "12px"},
                "spacing": {"density": "comfortable", "unit": 4},
                "typography": {
                    "fontFamily": "Inter, sans-serif",
                    "fontSizeBase": "16px",
                },
            },
            "templateOptions": {},
        }
        jsonschema.validate(valid, theme_schema)

    def test_missing_theme_id_rejected(self, theme_schema):
        """Missing themeId is rejected."""
        import jsonschema

        invalid = {
            "tokens": {
                "color": {"bg": "#fff", "fg": "#000", "accent": "#f00", "muted": "#999"},
                "radius": {},
                "spacing": {},
                "typography": {},
            },
            "templateOptions": {},
        }
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(invalid, theme_schema)

    def test_missing_required_color_token_rejected(self, theme_schema):
        """Missing required color token (accent) is rejected."""
        import jsonschema

        invalid = {
            "themeId": "test",
            "tokens": {
                "color": {"bg": "#fff", "fg": "#000", "muted": "#999"},
                "radius": {},
                "spacing": {},
                "typography": {},
            },
            "templateOptions": {},
        }
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(invalid, theme_schema)

    def test_invalid_color_hex_rejected(self, theme_schema):
        """Invalid hex color pattern is rejected."""
        import jsonschema

        invalid = {
            "themeId": "test",
            "tokens": {
                "color": {
                    "bg": "not-a-color",
                    "fg": "#000",
                    "accent": "#f00",
                    "muted": "#999",
                },
                "radius": {},
                "spacing": {},
                "typography": {},
            },
            "templateOptions": {},
        }
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(invalid, theme_schema)

    def test_invalid_styles_type_rejected(self, theme_schema):
        """Invalid styles type is rejected."""
        import jsonschema

        invalid = {
            "themeId": "eut",
            "tokens": {
                "color": {"bg": "#fff", "fg": "#000", "accent": "#f00", "muted": "#999"},
                "radius": {},
                "spacing": {},
                "typography": {},
            },
            "templateOptions": {},
            "styles": "not-an-array",
        }
        with pytest.raises(jsonschema.ValidationError):
            jsonschema.validate(invalid, theme_schema)
