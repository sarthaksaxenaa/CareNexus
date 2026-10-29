"""Pydantic schemas for health profile endpoints."""

import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.common import UTCDateTime

BLOOD_GROUPS = frozenset({"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"})


class HealthProfileCreateRequest(BaseModel):
    age: int | None = Field(None, ge=0, le=150, description="Patient's age")
    gender: str | None = Field(None, max_length=20)
    blood_group: str | None = Field(
        None, max_length=10, description="e.g., A+, B-, O+, AB+"
    )
    known_conditions: str | None = Field(
        None, max_length=2000, description="Known medical conditions"
    )
    current_medications: str | None = Field(
        None, max_length=2000, description="Current medications"
    )
    allergies: str | None = Field(None, max_length=2000, description="Known allergies")

    @field_validator("blood_group", mode="before")
    @classmethod
    def _blood_group(cls, value: object) -> object:
        if value is None:
            return None
        text = str(value).strip().upper().replace(" ", "")
        if not text:
            return None
        if text not in BLOOD_GROUPS:
            raise ValueError(
                "Blood group must be one of " + ", ".join(sorted(BLOOD_GROUPS))
            )
        return text

    @field_validator(
        "gender", "known_conditions", "current_medications", "allergies", mode="before"
    )
    @classmethod
    def _blank_is_none(cls, value: object) -> object:
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class HealthProfileUpdateRequest(HealthProfileCreateRequest):
    """Same fields and rules. On update, a field sent as null is cleared and
    a field left out is kept (the route uses exclude_unset)."""


class HealthProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    age: int | None
    gender: str | None
    blood_group: str | None
    known_conditions: str | None
    current_medications: str | None
    allergies: str | None
    created_at: UTCDateTime
    updated_at: UTCDateTime
