"""Pydantic schemas for authentication endpoints."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

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
    is_active: bool
    is_verified: bool
    created_at: datetime


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
