"""Analytics endpoints: the data behind the dashboard.

Previously almost untested (21% line coverage). These pin the numbers the
dashboard shows and the edge cases of the query parameters.
"""

from datetime import UTC, datetime

import pytest
from httpx import AsyncClient

from tests.helpers import bearer, register

EMERGENCY = "Crushing chest pain spreading to my left arm"
MILD = "I have a mild headache"


async def _chat(client: AsyncClient, headers: dict, text: str) -> dict:
    resp = await client.post(
        "/api/v1/chat/message", json={"message": text}, headers=headers
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/analytics/overview",
        "/api/v1/analytics/triage-distribution",
        "/api/v1/analytics/daily-usage",
        "/api/v1/analytics/my-stats",
        "/api/v1/analytics/rag-index",
    ],
)
async def test_requires_authentication(client: AsyncClient, path: str):
    resp = await client.get(path)
    assert resp.status_code == 401


async def test_my_stats_counts_only_my_own_checks(client: AsyncClient):
    alice = bearer((await register(client))["tokens"])
    bob = bearer((await register(client))["tokens"])
    await _chat(client, alice, MILD)
    await _chat(client, alice, EMERGENCY)
    await _chat(client, bob, MILD)

    mine = (await client.get("/api/v1/analytics/my-stats", headers=alice)).json()[
        "data"
    ]
    assert mine == {"total_sessions": 2, "total_messages": 2}  # user messages only


async def test_overview_counts_emergencies_and_averages(client: AsyncClient):
    headers = bearer((await register(client))["tokens"])
    before = (await client.get("/api/v1/analytics/overview", headers=headers)).json()[
        "data"
    ]
    await _chat(client, headers, EMERGENCY)
    after = (await client.get("/api/v1/analytics/overview", headers=headers)).json()[
        "data"
    ]

    assert after["total_sessions"] == before["total_sessions"] + 1
    assert after["total_messages"] == before["total_messages"] + 2  # question + answer
    assert after["emergency_triage_count"] == before["emergency_triage_count"] + 1
    assert after["avg_messages_per_session"] > 0


async def test_triage_distribution_percentages_add_up(client: AsyncClient):
    headers = bearer((await register(client))["tokens"])
    await _chat(client, headers, MILD)
    await _chat(client, headers, EMERGENCY)
    data = (
        await client.get("/api/v1/analytics/triage-distribution", headers=headers)
    ).json()["data"]

    assert set(data["distribution"]) == {"green", "yellow", "red", "none"}
    assert data["total_triaged"] == sum(data["distribution"].values())
    assert data["distribution"]["red"] >= 1
    assert abs(sum(data["percentages"].values()) - 100) < 0.5


async def test_daily_usage_is_zero_filled_and_ends_today(client: AsyncClient):
    headers = bearer((await register(client))["tokens"])
    await _chat(client, headers, MILD)
    days = (
        await client.get("/api/v1/analytics/daily-usage?days=7", headers=headers)
    ).json()["data"]

    assert len(days) == 7
    dates = [d["date"] for d in days]
    assert dates == sorted(dates)
    assert dates[-1] == datetime.now(UTC).strftime("%Y-%m-%d")
    assert days[-1]["messages"] >= 2


@pytest.mark.parametrize(("days", "expected_len"), [(1, 1), (30, 30), (90, 90)])
async def test_daily_usage_window_lengths(
    client: AsyncClient, days: int, expected_len: int
):
    headers = bearer((await register(client))["tokens"])
    resp = await client.get(
        f"/api/v1/analytics/daily-usage?days={days}", headers=headers
    )
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == expected_len


@pytest.mark.parametrize("days", ["0", "-5", "91", "1000", "abc"])
async def test_daily_usage_rejects_invalid_window(client: AsyncClient, days: str):
    headers = bearer((await register(client))["tokens"])
    resp = await client.get(
        f"/api/v1/analytics/daily-usage?days={days}", headers=headers
    )
    assert resp.status_code == 422


async def test_rag_index_reports_the_library(client: AsyncClient):
    headers = bearer((await register(client))["tokens"])
    data = (await client.get("/api/v1/analytics/rag-index", headers=headers)).json()[
        "data"
    ]
    assert data["indexed_conditions"] == 49
    assert len(data["categories"]) == 11
    assert data["vocabulary_size"] > 0
