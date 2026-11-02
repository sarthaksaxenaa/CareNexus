"""Database URL normalisation for the async drivers."""

import pytest

from app.core.config import Settings
from app.core.database import build_engine, to_async_url


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


@pytest.mark.parametrize(
    "bad",
    [
        # Pasted with the quotes from a psql snippet: unparseable, and SQLAlchemy's
        # own error would repeat the whole string, password included.
        "'postgresql://neondb_owner:s3cr3t-Pa55@ep-x.neon.tech/neondb'",
        "postgresql://neondb_owner:s3cr3t-Pa55@ep-x.neon.tech:port/neondb",
        "Paste the connection string here",
        "",
    ],
)
def test_invalid_database_url_error_never_echoes_the_value(bad):
    """A mistyped DATABASE_URL must not print its password into the logs."""
    with pytest.raises(RuntimeError) as excinfo:
        build_engine(bad)
    message = str(excinfo.value)
    assert "DATABASE_URL" in message
    assert "s3cr3t" not in message
    assert "connection string here" not in message
    assert excinfo.value.__cause__ is None  # the original error repeats the URL
    assert excinfo.value.__suppress_context__
