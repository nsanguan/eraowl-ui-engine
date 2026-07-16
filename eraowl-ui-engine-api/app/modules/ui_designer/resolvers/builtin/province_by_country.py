"""Built-in resolver: province_by_country.

Returns a list of provinces/states for a given country code.
§6.1 — This is a whitelisted resolver, no raw SQL.
"""

from __future__ import annotations

from typing import Any


async def resolve(params: dict[str, Any]) -> list[dict[str, str]]:
    """Return provinces for ``params['country_code']``."""
    country_code = params.get("country_code", "US").upper()
    # Stub data — replace with DB / API lookup via ORM (never raw SQL)
    provinces: dict[str, list[dict[str, str]]] = {
        "TH": [
            {"code": "BKK", "name": "Bangkok"},
            {"code": "CNX", "name": "Chiang Mai"},
            {"code": "Phuket", "name": "Phuket"},
        ],
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
    return provinces.get(country_code, [])
