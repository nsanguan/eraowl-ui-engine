"""Tests for AI endpoint output validation — §9 + §6 Security Contract.

Ensures AI-orchestrated layouts are validated against layout_schema_v1.json
before being returned (and before reaching the codegen writer path).
"""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user, require_role
from app.main import app
from app.schema_validation.validator import COMPONENT_TYPES, validate_layout_json

_ADMIN_USER = {"sub": "test-user", "roles": ["ui_designer.admin", "ui_designer.editor", "ui_designer.codegen"]}


@pytest.fixture
def client():
    app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    app.dependency_overrides[require_role] = lambda: _ADMIN_USER
    yield TestClient(app)
    app.dependency_overrides.clear()


def _valid_layout() -> dict:
    """A schema-valid layout using the canonical PascalCase type enum."""
    return {
        "schemaVersion": "1.0.0",
        "regions": [
            {
                "id": "region_1",
                "title": "Main",
                "components": [
                    {
                        "id": "c1",
                        "type": "Region",
                        "position": {"x": 0, "y": 0, "width": 200, "height": 40},
                    },
                    {
                        "id": "c2",
                        "type": "LovSelect",
                        "position": {"x": 0, "y": 50, "width": 200, "height": 40},
                    },
                ],
            }
        ],
    }


class TestComponentTypesSourceOfTruth:
    """§9 — the AI prompt and schema enum must agree on casing."""

    def test_component_types_match_schema_enum(self):
        expected = [
            "Region", "GridRow", "GridColumn",
            "InputText", "Textarea", "Select", "Checkbox", "RadioGroup", "DatePicker", "NumberInput",
            "Lov", "LovSelect",
            "Table", "Card",
            "Button", "IconButton", "Link",
        ]
        assert expected == COMPONENT_TYPES


class TestValidateLayoutJson:
    """Contract wrapper used by the AI endpoints."""

    def test_valid_pascal_case_layout_passes(self):
        assert validate_layout_json(_valid_layout()) == []

    def test_wrong_type_fails(self):
        layout = _valid_layout()
        layout["regions"][0]["components"][0]["type"] = "region"
        errors = validate_layout_json(layout)
        assert errors  # lowercase must be rejected by the schema enum

    def test_missing_required_field_fails(self):
        layout = _valid_layout()
        del layout["regions"][0]["components"][0]["position"]
        errors = validate_layout_json(layout)
        assert errors


class TestGenerateLayoutEndpoint:
    """§9.1 — generate-layout must validate AI output before returning."""

    @patch("app.modules.ui_designer.ai.orchestrator.ai_orchestrator.generate_layout")
    def test_valid_ai_layout_returns_200(self, mock_gen, client):
        async def _fake(prompt: str) -> dict:
            return _valid_layout()

        mock_gen.side_effect = _fake
        resp = client.post(
            "/api/v1/ai/generate-layout",
            json={"prompt": "make a form"},
            headers={"Authorization": "Bearer test"},
        )
        assert resp.status_code == 200
        assert resp.json()["layout"]["schemaVersion"] == "1.0.0"

    @patch("app.modules.ui_designer.ai.orchestrator.ai_orchestrator.generate_layout")
    def test_invalid_ai_layout_returns_422(self, mock_gen, client):
        bad = _valid_layout()
        bad["regions"][0]["components"][0]["type"] = "UnknownComponent"

        async def _fake(prompt: str) -> dict:
            return bad

        mock_gen.side_effect = _fake
        resp = client.post(
            "/api/v1/ai/generate-layout",
            json={"prompt": "make a form"},
            headers={"Authorization": "Bearer test"},
        )
        assert resp.status_code == 422
        assert "errors" in resp.json()["detail"]


class TestSuggestCodegenEndpoint:
    """§9.2 — suggest-codegen must validate the provided layout."""

    @patch("app.modules.ui_designer.ai.orchestrator.ai_orchestrator.suggest_codegen")
    def test_invalid_layout_returns_422(self, mock_suggest, client):
        bad = _valid_layout()
        bad["regions"][0]["components"][0]["type"] = "UnknownComponent"

        async def _fake(layout, target_project):
            return {"x.tsx": "code"}

        mock_suggest.side_effect = _fake
        resp = client.post(
            "/api/v1/ai/suggest-codegen",
            json={"layout": bad, "target_project": "web"},
            headers={"Authorization": "Bearer test"},
        )
        assert resp.status_code == 422
        assert mock_suggest.call_count == 0
