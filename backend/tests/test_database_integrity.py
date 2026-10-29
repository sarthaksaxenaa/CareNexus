"""Referential integrity is enforced by the database itself, not only by code."""

import uuid

import pytest
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError

from app.models.chat import ChatSession, Message, MessageRole
from app.models.user import User
from tests.conftest import TestSessionFactory


async def test_message_cannot_reference_a_missing_session():
    async with TestSessionFactory() as db:
        db.add(
            Message(session_id=uuid.uuid4(), role=MessageRole.USER, content="orphan")
        )
        with pytest.raises(IntegrityError):
            await db.commit()


async def test_deleting_a_user_cascades_to_their_data():
    async with TestSessionFactory() as db:
        user = User(
            email=f"cascade_{uuid.uuid4().hex[:6]}@example.com",
            hashed_password="x",
            full_name="Cas Cade",
        )
        db.add(user)
        await db.flush()
        session = ChatSession(user_id=user.id, title="t")
        db.add(session)
        await db.flush()
        db.add(Message(session_id=session.id, role=MessageRole.USER, content="hi"))
        await db.commit()
        user_id, session_id = user.id, session.id

    async with TestSessionFactory() as db:
        await db.execute(delete(User).where(User.id == user_id))
        await db.commit()
        left = await db.execute(select(Message).where(Message.session_id == session_id))
        assert left.scalars().all() == []
        assert await db.get(ChatSession, session_id) is None
