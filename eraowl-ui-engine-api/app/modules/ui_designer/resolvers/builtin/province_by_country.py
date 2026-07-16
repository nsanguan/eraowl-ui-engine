"""Built-in resolver: province_by_country.

Returns a list of provinces/states for a given country code.
"""

from __future__ import annotations

from typing import Any


async def resolve(params: dict[str, Any]) -> list[dict[str, str]]:
    """Return provinces for ``params['country_code']``."""
    country_code = params.get("country_code", "US").upper()
    # Stub data – replace with DB / API lookup
    _PROVINCES: dict[str, list[dict[str, str]]] = {
        "US": [
            {"code": "CA", "name": "California"},
            {"code": "NY", "name": "New York"},
            {"code": "TX", "name": "Texas"},
        ],
        "CN": [
            {"code": "BJ", "name": "Beijing"},
            {"code": "SH", "name": "Shanghai"},
            {"code": "GD", "name": "Guangdong"},
        ],
    }
    return _PROVINCES.get(country_code, [])
