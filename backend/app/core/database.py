"""Database engine, session factory, and base model for CareNexus."""

from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


def to_async_url(url: str) -> str:
    """Map a plain database URL to its async-driver form.

    SQLite (local default) -> aiosqlite; PostgreSQL -> asyncpg. Hosts such as
    Railway and Heroku hand out the short ``postgres://`` scheme, so accept it.
    URLs that already name a driver are returned unchanged.
    """
    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    for scheme in ("postgresql://", "postgres://"):
        if url.startswith(scheme):
            return "postgresql+asyncpg://" + url[len(scheme) :]
    return url


DATABASE_URL = to_async_url(settings.DATABASE_URL)

# SQLite doesn't support pool_pre_ping
_is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=not _is_sqlite,
    # SQLite needs this for async writes
    **({} if not _is_sqlite else {"connect_args": {"check_same_thread": False}}),
)


def enable_sqlite_foreign_keys(async_engine: AsyncEngine) -> None:
    """Make SQLite enforce FOREIGN KEY and ON DELETE CASCADE.

    SQLite ships with foreign keys switched off per connection, so without
    this a message could point at a missing session and deleting a user
    left their data behind. PostgreSQL always enforces them.
    """
    if async_engine.dialect.name != "sqlite":
        return

    @event.listens_for(async_engine.sync_engine, "connect")
    def _on_connect(dbapi_connection, _record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


enable_sqlite_foreign_keys(engine)

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
