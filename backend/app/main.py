"""CareNexus API — AI-powered medical chatbot for primary healthcare triage."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config import settings
from app.core.database import init_db
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging
from app.core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — runs on startup and shutdown."""
    setup_logging(level="DEBUG" if settings.DEBUG else "INFO")
    logger.info("🚀 CareNexus API starting up...")

    # Initialize database tables
    await init_db()
    logger.info("✅ Database initialized")

    yield

    logger.info("👋 CareNexus API shutting down...")


app = FastAPI(
    title="CareNexus API",
    description="AI-powered medical chatbot for primary healthcare triage",
    version="0.5.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── Middleware Stack (order matters: last added = first executed) ───
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Exception Handlers ───
register_exception_handlers(app)

# ─── API Routes ───
app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring and Docker healthchecks."""
    return {
        "status": "healthy",
        "version": "0.5.0",
        "service": "carenexus-api",
    }
