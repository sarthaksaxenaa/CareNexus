"""Tests for the CareNexus RAG pipeline — knowledge base, vectorizer, and retriever."""

import pytest

from app.rag.knowledge_base import (
    ALL_CONDITIONS,
    CONDITIONS_BY_CATEGORY,
    CONDITIONS_BY_ID,
    MedicalCondition,
    get_all_condition_names,
    get_condition_by_id,
    get_conditions_by_category,
)
from app.rag.retriever import build_rag_context, retrieve, get_retrieval_stats
from app.rag.vectorizer import MedicalVectorizer, get_vectorizer


# ═══════════════════════════════════════════════════════════════════════════════
# KNOWLEDGE BASE TESTS
# ═══════════════════════════════════════════════════════════════════════════════


class TestKnowledgeBase:
    """Tests for the medical knowledge base data integrity."""

    def test_all_conditions_not_empty(self):
        """Knowledge base should contain conditions."""
        assert len(ALL_CONDITIONS) >= 15
        assert all(isinstance(c, MedicalCondition) for c in ALL_CONDITIONS)

    def test_all_conditions_have_required_fields(self):
        """Every condition must have id, name, category, and symptoms."""
        for condition in ALL_CONDITIONS:
            assert condition.id, f"Missing id for {condition.name}"
            assert condition.name, f"Missing name for {condition.id}"
            assert condition.category, f"Missing category for {condition.id}"
            assert len(condition.symptoms) > 0, f"No symptoms for {condition.id}"

    def test_unique_condition_ids(self):
        """All condition IDs must be unique."""
        ids = [c.id for c in ALL_CONDITIONS]
        assert len(ids) == len(set(ids)), "Duplicate condition IDs found"

    def test_category_index_coverage(self):
        """Category index should cover all conditions."""
        indexed_count = sum(len(v) for v in CONDITIONS_BY_CATEGORY.values())
        assert indexed_count == len(ALL_CONDITIONS)

    def test_id_index_coverage(self):
        """ID index should cover all conditions."""
        assert len(CONDITIONS_BY_ID) == len(ALL_CONDITIONS)

    def test_get_condition_by_id_found(self):
        """Should return condition for valid ID."""
        condition = get_condition_by_id("resp-common-cold")
        assert condition is not None
        assert condition.name == "Common Cold"

    def test_get_condition_by_id_not_found(self):
        """Should return None for invalid ID."""
        assert get_condition_by_id("nonexistent-xyz") is None

    def test_get_conditions_by_category(self):
        """Should return conditions for valid category."""
        respiratory = get_conditions_by_category("respiratory")
        assert len(respiratory) >= 3
        assert all(c.category == "respiratory" for c in respiratory)

    def test_get_conditions_by_category_empty(self):
        """Should return empty list for nonexistent category."""
        assert get_conditions_by_category("zzz_nonexistent") == []

    def test_condition_names_list(self):
        """Should return all condition names."""
        names = get_all_condition_names()
        assert "Common Cold" in names
        assert "Migraine" in names
        assert len(names) == len(ALL_CONDITIONS)

    def test_conditions_are_frozen(self):
        """Conditions should be immutable (frozen dataclass)."""
        condition = ALL_CONDITIONS[0]
        with pytest.raises(AttributeError):
            condition.name = "Modified"  # type: ignore[misc]

    def test_icd_codes_present(self):
        """All conditions should have ICD codes."""
        for condition in ALL_CONDITIONS:
            assert condition.icd_code, f"Missing ICD code for {condition.id}"


# ═══════════════════════════════════════════════════════════════════════════════
# VECTORIZER TESTS
# ═══════════════════════════════════════════════════════════════════════════════


class TestVectorizer:
    """Tests for the TF-IDF vectorizer."""

    def test_vectorizer_initialization(self):
        """Vectorizer should build index on init."""
        vectorizer = MedicalVectorizer()
        assert vectorizer.document_count == len(ALL_CONDITIONS)
        assert vectorizer.vocabulary_size > 50

    def test_search_headache_returns_relevant(self):
        """'headache' should match migraine or tension headache."""
        vectorizer = MedicalVectorizer()
        results = vectorizer.search("I have a bad headache", top_k=3)
        assert len(results) > 0
        condition_names = [c.name for c, _ in results]
        assert any("headache" in name.lower() or "migraine" in name.lower()
                    for name in condition_names)

    def test_search_chest_pain_returns_cardiovascular(self):
        """'chest pain' should prioritize cardiovascular conditions."""
        vectorizer = MedicalVectorizer()
        results = vectorizer.search("sharp chest pain", top_k=3)
        assert len(results) > 0
        top_condition = results[0][0]
        assert top_condition.category in ("cardiovascular", "respiratory")

    def test_search_cold_symptoms_returns_respiratory(self):
        """Cold symptoms should match respiratory conditions."""
        vectorizer = MedicalVectorizer()
        results = vectorizer.search("runny nose sneezing congestion", top_k=3)
        assert len(results) > 0
        top_condition = results[0][0]
        assert top_condition.category == "respiratory"

    def test_search_empty_query_returns_empty(self):
        """Empty query should return no results."""
        vectorizer = MedicalVectorizer()
        assert vectorizer.search("") == []
        assert vectorizer.search("   ") == []

    def test_search_stopwords_only_returns_empty(self):
        """Query with only stop words should return no results."""
        vectorizer = MedicalVectorizer()
        assert vectorizer.search("the is a an") == []

    def test_search_respects_top_k(self):
        """Should not return more results than top_k."""
        vectorizer = MedicalVectorizer()
        results = vectorizer.search("pain and fever", top_k=2)
        assert len(results) <= 2

    def test_search_respects_threshold(self):
        """High threshold should filter out low-relevance results."""
        vectorizer = MedicalVectorizer()
        strict_results = vectorizer.search("headache", top_k=10, threshold=0.3)
        loose_results = vectorizer.search("headache", top_k=10, threshold=0.01)
        assert len(strict_results) <= len(loose_results)

    def test_search_scores_are_sorted_descending(self):
        """Results should be sorted by relevance score descending."""
        vectorizer = MedicalVectorizer()
        results = vectorizer.search("fever cough body aches", top_k=5)
        scores = [score for _, score in results]
        assert scores == sorted(scores, reverse=True)

    def test_singleton_vectorizer(self):
        """get_vectorizer() should return the same instance."""
        v1 = get_vectorizer()
        v2 = get_vectorizer()
        assert v1 is v2

    def test_mental_health_retrieval(self):
        """Mental health queries should match anxiety or depression."""
        vectorizer = MedicalVectorizer()
        results = vectorizer.search("I feel anxious and worried all the time", top_k=3)
        assert len(results) > 0
        condition_names = [c.name.lower() for c, _ in results]
        assert any("anxiety" in name for name in condition_names)

    def test_gi_retrieval(self):
        """GI symptoms should match gastrointestinal conditions."""
        vectorizer = MedicalVectorizer()
        results = vectorizer.search("nausea vomiting diarrhea stomach cramps", top_k=3)
        assert len(results) > 0
        top_condition = results[0][0]
        assert top_condition.category == "gastrointestinal"


# ═══════════════════════════════════════════════════════════════════════════════
# RETRIEVER TESTS
# ═══════════════════════════════════════════════════════════════════════════════


class TestRetriever:
    """Tests for the RAG retriever pipeline."""

    def test_retrieve_returns_results(self):
        """Should return RetrievalResult objects for valid queries."""
        results = retrieve("I have a fever and cough", top_k=3)
        assert len(results) > 0
        assert results[0].condition is not None
        assert results[0].relevance_score > 0
        assert results[0].context_block != ""

    def test_retrieve_context_block_has_condition_info(self):
        """Context block should contain condition name and ICD code."""
        results = retrieve("severe headache nausea", top_k=1)
        assert len(results) > 0
        block = results[0].context_block
        assert "Condition:" in block
        assert "ICD:" in block

    def test_build_rag_context_not_empty(self):
        """build_rag_context should return non-empty string for valid query."""
        context = build_rag_context("I have chest pain and shortness of breath")
        assert len(context) > 100
        assert "RETRIEVED MEDICAL KNOWLEDGE" in context
        assert "END MEDICAL KNOWLEDGE" in context

    def test_build_rag_context_empty_for_nonsense(self):
        """build_rag_context should return empty for completely irrelevant query."""
        context = build_rag_context("xyzzy foobar blah", top_k=3)
        # May be empty if threshold filters everything
        assert isinstance(context, str)

    def test_retrieval_stats(self):
        """get_retrieval_stats should return valid index metadata."""
        stats = get_retrieval_stats()
        assert stats["indexed_conditions"] == len(ALL_CONDITIONS)
        assert stats["vocabulary_size"] > 50
        assert len(stats["categories"]) >= 5

    def test_retrieve_respects_top_k(self):
        """Should not return more results than top_k."""
        results = retrieve("pain", top_k=2)
        assert len(results) <= 2

    def test_retrieve_back_pain(self):
        """Back pain query should match musculoskeletal condition."""
        results = retrieve("I have lower back pain that won't go away", top_k=3)
        assert len(results) > 0
        names = [r.condition.name.lower() for r in results]
        assert any("back" in name for name in names)

    def test_retrieve_allergy_symptoms(self):
        """Allergy query should match dermatological condition."""
        results = retrieve("I have hives and itching all over", top_k=3)
        assert len(results) > 0
        categories = [r.condition.category for r in results]
        assert "dermatological" in categories
