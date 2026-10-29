"""Auth: refresh token contract, deactivated users, e-mail case, malformed tokens."""

import uuid

from httpx import AsyncClient
from sqlalchemy import update

from app.core.config import settings
from app.models.user import User
from app.services.auth_service import create_access_token, create_refresh_token
from tests.conftest import TestSessionFactory
from tests.helpers import bearer, register

# ─── Refresh tokens ───────────────────────────────────────────────────────────


async def test_refresh_takes_token_in_json_body(client: AsyncClient):
    tokens = (await register(client))["tokens"]
    resp = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert resp.status_code == 200, resp.text
    new = resp.json()
    me = await client.get("/api/v1/auth/me", headers=bearer(new))
    assert me.status_code == 200


async def test_refresh_rejects_token_in_query_string(client: AsyncClient):
    tokens = (await register(client))["tokens"]
    resp = await client.post(
        "/api/v1/auth/refresh", params={"refresh_token": tokens["refresh_token"]}
    )
    assert resp.status_code == 422


async def test_refresh_rejects_access_token(client: AsyncClient):
    tokens = (await register(client))["tokens"]
    resp = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["access_token"]}
    )
    assert resp.status_code == 401


async def test_deactivated_user_cannot_refresh(client: AsyncClient):
    data = await register(client)
    async with TestSessionFactory() as db:
        await db.execute(
            update(User)
            .where(User.id == uuid.UUID(data["user"]["id"]))
            .values(is_active=False)
        )
        await db.commit()
    resp = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": data["tokens"]["refresh_token"]}
    )
    assert resp.status_code == 401


async def test_refresh_for_unknown_user_is_rejected(client: AsyncClient):
    token = create_refresh_token(str(uuid.uuid4()))
    resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": token})
    assert resp.status_code == 401


async def test_refresh_is_rate_limited(client: AsyncClient):
    body = {"refresh_token": "garbage"}
    for _ in range(settings.RATE_LIMIT_AUTH):
        await client.post("/api/v1/auth/refresh", json=body)
    resp = await client.post("/api/v1/auth/refresh", json=body)
    assert resp.status_code == 429


# ─── Auth edge cases ──────────────────────────────────────────────────────────


async def test_duplicate_email_with_different_case_is_a_conflict(client: AsyncClient):
    local = uuid.uuid4().hex[:8]
    await register(client, f"{local}@test.com")
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"{local.upper()}@test.com",
            "password": "SecurePass#123",
            "full_name": "Case Twin",
        },
    )
    assert resp.status_code == 409


async def test_login_is_case_insensitive(client: AsyncClient):
    local = uuid.uuid4().hex[:8]
    await register(client, f"{local}@test.com")
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": f"{local.upper()}@test.com", "password": "SecurePass#123"},
    )
    assert resp.status_code == 200


async def test_token_with_malformed_subject_is_401_not_500(client: AsyncClient):
    token = create_access_token("not-a-uuid")
    resp = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 401


# ─── Password hashing ─────────────────────────────────────────────────────────


def test_new_hashes_use_the_sha256_prehash():
    from app.services.auth_service import hash_password, needs_rehash, verify_password

    hashed = hash_password("p" * 100)
    assert hashed.startswith("sha256$")
    assert not needs_rehash(hashed)
    assert verify_password("p" * 100, hashed)
    assert not verify_password("p" * 99 + "q", hashed)


async def test_legacy_bcrypt_hash_still_logs_in_and_is_upgraded(client: AsyncClient):
    import bcrypt

    from app.models.user import User

    email = f"legacy_{uuid.uuid4().hex[:6]}@example.com"
    data = await register(client, email)
    legacy = bcrypt.hashpw(b"OldPassword#1", bcrypt.gensalt()).decode()
    async with TestSessionFactory() as db:
        await db.execute(
            update(User)
            .where(User.id == uuid.UUID(data["user"]["id"]))
            .values(hashed_password=legacy)
        )
        await db.commit()

    resp = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": "OldPassword#1"}
    )
    assert resp.status_code == 200

    async with TestSessionFactory() as db:
        user = await db.get(User, uuid.UUID(data["user"]["id"]))
        assert user.hashed_password.startswith("sha256$")

    again = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": "OldPassword#1"}
    )
    assert again.status_code == 200
