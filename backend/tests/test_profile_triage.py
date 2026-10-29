"""Health-profile-aware triage.

The profile (age, conditions) must change the triage outcome, end to end:
    HealthProfile row -> chat route -> analyze_symptoms -> response + level.

Regression note: before this feature the engine accepted patient_age /
patient_gender / known_conditions but the chat route never passed them, and
the offline (no API key) path dropped risk factors even when supplied.
"""

import uuid

import pytest
from httpx import AsyncClient

from app.core.triage.engine import analyze_symptoms
from app.models.chat import TriageLevel

# A presentation that is GREEN for a healthy adult (asserted below so the
# escalation tests cannot pass vacuously).
MILD = "I have a runny nose and I sneeze a lot"


class TestEngineRiskAdjustment:
    @pytest.mark.asyncio
    async def test_baseline_is_green_without_risk_factors(self):
        result = await analyze_symptoms(MILD)
        assert result["triage_level"] == TriageLevel.GREEN
        assert "Risk factors noted" not in result["response"]

    @pytest.mark.asyncio
    async def test_elderly_patient_escalates_and_is_explained(self):
        result = await analyze_symptoms(MILD, patient_age=72)
        assert result["triage_level"] == TriageLevel.YELLOW
        assert "Risk factors noted" in result["response"]
        assert "Elderly" in result["response"]

    @pytest.mark.asyncio
    async def test_known_condition_escalates(self):
        result = await analyze_symptoms(MILD, known_conditions="Type 2 diabetes")
        assert result["triage_level"] == TriageLevel.YELLOW
        assert "diabetes" in result["response"].lower()

    @pytest.mark.asyncio
    async def test_healthy_adult_profile_does_not_escalate(self):
        """Negative case: a profile alone must not inflate severity."""
        result = await analyze_symptoms(
            MILD, patient_age=30, patient_gender="Female", known_conditions=""
        )
        assert result["triage_level"] == TriageLevel.GREEN
        assert "Risk factors noted" not in result["response"]

    @pytest.mark.asyncio
    async def test_red_flag_still_wins_over_profile(self):
        result = await analyze_symptoms(
            "I have severe chest pain and my left arm is numb", patient_age=30
        )
        assert result["triage_level"] == TriageLevel.RED


class TestChatRouteUsesProfile:
    @pytest.mark.asyncio
    async def test_profile_changes_chat_outcome(self, auth_client: AsyncClient):
        before = await auth_client.post("/api/v1/chat/message", json={"message": MILD})
        assert before.status_code == 200
        assert before.json()["assistant_message"]["triage_level"] == "green"

        created = await auth_client.post(
            "/api/v1/health-profile/",
            json={"age": 71, "known_conditions": "hypertension, diabetes"},
        )
        assert created.status_code == 201

        after = await auth_client.post("/api/v1/chat/message", json={"message": MILD})
        assert after.status_code == 200
        msg = after.json()["assistant_message"]
        assert msg["triage_level"] == "yellow"
        assert "Risk factors noted" in msg["content"]

    @pytest.mark.asyncio
    async def test_user_without_profile_still_works(self, auth_client: AsyncClient):
        """A missing profile is normal, never an error."""
        resp = await auth_client.post("/api/v1/chat/message", json={"message": MILD})
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_profile_is_not_leaked_across_users(
        self, client: AsyncClient, auth_client: AsyncClient
    ):
        """Another user's high-risk profile must never affect my triage."""
        await auth_client.post(
            "/api/v1/health-profile/", json={"age": 80, "known_conditions": "copd"}
        )

        other = uuid.uuid4().hex[:8]
        reg = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"isolated_{other}@test.com",
                "password": "SecurePass#123",
                "full_name": "Isolated User",
            },
        )
        token = reg.json()["tokens"]["access_token"]
        resp = await client.post(
            "/api/v1/chat/message",
            json={"message": MILD},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["assistant_message"]["triage_level"] == "green"
