from fastapi import APIRouter

router = APIRouter()


@router.post("/register")
async def register():
    """Register a new user."""
    return {"message": "Registration endpoint — coming soon"}


@router.post("/login")
async def login():
    """Authenticate user and return JWT token."""
    return {"message": "Login endpoint — coming soon"}
