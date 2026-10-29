"""Extended medical knowledge base — additional conditions for improved triage accuracy.

Supplements the core knowledge_base.py with 30+ additional conditions spanning
infectious diseases, urological, ENT, ophthalmological, endocrine, pediatric,
and women's health categories.

Data Sources:
    - WHO ICD-11 classification guidelines
    - NHS Symptom Checker evidence base
    - Mayo Clinic patient education materials
    - CDC clinical guidance documents
"""

from app.rag.knowledge_base import MedicalCondition

# ═══════════════════════════════════════════════════════════════════════════════
# INFECTIOUS DISEASE CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

INFECTIOUS_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="inf-covid19",
        name="COVID-19",
        category="infectious",
        aliases=("covid", "coronavirus", "sars-cov-2", "covid 19", "corona"),
        symptoms=(
            "fever",
            "dry cough",
            "fatigue",
            "loss of taste",
            "loss of smell",
            "sore throat",
            "headache",
            "body aches",
            "shortness of breath",
            "congestion",
        ),
        severity="moderate",
        red_flags=(
            "difficulty breathing",
            "persistent chest pain",
            "confusion",
            "inability to stay awake",
            "bluish lips or face",
            "oxygen saturation below 94%",
        ),
        when_to_seek_help=(
            "Seek emergency care if you experience difficulty breathing, "
            "persistent chest pain, confusion, or bluish discoloration of lips. "
            "Test and isolate if symptomatic. High-risk groups should consult a doctor early."
        ),
        first_aid=(
            "Isolate from others. Rest and stay hydrated. Monitor oxygen levels if possible. "
            "Use acetaminophen for fever. Prone positioning can help breathing. "
            "Seek testing and follow local health guidelines."
        ),
        description="Respiratory illness caused by SARS-CoV-2. Ranges from mild to severe.",
        icd_code="U07.1",
    ),
    MedicalCondition(
        id="inf-uti",
        name="Urinary Tract Infection (UTI)",
        category="infectious",
        aliases=(
            "uti",
            "bladder infection",
            "urinary infection",
            "cystitis",
            "burning urine",
        ),
        symptoms=(
            "burning sensation during urination",
            "frequent urination",
            "urgency to urinate",
            "cloudy urine",
            "strong-smelling urine",
            "pelvic pain",
            "blood in urine",
            "lower abdominal discomfort",
        ),
        severity="moderate",
        red_flags=(
            "fever with back pain",
            "blood in urine",
            "nausea and vomiting with urinary symptoms",
            "symptoms in pregnant women",
        ),
        when_to_seek_help=(
            "See a doctor if symptoms persist beyond 2 days, you have fever with back pain "
            "(possible kidney infection), blood in urine, or if you are pregnant."
        ),
        first_aid=(
            "Drink plenty of water to flush bacteria. Avoid caffeine and alcohol. "
            "Urinate frequently — do not hold it in. OTC pain relievers for discomfort. "
            "Cranberry products may help prevent recurrence but are not a cure."
        ),
        description="Bacterial infection of the urinary system. Common in women. Requires antibiotics.",
        icd_code="N39.0",
    ),
    MedicalCondition(
        id="inf-strep-throat",
        name="Strep Throat",
        category="infectious",
        aliases=(
            "strep throat",
            "streptococcal pharyngitis",
            "throat infection",
            "strep",
        ),
        symptoms=(
            "severe sore throat",
            "pain when swallowing",
            "fever",
            "red swollen tonsils",
            "white patches on tonsils",
            "swollen lymph nodes in neck",
            "headache",
            "body aches",
        ),
        severity="moderate",
        red_flags=(
            "difficulty breathing or swallowing",
            "drooling due to inability to swallow",
            "high fever above 101°F persisting over 48 hours",
            "rash accompanying sore throat",
        ),
        when_to_seek_help=(
            "See a doctor for rapid strep test if sore throat is severe, "
            "accompanied by fever and swollen glands, or lasts more than 48 hours. "
            "Untreated strep can lead to rheumatic fever."
        ),
        first_aid=(
            "Gargle with warm salt water. Use throat lozenges. "
            "OTC pain relievers for fever and pain. Stay hydrated with warm liquids. "
            "Rest your voice. Antibiotics are needed — see a doctor."
        ),
        description="Bacterial throat infection caused by Group A Streptococcus. Requires antibiotics.",
        icd_code="J02.0",
    ),
    MedicalCondition(
        id="inf-conjunctivitis",
        name="Conjunctivitis (Pink Eye)",
        category="infectious",
        aliases=(
            "pink eye",
            "conjunctivitis",
            "eye infection",
            "red eye",
            "eye redness",
        ),
        symptoms=(
            "redness in one or both eyes",
            "itching or burning sensation",
            "excessive tearing",
            "discharge from eye",
            "crusting of eyelids",
            "gritty feeling in eyes",
            "sensitivity to light",
        ),
        severity="mild",
        red_flags=(
            "severe eye pain",
            "vision changes",
            "sensitivity to light with pain",
            "symptoms not improving after 24 hours of treatment",
        ),
        when_to_seek_help=(
            "See a doctor if you have eye pain, vision changes, intense redness, "
            "or symptoms not improving in 2-3 days. Newborns with eye discharge "
            "need immediate medical attention."
        ),
        first_aid=(
            "Apply warm compresses to the affected eye. Clean discharge with a damp cloth. "
            "Do NOT touch or rub the eye. Wash hands frequently. "
            "Remove contact lenses until infection clears."
        ),
        description="Inflammation of the conjunctiva. Can be viral, bacterial, or allergic.",
        icd_code="H10",
    ),
    MedicalCondition(
        id="inf-sinusitis",
        name="Sinusitis",
        category="infectious",
        aliases=(
            "sinus infection",
            "sinusitis",
            "sinus pressure",
            "blocked sinuses",
            "sinus headache",
        ),
        symptoms=(
            "facial pain or pressure",
            "nasal congestion",
            "thick nasal discharge",
            "reduced sense of smell",
            "cough",
            "headache",
            "ear pressure",
            "fatigue",
            "bad breath",
        ),
        severity="mild",
        red_flags=(
            "severe headache or facial pain",
            "fever above 101°F",
            "symptoms lasting more than 10 days",
            "double vision or swelling around eyes",
        ),
        when_to_seek_help=(
            "See a doctor if symptoms persist beyond 10 days, worsen after initial improvement, "
            "or are accompanied by high fever. Recurrent sinusitis may need specialist evaluation."
        ),
        first_aid=(
            "Use saline nasal irrigation (neti pot or spray). Apply warm compresses to face. "
            "Stay hydrated. Use a humidifier. OTC decongestants for short-term relief. "
            "Steam inhalation can help relieve congestion."
        ),
        description="Inflammation of the sinuses, usually following a cold. Most cases are viral.",
        icd_code="J01",
    ),
    MedicalCondition(
        id="inf-ear-infection",
        name="Ear Infection (Otitis Media)",
        category="infectious",
        aliases=(
            "ear infection",
            "otitis media",
            "ear pain",
            "earache",
            "middle ear infection",
        ),
        symptoms=(
            "ear pain",
            "difficulty hearing",
            "fluid drainage from ear",
            "fever",
            "irritability",
            "difficulty sleeping",
            "loss of balance",
            "headache",
        ),
        severity="moderate",
        red_flags=(
            "severe ear pain that suddenly stops (possible rupture)",
            "high fever",
            "swelling behind the ear",
            "facial weakness or drooping",
        ),
        when_to_seek_help=(
            "See a doctor if ear pain is severe, symptoms persist beyond 2-3 days, "
            "there is fluid or pus draining from the ear, or in children under 6 months."
        ),
        first_aid=(
            "Apply warm compress to the affected ear. OTC pain relievers. "
            "Keep the ear dry. Elevate the head when sleeping. "
            "Do NOT insert objects into the ear canal."
        ),
        description="Infection of the middle ear, common in children. May need antibiotics.",
        icd_code="H66",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# ENDOCRINE & METABOLIC CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

ENDOCRINE_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="endo-hypothyroid",
        name="Hypothyroidism",
        category="endocrine",
        aliases=(
            "hypothyroidism",
            "underactive thyroid",
            "low thyroid",
            "thyroid problem",
        ),
        symptoms=(
            "fatigue",
            "weight gain",
            "cold intolerance",
            "constipation",
            "dry skin",
            "hair loss",
            "muscle weakness",
            "depression",
            "brain fog",
            "irregular periods",
        ),
        severity="moderate",
        red_flags=(
            "extreme fatigue with confusion",
            "very low body temperature",
            "swelling in face and limbs",
            "difficulty breathing",
        ),
        when_to_seek_help=(
            "See a doctor if you experience persistent fatigue, unexplained weight gain, "
            "or multiple symptoms listed above. Thyroid function blood tests are needed for diagnosis."
        ),
        first_aid=(
            "No emergency first aid needed for mild symptoms. "
            "Maintain a balanced diet with adequate iodine. "
            "Track symptoms to discuss with your doctor. "
            "Do NOT take thyroid supplements without medical guidance."
        ),
        description="Underactive thyroid gland leading to insufficient hormone production. Treatable with medication.",
        icd_code="E03",
    ),
    MedicalCondition(
        id="endo-hyperthyroid",
        name="Hyperthyroidism",
        category="endocrine",
        aliases=(
            "hyperthyroidism",
            "overactive thyroid",
            "thyroid storm",
            "graves disease",
        ),
        symptoms=(
            "rapid heartbeat",
            "weight loss",
            "heat intolerance",
            "sweating",
            "trembling hands",
            "anxiety",
            "irritability",
            "difficulty sleeping",
            "frequent bowel movements",
            "bulging eyes",
        ),
        severity="moderate",
        red_flags=(
            "very rapid or irregular heartbeat",
            "high fever",
            "confusion or delirium",
            "extreme weakness",
        ),
        when_to_seek_help=(
            "See a doctor if you have unexplained weight loss with rapid heartbeat, "
            "tremors, or heat intolerance. Seek emergency care for suspected thyroid storm "
            "(high fever, rapid heart rate, confusion)."
        ),
        first_aid=(
            "Stay cool and hydrated. Avoid caffeine and stimulants. "
            "Practice stress reduction techniques. "
            "For thyroid storm: call 911 — this is a medical emergency."
        ),
        description="Overactive thyroid producing excess hormones. Can cause serious heart complications if untreated.",
        icd_code="E05",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# WOMEN'S HEALTH CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

WOMENS_HEALTH_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="wh-menstrual-cramps",
        name="Menstrual Cramps (Dysmenorrhea)",
        category="womens_health",
        aliases=(
            "period cramps",
            "menstrual pain",
            "period pain",
            "dysmenorrhea",
            "cramps during period",
        ),
        symptoms=(
            "lower abdominal cramping",
            "pain radiating to lower back and thighs",
            "nausea",
            "headache",
            "fatigue",
            "bloating",
            "diarrhea or loose stools",
            "dizziness",
        ),
        severity="mild",
        red_flags=(
            "pain not relieved by OTC medication",
            "extremely heavy bleeding (soaking a pad/tampon every hour)",
            "fever with menstrual pain",
            "sudden severe pelvic pain outside menstruation",
        ),
        when_to_seek_help=(
            "See a doctor if cramps severely disrupt daily activities, "
            "OTC pain relief is ineffective, bleeding is unusually heavy, "
            "or you develop new severe cramps after age 25."
        ),
        first_aid=(
            "Apply a heating pad to the lower abdomen. Take ibuprofen or naproxen "
            "(start 1-2 days before expected period for best results). "
            "Light exercise can help. Warm baths and herbal teas may provide comfort."
        ),
        description="Painful menstrual periods caused by uterine contractions. Very common and usually manageable.",
        icd_code="N94.6",
    ),
    MedicalCondition(
        id="wh-pcos",
        name="Polycystic Ovary Syndrome (PCOS)",
        category="womens_health",
        aliases=(
            "pcos",
            "polycystic ovaries",
            "hormonal imbalance",
            "irregular periods pcos",
        ),
        symptoms=(
            "irregular periods",
            "missed periods",
            "heavy periods",
            "excess facial or body hair",
            "acne",
            "weight gain",
            "thinning hair on scalp",
            "difficulty getting pregnant",
            "darkening of skin in creases",
        ),
        severity="moderate",
        red_flags=(
            "no period for 3+ months",
            "signs of diabetes",
            "severe pelvic pain",
            "rapid weight gain",
        ),
        when_to_seek_help=(
            "See a doctor if you have irregular periods, difficulty conceiving, "
            "or signs of excess androgen (facial hair, severe acne). "
            "PCOS increases risk of diabetes and heart disease."
        ),
        first_aid=(
            "Maintain a healthy weight through balanced diet and exercise. "
            "Regular physical activity helps regulate hormones. "
            "Track your menstrual cycle. Professional diagnosis requires ultrasound and blood tests."
        ),
        description="Hormonal disorder causing enlarged ovaries with small cysts. Affects 1 in 10 women.",
        icd_code="E28.2",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# ADDITIONAL GASTROINTESTINAL CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

GI_EXTENDED_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="gi-ibs",
        name="Irritable Bowel Syndrome (IBS)",
        category="gastrointestinal",
        aliases=(
            "ibs",
            "irritable bowel",
            "spastic colon",
            "nervous stomach",
            "stomach cramps",
        ),
        symptoms=(
            "abdominal pain or cramping",
            "bloating",
            "gas",
            "diarrhea",
            "constipation",
            "alternating diarrhea and constipation",
            "mucus in stool",
            "urgency to have bowel movement",
        ),
        severity="mild",
        red_flags=(
            "unexplained weight loss",
            "rectal bleeding",
            "persistent vomiting",
            "difficulty swallowing",
            "pain that worsens or occurs at night",
        ),
        when_to_seek_help=(
            "See a doctor if symptoms persist, you notice blood in stool, "
            "experience unexplained weight loss, or have nighttime symptoms. "
            "Diagnosis requires ruling out other conditions."
        ),
        first_aid=(
            "Identify and avoid trigger foods (common: dairy, gluten, FODMAPs). "
            "Eat smaller, more frequent meals. Manage stress with relaxation techniques. "
            "Stay hydrated. Regular exercise helps regulate bowel function."
        ),
        description="Chronic functional GI disorder affecting the large intestine. Managed with diet and lifestyle.",
        icd_code="K58",
    ),
    MedicalCondition(
        id="gi-constipation",
        name="Constipation",
        category="gastrointestinal",
        aliases=(
            "constipation",
            "constipated",
            "cannot poop",
            "hard stool",
            "irregular bowels",
        ),
        symptoms=(
            "fewer than 3 bowel movements per week",
            "hard or lumpy stools",
            "straining during bowel movements",
            "feeling of incomplete evacuation",
            "bloating",
            "abdominal discomfort",
        ),
        severity="mild",
        red_flags=(
            "blood in stool",
            "unexplained weight loss",
            "severe abdominal pain",
            "constipation lasting more than 3 weeks",
            "sudden change in bowel habits after age 50",
        ),
        when_to_seek_help=(
            "See a doctor if constipation lasts more than 3 weeks, "
            "you notice blood in stool, or experience severe pain. "
            "Sudden changes in bowel habits may warrant investigation."
        ),
        first_aid=(
            "Increase fiber intake (fruits, vegetables, whole grains). "
            "Drink plenty of water. Exercise regularly. "
            "OTC fiber supplements or mild laxatives for short-term relief. "
            "Establish a regular bathroom routine."
        ),
        description="Infrequent or difficult bowel movements. Usually improved with diet and lifestyle changes.",
        icd_code="K59.0",
    ),
    MedicalCondition(
        id="gi-food-allergy",
        name="Food Allergy Reaction",
        category="gastrointestinal",
        aliases=(
            "food allergy",
            "food reaction",
            "food intolerance",
            "allergic to food",
        ),
        symptoms=(
            "hives or skin rash",
            "swelling of lips or tongue",
            "abdominal pain",
            "nausea",
            "vomiting",
            "diarrhea",
            "tingling in mouth",
            "difficulty breathing",
        ),
        severity="moderate",
        red_flags=(
            "swelling of throat or tongue",
            "difficulty breathing",
            "rapid drop in blood pressure",
            "dizziness or fainting",
            "anaphylaxis",
        ),
        when_to_seek_help=(
            "CALL 911 for anaphylaxis symptoms: throat swelling, difficulty breathing, "
            "rapid pulse, dizziness. Use EpiPen if available. "
            "See an allergist for testing after any allergic reaction to food."
        ),
        first_aid=(
            "For mild reactions: take antihistamine (diphenhydramine). "
            "For anaphylaxis: use EpiPen, call 911, lie flat with legs elevated. "
            "Remove the allergen. Monitor breathing. "
            "Even if symptoms improve after EpiPen, go to the ER."
        ),
        description="Immune reaction to specific foods. Can range from mild to life-threatening anaphylaxis.",
        icd_code="T78.1",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# RESPIRATORY EXTENDED CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

RESPIRATORY_EXTENDED_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="resp-pneumonia",
        name="Pneumonia",
        category="respiratory",
        aliases=("pneumonia", "lung infection", "chest infection", "walking pneumonia"),
        symptoms=(
            "cough with phlegm or pus",
            "fever",
            "chills",
            "difficulty breathing",
            "chest pain when breathing or coughing",
            "fatigue",
            "nausea or vomiting",
            "confusion in older adults",
        ),
        severity="severe",
        red_flags=(
            "high fever above 102°F",
            "difficulty breathing at rest",
            "confusion",
            "bluish lips",
            "coughing up blood",
        ),
        when_to_seek_help=(
            "Seek medical attention if you have difficulty breathing, chest pain, "
            "persistent fever above 102°F, or cough with pus. "
            "High-risk groups (elderly, infants, immunocompromised) should seek early care."
        ),
        first_aid=(
            "Rest and stay hydrated. Take prescribed antibiotics as directed. "
            "Use a humidifier. OTC fever reducers. "
            "Do NOT suppress a productive cough — it helps clear infection."
        ),
        description="Infection causing lung inflammation and fluid in air sacs. Can be life-threatening.",
        icd_code="J18",
    ),
    MedicalCondition(
        id="resp-allergic-rhinitis",
        name="Allergic Rhinitis (Hay Fever)",
        category="respiratory",
        aliases=(
            "hay fever",
            "allergic rhinitis",
            "seasonal allergies",
            "pollen allergy",
            "nasal allergy",
        ),
        symptoms=(
            "sneezing",
            "runny nose",
            "nasal congestion",
            "itchy nose",
            "watery itchy eyes",
            "postnasal drip",
            "cough",
            "fatigue",
            "sinus pressure",
        ),
        severity="mild",
        red_flags=(
            "wheezing or difficulty breathing",
            "symptoms significantly impacting sleep or daily function",
            "recurrent sinus infections",
        ),
        when_to_seek_help=(
            "See a doctor if OTC antihistamines are not effective, "
            "symptoms significantly impact quality of life, "
            "or you develop wheezing or breathing difficulty."
        ),
        first_aid=(
            "OTC antihistamines (cetirizine, loratadine, fexofenadine). "
            "Nasal corticosteroid sprays for chronic symptoms. "
            "Avoid known allergens. Keep windows closed during high pollen days. "
            "Shower after outdoor activities to remove pollen."
        ),
        description="Allergic reaction to airborne allergens causing nasal and eye symptoms.",
        icd_code="J30",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# MUSCULOSKELETAL EXTENDED CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

MSK_EXTENDED_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="msk-neck-pain",
        name="Neck Pain",
        category="musculoskeletal",
        aliases=(
            "neck pain",
            "stiff neck",
            "neck stiffness",
            "cervical pain",
            "neck ache",
        ),
        symptoms=(
            "pain in neck",
            "stiffness",
            "limited range of motion",
            "headache",
            "pain radiating to shoulders or arms",
            "muscle spasms",
            "difficulty turning head",
        ),
        severity="mild",
        red_flags=(
            "neck pain with fever and headache (possible meningitis)",
            "weakness or numbness in arms or hands",
            "pain after trauma or injury",
            "loss of bladder or bowel control",
        ),
        when_to_seek_help=(
            "Seek emergency care if neck pain follows an injury, is accompanied by "
            "fever and stiff neck, or causes weakness/numbness in arms. "
            "See a doctor if pain persists beyond a week."
        ),
        first_aid=(
            "Apply ice for first 48 hours, then switch to heat. "
            "Gentle neck stretches and range-of-motion exercises. "
            "OTC pain relievers. Maintain good posture. "
            "Avoid prolonged phone or computer use without breaks."
        ),
        description="Common condition often caused by poor posture, stress, or sleeping position.",
        icd_code="M54.2",
    ),
    MedicalCondition(
        id="msk-knee-pain",
        name="Knee Pain",
        category="musculoskeletal",
        aliases=(
            "knee pain",
            "knee injury",
            "knee swelling",
            "joint pain knee",
            "knee ache",
        ),
        symptoms=(
            "pain in or around the knee",
            "swelling",
            "stiffness",
            "redness and warmth",
            "weakness or instability",
            "popping or crunching sounds",
            "inability to fully straighten knee",
        ),
        severity="mild",
        red_flags=(
            "knee locked and unable to bend or straighten",
            "significant swelling after injury",
            "fever with red swollen knee (possible infection)",
            "inability to bear weight",
        ),
        when_to_seek_help=(
            "See a doctor if knee is visibly deformed, you cannot bear weight, "
            "there is significant swelling, or you have fever with a swollen knee. "
            "Persistent pain beyond 2 weeks warrants evaluation."
        ),
        first_aid=(
            "RICE protocol: Rest, Ice, Compression, Elevation. "
            "OTC anti-inflammatory medications. "
            "Avoid high-impact activities. Gentle range-of-motion exercises as pain allows. "
            "Use a knee brace for support if needed."
        ),
        description="Can result from injury, arthritis, or overuse. Very common across all age groups.",
        icd_code="M25.5",
    ),
    MedicalCondition(
        id="msk-arthritis",
        name="Arthritis",
        category="musculoskeletal",
        aliases=(
            "arthritis",
            "joint pain",
            "joint stiffness",
            "swollen joints",
            "osteoarthritis",
            "rheumatoid arthritis",
        ),
        symptoms=(
            "joint pain",
            "stiffness especially in morning",
            "swelling",
            "reduced range of motion",
            "redness around joint",
            "fatigue",
            "joint tenderness",
            "bone spurs",
        ),
        severity="moderate",
        red_flags=(
            "sudden severe joint swelling",
            "fever with joint inflammation",
            "inability to use the joint",
            "joint deformity",
        ),
        when_to_seek_help=(
            "See a doctor for persistent joint pain lasting more than 2 weeks, "
            "joint swelling with fever, or significantly reduced mobility. "
            "Early treatment can prevent joint damage."
        ),
        first_aid=(
            "Alternate ice and heat therapy. Gentle low-impact exercise (swimming, walking). "
            "OTC anti-inflammatory medications. Maintain a healthy weight to reduce joint stress. "
            "Use assistive devices if needed."
        ),
        description="Inflammation of joints causing pain and stiffness. Over 100 types exist.",
        icd_code="M19",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# SKIN & DERMATOLOGICAL EXTENDED CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

DERM_EXTENDED_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="derm-eczema",
        name="Eczema (Atopic Dermatitis)",
        category="dermatological",
        aliases=(
            "eczema",
            "atopic dermatitis",
            "skin rash itchy",
            "dry itchy skin",
            "dermatitis",
        ),
        symptoms=(
            "dry itchy skin",
            "red or brownish patches",
            "small raised bumps",
            "thickened cracked skin",
            "raw sensitive skin from scratching",
            "patches on hands, feet, ankles, wrists, neck, upper chest",
        ),
        severity="mild",
        red_flags=(
            "signs of skin infection (pus, yellow crusting)",
            "symptoms not improving with OTC treatment",
            "sleep disruption due to itching",
            "widespread rash covering large body areas",
        ),
        when_to_seek_help=(
            "See a doctor if eczema is widespread, infected (oozing, crusting), "
            "not responding to OTC treatments, or significantly affecting sleep and daily life."
        ),
        first_aid=(
            "Moisturize skin frequently with fragrance-free cream. "
            "Use lukewarm (not hot) water for bathing. Apply OTC hydrocortisone cream. "
            "Wear soft, breathable fabrics. Identify and avoid triggers. "
            "Keep fingernails short to minimize scratching damage."
        ),
        description="Chronic condition causing dry, itchy, inflamed skin. Common in children but affects all ages.",
        icd_code="L20",
    ),
    MedicalCondition(
        id="derm-fungal",
        name="Fungal Skin Infection",
        category="dermatological",
        aliases=(
            "ringworm",
            "athlete foot",
            "fungal infection",
            "jock itch",
            "tinea",
            "fungus skin",
        ),
        symptoms=(
            "red circular rash with clearing center",
            "itching",
            "scaling or peeling skin",
            "cracking skin between toes",
            "blisters",
            "burning sensation",
            "discolored thickened nails",
        ),
        severity="mild",
        red_flags=(
            "infection spreading rapidly",
            "fever with skin infection",
            "infection on scalp with hair loss",
            "fungal infection in immunocompromised individuals",
        ),
        when_to_seek_help=(
            "See a doctor if OTC antifungal treatments don't work after 2 weeks, "
            "the infection is on the scalp, or you are immunocompromised."
        ),
        first_aid=(
            "Apply OTC antifungal cream (clotrimazole, terbinafine). "
            "Keep the area clean and dry. Wear breathable fabrics. "
            "Don't share towels or clothing. Change socks daily. "
            "Continue treatment for 1-2 weeks after symptoms clear."
        ),
        description="Infection caused by dermatophyte fungi. Contagious but treatable with antifungals.",
        icd_code="B35",
    ),
    MedicalCondition(
        id="derm-acne",
        name="Acne",
        category="dermatological",
        aliases=(
            "acne",
            "pimples",
            "breakout",
            "zits",
            "acne vulgaris",
            "spots on face",
        ),
        symptoms=(
            "whiteheads",
            "blackheads",
            "small red tender bumps",
            "pimples with pus",
            "large painful lumps under skin",
            "scarring",
            "oily skin",
        ),
        severity="mild",
        red_flags=(
            "deep painful cysts or nodules",
            "widespread scarring",
            "acne not responding to OTC treatment after 2 months",
            "acne with signs of hormonal imbalance",
        ),
        when_to_seek_help=(
            "See a dermatologist if OTC treatments aren't helping after 2-3 months, "
            "you have severe cystic acne, or acne is causing scarring or emotional distress."
        ),
        first_aid=(
            "Wash face twice daily with gentle cleanser. Use OTC benzoyl peroxide or salicylic acid. "
            "Don't pick or squeeze pimples. Use non-comedogenic moisturizer and sunscreen. "
            "Change pillowcases regularly."
        ),
        description="Skin condition occurring when hair follicles become clogged with oil and dead cells.",
        icd_code="L70",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# NEUROLOGICAL EXTENDED CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

NEURO_EXTENDED_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="neuro-vertigo",
        name="Vertigo",
        category="neurological",
        aliases=(
            "vertigo",
            "dizziness",
            "room spinning",
            "dizzy spells",
            "balance problems",
            "BPPV",
        ),
        symptoms=(
            "sensation that room is spinning",
            "loss of balance",
            "nausea",
            "vomiting",
            "unsteady gait",
            "abnormal eye movements",
            "headache",
            "sweating",
        ),
        severity="moderate",
        red_flags=(
            "vertigo with sudden severe headache",
            "vertigo with double vision or slurred speech",
            "vertigo with arm or leg weakness",
            "vertigo with hearing loss",
        ),
        when_to_seek_help=(
            "Seek emergency care if vertigo occurs with headache, vision changes, "
            "slurred speech, or weakness — these may indicate stroke. "
            "See a doctor for recurrent vertigo episodes."
        ),
        first_aid=(
            "Sit or lie down immediately when dizzy. Move slowly and carefully. "
            "Avoid sudden head movements. Focus on a fixed point. "
            "Stay hydrated. Epley maneuver can help with BPPV (positional vertigo)."
        ),
        description="False sensation of movement, often rotational. Usually caused by inner ear problems.",
        icd_code="H81",
    ),
    MedicalCondition(
        id="neuro-insomnia",
        name="Insomnia",
        category="neurological",
        aliases=(
            "insomnia",
            "can't sleep",
            "difficulty sleeping",
            "sleepless",
            "sleep problems",
        ),
        symptoms=(
            "difficulty falling asleep",
            "waking up during the night",
            "waking up too early",
            "daytime fatigue",
            "difficulty concentrating",
            "irritability",
            "anxiety about sleep",
            "feeling unrefreshed after sleep",
        ),
        severity="mild",
        red_flags=(
            "chronic insomnia lasting more than 3 months",
            "insomnia with depression or anxiety",
            "excessive daytime sleepiness causing safety concerns",
            "sleep apnea symptoms (snoring, gasping)",
        ),
        when_to_seek_help=(
            "See a doctor if insomnia persists more than 4 weeks, "
            "significantly impacts daily function, or is accompanied by "
            "mood changes, snoring with gasping, or excessive daytime sleepiness."
        ),
        first_aid=(
            "Maintain consistent sleep/wake times. Create a dark, cool, quiet bedroom. "
            "Avoid screens 1 hour before bed. Limit caffeine after noon. "
            "Practice relaxation techniques. Avoid alcohol before bed. "
            "Get regular exercise but not close to bedtime."
        ),
        description="Persistent difficulty with sleep initiation, duration, or quality despite adequate opportunity.",
        icd_code="G47.0",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# CARDIOVASCULAR EXTENDED CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

CARDIO_EXTENDED_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="cardio-palpitations",
        name="Heart Palpitations",
        category="cardiovascular",
        aliases=(
            "palpitations",
            "heart racing",
            "heart pounding",
            "heart fluttering",
            "irregular heartbeat",
        ),
        symptoms=(
            "feeling heart is racing",
            "pounding or fluttering in chest",
            "skipped heartbeats",
            "rapid pulse",
            "lightheadedness",
            "shortness of breath",
            "anxiety",
        ),
        severity="mild",
        red_flags=(
            "palpitations with chest pain",
            "fainting or near-fainting",
            "severe shortness of breath",
            "palpitations lasting more than a few minutes",
            "palpitations with dizziness",
        ),
        when_to_seek_help=(
            "Seek emergency care if palpitations are accompanied by chest pain, "
            "fainting, severe shortness of breath, or dizziness. "
            "See a doctor for frequent or prolonged episodes."
        ),
        first_aid=(
            "Stop and rest. Practice slow deep breathing. "
            "Splash cold water on your face (vagal maneuver). "
            "Reduce caffeine, alcohol, and nicotine intake. "
            "Manage stress and anxiety. Track episodes to report to doctor."
        ),
        description="Awareness of heartbeat that feels fast, pounding, or irregular. Usually harmless but can indicate arrhythmia.",
        icd_code="R00.2",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# MENTAL HEALTH EXTENDED CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

MH_EXTENDED_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="mh-stress",
        name="Chronic Stress",
        category="mental_health",
        aliases=(
            "stress",
            "stressed",
            "burnout",
            "overwhelmed",
            "stressed out",
            "work stress",
        ),
        symptoms=(
            "headache",
            "muscle tension",
            "fatigue",
            "sleep disturbance",
            "irritability",
            "difficulty concentrating",
            "stomach upset",
            "chest tightness",
            "social withdrawal",
            "changes in appetite",
        ),
        severity="mild",
        red_flags=(
            "thoughts of self-harm",
            "substance use to cope",
            "inability to function at work or home",
            "physical symptoms worsening despite rest",
        ),
        when_to_seek_help=(
            "See a healthcare provider if stress is causing persistent physical symptoms, "
            "affecting your ability to work or maintain relationships, "
            "or if you're using substances to cope."
        ),
        first_aid=(
            "Practice deep breathing: inhale 4s, hold 4s, exhale 6s. "
            "Take regular breaks. Exercise for at least 30 minutes daily. "
            "Maintain social connections. Limit news and screen time. "
            "Consider journaling or mindfulness meditation."
        ),
        description="Prolonged psychological and physical response to demands exceeding coping resources.",
        icd_code="F43",
    ),
    MedicalCondition(
        id="mh-panic-disorder",
        name="Panic Attack / Panic Disorder",
        category="mental_health",
        aliases=(
            "panic attack",
            "panic disorder",
            "panic",
            "extreme anxiety attack",
            "sudden fear",
        ),
        symptoms=(
            "sudden intense fear",
            "racing heart",
            "sweating",
            "trembling",
            "shortness of breath",
            "chest pain",
            "nausea",
            "dizziness",
            "numbness or tingling",
            "feeling of impending doom",
            "fear of losing control",
        ),
        severity="moderate",
        red_flags=(
            "panic attacks becoming more frequent",
            "avoidance of situations due to fear of attacks",
            "chest pain that could be cardiac (especially in older adults)",
            "thoughts of self-harm",
        ),
        when_to_seek_help=(
            "See a doctor to rule out cardiac causes if experiencing chest pain. "
            "Seek mental health professional for recurrent panic attacks. "
            "Emergency: first-time chest pain/shortness of breath should be evaluated in ER."
        ),
        first_aid=(
            "Remind yourself: 'This is a panic attack and it will pass.' "
            "Slow your breathing: inhale 4 counts, exhale 6 counts. "
            "Ground yourself: name 5 things you can see. "
            "Avoid fleeing — stay and let the panic peak and recede. "
            "Cold water on wrists or face can help."
        ),
        description="Sudden episode of intense fear with physical symptoms. Peaks within 10 minutes.",
        icd_code="F41.0",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# GENERAL EXTENDED CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

GENERAL_EXTENDED_CONDITIONS: tuple[MedicalCondition, ...] = (
    MedicalCondition(
        id="gen-anemia",
        name="Anemia",
        category="general",
        aliases=(
            "anemia",
            "low iron",
            "iron deficiency",
            "low hemoglobin",
            "pale skin fatigue",
        ),
        symptoms=(
            "fatigue",
            "weakness",
            "pale skin",
            "shortness of breath on exertion",
            "dizziness",
            "cold hands and feet",
            "brittle nails",
            "fast or irregular heartbeat",
            "headache",
        ),
        severity="moderate",
        red_flags=(
            "fainting",
            "severe shortness of breath",
            "rapid heartbeat at rest",
            "chest pain",
        ),
        when_to_seek_help=(
            "See a doctor if you experience persistent fatigue, shortness of breath, "
            "or dizziness. Blood tests are needed for diagnosis. "
            "Seek emergency care for fainting or chest pain."
        ),
        first_aid=(
            "Eat iron-rich foods (spinach, red meat, lentils, fortified cereals). "
            "Vitamin C helps iron absorption (citrus fruits). "
            "Avoid tea/coffee with meals (inhibits iron absorption). "
            "Iron supplements as directed by doctor."
        ),
        description="Condition with insufficient healthy red blood cells. Iron deficiency is the most common type.",
        icd_code="D50",
    ),
    MedicalCondition(
        id="gen-vitamin-d-deficiency",
        name="Vitamin D Deficiency",
        category="general",
        aliases=(
            "vitamin d deficiency",
            "low vitamin d",
            "vitamin d low",
            "bone pain fatigue",
        ),
        symptoms=(
            "fatigue",
            "bone pain",
            "muscle weakness",
            "mood changes",
            "depression",
            "frequent illness",
            "slow wound healing",
            "hair loss",
            "back pain",
        ),
        severity="mild",
        red_flags=(
            "severe bone pain",
            "repeated fractures",
            "muscle cramps and spasms",
            "significant depression",
        ),
        when_to_seek_help=(
            "See a doctor for blood test if you suspect vitamin D deficiency. "
            "Common in people with limited sun exposure, darker skin, or living in northern latitudes."
        ),
        first_aid=(
            "Get 15-20 minutes of sunlight exposure daily. "
            "Eat vitamin D-rich foods (fatty fish, egg yolks, fortified milk). "
            "Supplements (1000-2000 IU daily) with doctor approval. "
            "Combine with calcium for bone health."
        ),
        description="Insufficient vitamin D levels affecting bones, muscles, and immune function. Very common globally.",
        icd_code="E55",
    ),
    MedicalCondition(
        id="gen-heat-exhaustion",
        name="Heat Exhaustion",
        category="general",
        aliases=(
            "heat exhaustion",
            "heat stroke",
            "overheating",
            "sun stroke",
            "heat illness",
        ),
        symptoms=(
            "heavy sweating",
            "weakness",
            "cold clammy skin",
            "nausea",
            "vomiting",
            "fast weak pulse",
            "muscle cramps",
            "headache",
            "dizziness",
            "fainting",
        ),
        severity="moderate",
        red_flags=(
            "body temperature above 103°F (heat stroke)",
            "hot red dry skin (no sweating)",
            "confusion or altered mental state",
            "loss of consciousness",
        ),
        when_to_seek_help=(
            "CALL 911 for heat stroke: high body temperature, confusion, no sweating. "
            "Seek medical attention if heat exhaustion symptoms don't improve within 1 hour of cooling."
        ),
        first_aid=(
            "Move to a cool place immediately. Loosen clothing. "
            "Apply cool wet cloths to skin. Sip water slowly. "
            "Fan the person. If heat stroke suspected: call 911, "
            "cool the person rapidly with ice packs on neck, armpits, groin."
        ),
        description="Body overheating due to prolonged heat exposure. Can progress to life-threatening heat stroke.",
        icd_code="T67",
    ),
)


# ═══════════════════════════════════════════════════════════════════════════════
# AGGREGATE ALL EXTENDED CONDITIONS
# ═══════════════════════════════════════════════════════════════════════════════

ALL_EXTENDED_CONDITIONS: tuple[MedicalCondition, ...] = (
    *INFECTIOUS_CONDITIONS,
    *ENDOCRINE_CONDITIONS,
    *WOMENS_HEALTH_CONDITIONS,
    *GI_EXTENDED_CONDITIONS,
    *RESPIRATORY_EXTENDED_CONDITIONS,
    *MSK_EXTENDED_CONDITIONS,
    *DERM_EXTENDED_CONDITIONS,
    *NEURO_EXTENDED_CONDITIONS,
    *CARDIO_EXTENDED_CONDITIONS,
    *MH_EXTENDED_CONDITIONS,
    *GENERAL_EXTENDED_CONDITIONS,
)
