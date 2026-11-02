"""Database engine, session factory, and base model for CareNexus."""

from sqlalchemy import event, inspect, text
from sqlalchemy.exc import ArgumentError
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
            return _asyncpg_query("postgresql+asyncpg://" + url[len(scheme) :])
    return url


def _asyncpg_query(url: str) -> str:
    """Translate libpq query options into the ones asyncpg understands.

    Managed Postgres hosts (Neon, Render, Supabase) give ``?sslmode=require``
    and sometimes ``channel_binding=require``. asyncpg takes ``ssl=`` instead
    and raises on the others, so rewrite ``sslmode`` and drop the rest.
    """
    base, sep, query = url.partition("?")
    if not sep:
        return url
    pairs = [p for p in query.split("&") if p]
    keys = {p.partition("=")[0] for p in pairs}
    kept = []
    for pair in pairs:
        key, _, value = pair.partition("=")
        if key == "channel_binding":
            continue
        if key == "sslmode":
            if "ssl" in keys:
                continue
            pair = f"ssl={value}"
        kept.append(pair)
    return base + ("?" + "&".join(kept) if kept else "")


def build_engine(url: str) -> AsyncEngine:
    """Create the async engine for a plain or driver-qualified database URL.

    A malformed URL fails with a message that names the setting but never
    repeats its value: SQLAlchemy's own error echoes the whole string, which
    for a mistyped connection string means the password ends up in the logs.
    """
    async_url = to_async_url(url)
    is_sqlite = async_url.startswith("sqlite")
    try:
        return create_async_engine(
            async_url,
            echo=settings.DEBUG,
            # SQLite has no server connection to ping.
            pool_pre_ping=not is_sqlite,
            # SQLite needs this for async writes.
            **({"connect_args": {"check_same_thread": False}} if is_sqlite else {}),
        )
    except (ArgumentError, ValueError):
        raise RuntimeError(
            "DATABASE_URL is not a valid database URL (value hidden). Expected "
            "postgresql://user:password@host/db or sqlite:///path, with no "
            "quotes or extra text around it."
        ) from None


engine = build_engine(settings.DATABASE_URL)
DATABASE_URL = engine.url.render_as_string(hide_password=True)


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


# Columns added after a table first shipped. create_all() creates missing
# tables but never alters existing ones, so a database created by an earlier
# version (production included) gets these added at start-up. Additive and
# nullable only: anything that rewrites data needs a real migration tool.
ADDITIVE_COLUMNS: tuple[tuple[str, str, str], ...] = (("users", "sex", "VARCHAR(6)"),)


def apply_additive_migrations(sync_conn) -> None:
    """Add any ADDITIVE_COLUMNS a table lacks. Safe to run on every start."""
    inspector = inspect(sync_conn)
    tables = set(inspector.get_table_names())
    for table, column, ddl in ADDITIVE_COLUMNS:
        if table not in tables:
            continue  # create_all() will build it with the column
        existing = {c["name"] for c in inspector.get_columns(table)}
        if column not in existing:
            # Names come from the constant above, never from input.
            sync_conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(apply_additive_migrations)
        await conn.run_sync(Base.metadata.create_all)
