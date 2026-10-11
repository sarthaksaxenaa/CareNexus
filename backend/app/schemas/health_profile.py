"""Pydantic schemas for health profile endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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


class HealthProfileUpdateRequest(BaseModel):
    age: int | None = Field(None, ge=0, le=150)
    gender: str | None = Field(None, max_length=20)
    blood_group: str | None = Field(None, max_length=10)
    known_conditions: str | None = Field(None, max_length=2000)
    current_medications: str | None = Field(None, max_length=2000)
    allergies: str | None = Field(None, max_length=2000)


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
    created_at: datetime
    updated_at: datetime
