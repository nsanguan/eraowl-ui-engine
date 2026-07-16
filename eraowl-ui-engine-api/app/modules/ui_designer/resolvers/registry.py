"""Resolver registry – §6.1.

Discovers and manages data resolvers that fetch runtime data for components.
"""

from __future__ import annotations

import importlib
from typing import Any, Callable


class ResolverRegistry:
    """Singleton registry of named data resolvers."""

    _resolvers: dict[str, Callable[..., Any]] = {}

    @classmethod
    def register(cls, name: str, fn: Callable[..., Any]) -> None:
        cls._resolvers[name] = fn

    @classmethod
    def get(cls, name: str) -> Callable[..., Any]:
        if name not in cls._resolvers:
            raise KeyError(f"Resolver '{name}' not found")
        return cls._resolvers[name]

    @classmethod
    def list_names(cls) -> list[str]:
        return sorted(cls._resolvers.keys())

    @classmethod
    def load_module(cls, module_path: str, name: str | None = None) -> None:
        """Dynamically import a resolver module and register its ``resolve`` callable."""
        mod = importlib.import_module(module_path)
        fn = getattr(mod, "resolve", None)
        if fn is None:
            raise ImportError(f"Module {module_path} has no 'resolve' function")
        cls.register(name or module_path.rsplit(".", 1)[-1], fn)

    @classmethod
    def clear(cls) -> None:
        cls._resolvers.clear()
