"""Symptom parser — extracts structured symptom data from free-text user input.

Provides:
    - Multi-symptom extraction from a single message
    - Duration parsing ("for 3 days", "since last week")
    - Severity modifier detection ("severe", "mild", "unbearable")
    - Demographic risk factor integration from health profile
"""

import re
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ParsedSymptoms:
    """Structured representation of extracted symptom information.

    Attributes:
        symptoms: Individual symptom phrases extracted from the message.
        duration_days: Estimated duration in days (None if not mentioned).
        severity_modifier: Detected severity level ('mild', 'moderate', 'severe').
        body_parts: Mentioned body parts/locations.
        negated_symptoms: Symptoms the user explicitly denied having.
    """

    symptoms: tuple[str, ...]
    duration_days: float | None = None
    severity_modifier: str = "unknown"
    body_parts: tuple[str, ...] = ()
    negated_symptoms: tuple[str, ...] = ()


# ─── Duration Patterns ──────────────────────────────────────────────────────

_DURATION_PATTERNS: list[tuple[re.Pattern, str, float]] = [
    (re.compile(r"(\d+)\s*(?:day|days)"), "days", 1.0),
    (re.compile(r"(\d+)\s*(?:week|weeks)"), "weeks", 7.0),
    (re.compile(r"(\d+)\s*(?:month|months)"), "months", 30.0),
    (re.compile(r"(\d+)\s*(?:hour|hours|hr|hrs)"), "hours", 1 / 24),
    (re.compile(r"(\d+)\s*(?:year|years)"), "years", 365.0),
    (re.compile(r"since\s+(?:last|this)\s+week"), "since_week", 7.0),
    (re.compile(r"since\s+(?:last|this)\s+month"), "since_month", 30.0),
    (re.compile(r"since\s+yesterday"), "yesterday", 1.0),
    (re.compile(r"(?:a|one)\s+week"), "one_week", 7.0),
    (re.compile(r"(?:a|one)\s+month"), "one_month", 30.0),
    (re.compile(r"few\s+days"), "few_days", 3.0),
    (re.compile(r"couple\s+(?:of\s+)?days"), "couple_days", 2.0),
]

# ─── Severity Modifiers ─────────────────────────────────────────────────────

_SEVERE_WORDS = frozenset(
    {
        "severe",
        "extreme",
        "excruciating",
        "unbearable",
        "terrible",
        "worst",
        "agonizing",
        "intense",
        "horrible",
        "awful",
        "very bad",
        "really bad",
        "10 out of 10",
        "10/10",
        "9/10",
    }
)

_MODERATE_WORDS = frozenset(
    {
        "moderate",
        "noticeable",
        "significant",
        "considerable",
        "persistent",
        "constant",
        "ongoing",
        "getting worse",
        "worsening",
        "increasing",
        "7/10",
        "8/10",
        "6/10",
    }
)

_MILD_WORDS = frozenset(
    {
        "mild",
        "slight",
        "minor",
        "little",
        "small",
        "tiny",
        "faint",
        "barely",
        "not too bad",
        "manageable",
        "1/10",
        "2/10",
        "3/10",
    }
)

# ─── Body Part Keywords ─────────────────────────────────────────────────────

_BODY_PARTS = frozenset(
    {
        "head",
        "chest",
        "stomach",
        "abdomen",
        "back",
        "neck",
        "throat",
        "arm",
        "leg",
        "knee",
        "ankle",
        "wrist",
        "shoulder",
        "hip",
        "eye",
        "ear",
        "nose",
        "mouth",
        "skin",
        "face",
        "foot",
        "feet",
        "hand",
        "finger",
        "toe",
        "elbow",
        "spine",
        "rib",
        "groin",
        "temple",
        "forehead",
        "jaw",
        "pelvis",
        "thigh",
        "calf",
        "shin",
    }
)

# ─── Negation Patterns ──────────────────────────────────────────────────────

_NEGATION_PATTERN = re.compile(
    r"(?:no|not|don'?t have|without|denies?|absence of|negative for)\s+"
    r"([\w\s]+?)(?:\.|,|$|but|and|however)",
    re.IGNORECASE,
)

# ─── Symptom Phrase Extraction ───────────────────────────────────────────────

_SYMPTOM_KEYWORDS: tuple[str, ...] = (
    "headache",
    "fever",
    "cough",
    "pain",
    "ache",
    "nausea",
    "vomiting",
    "diarrhea",
    "fatigue",
    "dizziness",
    "rash",
    "swelling",
    "bleeding",
    "numbness",
    "tingling",
    "shortness of breath",
    "difficulty breathing",
    "chest pain",
    "sore throat",
    "runny nose",
    "congestion",
    "chills",
    "sweating",
    "weakness",
    "blurred vision",
    "itching",
    "burning",
    "cramps",
    "bloating",
    "constipation",
    "heartburn",
    "wheezing",
    "sneezing",
    "insomnia",
    "anxiety",
    "depression",
    "palpitations",
    "weight loss",
    "weight gain",
    "loss of appetite",
    "hair loss",
    "joint pain",
    "muscle pain",
    "back pain",
    "neck pain",
    "stomach pain",
    "abdominal pain",
    "ear pain",
    "eye pain",
    "tooth pain",
    "frequent urination",
    "blood in urine",
    "blood in stool",
)


def parse_symptoms(message: str) -> ParsedSymptoms:
    """Extract structured symptom data from free-text user input.

    Args:
        message: Raw user message describing their symptoms.

    Returns:
        ParsedSymptoms with extracted symptoms, duration, severity, and body parts.
    """
    text = message.lower().strip()

    return ParsedSymptoms(
        symptoms=_extract_symptoms(text),
        duration_days=_extract_duration(text),
        severity_modifier=_detect_severity(text),
        body_parts=_extract_body_parts(text),
        negated_symptoms=_extract_negated(text),
    )


def _extract_symptoms(text: str) -> tuple[str, ...]:
    """Extract symptom phrases from the message."""
    found: list[str] = []
    for symptom in _SYMPTOM_KEYWORDS:
        if symptom in text:
            found.append(symptom)
    return tuple(dict.fromkeys(found))  # Deduplicate preserving order


def _extract_duration(text: str) -> float | None:
    """Parse duration from the message, returning estimated days."""
    for pattern, _, multiplier in _DURATION_PATTERNS:
        match = pattern.search(text)
        if match:
            groups = match.groups()
            if groups and groups[0]:
                return float(groups[0]) * multiplier
            return multiplier
    return None


def _detect_severity(text: str) -> str:
    """Detect severity modifier from the message."""
    if any(word in text for word in _SEVERE_WORDS):
        return "severe"
    if any(word in text for word in _MODERATE_WORDS):
        return "moderate"
    if any(word in text for word in _MILD_WORDS):
        return "mild"
    return "unknown"


def _extract_body_parts(text: str) -> tuple[str, ...]:
    """Extract mentioned body parts from the message."""
    words = set(text.split())
    return tuple(part for part in _BODY_PARTS if part in words)


def _extract_negated(text: str) -> tuple[str, ...]:
    """Extract symptoms the user denied having."""
    negated: list[str] = []
    for match in _NEGATION_PATTERN.finditer(text):
        negated.append(match.group(1).strip())
    return tuple(negated)


def adjust_triage_for_duration(
    base_severity: str,
    duration_days: float | None,
) -> str:
    """Adjust severity based on symptom duration.

    Longer durations generally indicate more concern:
    - < 2 days: no change
    - 2-7 days: bump mild → moderate
    - > 7 days: bump moderate → severe (persistent symptoms)

    Args:
        base_severity: Original severity from condition matching.
        duration_days: Parsed duration in days.

    Returns:
        Adjusted severity string.
    """
    if duration_days is None:
        return base_severity

    severity_order = ["mild", "moderate", "severe"]

    try:
        idx = severity_order.index(base_severity)
    except ValueError:
        return base_severity

    if duration_days > 7 and idx < 2:
        return severity_order[idx + 1]
    if duration_days >= 2 and idx < 1:
        return severity_order[idx + 1]

    return base_severity


def get_demographic_risk_factors(
    age: int | None = None,
    gender: str | None = None,
    known_conditions: str | None = None,
) -> list[str]:
    """Identify demographic risk factors that may affect triage severity.

    Args:
        age: Patient's age.
        gender: Patient's gender.
        known_conditions: Known medical conditions string.

    Returns:
        List of risk factor descriptions.
    """
    risks: list[str] = []

    if age is not None:
        if age < 5:
            risks.append("Pediatric patient — symptoms may progress faster")
        elif age >= 65:
            risks.append("Elderly patient — higher risk for complications")

    high_risk_conditions = [
        "diabetes",
        "hypertension",
        "heart disease",
        "asthma",
        "copd",
        "cancer",
        "hiv",
        "kidney disease",
        "liver disease",
        "immunocompromised",
        "pregnant",
        "pregnancy",
    ]

    if known_conditions:
        conditions_lower = known_conditions.lower()
        for condition in high_risk_conditions:
            if condition in conditions_lower:
                risks.append(f"Pre-existing condition: {condition}")

    return risks
