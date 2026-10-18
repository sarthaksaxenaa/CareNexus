"""Curated medical knowledge base for CareNexus RAG pipeline.

This module provides a structured, evidence-based medical knowledge repository
covering common conditions, symptoms, severity indicators, and triage guidance.
Each entry follows a standardized schema optimized for retrieval and LLM context
augmentation.

Data Sources:
    - WHO ICD-11 classification guidelines
    - NHS Symptom Checker evidence base
    - Mayo Clinic patient education materials
    - CDC clinical guidance documents

Note:
    This knowledge base is for triage guidance ONLY — not for diagnosis.
    All entries include disclaimers directing users to seek professional care.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class MedicalCondition:
    """Structured representation of a medical condition for RAG retrieval.

    Attributes:
        id: Unique condition identifier (e.g., 'respiratory-common-cold').
        name: Human-readable condition name.
        category: Medical category (e.g., 'respiratory', 'cardiovascular').
        aliases: Alternative names and common misspellings.
        symptoms: List of associated symptoms.
        severity: Baseline severity ('mild', 'moderate', 'severe').
        red_flags: Symptoms that escalate triage to emergency.
        when_to_seek_help: Guidance on when professional care is needed.
        first_aid: Immediate self-care steps.
        description: Brief clinical description for LLM context.
    """

    id: str
    name: str
    category: str
    aliases: tuple[str, ...] = ()
    symptoms: tuple[str, ...] = ()
    severity: str = "mild"
    red_flags: tuple[str, ...] = ()
    when_to_seek_help: str = ""
    first_aid: str = ""
    description: str = ""
    icd_code: str = ""


# ═══════════════════════════════════════════════════════════════════════════════
# RESPIRATORY CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

RESPIRATORY_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="resp-common-cold",
        name="Common Cold",
        category="respiratory",
        aliases=("cold", "runny nose", "nasal congestion", "sniffles", "head cold"),
        symptoms=(
            "runny nose", "sneezing", "nasal congestion", "sore throat",
            "mild cough", "low-grade fever", "watery eyes", "mild body aches",
        ),
        severity="mild",
        red_flags=("difficulty breathing", "high fever above 103°F", "symptoms lasting over 10 days"),
        when_to_seek_help=(
            "See a doctor if symptoms persist beyond 10 days, fever exceeds 103°F (39.4°C), "
            "you experience shortness of breath, or symptoms significantly worsen after initial improvement."
        ),
        first_aid=(
            "Rest and stay hydrated. Use saline nasal spray for congestion. "
            "Over-the-counter pain relievers (acetaminophen/ibuprofen) for discomfort. "
            "Honey and warm liquids can soothe sore throat (not for children under 1)."
        ),
        description="Viral upper respiratory infection, typically self-limiting within 7-10 days.",
        icd_code="J00",
    ),
    MedicalCondition(
        id="resp-influenza",
        name="Influenza (Flu)",
        category="respiratory",
        aliases=("flu", "seasonal flu", "influenza", "grippe"),
        symptoms=(
            "high fever", "severe body aches", "chills", "fatigue",
            "headache", "dry cough", "sore throat", "runny nose",
            "muscle pain", "weakness",
        ),
        severity="moderate",
        red_flags=(
            "difficulty breathing", "chest pain", "persistent vomiting",
            "sudden dizziness", "confusion", "severe dehydration",
        ),
        when_to_seek_help=(
            "Seek immediate care if you experience difficulty breathing, persistent chest pain, "
            "confusion, or severe dehydration. High-risk groups (elderly, pregnant, "
            "immunocompromised) should consult a doctor within 48 hours of symptom onset "
            "for antiviral treatment."
        ),
        first_aid=(
            "Rest in bed. Stay hydrated with water, broths, and electrolyte drinks. "
            "Use acetaminophen or ibuprofen for fever and pain. "
            "Isolate to prevent spreading. Monitor temperature regularly."
        ),
        description=(
            "Acute viral respiratory illness caused by influenza viruses. "
            "More severe than common cold with systemic symptoms."
        ),
        icd_code="J11",
    ),
    MedicalCondition(
        id="resp-asthma-attack",
        name="Asthma Attack",
        category="respiratory",
        aliases=("asthma", "wheezing", "breathing difficulty", "bronchospasm", "asthma flare"),
        symptoms=(
            "wheezing", "shortness of breath", "chest tightness",
            "persistent cough", "difficulty speaking in full sentences",
            "rapid breathing",
        ),
        severity="moderate",
        red_flags=(
            "lips or fingernails turning blue", "inability to speak",
            "no improvement after rescue inhaler", "severe chest retractions",
        ),
        when_to_seek_help=(
            "Call emergency services (911) if rescue inhaler provides no relief after 15 minutes, "
            "you cannot speak in full sentences, lips/nails turn blue, or you feel you cannot breathe."
        ),
        first_aid=(
            "Sit upright (do NOT lie down). Use rescue inhaler (2 puffs, wait 1 minute, repeat if needed). "
            "Stay calm and breathe slowly. Remove triggers if identifiable. "
            "If no inhaler available, call emergency services immediately."
        ),
        description="Acute narrowing of airways causing breathing difficulty. Requires prompt treatment.",
        icd_code="J45",
    ),
    MedicalCondition(
        id="resp-bronchitis",
        name="Acute Bronchitis",
        category="respiratory",
        aliases=("bronchitis", "chest cold", "bronchial infection"),
        symptoms=(
            "persistent cough", "mucus production", "chest discomfort",
            "fatigue", "mild fever", "sore throat", "body aches",
        ),
        severity="moderate",
        red_flags=(
            "coughing up blood", "fever above 100.4°F for more than 3 days",
            "significant breathing difficulty", "symptoms lasting over 3 weeks",
        ),
        when_to_seek_help=(
            "See a doctor if cough persists beyond 3 weeks, you cough up blood, "
            "have a high fever, or develop significant breathing difficulty."
        ),
        first_aid=(
            "Rest and increase fluid intake. Use a humidifier to ease breathing. "
            "Over-the-counter cough suppressants for nighttime relief. "
            "Avoid irritants like smoke and strong fumes."
        ),
        description="Inflammation of the bronchial tubes, usually viral. Cough may persist 2-3 weeks.",
        icd_code="J20",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# CARDIOVASCULAR CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

CARDIOVASCULAR_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="cardio-chest-pain",
        name="Chest Pain (Non-Cardiac)",
        category="cardiovascular",
        aliases=("chest pain", "chest tightness", "chest pressure", "chest discomfort"),
        symptoms=(
            "sharp chest pain", "pain worsening with movement", "tenderness to touch",
            "pain related to eating", "anxiety-related chest tightness",
        ),
        severity="moderate",
        red_flags=(
            "crushing chest pain", "pain radiating to arm or jaw",
            "shortness of breath with chest pain", "cold sweats",
            "nausea with chest pain", "sudden onset of severe pain",
        ),
        when_to_seek_help=(
            "CALL 911 IMMEDIATELY if chest pain is crushing, radiates to arm/jaw/back, "
            "is accompanied by shortness of breath, cold sweats, or nausea. "
            "These may indicate a heart attack."
        ),
        first_aid=(
            "If suspected heart attack: Call 911, chew an aspirin (325mg) if not allergic, "
            "sit or lie in a comfortable position. Do NOT drive yourself. "
            "For non-cardiac: rest, antacids if related to digestion."
        ),
        description=(
            "Chest pain has many causes. Cardiac causes require emergency evaluation. "
            "Musculoskeletal, GI, and anxiety-related chest pain are common non-cardiac causes."
        ),
        icd_code="R07",
    ),
    MedicalCondition(
        id="cardio-hypertension",
        name="High Blood Pressure",
        category="cardiovascular",
        aliases=("hypertension", "high bp", "elevated blood pressure", "high blood pressure"),
        symptoms=(
            "often asymptomatic", "headache", "dizziness",
            "blurred vision", "nosebleeds", "fatigue",
        ),
        severity="moderate",
        red_flags=(
            "severe headache with vision changes", "chest pain",
            "blood pressure above 180/120", "confusion",
            "difficulty breathing", "blood in urine",
        ),
        when_to_seek_help=(
            "Seek emergency care if BP exceeds 180/120 mmHg (hypertensive crisis). "
            "See a doctor for consistent readings above 140/90 mmHg. "
            "Regular monitoring is essential — hypertension is a silent killer."
        ),
        first_aid=(
            "For hypertensive crisis: call 911 immediately. "
            "For elevated BP: sit quietly, practice deep breathing, "
            "take prescribed medications. Avoid caffeine and salt. "
            "Do NOT stop BP medications without doctor consultation."
        ),
        description="Persistently elevated arterial blood pressure. Major risk factor for stroke and heart disease.",
        icd_code="I10",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# GASTROINTESTINAL CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

GASTROINTESTINAL_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="gi-gastroenteritis",
        name="Gastroenteritis (Stomach Flu)",
        category="gastrointestinal",
        aliases=("stomach flu", "stomach bug", "food poisoning", "gastro", "vomiting and diarrhea"),
        symptoms=(
            "nausea", "vomiting", "diarrhea", "abdominal cramps",
            "low-grade fever", "loss of appetite", "dehydration",
        ),
        severity="moderate",
        red_flags=(
            "bloody stool", "severe dehydration", "inability to keep fluids down for 24 hours",
            "high fever above 104°F", "severe abdominal pain",
        ),
        when_to_seek_help=(
            "See a doctor if you cannot keep fluids down for 24 hours, "
            "notice blood in stool or vomit, have a high fever, "
            "or show signs of severe dehydration (dark urine, dizziness, dry mouth)."
        ),
        first_aid=(
            "Stay hydrated with small, frequent sips of water or oral rehydration solution (ORS). "
            "Follow the BRAT diet (bananas, rice, applesauce, toast) as tolerated. "
            "Avoid dairy, caffeine, and fatty foods. Rest."
        ),
        description="Inflammation of the stomach and intestines, usually viral. Self-limiting in 1-3 days.",
        icd_code="K52",
    ),
    MedicalCondition(
        id="gi-acid-reflux",
        name="Acid Reflux / GERD",
        category="gastrointestinal",
        aliases=("acid reflux", "heartburn", "gerd", "acidity", "indigestion"),
        symptoms=(
            "burning sensation in chest", "regurgitation of food or sour liquid",
            "difficulty swallowing", "sensation of lump in throat",
            "chronic cough", "worsening symptoms after meals or lying down",
        ),
        severity="mild",
        red_flags=(
            "difficulty swallowing that worsens", "unintentional weight loss",
            "vomiting blood", "black tarry stools", "severe chest pain",
        ),
        when_to_seek_help=(
            "See a doctor if symptoms occur more than twice a week, "
            "OTC medications don't help, you have difficulty swallowing, "
            "or you experience unexplained weight loss."
        ),
        first_aid=(
            "Avoid trigger foods (spicy, fatty, acidic). Don't lie down within 3 hours of eating. "
            "Elevate the head of your bed. OTC antacids for immediate relief. "
            "Eat smaller, more frequent meals."
        ),
        description="Chronic condition where stomach acid flows back into the esophagus.",
        icd_code="K21",
    ),
    MedicalCondition(
        id="gi-appendicitis",
        name="Appendicitis",
        category="gastrointestinal",
        aliases=("appendix pain", "appendicitis", "right side pain", "lower right abdominal pain"),
        symptoms=(
            "pain starting around navel then moving to lower right abdomen",
            "pain worsening over hours", "nausea", "vomiting",
            "loss of appetite", "low-grade fever", "abdominal tenderness",
        ),
        severity="severe",
        red_flags=(
            "sudden worsening of pain", "pain spreading across abdomen",
            "high fever", "inability to pass gas",
        ),
        when_to_seek_help=(
            "Seek EMERGENCY medical attention immediately. Appendicitis requires surgical evaluation. "
            "A ruptured appendix is life-threatening. Do NOT wait."
        ),
        first_aid=(
            "Do NOT eat, drink, or take pain medications (they can mask symptoms). "
            "Do NOT apply heat to the abdomen. "
            "Go to the emergency room or call 911 immediately."
        ),
        description="Inflammation of the appendix requiring emergency surgical evaluation.",
        icd_code="K35",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# NEUROLOGICAL CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

NEUROLOGICAL_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="neuro-migraine",
        name="Migraine",
        category="neurological",
        aliases=("migraine", "severe headache", "one-sided headache", "throbbing headache"),
        symptoms=(
            "throbbing or pulsating headache", "usually one-sided",
            "nausea", "vomiting", "sensitivity to light and sound",
            "visual disturbances (aura)", "lasting 4-72 hours",
        ),
        severity="moderate",
        red_flags=(
            "worst headache of your life", "sudden thunderclap headache",
            "headache with fever and stiff neck", "headache after head injury",
            "headache with confusion or seizures", "new headache over age 50",
        ),
        when_to_seek_help=(
            "Seek emergency care for sudden, severe 'thunderclap' headache, "
            "headache with fever/stiff neck (possible meningitis), "
            "headache after head trauma, or headache with neurological symptoms."
        ),
        first_aid=(
            "Rest in a dark, quiet room. Apply cold compress to forehead. "
            "Take prescribed migraine medication at onset. Stay hydrated. "
            "OTC pain relievers (ibuprofen, acetaminophen) for mild migraines."
        ),
        description="Recurrent neurological condition with moderate-to-severe headaches and associated symptoms.",
        icd_code="G43",
    ),
    MedicalCondition(
        id="neuro-tension-headache",
        name="Tension Headache",
        category="neurological",
        aliases=("tension headache", "stress headache", "headache", "head pain", "head pressure"),
        symptoms=(
            "dull aching head pain", "sensation of tightness across forehead",
            "tenderness in scalp, neck, and shoulder muscles",
            "pressure on both sides of head",
        ),
        severity="mild",
        red_flags=(
            "headaches increasing in frequency and severity",
            "headache that wakes you from sleep",
            "headache with vision changes",
        ),
        when_to_seek_help=(
            "See a doctor if headaches occur 15+ days per month, "
            "OTC medications are not effective, or headaches interfere with daily activities."
        ),
        first_aid=(
            "OTC pain relievers (acetaminophen, ibuprofen, aspirin). "
            "Apply warm or cold compress to head/neck. "
            "Practice relaxation techniques. Maintain good posture. "
            "Manage stress and ensure adequate sleep."
        ),
        description="Most common type of headache, usually related to muscle tension and stress.",
        icd_code="G44.2",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# MUSCULOSKELETAL CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

MUSCULOSKELETAL_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="msk-back-pain",
        name="Lower Back Pain",
        category="musculoskeletal",
        aliases=("back pain", "lower back pain", "backache", "lumbar pain", "back ache"),
        symptoms=(
            "aching or stiffness in lower back", "sharp localized pain",
            "pain worsening with movement", "difficulty standing straight",
            "muscle spasms", "limited range of motion",
        ),
        severity="mild",
        red_flags=(
            "pain radiating down legs", "numbness or tingling in legs",
            "loss of bladder or bowel control", "pain after major trauma",
            "unexplained weight loss with back pain",
        ),
        when_to_seek_help=(
            "Seek immediate care if you experience loss of bladder/bowel control, "
            "progressive leg weakness, or pain after significant trauma. "
            "See a doctor if pain persists beyond 6 weeks."
        ),
        first_aid=(
            "Stay active (bed rest worsens outcomes). Apply ice for first 48 hours, "
            "then switch to heat. OTC anti-inflammatory medications. "
            "Gentle stretching and walking. Maintain good posture."
        ),
        description="Extremely common condition, usually muscular. Most cases resolve within 4-6 weeks.",
        icd_code="M54.5",
    ),
    MedicalCondition(
        id="msk-sprain",
        name="Sprain / Strain",
        category="musculoskeletal",
        aliases=("sprain", "strain", "twisted ankle", "pulled muscle", "muscle strain", "ligament injury"),
        symptoms=(
            "pain at the injury site", "swelling", "bruising",
            "limited movement", "popping sensation at time of injury",
            "tenderness",
        ),
        severity="mild",
        red_flags=(
            "inability to bear weight", "significant deformity",
            "numbness below injury", "severe swelling within minutes",
        ),
        when_to_seek_help=(
            "See a doctor if you cannot bear weight, the joint feels unstable, "
            "there is significant swelling, or you heard a popping sound "
            "and the area is very painful."
        ),
        first_aid=(
            "Follow RICE protocol: Rest, Ice (20 min on/20 min off), "
            "Compression (elastic bandage), Elevation (above heart level). "
            "OTC pain relievers. Avoid heat, alcohol, and massage for 72 hours."
        ),
        description="Injury to ligaments (sprain) or muscles/tendons (strain) from overstretching.",
        icd_code="T14.3",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# DERMATOLOGICAL CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

DERMATOLOGICAL_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="derm-allergic-reaction",
        name="Allergic Reaction",
        category="dermatological",
        aliases=("allergy", "allergic reaction", "hives", "rash", "itching", "urticaria"),
        symptoms=(
            "itchy skin", "hives (raised red welts)", "rash",
            "swelling", "watery eyes", "sneezing",
            "runny nose",
        ),
        severity="mild",
        red_flags=(
            "swelling of face, lips, or throat", "difficulty breathing",
            "dizziness or fainting", "rapid heartbeat",
            "severe abdominal pain", "anaphylaxis symptoms",
        ),
        when_to_seek_help=(
            "CALL 911 for anaphylaxis: swelling of throat/tongue, difficulty breathing, "
            "dizziness, rapid pulse. Use EpiPen if available. "
            "See a doctor for persistent or recurring allergic reactions."
        ),
        first_aid=(
            "For mild reactions: OTC antihistamine (cetirizine, loratadine). "
            "Remove the allergen if identified. Cool compress for itching. "
            "For anaphylaxis: use EpiPen, call 911, lie flat with legs elevated."
        ),
        description="Immune system overreaction to a substance. Ranges from mild to life-threatening.",
        icd_code="T78.4",
    ),
    MedicalCondition(
        id="derm-skin-infection",
        name="Skin Infection",
        category="dermatological",
        aliases=("skin infection", "infected wound", "cellulitis", "abscess", "boil"),
        symptoms=(
            "redness spreading around wound", "warmth at site",
            "swelling", "pain or tenderness", "pus or drainage",
            "fever", "red streaks extending from wound",
        ),
        severity="moderate",
        red_flags=(
            "red streaks spreading from wound", "high fever",
            "rapid spreading of redness", "black or necrotic tissue",
        ),
        when_to_seek_help=(
            "See a doctor promptly if redness is spreading, "
            "red streaks appear, you develop fever, "
            "or the infected area is near eyes or on the face."
        ),
        first_aid=(
            "Keep the area clean and dry. Apply antibiotic ointment. "
            "Cover with a sterile bandage. Do NOT squeeze abscesses. "
            "Warm compresses can help drain boils naturally."
        ),
        description="Bacterial infection of the skin requiring monitoring and potentially antibiotics.",
        icd_code="L08",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# MENTAL HEALTH CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

MENTAL_HEALTH_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="mh-anxiety",
        name="Anxiety",
        category="mental_health",
        aliases=("anxiety", "anxious", "panic attack", "worried", "nervous", "anxiety attack"),
        symptoms=(
            "excessive worry", "restlessness", "rapid heartbeat",
            "sweating", "trembling", "difficulty concentrating",
            "sleep disturbance", "muscle tension", "irritability",
        ),
        severity="moderate",
        red_flags=(
            "thoughts of self-harm", "panic attacks becoming more frequent",
            "inability to perform daily activities", "substance use to cope",
        ),
        when_to_seek_help=(
            "See a mental health professional if anxiety interferes with daily life, "
            "relationships, or work. Seek immediate help if you have thoughts of "
            "self-harm or suicide."
        ),
        first_aid=(
            "Practice the 5-4-3-2-1 grounding technique: identify 5 things you see, "
            "4 you can touch, 3 you hear, 2 you smell, 1 you taste. "
            "Deep breathing: inhale 4 seconds, hold 4, exhale 6. "
            "Remind yourself: this feeling is temporary and will pass."
        ),
        description="Common mental health condition characterized by persistent, excessive worry.",
        icd_code="F41",
    ),
    MedicalCondition(
        id="mh-depression",
        name="Depression",
        category="mental_health",
        aliases=("depression", "depressed", "feeling hopeless", "sadness", "no motivation"),
        symptoms=(
            "persistent sadness", "loss of interest in activities",
            "changes in appetite or weight", "sleep disturbances",
            "fatigue", "difficulty concentrating", "feelings of worthlessness",
            "withdrawal from social activities",
        ),
        severity="moderate",
        red_flags=(
            "thoughts of death or suicide", "self-harm",
            "giving away possessions", "saying goodbye to people",
            "feeling like a burden to others",
        ),
        when_to_seek_help=(
            "If you or someone you know is in crisis, contact the 988 Suicide & Crisis Lifeline "
            "(call or text 988). Seek professional help if symptoms persist for more than 2 weeks."
        ),
        first_aid=(
            "You are not alone, and your feelings are valid. "
            "Reach out to someone you trust. Maintain a routine — even small steps matter. "
            "Physical activity, even a short walk, can help. "
            "Crisis resources: 988 Suicide & Crisis Lifeline, Crisis Text Line (text HOME to 741741)."
        ),
        description="Clinical mood disorder requiring professional evaluation and treatment.",
        icd_code="F32",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# FEVER & GENERAL CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

GENERAL_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="gen-fever",
        name="Fever",
        category="general",
        aliases=("fever", "high temperature", "pyrexia", "feeling hot", "chills and fever"),
        symptoms=(
            "elevated body temperature above 100.4°F (38°C)", "chills",
            "sweating", "headache", "body aches", "fatigue",
            "loss of appetite", "dehydration",
        ),
        severity="mild",
        red_flags=(
            "temperature above 104°F (40°C)", "fever lasting more than 3 days",
            "fever with rash", "fever with stiff neck",
            "fever in infants under 3 months", "seizures with fever",
        ),
        when_to_seek_help=(
            "Seek immediate care for fever above 104°F, fever with stiff neck or rash, "
            "fever in infants under 3 months, or febrile seizures. "
            "See a doctor if fever persists beyond 3 days."
        ),
        first_aid=(
            "Stay hydrated. Rest. Use acetaminophen or ibuprofen as directed. "
            "Light clothing and cool compresses. "
            "Do NOT use aspirin for children under 18 (risk of Reye's syndrome). "
            "Monitor temperature regularly."
        ),
        description="Body's natural defense mechanism against infection. Usually indicates an underlying condition.",
        icd_code="R50",
    ),
    MedicalCondition(
        id="gen-dehydration",
        name="Dehydration",
        category="general",
        aliases=("dehydration", "dehydrated", "not drinking enough water", "dry mouth", "thirsty"),
        symptoms=(
            "thirst", "dark yellow urine", "dry mouth and lips",
            "fatigue", "dizziness", "decreased urine output",
            "headache", "dry skin",
        ),
        severity="mild",
        red_flags=(
            "no urine output for 8+ hours", "rapid heartbeat",
            "sunken eyes", "confusion or lethargy",
            "inability to keep fluids down",
        ),
        when_to_seek_help=(
            "Seek medical attention for signs of severe dehydration: "
            "no urination for 8+ hours, rapid heartbeat, confusion, or fainting. "
            "Children and elderly are at highest risk."
        ),
        first_aid=(
            "Sip water frequently — small amounts often. "
            "Oral rehydration solution (ORS) is ideal. "
            "Avoid caffeine and alcohol. Eat water-rich foods (watermelon, cucumber). "
            "For children: pediatric electrolyte solutions."
        ),
        description="Insufficient body fluid levels. Can range from mild to life-threatening.",
        icd_code="E86",
    ),
    MedicalCondition(
        id="gen-diabetes-symptoms",
        name="Diabetes Warning Signs",
        category="general",
        aliases=("diabetes", "high blood sugar", "sugar disease", "frequent urination and thirst"),
        symptoms=(
            "frequent urination", "excessive thirst", "unexplained weight loss",
            "extreme fatigue", "blurred vision", "slow-healing wounds",
            "tingling in hands or feet", "frequent infections",
        ),
        severity="moderate",
        red_flags=(
            "fruity-smelling breath (diabetic ketoacidosis)",
            "extreme thirst with vomiting",
            "confusion or loss of consciousness",
            "blood sugar above 300 mg/dL",
        ),
        when_to_seek_help=(
            "See a doctor for evaluation if you experience multiple symptoms. "
            "Seek emergency care for signs of diabetic ketoacidosis: "
            "fruity breath, vomiting, confusion, rapid breathing."
        ),
        first_aid=(
            "If diabetic emergency suspected: call 911. "
            "For known diabetics: check blood sugar, take prescribed medication. "
            "Stay hydrated. Do NOT skip insulin doses. "
            "Monitor blood glucose regularly."
        ),
        description="Metabolic disorder affecting blood sugar regulation. Requires professional diagnosis.",
        icd_code="E11",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# UNIFIED KNOWLEDGE BASE
# ═══════════════════════════════════════════════════════════════════════════════

ALL_CONDITIONS: tuple[MedicalCondition, ...] = (
    *RESPIRATORY_CONDITIONS,
    *CARDIOVASCULAR_CONDITIONS,
    *GASTROINTESTINAL_CONDITIONS,
    *NEUROLOGICAL_CONDITIONS,
    *MUSCULOSKELETAL_CONDITIONS,
    *DERMATOLOGICAL_CONDITIONS,
    *MENTAL_HEALTH_CONDITIONS,
    *GENERAL_CONDITIONS,
)

# Category index for fast lookups
CONDITIONS_BY_CATEGORY: dict[str, list[MedicalCondition]] = {}
for _condition in ALL_CONDITIONS:
    CONDITIONS_BY_CATEGORY.setdefault(_condition.category, []).append(_condition)

# ID index for direct access
CONDITIONS_BY_ID: dict[str, MedicalCondition] = {c.id: c for c in ALL_CONDITIONS}


def get_all_condition_names() -> list[str]:
    """Return all condition names for display purposes."""
    return [c.name for c in ALL_CONDITIONS]


def get_condition_by_id(condition_id: str) -> MedicalCondition | None:
    """Retrieve a specific condition by its ID."""
    return CONDITIONS_BY_ID.get(condition_id)


def get_conditions_by_category(category: str) -> list[MedicalCondition]:
    """Retrieve all conditions in a category."""
    return CONDITIONS_BY_CATEGORY.get(category, [])
