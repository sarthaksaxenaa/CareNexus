"""Tests for custom exceptions and error handling."""

import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    CareNexusError,
    RateLimitError,
    ResourceNotFoundError,
    register_exception_handlers,
)


def _create_test_app() -> FastAPI:
    """Create a minimal FastAPI app with exception handlers for testing."""
    test_app = FastAPI()
    register_exception_handlers(test_app)

    @test_app.get("/error/base")
    async def raise_base():
        raise CareNexusError("Something went wrong", status_code=500)

    @test_app.get("/error/auth")
    async def raise_auth():
        raise AuthenticationError()

    @test_app.get("/error/forbidden")
    async def raise_forbidden():
        raise AuthorizationError()

    @test_app.get("/error/not-found")
    async def raise_not_found():
        raise ResourceNotFoundError("User", "123")

    @test_app.get("/error/rate-limit")
    async def raise_rate_limit():
        raise RateLimitError()

    return test_app


@pytest_asyncio.fixture()
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=_create_test_app()), base_url="http://test"
    ) as c:
        yield c


async def test_base_error_returns_500(client):
    """Base CareNexusError returns 500 with structured JSON."""
    response = await client.get("/error/base")
    assert response.status_code == 500
    data = response.json()
    assert data["error"] == "CareNexusError"
    assert data["message"] == "Something went wrong"
    assert "path" in data


async def test_auth_error_returns_401(client):
    """AuthenticationError returns 401."""
    response = await client.get("/error/auth")
    assert response.status_code == 401
    assert response.json()["error"] == "AuthenticationError"


async def test_forbidden_error_returns_403(client):
    """AuthorizationError returns 403."""
    response = await client.get("/error/forbidden")
    assert response.status_code == 403
    assert response.json()["error"] == "AuthorizationError"


async def test_not_found_returns_404(client):
    """ResourceNotFoundError returns 404 with resource name."""
    response = await client.get("/error/not-found")
    assert response.status_code == 404
    data = response.json()
    assert "User" in data["message"]
    assert "123" in data["message"]


async def test_rate_limit_returns_429(client):
    """RateLimitError returns 429."""
    response = await client.get("/error/rate-limit")
    assert response.status_code == 429
    assert "Rate limit" in response.json()["message"]
