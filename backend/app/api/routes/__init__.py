"""API route aggregation — all v1 endpoints."""

from fastapi import APIRouter

from app.api.routes import analytics, auth, chat, health_profile

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(chat.router, prefix="/chat", tags=["Chat"])
router.include_router(
    health_profile.router, prefix="/health-profile", tags=["Health Profile"]
)
router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
