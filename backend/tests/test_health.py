"""Tests for CareNexus API — health check, route registration, auth service."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.auth_service import hash_password, verify_password

# ─── Health Check ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_health_check():
    """Test that the health check endpoint returns healthy status."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "carenexus-api"
    assert data["version"] == "0.1.0"


# ─── Route Registration ───────────────────────────────────


@pytest.mark.asyncio
async def test_register_endpoint_exists():
    """Test that the registration endpoint exists and accepts POST."""
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/auth/register",
                json={
                    "email": "test@example.com",
                    "password": "testpassword123",
                    "full_name": "Test User",
                },
            )

        # Route exists (not 404). May be 500 if DB is unavailable.
        assert response.status_code != 404
        assert response.status_code != 405
    except (ConnectionRefusedError, OSError):
        # No PostgreSQL running — skip gracefully.
        pytest.skip("PostgreSQL not available")


@pytest.mark.asyncio
async def test_login_endpoint_exists():
    """Test that the login endpoint exists."""
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/auth/login",
                json={"email": "test@example.com", "password": "test"},
            )

        assert response.status_code != 404
    except (ConnectionRefusedError, OSError):
        pytest.skip("PostgreSQL not available")


@pytest.mark.asyncio
async def test_swagger_docs_accessible():
    """Test that API documentation is served."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/docs")

    assert response.status_code == 200


# ─── Auth Service Unit Tests ──────────────────────────────


def test_password_hashing():
    """Test that passwords are hashed and verified correctly."""
    password = "mysecurepassword123"
    hashed = hash_password(password)

    # Hash should not equal plaintext
    assert hashed != password

    # Verification should succeed with correct password
    assert verify_password(password, hashed) is True

    # Verification should fail with wrong password
    assert verify_password("wrongpassword", hashed) is False


def test_password_hash_uniqueness():
    """Test that same password produces different hashes (salt)."""
    password = "samepassword"
    hash1 = hash_password(password)
    hash2 = hash_password(password)

    # Each hash should be unique due to random salt
    assert hash1 != hash2

    # But both should verify against the original password
    assert verify_password(password, hash1) is True
    assert verify_password(password, hash2) is True
