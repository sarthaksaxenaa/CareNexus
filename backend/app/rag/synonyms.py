"""Medical synonym expansion for improved symptom matching.

Maps common colloquial terms to medical terminology, enabling the
vectorizer to match user-friendly descriptions like "tummy ache"
to clinical terms like "abdominal pain".

Architecture:
    - Bidirectional: each term expands to all its synonyms during tokenization.
    - Lightweight: pure dict lookup, zero dependencies.
    - Used by MedicalVectorizer._tokenize() to augment query tokens.
"""

# ─── Symptom Synonym Groups ─────────────────────────────────────────────────
# Each tuple is a group of equivalent terms. When ANY term in a group appears
# in user input, ALL terms in the group are added to the token set.

SYNONYM_GROUPS: tuple[tuple[str, ...], ...] = (
    # Pain descriptions
    ("headache", "head pain", "head ache", "cephalalgia"),
    (
        "stomachache",
        "stomach ache",
        "tummy ache",
        "abdominal pain",
        "belly pain",
        "stomach pain",
    ),
    ("backache", "back pain", "back ache", "lumbar pain"),
    ("chest pain", "chest tightness", "chest pressure", "chest discomfort"),
    ("sore throat", "throat pain", "throat hurts", "pharyngitis"),
    ("earache", "ear pain", "ear ache", "otalgia"),
    ("toothache", "tooth pain", "tooth ache", "dental pain"),
    ("muscle pain", "myalgia", "body aches", "muscle ache"),
    ("joint pain", "arthralgia", "joint ache", "joint stiffness"),
    # Respiratory
    ("cough", "coughing", "hacking cough"),
    (
        "shortness of breath",
        "breathlessness",
        "dyspnea",
        "cant breathe",
        "difficulty breathing",
    ),
    ("runny nose", "nasal discharge", "rhinorrhea", "nose running"),
    ("stuffy nose", "nasal congestion", "blocked nose", "congestion"),
    ("wheezing", "wheeze", "whistling breathing"),
    ("sneezing", "sneeze", "sneezing fits"),
    ("phlegm", "sputum", "mucus", "catarrh"),
    # Gastrointestinal
    ("nausea", "feeling sick", "nauseous", "queasy"),
    ("vomiting", "throwing up", "puking", "emesis"),
    ("diarrhea", "diarrhoea", "loose stools", "watery stool", "runny stomach"),
    ("constipation", "constipated", "hard stool", "cant poop"),
    ("heartburn", "acid reflux", "acidity", "burning chest after eating"),
    ("bloating", "bloated", "abdominal bloating", "gassy", "gas"),
    ("stomach cramps", "abdominal cramps", "belly cramps"),
    ("indigestion", "dyspepsia", "upset stomach"),
    # Neurological
    ("dizziness", "dizzy", "lightheaded", "light headed", "vertigo", "room spinning"),
    ("fainting", "syncope", "passing out", "blacking out"),
    ("numbness", "tingling", "pins and needles", "paresthesia"),
    ("seizure", "convulsion", "fit", "epileptic fit"),
    ("confusion", "disorientation", "mental confusion", "brain fog"),
    ("insomnia", "cant sleep", "difficulty sleeping", "sleeplessness"),
    # Skin
    ("rash", "skin rash", "skin eruption", "dermatitis"),
    ("itching", "itchy", "pruritus", "scratching"),
    ("hives", "urticaria", "welts"),
    ("swelling", "edema", "oedema", "puffiness"),
    ("bruise", "bruising", "contusion", "black and blue"),
    ("pimples", "acne", "zits", "breakout", "spots"),
    # General / Systemic
    ("fever", "temperature", "pyrexia", "high temperature", "febrile"),
    ("chills", "shivering", "rigors"),
    (
        "fatigue",
        "tiredness",
        "exhaustion",
        "feeling tired",
        "lethargy",
        "lack of energy",
    ),
    ("weakness", "feeling weak", "asthenia"),
    ("weight loss", "losing weight", "unexplained weight loss"),
    ("weight gain", "gaining weight", "putting on weight"),
    ("dehydration", "dehydrated", "dry mouth", "extreme thirst"),
    ("sweating", "night sweats", "diaphoresis", "excessive sweating"),
    ("loss of appetite", "no appetite", "not hungry", "anorexia"),
    ("swollen lymph nodes", "swollen glands", "lymphadenopathy"),
    # Mental health
    ("anxiety", "anxious", "worried", "nervousness", "nervous"),
    ("depression", "depressed", "feeling hopeless", "feeling down", "sadness"),
    ("stress", "stressed", "overwhelmed", "burnout"),
    ("panic attack", "panic", "anxiety attack"),
    ("mood swings", "irritability", "mood changes"),
    ("crying", "tearful", "emotional"),
    # Eyes
    ("blurred vision", "blurry vision", "vision problems", "cant see clearly"),
    ("red eye", "pink eye", "eye redness", "bloodshot eyes"),
    ("watery eyes", "tearing", "lacrimation"),
    # Urinary
    ("burning urination", "painful urination", "dysuria", "burning pee"),
    ("frequent urination", "urinary frequency", "peeing a lot"),
    ("blood in urine", "hematuria", "bloody urine"),
    # Cardiovascular
    (
        "palpitations",
        "heart racing",
        "heart pounding",
        "heart fluttering",
        "rapid heartbeat",
    ),
    ("high blood pressure", "hypertension", "elevated bp"),
    ("low blood pressure", "hypotension"),
    # ENT
    ("hearing loss", "cant hear", "hard of hearing", "deafness"),
    ("tinnitus", "ringing in ears", "ear ringing"),
    ("hoarse voice", "hoarseness", "voice loss", "laryngitis"),
)


# ─── Precomputed Lookup Table ────────────────────────────────────────────────
# Maps each individual token/phrase to its full synonym set for O(1) expansion.

_SYNONYM_MAP: dict[str, frozenset[str]] = {}

for _group in SYNONYM_GROUPS:
    _frozen = frozenset(_group)
    for _term in _group:
        _SYNONYM_MAP[_term] = _frozen


def expand_synonyms(tokens: list[str], original_text: str) -> list[str]:
    """Expand tokens with medical synonyms found in the original text.

    Checks both individual tokens AND multi-word phrases from the original
    text against the synonym map. Returns the original tokens plus any
    matched synonym expansions.

    Args:
        tokens: Pre-tokenized single-word tokens from the query.
        original_text: Original lowercased user input for phrase matching.

    Returns:
        Expanded token list with synonym additions.
    """
    expanded: set[str] = set(tokens)

    # Check multi-word phrases in the original text
    for phrase, synonyms in _SYNONYM_MAP.items():
        if " " in phrase and phrase in original_text:
            for syn in synonyms:
                expanded.update(syn.split())

    # Check single-word tokens
    for token in tokens:
        if token in _SYNONYM_MAP:
            for syn in _SYNONYM_MAP[token]:
                expanded.update(syn.split())

    return list(expanded)
