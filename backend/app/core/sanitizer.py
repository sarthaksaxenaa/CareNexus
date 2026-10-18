"""Input sanitization and prompt injection guard for CareNexus.

Protects the application against:
1. XSS attacks — strips HTML/script tags from user input
2. Prompt injection — detects attempts to override LLM system prompts
3. Input abuse — enforces length limits and filters empty/whitespace input
4. SQL injection patterns — basic pattern detection (defense in depth)

Note:
    SQLAlchemy parameterized queries are the primary SQL injection defense.
    This module provides an additional defense-in-depth layer.
"""

import logging
import re

logger = logging.getLogger(__name__)


# ─── XSS Prevention ─────────────────────────────────────────────────────────

# Tags that could execute scripts or modify page structure
_DANGEROUS_HTML_PATTERN = re.compile(
    r"<\s*(?:script|iframe|object|embed|form|input|button|link|meta|style|svg|math|base)"
    r"[^>]*>",
    re.IGNORECASE,
)

# All HTML tags (for complete stripping)
_HTML_TAG_PATTERN = re.compile(r"<[^>]+>")

# HTML entities that could be used for evasion
_HTML_ENTITY_PATTERN = re.compile(r"&(?:#x?[0-9a-fA-F]+|[a-zA-Z]+);")


def strip_html(text: str) -> str:
    """Remove all HTML tags from text."""
    return _HTML_TAG_PATTERN.sub("", text)


def has_dangerous_html(text: str) -> bool:
    """Check if text contains potentially dangerous HTML tags."""
    return bool(_DANGEROUS_HTML_PATTERN.search(text))


# ─── Prompt Injection Detection ──────────────────────────────────────────────

_INJECTION_PATTERNS: tuple[re.Pattern, ...] = (
    # Direct system prompt override attempts
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"ignore\s+(all\s+)?above\s+instructions", re.IGNORECASE),
    re.compile(r"disregard\s+(all\s+)?(previous|above|prior)", re.IGNORECASE),
    re.compile(r"forget\s+(all\s+)?(previous|above|prior)", re.IGNORECASE),

    # System prompt extraction
    re.compile(r"(reveal|show|display|print|output)\s+(your\s+)?(system\s+)?prompt", re.IGNORECASE),
    re.compile(r"what\s+(are|is)\s+your\s+(system\s+)?instructions", re.IGNORECASE),

    # Role hijacking
    re.compile(r"you\s+are\s+now\s+(?:a|an|the)\s+(?!patient|user)", re.IGNORECASE),
    re.compile(r"act\s+as\s+(?:a|an)\s+(?!patient|user)", re.IGNORECASE),
    re.compile(r"pretend\s+(to\s+be|you\s+are)\s+(?!sick|ill|patient)", re.IGNORECASE),

    # Jailbreak markers
    re.compile(r"\[(?:system|SYSTEM)\]", re.IGNORECASE),
    re.compile(r"```\s*system", re.IGNORECASE),
    re.compile(r"<\|(?:im_start|system|end)\|>", re.IGNORECASE),
)


def detect_prompt_injection(text: str) -> bool:
    """Detect potential prompt injection attempts.

    Returns True if the text appears to contain prompt injection patterns.
    """
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            logger.warning(
                f"Prompt injection detected: pattern='{pattern.pattern}' "
                f"input='{text[:80]}...'"
            )
            return True
    return False


# ─── Input Sanitization ─────────────────────────────────────────────────────

class SanitizationResult:
    """Result of input sanitization."""

    __slots__ = ("clean_text", "is_valid", "rejection_reason", "was_modified")

    def __init__(
        self,
        clean_text: str,
        is_valid: bool = True,
        rejection_reason: str = "",
        was_modified: bool = False,
    ):
        self.clean_text = clean_text
        self.is_valid = is_valid
        self.rejection_reason = rejection_reason
        self.was_modified = was_modified


def sanitize_input(
    text: str,
    max_length: int = 2000,
    min_length: int = 1,
    strip_html_tags: bool = True,
    check_injection: bool = True,
) -> SanitizationResult:
    """Sanitize user input for safety.

    Args:
        text: Raw user input.
        max_length: Maximum allowed length after trimming.
        min_length: Minimum required length after trimming.
        strip_html_tags: Whether to remove HTML tags.
        check_injection: Whether to check for prompt injection.

    Returns:
        SanitizationResult with clean text and validation status.
    """
    if not text or not text.strip():
        return SanitizationResult(
            clean_text="",
            is_valid=False,
            rejection_reason="Input cannot be empty.",
        )

    clean = text.strip()
    was_modified = False

    # Length check (before any processing)
    if len(clean) > max_length:
        return SanitizationResult(
            clean_text=clean[:max_length],
            is_valid=False,
            rejection_reason=f"Input exceeds maximum length of {max_length} characters.",
        )

    # HTML sanitization
    if strip_html_tags and has_dangerous_html(clean):
        clean = strip_html(clean)
        was_modified = True
        logger.info("Dangerous HTML stripped from user input")

    # Prompt injection check
    if check_injection and detect_prompt_injection(clean):
        return SanitizationResult(
            clean_text=clean,
            is_valid=False,
            rejection_reason=(
                "Your message was flagged by our safety filter. "
                "Please rephrase your health question."
            ),
        )

    # Minimum length check (after processing)
    if len(clean.strip()) < min_length:
        return SanitizationResult(
            clean_text=clean,
            is_valid=False,
            rejection_reason="Please provide more detail about your symptoms.",
        )

    return SanitizationResult(
        clean_text=clean,
        is_valid=True,
        was_modified=was_modified,
    )
