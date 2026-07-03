"""
health.py — Health Check Router
===============================
Checks whether the backend and database are healthy.
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import settings
from app.core.database import engine


router = APIRouter(
    prefix="",
    tags=["Health"],
)


async def check_database_connection() -> dict:
    """
    Checks whether database connection can be opened.
    This function can be used both during startup and inside /health API.
    """

    try:
        async with engine.connect():
            return {
                "connected": True,
                "status": "connected",
                "error": None,
            }

    except Exception as exc:
        return {
            "connected": False,
            "status": "disconnected",
            "error": str(exc),
        }


@router.get("/health", summary="Health check")
async def health_check():
    """
    Health check endpoint.
    Checks whether the server is running and database connection is working.
    """

    db_check = await check_database_connection()

    if db_check["connected"]:
        return {
            "success": True,
            "status": "healthy",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.APP_ENV,
            "database": db_check["status"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    return {
        "success": False,
        "status": "unhealthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "database": db_check["status"],
        "error": db_check["error"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }