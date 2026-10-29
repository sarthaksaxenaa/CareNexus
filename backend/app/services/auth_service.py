"""Authentication service — handles password hashing, JWT tokens, and user operations."""

import base64
import hashlib
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User
from app.schemas.auth import TokenPayload

# ─── Password Operations ────────────────────────────


# bcrypt reads only the first 72 bytes of its input, so two long passwords
# sharing that prefix would both unlock an account. Hashing with SHA-256
# first gives bcrypt a fixed 44-byte input that depends on every byte (the
# pattern of passlib's bcrypt_sha256). New hashes carry a prefix; older
# plain-bcrypt hashes still verify and are upgraded at the next login.
_SHA256_PREFIX = "sha256$"


def _prehash(password: str) -> bytes:
    # base64 so the digest never contains NUL bytes, which bcrypt rejects.
    return base64.b64encode(hashlib.sha256(password.encode("utf-8")).digest())


def hash_password(password: str) -> str:
    """Hash a password: SHA-256, then bcrypt with a random salt."""
    hashed = bcrypt.hashpw(_prehash(password), bcrypt.gensalt())
    return _SHA256_PREFIX + hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a password against a stored hash (current or legacy format)."""
    if hashed_password.startswith(_SHA256_PREFIX):
        stored = hashed_password[len(_SHA256_PREFIX) :].encode("utf-8")
        return bcrypt.checkpw(_prehash(plain_password), stored)
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def needs_rehash(hashed_password: str) -> bool:
    """True for legacy plain-bcrypt hashes that should be upgraded."""
    return not hashed_password.startswith(_SHA256_PREFIX)


# ─── JWT Token Operations ───────────────────────────


def create_access_token(user_id: str) -> str:
    """Create a JWT access token for the given user."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create a JWT refresh token for the given user."""
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str, token_type: str = "access") -> TokenPayload | None:
    """Verify and decode a JWT token. Returns payload if valid, None if invalid."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.type != token_type:
            return None
        return token_data
    except jwt.PyJWTError:
        return None


# ─── User Database Operations ───────────────────────


def normalize_email(email: str) -> str:
    """Canonical form used for storage and lookup, so case never creates duplicates."""
    return email.strip().lower()


def parse_user_id(sub: str) -> uuid.UUID | None:
    """Turn a token subject into a user id, or None if it is not a UUID."""
    try:
        return uuid.UUID(sub)
    except ValueError:
        return None


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Fetch a user by their email address (case-insensitive)."""
    result = await db.execute(select(User).where(User.email == normalize_email(email)))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    """Fetch a user by their ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession, email: str, password: str, full_name: str
) -> User:
    """Create a new user with hashed password."""
    user = User(
        email=normalize_email(email),
        hashed_password=hash_password(password),
        full_name=full_name.strip(),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    """Authenticate a user by email and password. Returns user if valid, None if invalid."""
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    if needs_rehash(user.hashed_password):
        # Transparent upgrade: we only ever see the plain password at login.
        user.hashed_password = hash_password(password)
        await db.flush()
    return user
