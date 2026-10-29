"""Rate limiting: proxy-header spoofing, per-rule buckets, memory bound, per-user chat quota."""

from types import SimpleNamespace

import pytest
from httpx import AsyncClient

from app.core import rate_limiter as rl
from app.core.config import settings
from app.core.rate_limiter import RateLimitConfig, SlidingWindowRateLimiter
from tests.helpers import bearer, register

pytestmark = pytest.mark.asyncio

SPOOF = "X-Forwarded-For"


# ─── Rate limiting ────────────────────────────────────────────────────────────


class TestClientIp:
    def _request(self, xff: str | None, host: str = "10.0.0.1"):
        headers = {SPOOF: xff} if xff else {}
        return SimpleNamespace(headers=headers, client=SimpleNamespace(host=host))

    def test_ignores_forwarded_header_by_default(self, monkeypatch):
        monkeypatch.setattr(settings, "TRUST_PROXY_HEADERS", False)
        assert rl.get_client_ip(self._request("1.2.3.4")) == "10.0.0.1"

    def test_uses_forwarded_header_when_behind_trusted_proxy(self, monkeypatch):
        monkeypatch.setattr(settings, "TRUST_PROXY_HEADERS", True)
        assert rl.get_client_ip(self._request("1.2.3.4, 10.0.0.9")) == "1.2.3.4"


async def test_spoofed_forwarded_for_cannot_bypass_login_limit(client: AsyncClient):
    body = {"email": "nobody@test.com", "password": "wrong-password"}
    for i in range(settings.RATE_LIMIT_AUTH):
        resp = await client.post(
            "/api/v1/auth/login", json=body, headers={SPOOF: f"9.9.9.{i}"}
        )
        assert resp.status_code == 401
    resp = await client.post(
        "/api/v1/auth/login", json=body, headers={SPOOF: "9.9.9.200"}
    )
    assert resp.status_code == 429


def test_limits_do_not_share_one_bucket():
    limiter = SlidingWindowRateLimiter()
    chat = RateLimitConfig(max_requests=2, window_seconds=60, name="chat")
    auth = RateLimitConfig(max_requests=2, window_seconds=60, name="auth")
    limiter.check("ip", chat)
    limiter.check("ip", chat)
    assert limiter.check("ip", auth) is True


def test_idle_keys_are_forgotten(monkeypatch):
    limiter = SlidingWindowRateLimiter()
    config = RateLimitConfig(max_requests=5, window_seconds=10, name="t")
    now = [1000.0]
    monkeypatch.setattr(rl.time, "time", lambda: now[0])
    for i in range(50):
        limiter.check(f"ip-{i}", config)
    now[0] += rl._MAX_WINDOW_SECONDS + 1
    limiter.check("fresh", config)
    assert limiter.tracked_keys == 1


def test_limits_come_from_settings():
    assert rl.CHAT_RATE_LIMIT.max_requests == settings.RATE_LIMIT_CHAT
    assert rl.AUTH_RATE_LIMIT.max_requests == settings.RATE_LIMIT_AUTH


async def test_chat_limit_is_per_user_not_per_ip(client: AsyncClient):
    """Two people behind one NAT (college Wi-Fi) must not share a chat quota."""
    alice = (await register(client))["tokens"]
    bob = (await register(client))["tokens"]
    msg = {"message": "I have a mild headache"}
    for _ in range(settings.RATE_LIMIT_CHAT):
        resp = await client.post(
            "/api/v1/chat/message", json=msg, headers=bearer(alice)
        )
        assert resp.status_code == 200, resp.text
    over = await client.post("/api/v1/chat/message", json=msg, headers=bearer(alice))
    assert over.status_code == 429
    resp = await client.post("/api/v1/chat/message", json=msg, headers=bearer(bob))
    assert resp.status_code == 200
