"""Configuration safety: a production deploy must never run on a known secret.

The default SECRET_KEY is published in the public repository. If a deploy
forgets to set it, JWTs would be signed with a key anyone can read on GitHub,
so tokens become forgeable. The app must refuse to start instead of running
insecurely (fail fast beats a silent failure).
"""

import pytest
from pydantic import ValidationError

from app.core.config import Settings

PUBLISHED_DEFAULT = "change-this-in-production-use-a-real-secret-key"
STRONG = "k3Jx9-vQ2mT7pL0aZ8wR5nB1cY6dF4hG-sE3uI"  # 38 chars


class TestSecretKeyGuard:
    def test_production_rejects_published_default(self):
        with pytest.raises(ValidationError, match="SECRET_KEY"):
            Settings(ENVIRONMENT="production", SECRET_KEY=PUBLISHED_DEFAULT)

    def test_production_rejects_short_key(self):
        with pytest.raises(ValidationError, match="SECRET_KEY"):
            Settings(ENVIRONMENT="production", SECRET_KEY="short")

    def test_production_accepts_strong_key(self):
        s = Settings(ENVIRONMENT="production", SECRET_KEY=STRONG)
        assert s.SECRET_KEY == STRONG

    @pytest.mark.parametrize(
        "env", ["PRODUCTION", "Production", "prod", " production "]
    )
    def test_environment_name_is_case_and_whitespace_insensitive(self, env):
        """Negative-state: a casing slip must not bypass the guard."""
        with pytest.raises(ValidationError, match="SECRET_KEY"):
            Settings(ENVIRONMENT=env, SECRET_KEY=PUBLISHED_DEFAULT)

    def test_development_keeps_working_with_the_default(self):
        """Local dev and the test suite must not need a real secret."""
        s = Settings(ENVIRONMENT="development", SECRET_KEY=PUBLISHED_DEFAULT)
        assert s.ENVIRONMENT == "development"
