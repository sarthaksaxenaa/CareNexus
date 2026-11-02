"""Red-flag symptom detection: emergencies that need care now.

Messages are normalised (lower case, apostrophes removed, punctuation turned
into spaces) and then matched against phrase patterns, so "pain in my chest",
"my chest hurts" and "I can’t breathe" typed on a phone all count, not just
one exact wording. Negation is deliberately not handled: in triage a false
alarm is far safer than a missed emergency.
"""

import re

# Emergency symptoms that require IMMEDIATE medical attention
RED_FLAG_PATTERNS: list[dict] = [
    {
        "patterns": [
            r"\bchest (pains?|tightness|pressure|heaviness|hurts?|hurting|is hurting|feels? (tight|heavy|like))",
            r"\bpains? in (my |the |his |her )?chest",
            r"\b(pressure|tightness|heaviness|squeezing) (in|on|across) (my |the |his |her )?chest",
            r"\bcrushing (pain|chest|feeling)",
            r"\bheart attack",
            r"\b(spread\w*|radiat\w*|going|shoot\w*|moving) (down|to|into|up) (my |the |his |her )?(left arm|jaw)",
        ],
        "message": (
            "**EMERGENCY — Possible Cardiac Event**\n\n"
            "Chest pain or tightness can be a sign of a heart attack. "
            "**Please call emergency services (112/108) immediately or go to the nearest emergency room.**\n\n"
            "While waiting:\n"
            "- Sit down and rest\n"
            "- Chew an aspirin if available and not allergic\n"
            "- Loosen any tight clothing\n\n"
            "*This is an emergency triage recommendation. Call for help immediately.*"
        ),
    },
    {
        "patterns": [
            r"\b(cant|cannot|unable to|couldnt) breathe",
            r"\b(cant|cannot|couldnt) catch (my|his|her|their) breath",
            r"\b(difficulty|trouble|struggling|problems?|hard time) (breathing|to breathe)",
            r"\b(hard|difficult) to breathe",
            r"\bshort(ness)? of breath",
            r"\b(gasping|choking)",
            r"\blips? (are |is )?(turning |going )?blue",
            r"\bthroat (is )?(closing|swelling)",
            r"\btongue (is )?swelling",
        ],
        "message": (
            "**EMERGENCY — Breathing Difficulty**\n\n"
            "Severe difficulty breathing requires immediate medical attention. "
            "**Call emergency services (112/108) immediately.**\n\n"
            "While waiting:\n"
            "- Sit upright\n"
            "- Try to remain calm and breathe slowly\n"
            "- Loosen any tight clothing\n\n"
            "*This is an emergency triage recommendation. Call for help immediately.*"
        ),
    },
    {
        "patterns": [
            r"\bstroke\b",
            r"\bface (is )?droop",
            r"\bdroop\w* (face|mouth|eye)",
            r"\bone side of (my|his|her|their|the) face",
            r"\barm weakness",
            r"\b(weak|weakness|numb|numbness|paralysed|paralyzed) (in|on|down) one side",
            r"\bslurr\w*",
            r"\bsudden(ly)? (numb\w*|confus\w*|vision loss|loss of vision|weakness)",
            r"\bworst headache",
        ],
        "message": (
            "**EMERGENCY — Possible Stroke (FAST)**\n\n"
            "These symptoms may indicate a stroke. **Call emergency services (112/108) immediately.**\n\n"
            "Remember FAST:\n"
            "- **F**ace: Is one side drooping?\n"
            "- **A**rms: Can both arms be raised?\n"
            "- **S**peech: Is speech slurred?\n"
            "- **T**ime: Call emergency services NOW\n\n"
            "*Every minute counts. Call for help immediately.*"
        ),
    },
    {
        "patterns": [
            r"\bsuicid\w*",
            r"\bkill(ing)? (myself|my self)",
            r"\bwant to die",
            r"\bend (my life|it all)",
            r"\bself ?harm",
            r"\b(hurt|hurting|harm|harming) (myself|my self)",
            r"\bdont want to (live|be alive|be here anymore)",
            r"\bno reason to live",
            r"\bbetter off dead",
        ],
        "message": (
            "**You're Not Alone — Help is Available**\n\n"
            "I hear you, and I want you to know that help is available right now.\n\n"
            "**Please reach out immediately:**\n"
            "- 🇮🇳 iCall: **9152987821**\n"
            "- 🇮🇳 Vandrevala Foundation: **1860-2662-345**\n"
            "- 🇮🇳 AASRA: **9820466726**\n"
            "- Emergency: **112**\n\n"
            "You matter, and there are people who want to help. "
            "Please talk to someone — a friend, family member, or a professional.\n\n"
            "*I'm an AI and not equipped to provide crisis support. Please contact the helplines above.*"
        ),
    },
    {
        "patterns": [
            r"\bunconscious",
            r"\bnot responding",
            r"\bunresponsive",
            r"\bseizures?\b",
            r"\bconvuls\w*",
            r"\bpassed out",
            r"\bblack(ed|ing)? out",
            r"\bfaint(ed|ing)\b",
            r"\bcollapsed",
            r"\bwont wake up",
        ],
        "message": (
            "**EMERGENCY — Unconsciousness/Seizure**\n\n"
            "If someone is unconscious or having a seizure, "
            "**call emergency services (112/108) immediately.**\n\n"
            "While waiting:\n"
            "- Do NOT put anything in their mouth\n"
            "- Place them on their side (recovery position)\n"
            "- Clear the area of sharp objects\n"
            "- Time the seizure\n\n"
            "*This is an emergency triage recommendation. Call for help immediately.*"
        ),
    },
    {
        "patterns": [
            r"\b(severe|heavy|uncontrolled|a lot of) bleeding",
            r"\bbleeding (heavily|badly|a lot|profusely|nonstop|wont stop|that wont stop)",
            r"\bwont stop bleeding",
            r"\bblood everywhere",
            r"\b(coughing|cough|vomiting|throwing|spitting) (up )?blood",
        ],
        "message": (
            "**EMERGENCY — Severe Bleeding**\n\n"
            "Severe or uncontrolled bleeding requires immediate medical attention. "
            "**Call emergency services (112/108) immediately.**\n\n"
            "While waiting:\n"
            "- Apply firm, direct pressure with a clean cloth\n"
            "- Do NOT remove the cloth — add more on top if needed\n"
            "- Elevate the injured area above the heart if possible\n\n"
            "*This is an emergency triage recommendation. Call for help immediately.*"
        ),
    },
]


_APOSTROPHES = re.compile(r"['\u2018\u2019\u02bc`]")
_NON_WORD = re.compile(r"[^\w]+")

for _pattern in RED_FLAG_PATTERNS:
    _pattern["compiled"] = [re.compile(p) for p in _pattern["patterns"]]


def normalise(message: str) -> str:
    """Lower-case, drop apostrophes (can’t -> cant) and turn punctuation into spaces."""
    text = _APOSTROPHES.sub("", message.lower())
    return " ".join(_NON_WORD.sub(" ", text).split())


def check_red_flags(message: str) -> dict | None:
    """Return the emergency advice for the first matching category, else None."""
    text = normalise(message)
    if not text:
        return None
    for pattern in RED_FLAG_PATTERNS:
        if any(regex.search(text) for regex in pattern["compiled"]):
            return {"message": pattern["message"]}
    return None
