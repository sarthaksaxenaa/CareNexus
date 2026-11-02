"""Sex on the user account: required at sign-up, male or female only.

Clinical sex changes which conditions are possible (no menstrual cramps for a
male patient), so it lives on the account, is asked for once, and is
validated strictly at every entry point.
"""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.database import apply_additive_migrations
from tests.helpers import bearer

PASSWORD = "SecurePass#123"


def _payload(**extra) -> dict:
    return {
        "email": f"sex_{uuid.uuid4().hex[:8]}@example.com",
        "password": PASSWORD,
        "full_name": "Asha Verma",
        **extra,
    }


# ─── Sign-up ──────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("given", "stored"),
    [("male", "male"), ("female", "female"), (" Female ", "female"), ("MALE", "male")],
)
async def test_register_stores_sex(client: AsyncClient, given, stored):
    resp = await client.post("/api/v1/auth/register", json=_payload(sex=given))
    assert resp.status_code == 201, resp.text
    assert resp.json()["user"]["sex"] == stored


@pytest.mark.parametrize("bad", [None, "", "other", "m", "f", "unknown", 1])
async def test_register_rejects_missing_or_other_sex(client: AsyncClient, bad):
    payload = _payload() if bad is None else _payload(sex=bad)
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 422


async def test_login_and_me_return_sex(client: AsyncClient):
    payload = _payload(sex="female")
    await client.post("/api/v1/auth/register", json=payload)
    login = await client.post(
        "/api/v1/auth/login", json={"email": payload["email"], "password": PASSWORD}
    )
    assert login.json()["user"]["sex"] == "female"
    me = await client.get("/api/v1/auth/me", headers=bearer(login.json()["tokens"]))
    assert me.json()["sex"] == "female"


# ─── Setting it after login (accounts created before the field existed) ──────


async def test_sex_can_be_set_and_corrected(client: AsyncClient):
    tokens = (
        await client.post("/api/v1/auth/register", json=_payload(sex="male"))
    ).json()["tokens"]
    resp = await client.patch(
        "/api/v1/auth/me", json={"sex": "female"}, headers=bearer(tokens)
    )
    assert resp.status_code == 200
    assert resp.json()["sex"] == "female"
    me = await client.get("/api/v1/auth/me", headers=bearer(tokens))
    assert me.json()["sex"] == "female"


@pytest.mark.parametrize("body", [{}, {"sex": None}, {"sex": "other"}, {"sex": ""}])
async def test_patch_me_rejects_invalid_sex(client: AsyncClient, body):
    tokens = (
        await client.post("/api/v1/auth/register", json=_payload(sex="male"))
    ).json()["tokens"]
    resp = await client.patch("/api/v1/auth/me", json=body, headers=bearer(tokens))
    assert resp.status_code == 422


async def test_patch_me_requires_authentication(client: AsyncClient):
    resp = await client.patch("/api/v1/auth/me", json={"sex": "male"})
    assert resp.status_code == 401


async def test_patch_me_cannot_change_other_fields(client: AsyncClient):
    reg = (await client.post("/api/v1/auth/register", json=_payload(sex="male"))).json()
    resp = await client.patch(
        "/api/v1/auth/me",
        json={"sex": "male", "email": "evil@example.com", "is_active": False},
        headers=bearer(reg["tokens"]),
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == reg["user"]["email"]
    assert resp.json()["is_active"] is True


# ─── Schema migration for databases created before the column existed ────────


async def test_additive_migration_adds_sex_to_an_old_users_table(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'old.db'}")
    async with engine.begin() as conn:
        # The users table as it was before this change, with one account.
        await conn.execute(
            text(
                "CREATE TABLE users (id CHAR(32) PRIMARY KEY, email VARCHAR(255), "
                "hashed_password VARCHAR(255), full_name VARCHAR(100), "
                "is_active BOOLEAN, is_verified BOOLEAN, created_at DATETIME, updated_at DATETIME)"
            )
        )
        await conn.execute(
            text("INSERT INTO users (id, email) VALUES ('a', 'old@example.com')")
        )

    for _ in range(2):  # running it again must be a no-op
        async with engine.begin() as conn:
            await conn.run_sync(apply_additive_migrations)

    async with engine.connect() as conn:
        columns = await conn.run_sync(
            lambda c: [col["name"] for col in inspect(c).get_columns("users")]
        )
        row = (await conn.execute(text("SELECT email, sex FROM users"))).one()
    await engine.dispose()

    assert columns.count("sex") == 1
    assert row == ("old@example.com", None)  # existing accounts are asked later


async def test_additive_migration_ignores_missing_tables(tmp_path):
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'empty.db'}")
    async with engine.begin() as conn:
        await conn.run_sync(apply_additive_migrations)  # must not raise
    await engine.dispose()
