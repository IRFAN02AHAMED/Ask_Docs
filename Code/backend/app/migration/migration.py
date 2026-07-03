"""
migration.py — Automatic Database Migration
============================================
Runs at application startup via FastAPI lifespan.
Creates all tables defined in the SQLAlchemy models if they don't exist.

This is a "create if not exists" migration approach — safe to run every startup.
For production with schema changes, use Alembic instead.

HOW IT'S CALLED:
    In main.py lifespan:
        from app.migration import run_migrations
        await run_migrations()

WHAT IT DOES:
    - Imports all ORM models (so SQLAlchemy knows about them)
    - Calls Base.metadata.create_all() against the async engine
    - Tables that already exist are left untouched
    - New tables are created automatically
"""

from sqlalchemy import text

from app.core.database import Base, engine
from app.core.logger import logger

from app.models.models import (  # noqa: F401
    Role,
    User,
    DocumentStatus,
    DocumentCategory,
    Document,
    DocumentVersion,
    DocumentChunk,
    QASession,
    QAMessage,
    QAMessageSourceChunk,
    AIResponseLog,
    DocumentProcessingLog,
)


async def run_migrations() -> None:
    logger.info("[Migration] Starting database setup...")

    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.run_sync(Base.metadata.create_all)

        logger.info("[Migration] Database setup completed successfully.")

    except Exception as exc:
        logger.error(f"[Migration] Database setup failed: {exc}", exc_info=True)
        raise