"""Body-part extraction must survive ordinary punctuation and plurals.

Regression: extraction compared whitespace-split tokens to the vocabulary, so
"pain in my chest." (trailing period) and "my knees hurt" (plural) found no
body part at all. Real users punctuate and pluralise constantly.
"""

import pytest

from app.core.triage.symptom_parser import parse_symptoms

# These phrases are produced by the frontend body map
# (frontend/src/lib/bodyRegions.ts). If you change one there, change it here:
# this is the contract that keeps the 3D picker feeding the parser.
BODY_MAP_PHRASES = {
    "I have pain in my head": "head",
    "I have pain in my neck": "neck",
    "I have pain in my throat": "throat",
    "I have pain in my shoulder": "shoulder",
    "I have pain in my chest": "chest",
    "I have pain in my abdomen": "abdomen",
    "I have pain in my back": "back",
    "I have pain in my arm": "arm",
    "I have pain in my wrist": "wrist",
    "I have pain in my hand": "hand",
    "I have pain in my hip": "hip",
    "I have pain in my leg": "leg",
    "I have pain in my knee": "knee",
    "I have pain in my ankle": "ankle",
    "I have pain in my foot": "foot",
}


class TestPunctuationAndPlurals:
    @pytest.mark.parametrize(
        "message, expected",
        [
            ("pain in my chest.", "chest"),
            ("my head, hurts", "head"),
            ("My Chest hurts!", "chest"),
            ("(left) knee swelling", "knee"),
            ("my knees hurt", "knee"),
            ("both arms ache", "arm"),
            ("sore ankles; tired legs", "ankle"),
        ],
    )
    def test_finds_part(self, message, expected):
        assert expected in parse_symptoms(message).body_parts

    def test_irregular_plural_is_in_the_vocabulary(self):
        assert "feet" in parse_symptoms("my feet are swollen").body_parts

    @pytest.mark.parametrize(
        "message",
        [
            "this is fine",  # 'this' must not become 'thi'
            "I feel anxious",
            "headache",  # a symptom word, not the body part 'head'
            "",
        ],
    )
    def test_no_false_positives(self, message):
        assert parse_symptoms(message).body_parts == ()

    def test_each_part_reported_once(self):
        parts = parse_symptoms("chest chest, my chest.").body_parts
        assert parts.count("chest") == 1


class TestBodyMapContract:
    @pytest.mark.parametrize("phrase, part", list(BODY_MAP_PHRASES.items()))
    def test_every_body_map_phrase_is_understood(self, phrase, part):
        assert part in parse_symptoms(phrase).body_parts

    @pytest.mark.parametrize("phrase, part", list(BODY_MAP_PHRASES.items()))
    def test_phrase_survives_trailing_punctuation(self, phrase, part):
        assert part in parse_symptoms(phrase + ".").body_parts
