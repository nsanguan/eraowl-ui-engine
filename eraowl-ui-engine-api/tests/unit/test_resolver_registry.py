"""Tests for ResolverRegistry."""

import pytest

from app.modules.ui_designer.resolvers.registry import ResolverRegistry


@pytest.fixture(autouse=True)
def _clean_registry():
    ResolverRegistry.clear()
    yield
    ResolverRegistry.clear()


def test_register_and_get():
    ResolverRegistry.register("noop", lambda: None)
    assert ResolverRegistry.get("noop") is not None


def test_list_names():
    ResolverRegistry.register("alpha", lambda: 1)
    ResolverRegistry.register("beta", lambda: 2)
    assert ResolverRegistry.list_names() == ["alpha", "beta"]


def test_get_missing_raises():
    with pytest.raises(KeyError, match="nonexistent"):
        ResolverRegistry.get("nonexistent")


def test_load_module():
    ResolverRegistry.load_module(
        "app.modules.ui_designer.resolvers.builtin.province_by_country",
        name="province_by_country",
    )
    assert "province_by_country" in ResolverRegistry.list_names()
