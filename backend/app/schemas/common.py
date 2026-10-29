"""Shared schema types."""

from datetime import UTC, datetime
from typing import Annotated

from pydantic import AfterValidator


def _as_utc(value: datetime) -> datetime:
    # The database stores naive UTC; mark it so JSON carries the offset ("...Z").
    # Without it, browsers read the time as local (5 h 30 off in India).
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


UTCDateTime = Annotated[datetime, AfterValidator(_as_utc)]
