"""Shared test fixtures for CareNexus integration / E2E tests.

Provides:
    - In-memory SQLite async engine + session factory (isolated per test session)
    - Dependency overrides so the FastAPI app uses the test DB
    - Pre-registered user helper and authenticated HTTP client
    - Rate limiter reset between tests to avoid cross-test 429s
"""

import uuid
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.rate_limiter import get_rate_limiter
from app.main import app

# ─── In-memory SQLite engine for test isolation ───────────────────────────────

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

TestSessionFactory = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


# ─── Fixtures ─────────────────────────────────────────────────────────────────


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _setup_test_db():
    """Create all tables once per test session, then tear down."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def _reset_rate_limiter():
    """Reset the global rate limiter before every test."""
    get_rate_limiter().reset()
    yield
    get_rate_limiter().reset()


async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency override that yields a test-scoped DB session."""
    async with TestSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Wire the override globally so every test uses the in-memory DB
app.dependency_overrides[get_db] = _override_get_db


@pytest_asyncio.fixture()
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Unauthenticated async HTTP client for the test app."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


@pytest_asyncio.fixture()
async def registered_user(client: AsyncClient) -> dict:
    """Register a fresh user and return {email, password, full_name, tokens, user}."""
    unique = uuid.uuid4().hex[:8]
    payload = {
        "email": f"e2e_{unique}@test.com",
        "password": "SecurePass#123",
        "full_name": f"E2E User {unique}",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, f"Registration failed: {resp.text}"
    data = resp.json()
    return {
        **payload,
        "tokens": data["tokens"],
        "user": data["user"],
    }


@pytest_asyncio.fixture()
async def auth_client(
    client: AsyncClient, registered_user: dict
) -> AsyncClient:
    """Authenticated HTTP client (Bearer token pre-set in headers)."""
    token = registered_user["tokens"]["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client
