"""Retrieval quality gate, measured on labelled queries.

Baseline before field weighting and stemming (same data):
    labelled 62.8% top-1 / 93.0% top-3, held-out 73.3% / 93.3%.
The floors below sit just under the measured results so CI fails on a
regression without being flaky. Run `python -m scripts.eval_retrieval`
for the numbers and the misses.
"""

import pytest

from app.rag.retriever import retrieve
from app.rag.vectorizer import stem
from scripts.eval_retrieval import EVAL_FILE, HELDOUT_FILE, evaluate


def test_labelled_set_accuracy():
    result = evaluate(path=EVAL_FILE)
    assert result["top1"] >= 0.85
    assert result["top3"] == 1.0


def test_heldout_set_accuracy():
    result = evaluate(path=HELDOUT_FILE)
    assert result["top1"] >= 0.90
    assert result["top3"] == 1.0


def test_every_quick_prompt_ranks_correctly():
    """The chat page's starter buttons are the most-clicked queries."""
    rows = [r for r in evaluate(path=EVAL_FILE)["rows"] if r.get("quick")]
    assert len(rows) == 8
    misses = [(r["q"], r["got"][:1]) for r in rows if not r["top1"]]
    assert misses == []


@pytest.mark.parametrize(
    "query",
    [
        "the room spins when I stand up",
        "burning when I pee and I need to go all the time",
    ],
)
def test_advice_text_does_not_drive_matches(query):
    """'room'/'go' used to match 'go to the emergency room' in Appendicitis advice."""
    ids = [r.condition.id for r in retrieve(query, top_k=3)]
    assert "gi-appendicitis" not in ids


def test_headache_is_not_neck_pain():
    top = retrieve("I have a persistent headache that won't go away.", top_k=1)
    assert top[0].condition.id in {"neuro-tension-headache", "neuro-migraine"}


@pytest.mark.parametrize(
    ("words", "same"),
    [
        (("spins", "spinning", "spin"), True),
        (("aches", "aching", "ache"), True),
        (("infections", "infection"), True),
        (("dizziness", "dizzy"), False),
    ],
)
def test_stem_groups_word_forms(words, same):
    assert (len({stem(w) for w in words}) == 1) is same
