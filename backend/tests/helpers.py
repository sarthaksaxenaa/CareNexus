"""Small helpers shared by the API-level tests."""

import uuid

from httpx import AsyncClient


async def register(client: AsyncClient, email: str | None = None) -> dict:
    """Register a fresh user and return the API response body."""
    email = email or f"user_{uuid.uuid4().hex[:8]}@test.com"
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "SecurePass#123", "full_name": "Test User"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


def bearer(tokens: dict) -> dict:
    """Authorization header for an access token pair."""
    return {"Authorization": f"Bearer {tokens['access_token']}"}
