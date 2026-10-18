"""RAG retriever — builds grounded context from medical knowledge base.

This module bridges the vectorizer and the triage engine by:
1. Accepting a user query (symptom description)
2. Retrieving the most relevant medical conditions
3. Formatting retrieved knowledge into LLM-ready context blocks

The retriever produces structured context that the LLM can reference
for evidence-based, grounded responses — reducing hallucination and
improving triage accuracy.
"""

import logging
from dataclasses import dataclass

from app.rag.knowledge_base import MedicalCondition
from app.rag.vectorizer import get_vectorizer

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class RetrievalResult:
    """A single retrieval result with condition and relevance metadata.

    Attributes:
        condition: The matched MedicalCondition.
        relevance_score: Cosine similarity score (0-1).
        context_block: Pre-formatted context string for LLM injection.
    """

    condition: MedicalCondition
    relevance_score: float
    context_block: str


def retrieve(
    query: str,
    top_k: int = 3,
    threshold: float = 0.08,
) -> list[RetrievalResult]:
    """Retrieve relevant medical conditions for a user query.

    Args:
        query: User's symptom description or health question.
        top_k: Maximum number of conditions to retrieve.
        threshold: Minimum relevance score to include a result.

    Returns:
        List of RetrievalResult objects sorted by relevance.
    """
    vectorizer = get_vectorizer()
    matches = vectorizer.search(query, top_k=top_k, threshold=threshold)

    results: list[RetrievalResult] = []
    for condition, score in matches:
        context_block = _format_context_block(condition, score)
        results.append(
            RetrievalResult(
                condition=condition,
                relevance_score=score,
                context_block=context_block,
            )
        )

    logger.info(
        f"RAG retrieved {len(results)} conditions for query: "
        f"'{query[:60]}...' | "
        f"Top match: {results[0].condition.name} ({results[0].relevance_score:.3f})"
        if results
        else f"RAG: no matches for query '{query[:60]}...'"
    )

    return results


def build_rag_context(query: str, top_k: int = 3) -> str:
    """Build a complete RAG context string for LLM prompt augmentation.

    This is the primary interface used by the triage engine. It returns
    a formatted string that can be injected into the LLM system prompt
    to ground responses in evidence-based medical knowledge.

    Args:
        query: User's symptom description.
        top_k: Number of conditions to include in context.

    Returns:
        Formatted context string, or empty string if no relevant matches.
    """
    results = retrieve(query, top_k=top_k)

    if not results:
        return ""

    context_parts = [
        "═══ RETRIEVED MEDICAL KNOWLEDGE (use as reference, do NOT copy verbatim) ═══",
        "",
    ]

    for i, result in enumerate(results, 1):
        context_parts.append(
            f"[{i}] {result.context_block}"
        )
        context_parts.append("")

    context_parts.extend([
        "═══ END MEDICAL KNOWLEDGE ═══",
        "",
        "INSTRUCTIONS: Use the above medical knowledge to inform your response. "
        "Do NOT copy text verbatim — synthesize and adapt to the patient's specific situation. "
        "Always recommend consulting a healthcare professional for proper diagnosis.",
    ])

    return "\n".join(context_parts)


def _format_context_block(condition: MedicalCondition, score: float) -> str:
    """Format a MedicalCondition into an LLM-readable context block."""
    parts = [
        f"Condition: {condition.name} (ICD: {condition.icd_code}) "
        f"[Relevance: {score:.1%}]",
        f"  Category: {condition.category}",
        f"  Severity: {condition.severity}",
        f"  Description: {condition.description}",
    ]

    if condition.symptoms:
        parts.append(f"  Common Symptoms: {', '.join(condition.symptoms[:8])}")

    if condition.red_flags:
        parts.append(f"  ⚠ Red Flags: {', '.join(condition.red_flags[:5])}")

    if condition.when_to_seek_help:
        parts.append(f"  When to Seek Help: {condition.when_to_seek_help[:200]}")

    if condition.first_aid:
        parts.append(f"  First Aid: {condition.first_aid[:200]}")

    return "\n".join(parts)


def get_retrieval_stats() -> dict:
    """Return statistics about the retrieval index for monitoring."""
    vectorizer = get_vectorizer()
    return {
        "indexed_conditions": vectorizer.document_count,
        "vocabulary_size": vectorizer.vocabulary_size,
        "categories": list(
            {c.category for c in vectorizer._conditions}
        ),
    }
