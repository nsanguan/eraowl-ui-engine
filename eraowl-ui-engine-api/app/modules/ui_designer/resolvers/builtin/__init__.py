"""Initialize builtin resolvers.

§6.1 — All resolvers must be registered here before use.
"""

from app.modules.ui_designer.resolvers.builtin import province_by_country
from app.modules.ui_designer.resolvers.registry import ResolverRegistry


def register_builtin_resolvers() -> None:
    """Register all builtin resolvers."""
    ResolverRegistry.register("province_by_country", province_by_country.resolve)
