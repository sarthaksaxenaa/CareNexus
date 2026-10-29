"""Analytics service — aggregates triage, session, and usage statistics."""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import ChatSession, Message, MessageRole, TriageLevel


async def get_triage_distribution(db: AsyncSession) -> dict:
    """Get distribution of triage levels across all messages.

    Returns:
        Dict with triage level counts and percentages.
    """
    result = await db.execute(
        select(
            Message.triage_level,
            func.count(Message.id).label("count"),
        )
        .where(Message.role == MessageRole.ASSISTANT)
        .where(Message.triage_level.isnot(None))
        .group_by(Message.triage_level)
    )

    rows = result.all()
    total = sum(row.count for row in rows)

    distribution = {
        "green": 0,
        "yellow": 0,
        "red": 0,
        "none": 0,
    }

    for row in rows:
        level = row.triage_level.value if row.triage_level else "none"
        distribution[level] = row.count

    return {
        "distribution": distribution,
        "total_triaged": total,
        "percentages": {
            level: round((count / total) * 100, 1) if total > 0 else 0.0
            for level, count in distribution.items()
        },
    }


async def get_daily_usage(
    db: AsyncSession,
    days: int = 7,
) -> list[dict]:
    """Get daily message counts for the last N days.

    Returns:
        List of dicts with date, message_count, and session_count.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Get message counts per day
    msg_result = await db.execute(
        select(
            func.date(Message.created_at).label("date"),
            func.count(Message.id).label("message_count"),
        )
        .where(Message.created_at >= cutoff)
        .group_by(func.date(Message.created_at))
        .order_by(func.date(Message.created_at))
    )

    # Get session counts per day
    session_result = await db.execute(
        select(
            func.date(ChatSession.created_at).label("date"),
            func.count(ChatSession.id).label("session_count"),
        )
        .where(ChatSession.created_at >= cutoff)
        .group_by(func.date(ChatSession.created_at))
        .order_by(func.date(ChatSession.created_at))
    )

    msg_by_date = {str(row.date): row.message_count for row in msg_result.all()}
    session_by_date = {str(row.date): row.session_count for row in session_result.all()}

    # Build complete date range
    daily_stats = []
    for i in range(days):
        date = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).strftime(
            "%Y-%m-%d"
        )
        daily_stats.append(
            {
                "date": date,
                "messages": msg_by_date.get(date, 0),
                "sessions": session_by_date.get(date, 0),
            }
        )

    return daily_stats


async def get_overview_stats(db: AsyncSession) -> dict:
    """Get high-level application statistics.

    Returns:
        Dict with total sessions, messages, avg messages per session, etc.
    """
    # Total sessions
    total_sessions = await db.execute(select(func.count(ChatSession.id)))
    session_count = total_sessions.scalar() or 0

    # Total messages
    total_messages = await db.execute(select(func.count(Message.id)))
    message_count = total_messages.scalar() or 0

    # User messages vs assistant messages
    user_msg_count = await db.execute(
        select(func.count(Message.id)).where(Message.role == MessageRole.USER)
    )
    user_messages = user_msg_count.scalar() or 0

    # Average messages per session
    avg_per_session = (
        round(message_count / session_count, 1) if session_count > 0 else 0.0
    )

    # Red flag count (emergency triage)
    red_flag_count = await db.execute(
        select(func.count(Message.id)).where(Message.triage_level == TriageLevel.RED)
    )
    red_flags = red_flag_count.scalar() or 0

    return {
        "total_sessions": session_count,
        "total_messages": message_count,
        "user_messages": user_messages,
        "assistant_messages": message_count - user_messages,
        "avg_messages_per_session": avg_per_session,
        "emergency_triage_count": red_flags,
    }


async def get_user_stats(db: AsyncSession, user_id: uuid.UUID) -> dict:
    """Get statistics for a specific user."""
    # User's sessions
    user_sessions = await db.execute(
        select(func.count(ChatSession.id)).where(ChatSession.user_id == user_id)
    )
    sessions = user_sessions.scalar() or 0

    # User's messages
    user_messages = await db.execute(
        select(func.count(Message.id))
        .join(ChatSession, Message.session_id == ChatSession.id)
        .where(ChatSession.user_id == user_id)
        .where(Message.role == MessageRole.USER)
    )
    messages = user_messages.scalar() or 0

    return {
        "total_sessions": sessions,
        "total_messages": messages,
    }
