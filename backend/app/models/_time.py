"""Timestamp helper shared by the models."""

from datetime import UTC, datetime


def utcnow() -> datetime:
    """Current UTC time as a *naive* datetime.

    Columns are plain ``TIMESTAMP`` (no zone), so the stored value must be
    naive. SQLite accepts an aware value there but PostgreSQL rejects it.
    The API layer re-attaches the UTC offset when serialising (UTCDateTime).
    """
    return datetime.now(UTC).replace(tzinfo=None)
