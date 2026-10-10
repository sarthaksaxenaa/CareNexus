"""Chat routes — send messages, manage sessions, get history."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.triage.engine import analyze_symptoms
from app.models.chat import MessageRole
from app.models.user import User
from app.schemas.chat import (
    ChatResponse,
    ChatSessionResponse,
    MessageResponse,
    SendMessageRequest,
    SessionListResponse,
)
from app.services.chat_service import (
    add_message,
    create_session,
    get_session,
    get_session_messages,
    get_user_sessions,
)

router = APIRouter()


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message to CareNexus AI and receive a triage response."""
    # Get or create session
    if request.session_id:
        session = await get_session(db, request.session_id, current_user.id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found",
            )
    else:
        # Create new session with first few words as title
        title = request.message[:50].strip() + (
            "..." if len(request.message) > 50 else ""
        )
        session = await create_session(db, current_user.id, title)

    # Save user message
    user_msg = await add_message(db, session.id, MessageRole.USER, request.message)

    # Get conversation history for context
    history = await get_session_messages(db, session.id)

    # Analyze symptoms and generate AI response
    ai_result = await analyze_symptoms(request.message, history)

    # Save assistant message
    assistant_msg = await add_message(
        db,
        session.id,
        MessageRole.ASSISTANT,
        ai_result["response"],
        triage_level=ai_result.get("triage_level"),
        sources=ai_result.get("sources"),
    )

    return ChatResponse(
        session_id=session.id,
        user_message=MessageResponse.model_validate(user_msg),
        assistant_message=MessageResponse.model_validate(assistant_msg),
    )


@router.get("/sessions", response_model=SessionListResponse)
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all chat sessions for the current user."""
    sessions = await get_user_sessions(db, current_user.id)
    return SessionListResponse(
        sessions=[ChatSessionResponse(**s) for s in sessions],
        total=len(sessions),
    )


@router.get("/sessions/{session_id}/messages")
async def get_messages(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages for a specific chat session."""
    session = await get_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found",
        )

    messages = await get_session_messages(db, session_id)
    return {
        "session_id": session_id,
        "messages": [MessageResponse.model_validate(m) for m in messages],
    }
