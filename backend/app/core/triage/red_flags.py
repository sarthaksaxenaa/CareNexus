"""Red-flag symptom detection — identifies emergency conditions requiring immediate care."""

# Emergency symptoms that require IMMEDIATE medical attention
RED_FLAG_PATTERNS: list[dict] = [
    {
        "keywords": ["chest pain", "chest tightness", "pressure in chest"],
        "message": (
            "🚨 **EMERGENCY — Possible Cardiac Event**\n\n"
            "Chest pain or tightness can be a sign of a heart attack. "
            "**Please call emergency services (112/108) immediately or go to the nearest emergency room.**\n\n"
            "While waiting:\n"
            "- Sit down and rest\n"
            "- Chew an aspirin if available and not allergic\n"
            "- Loosen any tight clothing\n\n"
            "⚕️ *This is an emergency triage recommendation. Call for help immediately.*"
        ),
    },
    {
        "keywords": [
            "can't breathe",
            "cannot breathe",
            "difficulty breathing",
            "shortness of breath",
            "choking",
        ],
        "message": (
            "🚨 **EMERGENCY — Breathing Difficulty**\n\n"
            "Severe difficulty breathing requires immediate medical attention. "
            "**Call emergency services (112/108) immediately.**\n\n"
            "While waiting:\n"
            "- Sit upright\n"
            "- Try to remain calm and breathe slowly\n"
            "- Loosen any tight clothing\n\n"
            "⚕️ *This is an emergency triage recommendation. Call for help immediately.*"
        ),
    },
    {
        "keywords": [
            "stroke",
            "face drooping",
            "arm weakness",
            "slurred speech",
            "sudden numbness",
        ],
        "message": (
            "🚨 **EMERGENCY — Possible Stroke (FAST)**\n\n"
            "These symptoms may indicate a stroke. **Call emergency services (112/108) immediately.**\n\n"
            "Remember FAST:\n"
            "- **F**ace: Is one side drooping?\n"
            "- **A**rms: Can both arms be raised?\n"
            "- **S**peech: Is speech slurred?\n"
            "- **T**ime: Call emergency services NOW\n\n"
            "⚕️ *Every minute counts. Call for help immediately.*"
        ),
    },
    {
        "keywords": [
            "suicide",
            "kill myself",
            "want to die",
            "end my life",
            "self harm",
            "self-harm",
        ],
        "message": (
            "🤝 **You're Not Alone — Help is Available**\n\n"
            "I hear you, and I want you to know that help is available right now.\n\n"
            "**Please reach out immediately:**\n"
            "- 🇮🇳 iCall: **9152987821**\n"
            "- 🇮🇳 Vandrevala Foundation: **1860-2662-345**\n"
            "- 🇮🇳 AASRA: **9820466726**\n"
            "- 🌍 Emergency: **112**\n\n"
            "You matter, and there are people who want to help. "
            "Please talk to someone — a friend, family member, or a professional.\n\n"
            "⚕️ *I'm an AI and not equipped to provide crisis support. Please contact the helplines above.*"
        ),
    },
    {
        "keywords": [
            "unconscious",
            "not responding",
            "seizure",
            "convulsion",
            "passed out",
            "collapsed",
        ],
        "message": (
            "🚨 **EMERGENCY — Unconsciousness/Seizure**\n\n"
            "If someone is unconscious or having a seizure, "
            "**call emergency services (112/108) immediately.**\n\n"
            "While waiting:\n"
            "- Do NOT put anything in their mouth\n"
            "- Place them on their side (recovery position)\n"
            "- Clear the area of sharp objects\n"
            "- Time the seizure\n\n"
            "⚕️ *This is an emergency triage recommendation. Call for help immediately.*"
        ),
    },
    {
        "keywords": [
            "severe bleeding",
            "heavy bleeding",
            "won't stop bleeding",
            "blood everywhere",
        ],
        "message": (
            "🚨 **EMERGENCY — Severe Bleeding**\n\n"
            "Severe or uncontrolled bleeding requires immediate medical attention. "
            "**Call emergency services (112/108) immediately.**\n\n"
            "While waiting:\n"
            "- Apply firm, direct pressure with a clean cloth\n"
            "- Do NOT remove the cloth — add more on top if needed\n"
            "- Elevate the injured area above the heart if possible\n\n"
            "⚕️ *This is an emergency triage recommendation. Call for help immediately.*"
        ),
    },
]


def check_red_flags(message: str) -> dict | None:
    """Check if the user's message contains red-flag emergency symptoms.

    Returns a dict with 'message' if a red flag is detected, None otherwise.
    """
    message_lower = message.lower()

    for pattern in RED_FLAG_PATTERNS:
        for keyword in pattern["keywords"]:
            if keyword in message_lower:
                return {"message": pattern["message"]}

    return None
