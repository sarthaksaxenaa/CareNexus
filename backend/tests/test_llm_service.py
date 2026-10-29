"""Tests for the LLM service abstraction layer."""

import pytest

from app.services.llm_service import (
    GeminiService,
    LLMResponse,
    LLMService,
    LLMServiceError,
    OpenAIService,
    RetryConfig,
    reset_llm_service,
)

# ═══════════════════════════════════════════════════════════════════════════════
# RETRY CONFIG TESTS
# ═══════════════════════════════════════════════════════════════════════════════


class TestRetryConfig:
    """Tests for retry configuration."""

    def test_default_retry_config(self):
        """Default config should have sensible defaults."""
        config = RetryConfig()
        assert config.max_retries == 3
        assert config.base_delay == 1.0
        assert config.max_delay == 30.0
        assert config.backoff_factor == 2.0

    def test_custom_retry_config(self):
        """Custom config should override defaults."""
        config = RetryConfig(max_retries=5, base_delay=0.5)
        assert config.max_retries == 5
        assert config.base_delay == 0.5


# ═══════════════════════════════════════════════════════════════════════════════
# LLM RESPONSE TESTS
# ═══════════════════════════════════════════════════════════════════════════════


class TestLLMResponse:
    """Tests for the LLMResponse dataclass."""

    def test_response_creation(self):
        """Should create response with all fields."""
        response = LLMResponse(
            content="Hello",
            parsed={"key": "value"},
            model="gemini-2.0-flash",
            latency_ms=150.5,
            provider="gemini",
        )
        assert response.content == "Hello"
        assert response.parsed == {"key": "value"}
        assert response.model == "gemini-2.0-flash"
        assert response.latency_ms == 150.5
        assert response.provider == "gemini"

    def test_response_defaults(self):
        """Should have sensible defaults."""
        response = LLMResponse(content="Test")
        assert response.parsed is None
        assert response.model == ""
        assert response.latency_ms == 0.0
        assert response.tokens_used == 0
        assert response.provider == ""


# ═══════════════════════════════════════════════════════════════════════════════
# JSON PARSING TESTS
# ═══════════════════════════════════════════════════════════════════════════════


class TestJSONParsing:
    """Tests for LLM response JSON extraction."""

    def test_parse_json_code_block(self):
        """Should extract JSON from markdown code block."""
        content = 'Some text\n```json\n{"response": "hello", "triage_level": "green"}\n```\nMore text'
        result = LLMService._try_parse_json(content)
        assert result is not None
        assert result["response"] == "hello"
        assert result["triage_level"] == "green"

    def test_parse_inline_json(self):
        """Should extract inline JSON from response."""
        content = 'Here is my analysis: {"response": "test", "triage_level": "yellow"}'
        result = LLMService._try_parse_json(content)
        assert result is not None
        assert result["triage_level"] == "yellow"

    def test_parse_no_json(self):
        """Should return None when no JSON is present."""
        content = "This is a plain text response without any JSON."
        result = LLMService._try_parse_json(content)
        assert result is None

    def test_parse_invalid_json(self):
        """Should return None for malformed JSON."""
        content = '{"broken json here'
        result = LLMService._try_parse_json(content)
        assert result is None

    def test_parse_nested_json(self):
        """Should handle nested JSON structures."""
        content = '{"response": "test", "sources": {"name": "WHO", "year": 2024}}'
        result = LLMService._try_parse_json(content)
        assert result is not None
        assert result["sources"]["name"] == "WHO"


# ═══════════════════════════════════════════════════════════════════════════════
# SERVICE INITIALIZATION TESTS
# ═══════════════════════════════════════════════════════════════════════════════


class TestServiceInit:
    """Tests for service initialization and configuration."""

    def test_gemini_service_creation(self):
        """Should create GeminiService with API key."""
        service = GeminiService(api_key="test-key", model="gemini-2.0-flash")
        assert service.provider_name() == "gemini"
        assert service._get_model_name() == "gemini-2.0-flash"

    def test_openai_service_creation(self):
        """Should create OpenAIService with API key."""
        service = OpenAIService(api_key="test-key", model="gpt-4o-mini")
        assert service.provider_name() == "openai"
        assert service._get_model_name() == "gpt-4o-mini"

    def test_service_stats_initial(self):
        """Service stats should start at zero."""
        service = GeminiService(api_key="test")
        stats = service.get_stats()
        assert stats["total_requests"] == 0
        assert stats["total_errors"] == 0
        assert stats["error_rate"] == 0.0
        assert stats["provider"] == "gemini"

    def test_custom_retry_config_on_service(self):
        """Should apply custom retry config."""
        config = RetryConfig(max_retries=5, base_delay=2.0)
        service = GeminiService(api_key="test", retry_config=config)
        assert service.retry_config.max_retries == 5
        assert service.retry_config.base_delay == 2.0

    def test_reset_llm_service(self):
        """reset_llm_service should clear the singleton."""
        reset_llm_service()
        # Should not raise — just clears the cached instance


# ═══════════════════════════════════════════════════════════════════════════════
# ERROR HANDLING TESTS
# ═══════════════════════════════════════════════════════════════════════════════


class TestErrorHandling:
    """Tests for error handling and retry logic."""

    @pytest.mark.asyncio
    async def test_generate_retries_exhausted(self):
        """Should raise LLMServiceError when all retries fail."""

        class FailingService(LLMService):
            async def _call_api(self, messages, temperature=0.3, max_tokens=1000):
                raise ConnectionError("API down")

            def provider_name(self):
                return "test"

            def _get_model_name(self):
                return "test-model"

        service = FailingService(
            retry_config=RetryConfig(max_retries=2, base_delay=0.01, max_delay=0.02)
        )

        with pytest.raises(LLMServiceError, match="retries exhausted"):
            await service.generate([{"role": "user", "content": "test"}])

        assert service._error_count == 2

    @pytest.mark.asyncio
    async def test_generate_succeeds_after_retry(self):
        """Should succeed if API recovers within retry window."""
        attempt_count = 0

        class FlakeyService(LLMService):
            async def _call_api(self, messages, temperature=0.3, max_tokens=1000):
                nonlocal attempt_count
                attempt_count += 1
                if attempt_count < 3:
                    raise ConnectionError("Temporary failure")
                return '{"response": "recovered", "triage_level": "green"}'

            def provider_name(self):
                return "test"

            def _get_model_name(self):
                return "test-model"

        service = FlakeyService(
            retry_config=RetryConfig(max_retries=3, base_delay=0.01, max_delay=0.02)
        )

        response = await service.generate([{"role": "user", "content": "test"}])
        assert response.content == '{"response": "recovered", "triage_level": "green"}'
        assert response.parsed is not None
        assert response.parsed["triage_level"] == "green"
        assert attempt_count == 3


# ═══════════════════════════════════════════════════════════════════════════════
# PROVIDER / MODEL SELECTION
# ═══════════════════════════════════════════════════════════════════════════════


class TestModelSelection:
    """Each provider gets its own default model; LLM_MODEL overrides it."""

    @pytest.fixture(autouse=True)
    def _fresh(self, monkeypatch):
        from app.core.config import settings

        monkeypatch.setattr(settings, "LLM_MODEL", "")
        monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
        monkeypatch.setattr(settings, "OPENAI_API_KEY", "")
        reset_llm_service()
        yield settings
        reset_llm_service()

    def test_openai_default_is_an_openai_model(self, _fresh, monkeypatch):
        from app.services.llm_service import DEFAULT_OPENAI_MODEL, get_llm_service

        monkeypatch.setattr(_fresh, "LLM_PROVIDER", "openai")
        monkeypatch.setattr(_fresh, "OPENAI_API_KEY", "sk-test")
        service = get_llm_service()
        assert isinstance(service, OpenAIService)
        assert service._model == DEFAULT_OPENAI_MODEL

    def test_gemini_default_is_not_a_retired_model(self, _fresh, monkeypatch):
        from app.services.llm_service import DEFAULT_GEMINI_MODEL, get_llm_service

        monkeypatch.setattr(_fresh, "LLM_PROVIDER", "gemini")
        monkeypatch.setattr(_fresh, "GEMINI_API_KEY", "g-test")
        service = get_llm_service()
        assert isinstance(service, GeminiService)
        assert service._model == DEFAULT_GEMINI_MODEL
        assert not DEFAULT_GEMINI_MODEL.startswith("gemini-2.0")

    def test_explicit_model_wins(self, _fresh, monkeypatch):
        from app.services.llm_service import get_llm_service

        monkeypatch.setattr(_fresh, "LLM_PROVIDER", "gemini")
        monkeypatch.setattr(_fresh, "GEMINI_API_KEY", "g-test")
        monkeypatch.setattr(_fresh, "LLM_MODEL", "gemini-custom")
        assert get_llm_service()._model == "gemini-custom"
