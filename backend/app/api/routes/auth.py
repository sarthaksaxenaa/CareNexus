"""Authentication routes — register, login, refresh token, get current user."""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.core.rate_limiter import AUTH_RATE_LIMIT, get_client_ip, get_rate_limiter
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    create_user,
    get_user_by_email,
    get_user_by_id,
    parse_user_id,
    verify_token,
)

router = APIRouter()


@router.post(
    "/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    request: UserRegisterRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user account."""
    # Rate limit check (per-IP, 5 req/min)
    get_rate_limiter().check(get_client_ip(http_request), AUTH_RATE_LIMIT)

    # Check if email already exists
    existing_user = await get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Create new user
    user = await create_user(db, request.email, request.password, request.full_name)

    # Generate tokens
    tokens = TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )

    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=tokens,
        message="Registration successful",
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    request: UserLoginRequest, http_request: Request, db: AsyncSession = Depends(get_db)
):
    """Authenticate user and return JWT tokens."""
    # Rate limit check (per-IP, 5 req/min)
    get_rate_limiter().check(get_client_ip(http_request), AUTH_RATE_LIMIT)

    user = await authenticate_user(db, request.email, request.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Generate tokens
    tokens = TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )

    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=tokens,
        message="Login successful",
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Exchange a valid refresh token for a new access/refresh pair."""
    get_rate_limiter().check(get_client_ip(http_request), AUTH_RATE_LIMIT)

    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )
    token_data = verify_token(request.refresh_token, token_type="refresh")
    user_id = parse_user_id(token_data.sub) if token_data else None
    if user_id is None:
        raise invalid

    # A token stays cryptographically valid after the account is deleted or
    # deactivated, so check the user still exists and is allowed in.
    user = await get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise invalid

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )
