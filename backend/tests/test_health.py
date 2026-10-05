"""Tests for the health check endpoint."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


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
    assert "version" in data


@pytest.mark.asyncio
async def test_chat_message_placeholder():
    """Test that the chat message placeholder endpoint works."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post("/api/v1/chat/message")

    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "disclaimer" in data
