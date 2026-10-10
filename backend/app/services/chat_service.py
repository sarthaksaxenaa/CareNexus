"""Chat service — handles chat sessions, messages, and AI response orchestration."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import ChatSession, Message, MessageRole, TriageLevel


async def create_session(
    db: AsyncSession, user_id: uuid.UUID, title: str = "New Health Check"
) -> ChatSession:
    """Create a new chat session for a user."""
    session = ChatSession(user_id=user_id, title=title)
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


async def get_session(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> ChatSession | None:
    """Get a chat session by ID, ensuring it belongs to the user."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def get_user_sessions(db: AsyncSession, user_id: uuid.UUID) -> list[dict]:
    """Get all chat sessions for a user with message counts."""
    result = await db.execute(
        select(
            ChatSession,
            func.count(Message.id).label("message_count"),
        )
        .outerjoin(Message, Message.session_id == ChatSession.id)
        .where(ChatSession.user_id == user_id)
        .group_by(ChatSession.id)
        .order_by(ChatSession.updated_at.desc())
    )
    sessions = []
    for row in result.all():
        session = row[0]
        count = row[1]
        sessions.append(
            {
                "id": session.id,
                "title": session.title,
                "is_active": session.is_active,
                "created_at": session.created_at,
                "updated_at": session.updated_at,
                "message_count": count,
            }
        )
    return sessions


async def add_message(
    db: AsyncSession,
    session_id: uuid.UUID,
    role: MessageRole,
    content: str,
    triage_level: TriageLevel | None = None,
    sources: str | None = None,
) -> Message:
    """Add a message to a chat session."""
    message = Message(
        session_id=session_id,
        role=role,
        content=content,
        triage_level=triage_level,
        sources=sources,
    )
    db.add(message)
    await db.flush()
    await db.refresh(message)
    return message


async def get_session_messages(
    db: AsyncSession, session_id: uuid.UUID
) -> list[Message]:
    """Get all messages in a session, ordered by creation time."""
    result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at)
    )
    return list(result.scalars().all())
