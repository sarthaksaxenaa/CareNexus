"""Tests for the middleware stack — request logging and security headers."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_security_headers_present():
    """Security headers should be present on every response."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/health")

    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "0"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


@pytest.mark.asyncio
async def test_request_id_header_present():
    """X-Request-ID header should be added to every response."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/health")

    request_id = response.headers.get("X-Request-ID")
    assert request_id is not None
    assert len(request_id) == 8  # Short UUID


@pytest.mark.asyncio
async def test_response_time_header_present():
    """X-Response-Time header should be added to every response."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/health")

    response_time = response.headers.get("X-Response-Time")
    assert response_time is not None
    assert response_time.endswith("ms")


@pytest.mark.asyncio
async def test_unique_request_ids():
    """Each request should get a unique request ID."""
    ids = []
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        for _ in range(3):
            response = await client.get("/health")
            ids.append(response.headers.get("X-Request-ID"))

    assert len(set(ids)) == 3  # All unique
