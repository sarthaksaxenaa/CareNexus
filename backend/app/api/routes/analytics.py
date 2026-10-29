"""Analytics API routes — triage statistics, usage trends, and system metrics."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.rag.retriever import get_retrieval_stats
from app.services.analytics_service import (
    get_daily_usage,
    get_overview_stats,
    get_triage_distribution,
    get_user_stats,
)

router = APIRouter()


@router.get("/overview")
async def overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get high-level application statistics."""
    stats = await get_overview_stats(db)
    return {
        "status": "ok",
        "data": stats,
    }


@router.get("/triage-distribution")
async def triage_distribution(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get triage level distribution across all conversations."""
    data = await get_triage_distribution(db)
    return {
        "status": "ok",
        "data": data,
    }


@router.get("/daily-usage")
async def daily_usage(
    days: int = Query(7, ge=1, le=90, description="Window length in days (1-90)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get daily message and session counts for the last N days."""
    data = await get_daily_usage(db, days=days)
    return {
        "status": "ok",
        "data": data,
    }


@router.get("/my-stats")
async def my_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get statistics for the currently authenticated user."""
    data = await get_user_stats(db, current_user.id)
    return {
        "status": "ok",
        "data": data,
    }


@router.get("/rag-index")
async def rag_index_stats(
    current_user: User = Depends(get_current_user),
):
    """Get RAG knowledge base index statistics."""
    return {
        "status": "ok",
        "data": get_retrieval_stats(),
    }
