"""Simple in-memory token-bucket rate limiter.

Provides a FastAPI dependency that enforces per-IP rate limits.
Designed for the AI endpoints where unbounded requests could
incur significant external API costs.

For distributed deployments, replace with Redis-based rate limiting.
"""

from __future__ import annotations

import time

from fastapi import HTTPException, Request, status


class TokenBucket:
    """In-memory token-bucket rate limiter per client IP."""

    def __init__(self, capacity: int, refill_rate: float) -> None:
        self.capacity = float(capacity)
        self.refill_rate = refill_rate  # tokens per second
        self._buckets: dict[str, float] = {}
        self._last_refill: dict[str, float] = {}

    def _get_or_init(self, key: str) -> tuple[float, float]:
        tokens = self._buckets.get(key, self.capacity)
        last = self._last_refill.get(key, time.monotonic())
        return tokens, last

    def consume(self, key: str, cost: float = 1.0) -> bool:
        """Try to consume *cost* tokens. Returns ``True`` if allowed."""
        now = time.monotonic()
        tokens, last = self._get_or_init(key)

        # Refill based on elapsed time.
        elapsed = now - last
        tokens = min(self.capacity, tokens + elapsed * self.refill_rate)

        if tokens < cost:
            return False

        self._buckets[key] = tokens - cost
        self._last_refill[key] = now
        return True


# ── Global rate limiters ───────────────────────────────────────────
# AI endpoints: 10 requests per minute per IP (covers generate-layout
# + suggest-codegen).  Adjust via constructor args.
_ai_limiter = TokenBucket(capacity=10, refill_rate=10 / 60.0)


async def rate_limit_ai(request: Request) -> None:
    """FastAPI dependency that enforces the AI endpoint rate limit.

    Usage::

        @router.post("/ai/generate-layout", dependencies=[Depends(rate_limit_ai)])
    """
    client_ip = request.client.host if request.client else "unknown"
    if not _ai_limiter.consume(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Max 10 requests per minute per IP.",
        )
