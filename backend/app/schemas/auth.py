"""Pydantic schemas for authentication endpoints."""

import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.common import UTCDateTime

# Clinical sex: it decides which conditions are possible, so only these two.
Sex = Literal["male", "female"]


def _normalise_sex(value):
    return value.strip().lower() if isinstance(value, str) else value


# ─── Request Schemas ──────────────────────────────


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password must be 8-128 characters",
    )
    full_name: str = Field(..., min_length=2, max_length=100)
    sex: Sex

    _sex = field_validator("sex", mode="before")(_normalise_sex)

    @field_validator("full_name")
    @classmethod
    def _name_not_blank(cls, value: str) -> str:
        value = " ".join(value.split())
        if len(value) < 2:
            raise ValueError("Name must have at least 2 visible characters")
        return value


class UserUpdateRequest(BaseModel):
    """What a signed-in user may change about their own account."""

    sex: Sex

    _sex = field_validator("sex", mode="before")(_normalise_sex)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    # In the body, never the URL: query strings end up in access logs and history.
    refresh_token: str = Field(..., min_length=1, max_length=4096)


# ─── Response Schemas ─────────────────────────────


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    sex: Sex | None = None
    is_active: bool
    is_verified: bool
    created_at: UTCDateTime


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str  # user_id
    exp: int
    type: str  # "access" or "refresh"


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse
    message: str = "Success"
