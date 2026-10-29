"""Health profile routes — CRUD operations for user health data."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.health_profile import (
    HealthProfileCreateRequest,
    HealthProfileResponse,
    HealthProfileUpdateRequest,
)
from app.services.health_profile_service import (
    create_profile,
    delete_profile,
    get_profile,
    update_profile,
)

router = APIRouter()


@router.get("/", response_model=HealthProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's health profile."""
    profile = await get_profile(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health profile not found. Create one first.",
        )
    return HealthProfileResponse.model_validate(profile)


@router.post(
    "/", response_model=HealthProfileResponse, status_code=status.HTTP_201_CREATED
)
async def create_my_profile(
    request: HealthProfileCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a health profile for the current user."""
    existing = await get_profile(db, current_user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Health profile already exists. Use PUT to update.",
        )

    profile = await create_profile(
        db,
        user_id=current_user.id,
        age=request.age,
        gender=request.gender,
        blood_group=request.blood_group,
        known_conditions=request.known_conditions,
        current_medications=request.current_medications,
        allergies=request.allergies,
    )
    return HealthProfileResponse.model_validate(profile)


@router.put("/", response_model=HealthProfileResponse)
async def update_my_profile(
    request: HealthProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's health profile."""
    profile = await get_profile(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health profile not found. Create one first.",
        )

    updated = await update_profile(
        db, profile, **request.model_dump(exclude_unset=True)
    )
    return HealthProfileResponse.model_validate(updated)


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete the current user's health profile."""
    profile = await get_profile(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health profile not found.",
        )
    await delete_profile(db, profile)
