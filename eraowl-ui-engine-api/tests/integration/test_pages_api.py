"""Integration tests for Pages & Layouts API — §6.3 Auth/RBAC."""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.core.security import encode_token
from app.modules.ui_designer.models import Page, PageLayout

# ── Fixtures ────────────────────────────────────────────────────────


@pytest.fixture
def app():
    from app.main import app as _app
    return _app


@pytest.fixture
def client(app) -> TestClient:
    from app.core.db import get_db

    async def mock_get_db():
        yield AsyncMock()

    app.dependency_overrides[get_db] = mock_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token() -> str:
    return encode_token({"sub": "00000000-0000-0000-0000-000000000001", "roles": ["ui_designer.admin"]})


@pytest.fixture
def editor_token() -> str:
    return encode_token({"sub": "00000000-0000-0000-0000-000000000002", "roles": ["ui_designer.editor"]})


@pytest.fixture
def viewer_token() -> str:
    return encode_token({"sub": "00000000-0000-0000-0000-000000000003", "roles": ["ui_designer.viewer"]})


def _make_page(**overrides: Any) -> Page:
    from datetime import UTC, datetime

    defaults: dict[str, Any] = dict(
        id="p1",
        tenant_id="default",
        name="Test Page",
        route="/test",
        description="",
        schema_version="1.0.0",
        is_active=True,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        deleted_at=None,
        owner_id=None,
    )
    defaults.update(overrides)
    return Page(**defaults)


def _make_layout(page_id: str = "p1", **overrides: Any) -> PageLayout:
    from datetime import UTC, datetime

    defaults: dict[str, Any] = dict(
        id="l1",
        page_id=page_id,
        version=1,
        layout_json={"schemaVersion": "1.0.0", "regions": []},
        is_published=False,
        created_by="test",
        created_at=datetime.now(UTC),
    )
    defaults.update(overrides)
    return PageLayout(**defaults)


# ── Health ──────────────────────────────────────────────────────────


def test_health_endpoint(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ── Pages CRUD — Auth / RBAC ────────────────────────────────────────


def test_create_page_requires_auth(client: TestClient):
    resp = client.post("/api/v1/pages", json={"name": "Test Page"})
    assert resp.status_code == 401


def test_create_page_requires_role(client: TestClient, viewer_token: str):
    resp = client.post(
        "/api/v1/pages",
        json={"name": "Test Page"},
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert resp.status_code == 403


def test_create_page_allowed_for_editor(client: TestClient, editor_token: str):
    """An editor can create a page."""
    with patch("app.modules.ui_designer.service.PageService.create") as mock_create:
        mock_create.return_value = _make_page(id="p_new", name="Test Page", route="/test")

        resp = client.post(
            "/api/v1/pages",
            json={"name": "Test Page", "route": "/test"},
            headers={"Authorization": f"Bearer {editor_token}"},
        )
        assert resp.status_code == 201, resp.text
        body = resp.json()
        assert body["name"] == "Test Page"
        assert body["route"] == "/test"


def test_list_pages_scoped(client: TestClient, viewer_token: str):
    """Listing pages returns scoped results."""
    with patch("app.modules.ui_designer.service.PageService.list_paginated") as mock_list:
        mock_list.return_value = ([_make_page()], 1)

        resp = client.get(
            "/api/v1/pages",
            headers={"Authorization": f"Bearer {viewer_token}"},
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["total"] == 1


def test_get_page_owner_scoping(client: TestClient, viewer_token: str):
    """Getting a non-owned page returns 404 (no info leakage)."""
    with patch("app.modules.ui_designer.service.PageService.get_scoped") as mock_get:
        mock_get.return_value = None

        resp = client.get(
            "/api/v1/pages/nonexistent",
            headers={"Authorization": f"Bearer {viewer_token}"},
        )
        assert resp.status_code == 404, resp.text


# ── Layouts ─────────────────────────────────────────────────────────


def test_create_layout_rejects_invalid_schema(client: TestClient, editor_token: str):
    """Layout with an invalid component type is rejected (422)."""
    invalid = {
        "schemaVersion": "1.0.0",
        "regions": [
            {
                "id": "r1", "title": "Test",
                "components": [
                    {"id": "c1", "type": "UnknownType", "position": {"x": 0, "y": 0, "width": 100, "height": 40}},
                ],
            }
        ],
    }
    resp = client.post(
        "/api/v1/layouts",
        json={"page_id": "p1", "layout_json": invalid},
        headers={"Authorization": f"Bearer {editor_token}"},
    )
    assert resp.status_code == 422, resp.text


def test_create_layout_valid(client: TestClient, editor_token: str):
    """Valid layout passes schema validation and returns 201."""
    valid = {"schemaVersion": "1.0.0", "regions": [{"id": "region_1", "title": "Main", "components": []}]}

    with patch("app.modules.ui_designer.service.LayoutService.create") as mock_create:
        mock_create.return_value = _make_layout(page_id="p1", layout_json=valid)

        resp = client.post(
            "/api/v1/layouts",
            json={"page_id": "p1", "layout_json": valid},
            headers={"Authorization": f"Bearer {editor_token}"},
        )
        assert resp.status_code == 201, resp.text
        assert resp.json()["page_id"] == "p1"


def test_create_layout_no_auth_rejected(client: TestClient):
    resp = client.post(
        "/api/v1/layouts",
        json={"page_id": "p1", "layout_json": {"schemaVersion": "1.0.0", "regions": []}},
    )
    assert resp.status_code == 401
