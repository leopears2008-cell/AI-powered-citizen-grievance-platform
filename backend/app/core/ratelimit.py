"""Fixed-window in-memory rate limiter.

LIMITATION: per-process only. For multi-instance production use a shared store (Redis/Upstash), as the
original server/distributedRateLimit.ts did. Documented in docs/SECURITY_AND_LIMITATIONS.md.
"""
import time
from collections import defaultdict

from fastapi import HTTPException, Request, status

_hits: dict[tuple[str, str], list[float]] = defaultdict(list)


def rate_limit(name: str, limit: int, window_seconds: int = 60):
    def dep(request: Request) -> None:
        key = (name, request.client.host if request.client else "unknown")
        now = time.monotonic()
        recent = [t for t in _hits[key] if now - t < window_seconds]
        if len(recent) >= limit:
            _hits[key] = recent
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many requests. Please try again shortly.")
        recent.append(now)
        _hits[key] = recent

    return dep


def reset() -> None:
    _hits.clear()
