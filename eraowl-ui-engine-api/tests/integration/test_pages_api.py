"""Integration test stubs for Pages API."""

import pytest


@pytest.mark.asyncio
async def test_health_endpoint():
    """Placeholder – requires httpx AsyncClient + test client setup."""
    # from httpx import AsyncClient
    # from app.main import app
    # async with AsyncClient(app=app, base_url="http://test") as client:
    #     resp = await client.get("/health")
    #     assert resp.status_code == 200
    #     assert resp.json()["status"] == "ok"
    pass


@pytest.mark.asyncio
async def test_create_page():
    """Placeholder – requires DB fixture + test client."""
    pass


@pytest.mark.asyncio
async def test_list_pages():
    """Placeholder – requires DB fixture + test client."""
    pass
