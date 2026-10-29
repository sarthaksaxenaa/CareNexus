"""In-memory sliding window rate limiter for CareNexus API.

Implements a per-IP sliding window counter for rate limiting without
external dependencies (no Redis required for development).

Architecture:
    - Sliding window: tracks request timestamps within the window period
    - Per-IP isolation: separate counters for each client IP
    - Auto-cleanup: expired entries are pruned on each check
    - Per-rule buckets: chat, auth and profile limits are counted separately
    - Thread-safe: uses dict-level operations (GIL-protected in CPython)

Production Note:
    For multi-worker deployments, replace with Redis-backed rate limiting
    (e.g., redis + lua script). This in-memory implementation is suitable
    for single-worker development and testing.
"""

import logging
import time
from collections import defaultdict
from dataclasses import dataclass

from fastapi import HTTPException, Request, status

from app.core.config import settings

logger = logging.getLogger(__name__)

# Longest window any rule uses; keys idle for longer are safe to forget.
_MAX_WINDOW_SECONDS = 60


@dataclass
class RateLimitConfig:
    """Configuration for a rate limit rule.

    Attributes:
        max_requests: Maximum requests allowed within the window.
        window_seconds: Time window in seconds.
        name: Human-readable name for logging.
    """

    max_requests: int = 10
    window_seconds: int = 60
    name: str = "default"


class SlidingWindowRateLimiter:
    """Sliding window rate limiter with per-key request tracking.

    Usage:
        limiter = SlidingWindowRateLimiter()
        limiter.check("192.168.1.1", RateLimitConfig(max_requests=10, window_seconds=60))
    """

    def __init__(self) -> None:
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._last_sweep = 0.0

    def _prune_idle(self, now: float) -> None:
        """Drop keys with no recent requests so memory stays bounded.

        Runs at most once a second; anything older than the longest window
        configured below can no longer affect a decision.
        """
        if now - self._last_sweep < 1:
            return
        self._last_sweep = now
        horizon = now - _MAX_WINDOW_SECONDS
        for k in [k for k, ts in self._requests.items() if not ts or ts[-1] <= horizon]:
            del self._requests[k]

    def check(self, key: str, config: RateLimitConfig) -> bool:
        """Check if a request is allowed under the rate limit.

        Args:
            key: Unique identifier for the client (e.g., IP address).
            config: Rate limit configuration to apply.

        Returns:
            True if the request is allowed.

        Raises:
            HTTPException(429) if rate limit is exceeded.
        """
        now = time.time()
        self._prune_idle(now)
        # Each rule gets its own bucket, so chat traffic never eats the login quota.
        key = f"{config.name}:{key}"
        window_start = now - config.window_seconds

        # Prune expired timestamps
        self._requests[key] = [ts for ts in self._requests[key] if ts > window_start]

        current_count = len(self._requests[key])

        if current_count >= config.max_requests:
            retry_after = int(self._requests[key][0] + config.window_seconds - now) + 1
            logger.warning(
                f"Rate limit exceeded for {key} on '{config.name}': "
                f"{current_count}/{config.max_requests} in {config.window_seconds}s"
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "RateLimitExceeded",
                    "message": f"Too many requests. Please try again in {retry_after} seconds.",
                    "retry_after": retry_after,
                    "limit": config.max_requests,
                    "window": config.window_seconds,
                },
                headers={"Retry-After": str(retry_after)},
            )

        # Record this request
        self._requests[key].append(now)
        return True

    def get_remaining(self, key: str, config: RateLimitConfig) -> int:
        """Get the number of remaining requests in the current window."""
        now = time.time()
        window_start = now - config.window_seconds
        current_count = sum(
            1
            for ts in self._requests.get(f"{config.name}:{key}", [])
            if ts > window_start
        )
        return max(0, config.max_requests - current_count)

    def reset(self, key: str | None = None) -> None:
        """Reset rate limit counters.

        Args:
            key: Specific key to reset. If None, resets all counters.
        """
        if key:
            for k in [k for k in self._requests if k.split(":", 1)[-1] == key]:
                del self._requests[k]
        else:
            self._requests.clear()

    @property
    def tracked_keys(self) -> int:
        """Number of IPs currently being tracked."""
        return len(self._requests)


# ─── Module-level singleton ──────────────────────────────────────────────────

_rate_limiter: SlidingWindowRateLimiter | None = None


def get_rate_limiter() -> SlidingWindowRateLimiter:
    """Get or create the singleton rate limiter instance."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = SlidingWindowRateLimiter()
    return _rate_limiter


# ─── Pre-configured rate limit configs ────────────────────────────────────────


def get_client_ip(request: Request) -> str:
    """Return the caller's IP address.

    X-Forwarded-For is client-controlled: anyone can send it, so trusting it
    by default lets an attacker pick a fresh "IP" per request and walk past
    the limiter. It is honoured only when TRUST_PROXY_HEADERS says a reverse
    proxy we control sets it.
    """
    if settings.TRUST_PROXY_HEADERS:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# Rate limit configs (imported by route handlers)
CHAT_RATE_LIMIT = RateLimitConfig(
    max_requests=settings.RATE_LIMIT_CHAT, window_seconds=60, name="chat"
)
AUTH_RATE_LIMIT = RateLimitConfig(
    max_requests=settings.RATE_LIMIT_AUTH, window_seconds=60, name="auth"
)
PROFILE_RATE_LIMIT = RateLimitConfig(max_requests=20, window_seconds=60, name="profile")
