"""
main.py — FastAPI Application Entry Point
==========================================
This file:
  1. Creates the FastAPI app instance
  2. Registers lifespan (startup + shutdown events)
     - Runs database migrations
     - Runs master data seeder
      - Initializes Gemini AI components
  3. Configures CORS
  4. Registers global exception handlers
  5. Registers request logging middleware
  6. Mounts all routers under /api/v1
  7. Runs uvicorn server when executed directly

HOW TO RUN:
    python main.py
    — OR —
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logger import logger
from app.migration.migration import run_migrations
from app.seeder.seeder import run_seeders
from app.middleware.exception_handler import register_exception_handlers
from app.middleware.request_logger import RequestLoggerMiddleware

# ── Router imports ────────────────────────────────────────────────────────────
from app.routers.auth_router      import router as auth_router
from app.routers.document_router  import router as document_router
from app.routers.qa_router    import router as qa_router
from app.routers.dashboard_router import router as dashboard_router
from app.routers.user_router      import router as user_router
from app.routers.health import router as health_router, check_database_connection


# ─────────────────────────────────────────────────────────────────────────────
# LIFESPAN — Startup & Shutdown
# ─────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Everything BEFORE 'yield' runs at startup.
    Everything AFTER 'yield' runs at shutdown.

    Startup sequence:
      1. Create uploads directory if missing
      2. Run database migrations (create tables)
      3. Run master data seeder (roles, statuses, categories, admin user)
      4. Initialize AI components (logged inside ai_agent module)

    Shutdown:
      - Close the async database engine connection pool
    """
    # ── STARTUP ───────────────────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info(f"  {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"  Environment: {settings.APP_ENV}")
    logger.info("=" * 60)

    # 1. Create uploads directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"[Startup] Upload directory: {settings.UPLOAD_DIR}")
    

    db_check = await check_database_connection()

    if db_check["connected"]:

        logger.info("[Startup] ✓ Database connection successful.")

    else:

        logger.error(f"[Startup] ✗ Database connection failed: {db_check['error']}")

        raise RuntimeError("Database connection failed during startup.")

    # 2. Run database migrations
    await run_migrations()

    # 3. Seed master data
    await run_seeders()

    # 4. Pre-import AI agent. Clients are created lazily when first used.
    try:
        from app.ai import ai_agent  # noqa: F401
        logger.info("[Startup] ✓ AI agent module loaded (Gemini ready)")
    except Exception as exc:
        logger.warning(f"[Startup] ⚠ AI agent initialization warning: {exc}")
        logger.warning("[Startup] Q&A features may be unavailable until resolved.")

    logger.info("[Startup] ✓ Application startup complete.")
    logger.info(f"[Startup] API docs: http://{settings.HOST}:{settings.PORT}/docs")

    yield  # ← Application is running (handling requests)

    # ── SHUTDOWN ──────────────────────────────────────────────────────────────
    logger.info("[Shutdown] Closing database connection pool...")
    from app.core.database import engine
    await engine.dispose()
    logger.info("[Shutdown] Application shut down cleanly.")


# ─────────────────────────────────────────────────────────────────────────────
# FASTAPI APP INSTANCE
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=       settings.APP_NAME,
    version=     settings.APP_VERSION,
    description= """
## AI Knowledge Base Q&A System

A document knowledge base where users upload project documents and ask questions.
AI answers using stored document content and shows source references.

### Features
- 📄 Upload PDF, DOCX, TXT documents
- 🔍 Semantic search using Google text-embedding-004 + PostgreSQL pgvector
- 🤖 AI-powered answers using Gemini 2.5 Flash
- 💬 Chat-style Q&A sessions with history
- ⭐ Helpful/not helpful feedback
- 👮 Admin validation of AI answers
- 📊 Dashboard with analytics
- 🔐 JWT authentication with role-based access (admin | viewer)
    """,
    docs_url=    "/docs",
    openapi_url= "/openapi.json",
    lifespan=    lifespan,
)


# ─────────────────────────────────────────────────────────────────────────────
# CORS CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=     settings.CORS_ORIGINS,     # ["http://localhost:3000", "http://localhost:5173"]
    allow_credentials= True,                       # Allow cookies and Authorization headers
    allow_methods=     ["*"],                      # GET, POST, PATCH, DELETE, OPTIONS
    allow_headers=     ["*"],                      # Content-Type, Authorization, etc.
)


# ─────────────────────────────────────────────────────────────────────────────
# MIDDLEWARE
# ─────────────────────────────────────────────────────────────────────────────

# Request/response logging (logs every request with method, path, status, time)
app.add_middleware(RequestLoggerMiddleware)

# Global exception handlers (wraps all errors in standard response envelope)
register_exception_handlers(app)


# ─────────────────────────────────────────────────────────────────────────────
# ROUTERS
# ─────────────────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(auth_router,     prefix=API_PREFIX)
app.include_router(document_router, prefix=API_PREFIX)
app.include_router(qa_router,       prefix=API_PREFIX)
app.include_router(dashboard_router,prefix=API_PREFIX)
app.include_router(user_router,     prefix=API_PREFIX)
app.include_router(health_router)

# ─────────────────────────────────────────────────────────────────────────────
# UVICORN ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    """
    Runs the FastAPI application using Uvicorn when executed directly.

    Usage:
        python main.py

    For development with auto-reload:
        uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    """
    uvicorn.run(
        "app.main:app",
        host=       settings.HOST,
        port=       settings.PORT,
        reload=     settings.DEBUG,         # Auto-reload on code changes in development
        log_level=  settings.LOG_LEVEL.lower(),
        access_log= False,                  # We use our own RequestLoggerMiddleware
    )
