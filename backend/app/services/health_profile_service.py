"""Health profile service — manages user health profiles."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.health_profile import HealthProfile


async def get_profile(db: AsyncSession, user_id: uuid.UUID) -> HealthProfile | None:
    """Get a user's health profile."""
    result = await db.execute(
        select(HealthProfile).where(HealthProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_profile(
    db: AsyncSession,
    user_id: uuid.UUID,
    age: int | None = None,
    gender: str | None = None,
    blood_group: str | None = None,
    known_conditions: str | None = None,
    current_medications: str | None = None,
    allergies: str | None = None,
) -> HealthProfile:
    """Create a new health profile for a user."""
    profile = HealthProfile(
        user_id=user_id,
        age=age,
        gender=gender,
        blood_group=blood_group,
        known_conditions=known_conditions,
        current_medications=current_medications,
        allergies=allergies,
    )
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    return profile


async def update_profile(
    db: AsyncSession,
    profile: HealthProfile,
    **kwargs,
) -> HealthProfile:
    """Update the fields the client sent.

    A field sent as null clears it; a field left out is kept. (Skipping
    every None, as before, made it impossible to remove a condition.)
    """
    for key, value in kwargs.items():
        if hasattr(profile, key):
            setattr(profile, key, value)
    await db.flush()
    await db.refresh(profile)
    return profile


async def delete_profile(db: AsyncSession, profile: HealthProfile) -> None:
    """Delete a user's health profile."""
    await db.delete(profile)
    await db.flush()
