"""The Gemini path must see what retrieval found, and fail safe.

It used to send only the system prompt and the raw message, so answers were
not grounded in the retrieved conditions or the patient's risk factors, and
its error fallback dropped them too.
"""

import types

import pytest

from app.core.config import settings
from app.core.triage import engine


class _FakeModels:
    def __init__(self, recorder, fail):
        self.recorder = recorder
        self.fail = fail

    def generate_content(self, model, contents):
        self.recorder.append(contents)
        if self.fail:
            raise RuntimeError("quota exceeded")
        return types.SimpleNamespace(
            text='{"response": "Rest and fluids.", "triage_level": "green"}'
        )


@pytest.fixture
def fake_gemini(monkeypatch):
    prompts: list[str] = []
    state = {"fail": False}

    def client(api_key):
        return types.SimpleNamespace(models=_FakeModels(prompts, state["fail"]))

    import google.genai

    monkeypatch.setattr(google.genai, "Client", client)
    monkeypatch.setattr(settings, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    return prompts, state


async def test_prompt_carries_retrieved_conditions_and_risk(fake_gemini):
    prompts, _ = fake_gemini
    await engine.analyze_symptoms(
        "burning when I urinate and a fever since yesterday",
        patient_age=70,
        patient_gender="female",
    )
    prompt = prompts[0]
    assert "RETRIEVED MEDICAL KNOWLEDGE" in prompt
    assert "Urinary Tract Infection" in prompt
    assert "Patient risk factors" in prompt
    assert "burning when I urinate" in prompt


async def test_prompt_respects_the_patient_sex(fake_gemini):
    prompts, _ = fake_gemini
    await engine.analyze_symptoms(
        "lower abdominal cramps during my period", patient_gender="male"
    )
    assert "Menstrual Cramps" not in prompts[0]


async def test_gemini_failure_falls_back_with_full_context(fake_gemini):
    prompts, state = fake_gemini
    state["fail"] = True
    reply = await engine.analyze_symptoms(
        "lower abdominal cramps during my period", patient_gender="male"
    )
    assert prompts, "Gemini was called"
    assert reply["response"]  # offline answer, not an error
    assert "Menstrual" not in reply["response"]  # the sex filter survived the fallback
