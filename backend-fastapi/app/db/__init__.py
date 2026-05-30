"""
Database Module - SQLAlchemy AsyncSession Configuration

Provides async database session management and initialization.
"""

import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.pool import NullPool

from app.config import settings
from app.models import Base

logger = logging.getLogger(__name__)

engine = None
SessionLocal = None


async def init_db():
    """Initialize database engine and session factory."""
    global engine, SessionLocal

    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        poolclass=NullPool,
        future=True,
    )

    SessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # Rebuild the schema in non-production runs so stale local tables do not
    # keep old column types around after model changes.
    async with engine.begin() as conn:
        if settings.NODE_ENV != "production":
            await conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
            await conn.execute(text("CREATE SCHEMA public"))
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully")


async def get_db():
    """Dependency injection for database session."""
    if SessionLocal is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    async with SessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error("Database session error: %s", e)
            raise
        finally:
            await session.close()


# Compatibility alias used across the codebase
get_async_session = get_db

__all__ = ["init_db", "get_db", "get_async_session", "engine", "SessionLocal"]
