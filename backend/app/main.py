"""CareNexus API — AI-powered medical chatbot for primary healthcare triage."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — runs on startup and shutdown."""
    # Startup: initialize database tables
    await init_db()
    yield
    # Shutdown: cleanup resources if needed


app = FastAPI(
    title="CareNexus API",
    description="AI-powered medical chatbot for primary healthcare triage",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring and Docker healthchecks."""
    return {
        "status": "healthy",
        "version": "0.1.0",
        "service": "carenexus-api",
    }
