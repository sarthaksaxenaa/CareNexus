"""Tests for JWT token creation and verification."""

from app.services.auth_service import (
    create_access_token,
    create_refresh_token,
    verify_token,
)


def test_access_token_creation_and_verification():
    """Access tokens should be creatable and verifiable."""
    user_id = "test-user-123"
    token = create_access_token(user_id)

    payload = verify_token(token, token_type="access")
    assert payload is not None
    assert payload.sub == user_id
    assert payload.type == "access"


def test_refresh_token_creation_and_verification():
    """Refresh tokens should be creatable and verifiable."""
    user_id = "test-user-456"
    token = create_refresh_token(user_id)

    payload = verify_token(token, token_type="refresh")
    assert payload is not None
    assert payload.sub == user_id
    assert payload.type == "refresh"


def test_access_token_rejected_as_refresh():
    """Access tokens should not verify as refresh tokens."""
    token = create_access_token("user-1")
    payload = verify_token(token, token_type="refresh")
    assert payload is None


def test_refresh_token_rejected_as_access():
    """Refresh tokens should not verify as access tokens."""
    token = create_refresh_token("user-1")
    payload = verify_token(token, token_type="access")
    assert payload is None


def test_invalid_token_returns_none():
    """Invalid/corrupted tokens should return None."""
    payload = verify_token("this.is.not.a.valid.token")
    assert payload is None


def test_empty_token_returns_none():
    """Empty string token should return None."""
    payload = verify_token("")
    assert payload is None


def test_different_users_get_different_tokens():
    """Different user IDs should produce different tokens."""
    token1 = create_access_token("user-a")
    token2 = create_access_token("user-b")
    assert token1 != token2
