"""LLM Service — production-grade abstraction over LLM providers.

Supports Google Gemini and OpenAI with:
- Automatic retry with exponential backoff
- Rate limiting awareness
- Structured JSON output parsing
- Provider-agnostic interface
- Graceful degradation to rule-based fallback

Architecture:
    LLMService (abstract)
    ├── GeminiService (Google Gemini API)
    └── OpenAIService (OpenAI API)

Usage:
    service = get_llm_service()
    response = await service.generate(messages, temperature=0.3)
"""

import asyncio
import json
import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# DATA MODELS
# ═══════════════════════════════════════════════════════════════════════════════


@dataclass(slots=True)
class LLMResponse:
    """Structured response from an LLM provider.

    Attributes:
        content: Raw text content from the LLM.
        parsed: Parsed JSON if response contained structured data.
        model: Model identifier used for generation.
        latency_ms: Round-trip time in milliseconds.
        tokens_used: Approximate token count (if available).
        provider: Provider name ('gemini', 'openai', 'fallback').
    """

    content: str
    parsed: dict[str, Any] | None = None
    model: str = ""
    latency_ms: float = 0.0
    tokens_used: int = 0
    provider: str = ""


@dataclass(slots=True)
class RetryConfig:
    """Configuration for retry behavior.

    Attributes:
        max_retries: Maximum number of retry attempts.
        base_delay: Initial delay in seconds before first retry.
        max_delay: Maximum delay cap in seconds.
        backoff_factor: Multiplier applied to delay after each retry.
    """

    max_retries: int = 3
    base_delay: float = 1.0
    max_delay: float = 30.0
    backoff_factor: float = 2.0


# ═══════════════════════════════════════════════════════════════════════════════
# ABSTRACT LLM SERVICE
# ═══════════════════════════════════════════════════════════════════════════════


class LLMService(ABC):
    """Abstract base class for LLM service providers."""

    def __init__(self, retry_config: RetryConfig | None = None) -> None:
        self.retry_config = retry_config or RetryConfig()
        self._request_count = 0
        self._error_count = 0

    @abstractmethod
    async def _call_api(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000,
    ) -> str:
        """Make the actual API call. Implemented by subclasses."""
        ...

    @abstractmethod
    def provider_name(self) -> str:
        """Return the provider identifier."""
        ...

    async def generate(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000,
    ) -> LLMResponse:
        """Generate a response with automatic retry and error handling.

        Args:
            messages: Conversation messages in [{"role": ..., "content": ...}] format.
            temperature: Sampling temperature (0.0-1.0). Lower = more deterministic.
            max_tokens: Maximum tokens in the response.

        Returns:
            LLMResponse with content and metadata.

        Raises:
            LLMServiceError: If all retries are exhausted.
        """
        last_error: Exception | None = None
        delay = self.retry_config.base_delay

        for attempt in range(1, self.retry_config.max_retries + 1):
            try:
                start_time = time.perf_counter()
                self._request_count += 1

                content = await self._call_api(messages, temperature, max_tokens)
                latency = (time.perf_counter() - start_time) * 1000

                parsed = self._try_parse_json(content)

                logger.info(
                    f"LLM [{self.provider_name()}] responded in {latency:.0f}ms "
                    f"(attempt {attempt})"
                )

                return LLMResponse(
                    content=content,
                    parsed=parsed,
                    model=self._get_model_name(),
                    latency_ms=round(latency, 1),
                    provider=self.provider_name(),
                )

            except Exception as e:
                self._error_count += 1
                last_error = e
                logger.warning(
                    f"LLM [{self.provider_name()}] attempt {attempt}/{self.retry_config.max_retries} "
                    f"failed: {e}"
                )

                if attempt < self.retry_config.max_retries:
                    jittered_delay = delay + (delay * 0.1 * (attempt % 3))
                    await asyncio.sleep(jittered_delay)
                    delay = min(
                        delay * self.retry_config.backoff_factor,
                        self.retry_config.max_delay,
                    )

        raise LLMServiceError(
            f"All {self.retry_config.max_retries} retries exhausted for "
            f"{self.provider_name()}: {last_error}"
        )

    @abstractmethod
    def _get_model_name(self) -> str:
        """Return the model name being used."""
        ...

    @staticmethod
    def _try_parse_json(content: str) -> dict[str, Any] | None:
        """Attempt to extract and parse JSON from LLM response."""
        try:
            if "```json" in content:
                json_str = content.split("```json")[1].split("```")[0].strip()
            elif "{" in content and "}" in content:
                start = content.index("{")
                end = content.rindex("}") + 1
                json_str = content[start:end]
            else:
                return None

            return json.loads(json_str)
        except (json.JSONDecodeError, ValueError, IndexError):
            return None

    def get_stats(self) -> dict[str, Any]:
        """Return service statistics for monitoring."""
        return {
            "provider": self.provider_name(),
            "total_requests": self._request_count,
            "total_errors": self._error_count,
            "error_rate": (
                round(self._error_count / self._request_count, 3)
                if self._request_count > 0
                else 0.0
            ),
        }


class LLMServiceError(Exception):
    """Raised when LLM service fails after all retries."""


# ═══════════════════════════════════════════════════════════════════════════════
# GEMINI SERVICE
# ═══════════════════════════════════════════════════════════════════════════════


class GeminiService(LLMService):
    """Google Gemini API service with retry and structured output."""

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-2.0-flash",
        retry_config: RetryConfig | None = None,
    ) -> None:
        super().__init__(retry_config)
        self._api_key = api_key
        self._model = model
        self._client = None

    def _get_client(self):
        """Lazy-initialize the Gemini client."""
        if self._client is None:
            try:
                from google import genai

                self._client = genai.Client(api_key=self._api_key)
            except ImportError:
                raise LLMServiceError(
                    "google-genai package not installed. "
                    "Install with: pip install google-genai"
                )
        return self._client

    async def _call_api(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000,
    ) -> str:
        """Call Gemini API for content generation."""
        client = self._get_client()

        # Build prompt from messages (Gemini uses a flat prompt)
        prompt_parts = []
        for msg in messages:
            role_prefix = msg["role"].upper()
            prompt_parts.append(f"[{role_prefix}]\n{msg['content']}")

        prompt = "\n\n".join(prompt_parts)

        # Run synchronous Gemini call in executor to avoid blocking
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model=self._model,
                contents=prompt,
                config={
                    "temperature": temperature,
                    "max_output_tokens": max_tokens,
                },
            ),
        )

        if not response.text:
            raise LLMServiceError("Gemini returned empty response")

        return response.text

    def provider_name(self) -> str:
        return "gemini"

    def _get_model_name(self) -> str:
        return self._model


# ═══════════════════════════════════════════════════════════════════════════════
# OPENAI SERVICE
# ═══════════════════════════════════════════════════════════════════════════════


class OpenAIService(LLMService):
    """OpenAI API service with retry and structured output."""

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o-mini",
        retry_config: RetryConfig | None = None,
    ) -> None:
        super().__init__(retry_config)
        self._api_key = api_key
        self._model = model
        self._client = None

    def _get_client(self):
        """Lazy-initialize the OpenAI client."""
        if self._client is None:
            try:
                import openai

                self._client = openai.AsyncOpenAI(api_key=self._api_key)
            except ImportError:
                raise LLMServiceError(
                    "openai package not installed. Install with: pip install openai"
                )
        return self._client

    async def _call_api(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 1000,
    ) -> str:
        """Call OpenAI API for chat completion."""
        client = self._get_client()

        response = await client.chat.completions.create(
            model=self._model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        content = response.choices[0].message.content
        if not content:
            raise LLMServiceError("OpenAI returned empty response")

        return content

    def provider_name(self) -> str:
        return "openai"

    def _get_model_name(self) -> str:
        return self._model


# ═══════════════════════════════════════════════════════════════════════════════
# SERVICE FACTORY
# ═══════════════════════════════════════════════════════════════════════════════

_llm_service: LLMService | None = None


def get_llm_service() -> LLMService | None:
    """Get or create the LLM service based on application configuration.

    Returns the appropriate LLM service, or None if no API key is configured.
    Uses a singleton pattern for efficiency.
    """
    global _llm_service
    if _llm_service is not None:
        return _llm_service

    from app.core.config import settings

    if settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        _llm_service = GeminiService(
            api_key=settings.GEMINI_API_KEY,
            model=settings.LLM_MODEL or "gemini-2.0-flash",
        )
        logger.info(f"LLM service initialized: Gemini ({settings.LLM_MODEL})")
    elif settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        _llm_service = OpenAIService(
            api_key=settings.OPENAI_API_KEY,
            model=settings.LLM_MODEL or "gpt-4o-mini",
        )
        logger.info(f"LLM service initialized: OpenAI ({settings.LLM_MODEL})")
    else:
        logger.info("No LLM API key configured — using rule-based fallback only")
        return None

    return _llm_service


def reset_llm_service() -> None:
    """Reset the LLM service singleton. Used for testing."""
    global _llm_service
    _llm_service = None
