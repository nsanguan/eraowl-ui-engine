"""Resolver registry — §6.1.

Whitelisted query functions only. No raw SQL, no eval, no dynamic code.
AI Agent must NOT add resolvers without going through this whitelist.
"""

from __future__ import annotations

from typing import Awaitable, Callable

# Type alias: resolver takes params dict, returns list of dicts
QueryResolver = Callable[[dict], Awaitable[list[dict]]]


class ResolverRegistry:
    """Singleton registry of named data resolvers.

    §6.1 — Security boundary: only registered resolvers can be called.
    No dynamic eval. No raw SQL. No exceptions.
    """

    _resolvers: dict[str, QueryResolver] = {}

    @classmethod
    def register(cls, key: str, fn: QueryResolver) -> None:
        """Register a resolver function. Raises if already registered."""
        if key in cls._resolvers:
            raise ValueError(f"Resolver '{key}' already registered")
        cls._resolvers[key] = fn

    @classmethod
    async def resolve(cls, key: str, params: dict) -> list[dict]:
        """Execute a registered resolver. Raises KeyError if not found."""
        if key not in cls._resolvers:
            raise KeyError(f"Unregistered resolver: {key}")
        return await cls._resolvers[key](params)

    @classmethod
    def get(cls, key: str) -> QueryResolver:
        """Get a resolver function without executing it."""
        if key not in cls._resolvers:
            raise KeyError(f"Unregistered resolver: {key}")
        return cls._resolvers[key]

    @classmethod
    def list_keys(cls) -> list[str]:
        """List all registered resolver keys."""
        return sorted(cls._resolvers.keys())

    @classmethod
    def is_registered(cls, key: str) -> bool:
        """Check if a resolver is registered."""
        return key in cls._resolvers

    @classmethod
    def clear(cls) -> None:
        """Clear all resolvers (for testing only)."""
        cls._resolvers.clear()
