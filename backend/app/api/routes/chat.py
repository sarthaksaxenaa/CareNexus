from fastapi import APIRouter

router = APIRouter()


@router.post("/message")
async def send_message():
    """Send a message to the CareNexus AI and receive a response."""
    return {
        "response": "Hello! I'm CareNexus, your AI health assistant. How can I help you today?",
        "triage_level": None,
        "disclaimer": "This is not medical advice. Please consult a healthcare professional for diagnosis and treatment.",
    }


@router.get("/sessions")
async def list_sessions():
    """List all chat sessions for the current user."""
    return {"sessions": []}
