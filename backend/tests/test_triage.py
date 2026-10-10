"""Tests for the CareNexus triage engine — red flags and fallback responses."""

import pytest

from app.core.triage.engine import _fallback_response, analyze_symptoms
from app.core.triage.red_flags import check_red_flags
from app.models.chat import TriageLevel

# ─── Red Flag Detection ───────────────────────────────


def test_red_flag_chest_pain():
    """Detect chest pain as a red flag emergency."""
    result = check_red_flags("I have severe chest pain")
    assert result is not None
    assert "EMERGENCY" in result["message"]


def test_red_flag_breathing():
    """Detect breathing difficulty as a red flag emergency."""
    result = check_red_flags("I can't breathe properly")
    assert result is not None
    assert "Breathing" in result["message"]


def test_red_flag_stroke():
    """Detect stroke symptoms as a red flag emergency."""
    result = check_red_flags("I think I'm having a stroke")
    assert result is not None
    assert "Stroke" in result["message"]


def test_red_flag_mental_health():
    """Detect mental health crisis with appropriate helpline response."""
    result = check_red_flags("I want to end my life")
    assert result is not None
    assert "Not Alone" in result["message"]
    assert "iCall" in result["message"]


def test_no_red_flag_for_normal():
    """Normal symptoms should not trigger red flags."""
    result = check_red_flags("I have a mild headache")
    assert result is None


def test_no_red_flag_for_greeting():
    """Greetings should not trigger red flags."""
    result = check_red_flags("Hello, how are you?")
    assert result is None


# ─── Fallback Response ────────────────────────────────


def test_fallback_severe_symptoms():
    """Severe symptoms should return yellow triage."""
    result = _fallback_response("I have severe unbearable pain")
    assert result["triage_level"] == TriageLevel.YELLOW


def test_fallback_moderate_symptoms():
    """Moderate symptoms like fever should return yellow triage."""
    result = _fallback_response("I have a fever and cough")
    assert result["triage_level"] == TriageLevel.YELLOW


def test_fallback_mild_symptoms():
    """Mild symptoms like cold should return green triage."""
    result = _fallback_response("I have a runny nose and sneeze")
    assert result["triage_level"] == TriageLevel.GREEN
    assert "Rest" in result["response"]


def test_fallback_vague_input():
    """Vague input should ask for more details."""
    result = _fallback_response("I'm not feeling well")
    assert result["triage_level"] == TriageLevel.NONE
    assert "describe" in result["response"].lower()


def test_fallback_always_has_disclaimer():
    """All fallback responses should include a medical disclaimer."""
    result = _fallback_response("I have a headache")
    assert (
        "not medical advice" in result["response"].lower()
        or "Disclaimer" in result["response"]
    )


# ─── Analyze Symptoms Integration ─────────────────────


@pytest.mark.asyncio
async def test_analyze_red_flag_returns_red():
    """Emergency symptoms should bypass LLM and return RED triage."""
    result = await analyze_symptoms("I have severe chest pain and tightness")
    assert result["triage_level"] == TriageLevel.RED
    assert "EMERGENCY" in result["response"]


@pytest.mark.asyncio
async def test_analyze_normal_uses_fallback():
    """Without LLM keys, normal symptoms should use fallback."""
    result = await analyze_symptoms("I have a headache and fever")
    assert result["triage_level"] in [
        TriageLevel.YELLOW,
        TriageLevel.GREEN,
        TriageLevel.NONE,
    ]
    assert result["response"] is not None
