from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.core.config import settings

app = FastAPI(
    title="CareNexus API",
    description="AI-powered medical chatbot for primary healthcare triage",
    version="0.0.1",
    docs_url="/docs",
    redoc_url="/redoc",
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
        "version": "0.0.1",
        "service": "carenexus-api",
    }
