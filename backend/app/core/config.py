"""Application configuration — loads and validates settings from environment variables."""

import logging

from pydantic import ConfigDict, model_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

# Published in the public repository, so it is not a secret. Used only as a
# development convenience; production must override it.
_INSECURE_SECRET_DEFAULT = "change-this-in-production-use-a-real-secret-key"
_PRODUCTION_ENVIRONMENTS = {"production", "prod"}
_MIN_SECRET_LENGTH = 32  # 256 bits is the HS256 key-size recommendation


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Configuration precedence:
        1. Environment variables (highest priority)
        2. .env file
        3. Default values (lowest priority)
    """

    # ─── Application ─────────────────────────────────────────
    APP_NAME: str = "CareNexus"
    APP_VERSION: str = "0.5.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # ─── Server ──────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # ─── Database ────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://medibot_user:medibot_pass@localhost:5432/medibot"

    # ─── Redis (optional) ────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379"

    # ─── CORS ────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # ─── JWT Authentication ──────────────────────────────────
    SECRET_KEY: str = _INSECURE_SECRET_DEFAULT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # ─── LLM Configuration ──────────────────────────────────
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    LLM_PROVIDER: str = "gemini"  # "gemini" | "openai"
    LLM_MODEL: str = "gemini-2.0-flash"
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 1000

    # ─── Rate Limiting ───────────────────────────────────────
    RATE_LIMIT_CHAT: int = 10  # requests per minute, per user
    RATE_LIMIT_AUTH: int = 5  # requests per minute, per IP
    # Only enable behind a reverse proxy you control that sets X-Forwarded-For.
    TRUST_PROXY_HEADERS: bool = False

    # ─── RAG Pipeline ────────────────────────────────────────
    RAG_TOP_K: int = 3
    RAG_THRESHOLD: float = 0.08

    model_config = ConfigDict(env_file=".env", case_sensitive=True)

    @model_validator(mode="after")
    def _require_real_secret_in_production(self) -> "Settings":
        """Fail fast: never sign production JWTs with a publicly known key."""
        if self.ENVIRONMENT.strip().lower() in _PRODUCTION_ENVIRONMENTS and (
            self.SECRET_KEY == _INSECURE_SECRET_DEFAULT
            or len(self.SECRET_KEY) < _MIN_SECRET_LENGTH
        ):
            raise ValueError(
                "SECRET_KEY must be set to a unique value of at least "
                f"{_MIN_SECRET_LENGTH} characters when ENVIRONMENT is production. "
                'Generate one with: python -c "import secrets; '
                'print(secrets.token_urlsafe(48))"'
            )
        return self

    @model_validator(mode="after")
    def _log_llm_status(self) -> "Settings":
        """Log LLM configuration status at startup."""
        if self.LLM_PROVIDER == "gemini" and self.GEMINI_API_KEY:
            logger.info(f"LLM: Gemini ({self.LLM_MODEL}) — API key configured ✓")
        elif self.LLM_PROVIDER == "openai" and self.OPENAI_API_KEY:
            logger.info(f"LLM: OpenAI ({self.LLM_MODEL}) — API key configured ✓")
        else:
            logger.warning(
                "LLM: No API key configured — using RAG + rule-based fallback only. "
                "Set GEMINI_API_KEY or OPENAI_API_KEY in .env for AI-powered responses."
            )
        return self


settings = Settings()
