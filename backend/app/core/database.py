"""Database engine, session factory, and base model for CareNexus."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


def _build_database_url() -> str:
    """Build the async database URL from settings.

    Supports PostgreSQL (production) and SQLite (local development).
    """
    url = settings.DATABASE_URL

    if url.startswith("sqlite"):
        # SQLite async: sqlite+aiosqlite:///path/to/db.sqlite3
        return url.replace("sqlite:///", "sqlite+aiosqlite:///")

    # PostgreSQL async
    return url.replace("postgresql://", "postgresql+asyncpg://")


DATABASE_URL = _build_database_url()

# SQLite doesn't support pool_pre_ping
_is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=not _is_sqlite,
    # SQLite needs this for async writes
    **({} if not _is_sqlite else {"connect_args": {"check_same_thread": False}}),
)

async_session_factory = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
