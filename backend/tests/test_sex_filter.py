"""Conditions that cannot apply to the patient's sex are never matched.

Before this, a male user describing lower-abdominal cramps could be told it
"could be consistent with Menstrual Cramps". Sex is the account's clinical
sex (male or female); unknown sex filters nothing.
"""

import pytest
from httpx import AsyncClient

from app.core.triage.engine import analyze_symptoms
from app.core.triage.symptom_parser import parse_symptoms
from app.rag.knowledge_base import ALL_CONDITIONS
from app.rag.retriever import retrieve
from tests.helpers import bearer

FEMALE_ONLY = {
    "Menstrual Cramps (Dysmenorrhea)",
    "Polycystic Ovary Syndrome (PCOS)",
    "Breast Pain (Mastalgia)",
}


def names(results) -> list[str]:
    return [r.condition.name for r in results]


def test_every_condition_declares_a_valid_sex():
    for c in ALL_CONDITIONS:
        assert c.sex in (None, "male", "female"), c.name
    tagged = {c.name for c in ALL_CONDITIONS if c.sex == "female"}
    assert tagged == FEMALE_ONLY


@pytest.mark.parametrize(
    "query",
    [
        "lower abdominal cramps during my period",
        "pelvic pain and irregular periods",
        "breast pain and tenderness before my period",
        "I have pain in my breast",
    ],
)
def test_male_patients_never_get_female_only_conditions(query):
    assert not FEMALE_ONLY & set(names(retrieve(query, top_k=3, sex="male")))


@pytest.mark.parametrize(
    ("query", "expected"),
    [
        ("lower abdominal cramps during my period", "Menstrual Cramps (Dysmenorrhea)"),
        ("pelvic pain and irregular periods", "Polycystic Ovary Syndrome (PCOS)"),
        ("I have pain in my breast", "Breast Pain (Mastalgia)"),
        ("breast pain and tenderness before my period", "Breast Pain (Mastalgia)"),
    ],
)
def test_female_patients_still_get_them(query, expected):
    assert names(retrieve(query, top_k=3, sex="female"))[0] == expected


def test_unknown_sex_filters_nothing():
    assert "Menstrual Cramps (Dysmenorrhea)" in names(
        retrieve("lower abdominal cramps during my period", top_k=3)
    )


def test_filtering_still_returns_a_full_list():
    """Dropping a condition must not shrink the answer below top_k."""
    female = names(
        retrieve("lower abdominal cramps during my period", top_k=3, sex="female")
    )
    male = names(
        retrieve("lower abdominal cramps during my period", top_k=3, sex="male")
    )
    assert len(male) == len(female) == 3


def test_pelvis_region_reaches_pelvic_conditions():
    """The female body's pelvis region sends 'I have pain in my pelvis'.

    It used to match only on "pain" and return appendicitis first.
    """
    top = names(retrieve("I have pain in my pelvis", top_k=3, sex="female"))
    pelvic = {
        "Urinary Tract Infection (UTI)",
        "Menstrual Cramps (Dysmenorrhea)",
        "Polycystic Ovary Syndrome (PCOS)",
    }
    assert set(top) == pelvic


@pytest.mark.parametrize("part", ["breast", "pelvis"])
def test_parser_recognises_the_new_regions(part):
    assert part in parse_symptoms(f"I have pain in my {part}").body_parts


async def test_engine_applies_the_patient_sex():
    reply = await analyze_symptoms(
        "lower abdominal cramps during my period", patient_gender="male"
    )
    assert "Menstrual" not in reply["response"]
    reply = await analyze_symptoms(
        "lower abdominal cramps during my period", patient_gender="female"
    )
    assert "Menstrual" in reply["response"]


async def test_chat_uses_the_account_sex(client: AsyncClient):
    for sex, expect_menstrual in (("male", False), ("female", True)):
        resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"filter_{sex}@example.com",
                "password": "SecurePass#123",
                "full_name": "Filter Test",
                "sex": sex,
            },
        )
        headers = bearer(resp.json()["tokens"])
        chat = await client.post(
            "/api/v1/chat/message",
            json={"message": "lower abdominal cramps during my period"},
            headers=headers,
        )
        assert chat.status_code == 200
        assert (
            "Menstrual" in chat.json()["assistant_message"]["content"]
        ) is expect_menstrual, sex
