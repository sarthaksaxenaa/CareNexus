"""Emergency detection must survive the way people actually write.

The first version matched exact phrases, so "crushing pain in my chest,
spreading to my left arm" (a textbook heart attack, and the banner's own
example) was graded "see a doctor". Each case names the category it must
reach, because the advice differs (FAST for stroke, pressure for bleeding).
"""

import pytest

from app.core.triage.red_flags import check_red_flags

CARDIAC = "Cardiac"
BREATHING = "Breathing"
STROKE = "Stroke"
CRISIS = "Not Alone"
UNCONSCIOUS = "Unconsciousness"
BLEEDING = "Bleeding"


@pytest.mark.parametrize(
    ("message", "category"),
    [
        # Heart
        ("Crushing pain in my chest, spreading to my left arm", CARDIAC),
        ("my chest hurts really bad", CARDIAC),
        ("My chest feels tight and heavy", CARDIAC),
        ("there is pressure on my chest", CARDIAC),
        ("sharp pain in the chest when I breathe", CARDIAC),
        ("pain going down my left arm and into my jaw", CARDIAC),
        ("I think I'm having a heart attack", CARDIAC),
        # Breathing (curly apostrophes come from phone keyboards)
        ("I can’t breathe", BREATHING),
        ("i cant breathe properly", BREATHING),
        ("I can't catch my breath", BREATHING),
        ("having trouble breathing since an hour", BREATHING),
        ("struggling to breathe", BREATHING),
        ("my lips are turning blue", BREATHING),
        ("my throat is closing up after eating peanuts", BREATHING),
        # Stroke
        ("one side of my face is drooping", STROKE),
        ("my dad is slurring his words", STROKE),
        ("sudden weakness on one side of my body", STROKE),
        ("worst headache of my life, came on suddenly", STROKE),
        # Crisis
        ("I don't want to live anymore", CRISIS),
        ("I keep thinking about killing myself", CRISIS),
        ("i feel suicidal", CRISIS),
        ("I want to hurt myself", CRISIS),
        # Unconscious / seizure
        ("my friend fainted and won't wake up", UNCONSCIOUS),
        ("I blacked out twice today", UNCONSCIOUS),
        ("he is unresponsive", UNCONSCIOUS),
        ("she is having convulsions", UNCONSCIOUS),
        # Bleeding
        ("the cut is bleeding heavily", BLEEDING),
        ("it won’t stop bleeding", BLEEDING),
        ("I am coughing up blood", BLEEDING),
        ("vomiting blood since morning", BLEEDING),
    ],
)
def test_everyday_phrasings_reach_the_right_emergency(message, category):
    result = check_red_flags(message)
    assert result is not None, f"missed emergency: {message!r}"
    assert category in result["message"], f"{message!r} -> {result['message'][:40]!r}"


@pytest.mark.parametrize(
    "message",
    [
        "I have a mild headache",
        "sore throat and a runny nose",
        "my arm is itchy after a mosquito bite",
        "I cut my finger and it bled a little",
        "I feel a bit tired today",
        "my heart rate goes up when I run",
        "stomach ache after eating out",
        "back pain from sitting all day",
        "how do I breathe better while running?",
    ],
)
def test_everyday_complaints_are_not_emergencies(message):
    assert check_red_flags(message) is None, message
