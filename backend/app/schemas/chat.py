"""Pydantic schemas for chat endpoints."""

import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.chat import MessageRole, TriageLevel
from app.schemas.common import UTCDateTime

# Same limit the sanitizer enforces after trimming; one number, one error.
MAX_MESSAGE_LENGTH = 2000

# ─── Request Schemas ──────────────────────────────


class SendMessageRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=MAX_MESSAGE_LENGTH,
        description="User's message",
    )
    session_id: uuid.UUID | None = Field(
        None, description="Existing session ID. If None, creates a new session."
    )


# ─── Response Schemas ─────────────────────────────


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: MessageRole
    content: str
    triage_level: TriageLevel | None = None
    sources: str | None = None
    created_at: UTCDateTime


class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    is_active: bool
    created_at: UTCDateTime
    updated_at: UTCDateTime
    message_count: int = 0


class ChatResponse(BaseModel):
    session_id: uuid.UUID
    user_message: MessageResponse
    assistant_message: MessageResponse
    disclaimer: str = "This is not medical advice. Please consult a healthcare professional for diagnosis and treatment."


class SessionListResponse(BaseModel):
    sessions: list[ChatSessionResponse]
    total: int
