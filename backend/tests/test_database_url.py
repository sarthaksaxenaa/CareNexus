"""Database URL normalisation for the async drivers."""

import pytest

from app.core.config import Settings
from app.core.database import to_async_url


@pytest.mark.parametrize(
    ("given", "expected"),
    [
        ("sqlite:///./carenexus.db", "sqlite+aiosqlite:///./carenexus.db"),
        ("postgresql://u:p@h:5432/db", "postgresql+asyncpg://u:p@h:5432/db"),
        ("postgres://u:p@h:5432/db", "postgresql+asyncpg://u:p@h:5432/db"),
        ("postgresql+asyncpg://u:p@h/db", "postgresql+asyncpg://u:p@h/db"),
        ("sqlite+aiosqlite:///:memory:", "sqlite+aiosqlite:///:memory:"),
    ],
)
def test_to_async_url(given, expected):
    assert to_async_url(given) == expected


def test_default_database_needs_no_server():
    """A fresh clone must start without Postgres running."""
    default = Settings.model_fields["DATABASE_URL"].default
    assert default.startswith("sqlite:///")


@pytest.mark.parametrize(
    ("given", "expected"),
    [
        # Neon / Render / Supabase hand out libpq-style options asyncpg rejects.
        (
            "postgresql://u:p@h/db?sslmode=require&channel_binding=require",
            "postgresql+asyncpg://u:p@h/db?ssl=require",
        ),
        (
            "postgres://u:p@h/db?sslmode=verify-full",
            "postgresql+asyncpg://u:p@h/db?ssl=verify-full",
        ),
        (
            "postgresql://u:p@h/db?sslmode=disable",
            "postgresql+asyncpg://u:p@h/db?ssl=disable",
        ),
        # Unrelated options are kept; an explicit ssl wins over sslmode.
        (
            "postgresql://u:p@h/db?application_name=cn&sslmode=require",
            "postgresql+asyncpg://u:p@h/db?application_name=cn&ssl=require",
        ),
        (
            "postgresql://u:p@h/db?ssl=prefer&sslmode=require",
            "postgresql+asyncpg://u:p@h/db?ssl=prefer",
        ),
    ],
)
def test_to_async_url_translates_libpq_ssl_options(given, expected):
    assert to_async_url(given) == expected
