"""Edge cases across auth, chat and health-profile endpoints.

Each test states the behaviour a user or attacker would hit.
"""

import uuid

import pytest
from httpx import AsyncClient

from tests.helpers import bearer, register

PASSWORD = "SecurePass#123"


# ─── Auth ─────────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "payload",
    [
        {
            "email": "a@example.com",
            "password": "short",
            "full_name": "Asha",
        },  # < 8 chars
        {"email": "a@example.com", "password": "x" * 129, "full_name": "Asha"},  # > 128
        {"email": "not-an-email", "password": PASSWORD, "full_name": "Asha"},
        {"email": "a@example.com", "password": PASSWORD, "full_name": "A"},  # < 2 chars
        {"email": "a@example.com", "password": PASSWORD, "full_name": "    "},  # blank
        {"email": "a@example.com", "password": PASSWORD},  # missing name
    ],
)
async def test_register_rejects_invalid_input(client: AsyncClient, payload: dict):
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 422


async def test_register_trims_the_name(client: AsyncClient):
    email = f"trim_{uuid.uuid4().hex[:6]}@example.com"
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": PASSWORD, "full_name": "  Asha Verma  "},
    )
    assert resp.status_code == 201
    assert resp.json()["user"]["full_name"] == "Asha Verma"


async def test_passwords_differing_after_72_bytes_are_different(client: AsyncClient):
    """bcrypt only reads 72 bytes; longer passwords must not collide."""
    email = f"long_{uuid.uuid4().hex[:6]}@example.com"
    base = "p" * 80
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": base + "A", "full_name": "Long Pass"},
    )
    resp = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": base + "B"}
    )
    assert resp.status_code == 401


async def test_unicode_password_round_trips(client: AsyncClient):
    email = f"uni_{uuid.uuid4().hex[:6]}@example.com"
    password = "पासवर्ड-密码-🔒-secure"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Uni Code"},
    )
    resp = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": password}
    )
    assert resp.status_code == 200


@pytest.mark.parametrize(
    "header",
    ["", "Bearer", "Bearer ", "Basic dXNlcjpwYXNz", "Bearer not.a.jwt"],
)
async def test_bad_authorization_headers_are_401(client: AsyncClient, header: str):
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": header})
    assert resp.status_code == 401


async def test_refresh_token_cannot_be_used_as_access_token(client: AsyncClient):
    tokens = (await register(client))["tokens"]
    resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {tokens['refresh_token']}"},
    )
    assert resp.status_code == 401


# ─── Chat ─────────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("message", "status"),
    [
        ("", 422),
        ("   \n\t ", 400),
        ("x" * 2001, 422),  # one limit, enforced by the schema
    ],
)
async def test_chat_rejects_unusable_messages(client: AsyncClient, message, status):
    headers = bearer((await register(client))["tokens"])
    resp = await client.post(
        "/api/v1/chat/message", json={"message": message}, headers=headers
    )
    assert resp.status_code == status


async def test_chat_accepts_a_message_at_the_limit(client: AsyncClient):
    headers = bearer((await register(client))["tokens"])
    text = ("my head hurts " * 200)[:2000]
    resp = await client.post(
        "/api/v1/chat/message", json={"message": text}, headers=headers
    )
    assert resp.status_code == 200


@pytest.mark.parametrize(
    "message",
    [
        "मुझे सिरदर्द है और बुखार है",  # Hindi
        "I have a headache 🤕 and fever 🤒",
        "Fièvre et mal de tête depuis hier",
    ],
)
async def test_chat_handles_non_ascii_text(client: AsyncClient, message: str):
    headers = bearer((await register(client))["tokens"])
    resp = await client.post(
        "/api/v1/chat/message", json={"message": message}, headers=headers
    )
    assert resp.status_code == 200
    assert resp.json()["user_message"]["content"] == message


async def test_cannot_post_into_another_users_session(client: AsyncClient):
    alice = bearer((await register(client))["tokens"])
    bob = bearer((await register(client))["tokens"])
    session_id = (
        await client.post(
            "/api/v1/chat/message", json={"message": "headache"}, headers=alice
        )
    ).json()["session_id"]

    resp = await client.post(
        "/api/v1/chat/message",
        json={"message": "hello", "session_id": session_id},
        headers=bob,
    )
    assert resp.status_code == 404


@pytest.mark.parametrize("session_id", ["not-a-uuid", "123", ""])
async def test_malformed_session_ids_are_rejected(client: AsyncClient, session_id):
    headers = bearer((await register(client))["tokens"])
    resp = await client.get(
        f"/api/v1/chat/sessions/{session_id}/messages", headers=headers
    )
    assert resp.status_code in (404, 422)


async def test_unknown_session_is_404(client: AsyncClient):
    headers = bearer((await register(client))["tokens"])
    resp = await client.get(
        f"/api/v1/chat/sessions/{uuid.uuid4()}/messages", headers=headers
    )
    assert resp.status_code == 404


async def test_timestamps_carry_a_utc_offset(client: AsyncClient):
    """Naive timestamps were read as local time by browsers (5 h 30 off in India)."""
    headers = bearer((await register(client))["tokens"])
    data = (
        await client.post(
            "/api/v1/chat/message", json={"message": "headache"}, headers=headers
        )
    ).json()
    for stamp in (
        data["user_message"]["created_at"],
        data["assistant_message"]["created_at"],
    ):
        assert stamp.endswith("Z") or stamp.endswith("+00:00"), stamp
    sessions = (await client.get("/api/v1/chat/sessions", headers=headers)).json()
    first = sessions["sessions"][0]
    assert first["updated_at"].endswith(("Z", "+00:00"))


# ─── Health profile ───────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "payload",
    [
        {"age": -1},
        {"age": 151},
        {"age": "forty"},
        {"blood_group": "Z+"},
        {"blood_group": "A"},
        {"known_conditions": "x" * 2001},
    ],
)
async def test_profile_rejects_invalid_values(client: AsyncClient, payload: dict):
    headers = bearer((await register(client))["tokens"])
    resp = await client.post("/api/v1/health-profile/", json=payload, headers=headers)
    assert resp.status_code == 422


async def test_profile_blood_group_is_normalised(client: AsyncClient):
    headers = bearer((await register(client))["tokens"])
    resp = await client.post(
        "/api/v1/health-profile/", json={"blood_group": " ab+ "}, headers=headers
    )
    assert resp.status_code == 201
    assert resp.json()["blood_group"] == "AB+"


async def test_profile_fields_can_be_cleared(client: AsyncClient):
    """Removing a condition and saving must actually remove it."""
    headers = bearer((await register(client))["tokens"])
    await client.post(
        "/api/v1/health-profile/",
        json={"age": 40, "known_conditions": "Diabetes", "allergies": "Peanuts"},
        headers=headers,
    )
    resp = await client.put(
        "/api/v1/health-profile/",
        json={"age": 40, "known_conditions": None, "allergies": "Peanuts"},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["known_conditions"] is None
    assert body["allergies"] == "Peanuts"


async def test_profile_fields_left_out_are_kept(client: AsyncClient):
    headers = bearer((await register(client))["tokens"])
    await client.post(
        "/api/v1/health-profile/",
        json={"age": 40, "known_conditions": "Asthma"},
        headers=headers,
    )
    resp = await client.put(
        "/api/v1/health-profile/", json={"age": 41}, headers=headers
    )
    assert resp.json()["age"] == 41
    assert resp.json()["known_conditions"] == "Asthma"


async def test_profile_lifecycle(client: AsyncClient):
    headers = bearer((await register(client))["tokens"])
    url = "/api/v1/health-profile/"
    assert (await client.get(url, headers=headers)).status_code == 404
    assert (await client.put(url, json={"age": 1}, headers=headers)).status_code == 404
    assert (
        await client.post(url, json={"age": 30}, headers=headers)
    ).status_code == 201
    assert (
        await client.post(url, json={"age": 31}, headers=headers)
    ).status_code == 409
    assert (await client.delete(url, headers=headers)).status_code == 204
    assert (await client.get(url, headers=headers)).status_code == 404
    assert (await client.delete(url, headers=headers)).status_code == 404
