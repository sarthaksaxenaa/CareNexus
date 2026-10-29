"""Chat sessions are listed by latest activity, not creation time."""

from httpx import AsyncClient

from tests.helpers import bearer, register

# ─── Chat ordering ────────────────────────────────────────────────────────────


async def test_session_list_is_ordered_by_latest_activity(client: AsyncClient):
    headers = bearer((await register(client))["tokens"])
    first = await client.post(
        "/api/v1/chat/message",
        json={"message": "first topic headache"},
        headers=headers,
    )
    await client.post(
        "/api/v1/chat/message", json={"message": "second topic cough"}, headers=headers
    )
    first_id = first.json()["session_id"]
    await client.post(
        "/api/v1/chat/message",
        json={"message": "back to the headache", "session_id": first_id},
        headers=headers,
    )
    sessions = (await client.get("/api/v1/chat/sessions", headers=headers)).json()
    assert sessions["sessions"][0]["id"] == first_id
