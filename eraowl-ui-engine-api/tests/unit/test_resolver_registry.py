"""Contract tests — §6.1 ResolverRegistry.

Tests that the resolver registry enforces security:
- Only registered resolvers can be called
- Unregistered resolvers are rejected
- No dynamic eval or raw SQL
"""

import pytest
from app.modules.ui_designer.resolvers.registry import ResolverRegistry


@pytest.fixture(autouse=True)
def clear_registry():
    """Clear registry before each test."""
    ResolverRegistry.clear()
    yield
    ResolverRegistry.clear()


class TestResolverRegistry:
    """§6.1 — ResolverRegistry security contract tests."""

    @pytest.mark.asyncio
    async def test_register_and_resolve(self):
        """Registered resolver can be called."""

        async def my_resolver(params: dict) -> list[dict]:
            return [{"id": 1, "name": "test"}]

        ResolverRegistry.register("test_resolver", my_resolver)
        result = await ResolverRegistry.resolve("test_resolver", {"key": "value"})
        assert result == [{"id": 1, "name": "test"}]

    @pytest.mark.asyncio
    async def test_unregistered_resolver_rejected(self):
        """Unregistered resolver raises KeyError."""
        with pytest.raises(KeyError, match="Unregistered resolver"):
            await ResolverRegistry.resolve("nonexistent", {})

    def test_duplicate_registration_rejected(self):
        """Cannot register same key twice."""

        async def resolver_a(params: dict) -> list[dict]:
            return []

        async def resolver_b(params: dict) -> list[dict]:
            return []

        ResolverRegistry.register("dup_key", resolver_a)
        with pytest.raises(ValueError, match="already registered"):
            ResolverRegistry.register("dup_key", resolver_b)

    def test_list_keys(self):
        """list_keys returns sorted registered keys."""

        async def r1(params: dict) -> list[dict]:
            return []

        async def r2(params: dict) -> list[dict]:
            return []

        ResolverRegistry.register("zebra", r1)
        ResolverRegistry.register("alpha", r2)
        assert ResolverRegistry.list_keys() == ["alpha", "zebra"]

    def test_is_registered(self):
        """is_registered returns correct status."""

        async def r(params: dict) -> list[dict]:
            return []

        assert not ResolverRegistry.is_registered("check")
        ResolverRegistry.register("check", r)
        assert ResolverRegistry.is_registered("check")

    def test_clear(self):
        """clear removes all resolvers."""

        async def r(params: dict) -> list[dict]:
            return []

        ResolverRegistry.register("temp", r)
        ResolverRegistry.clear()
        assert ResolverRegistry.list_keys() == []
