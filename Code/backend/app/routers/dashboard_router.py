"""
dashboard_router.py — Dashboard Stats Endpoint
================================================
Endpoints:
  GET /api/v1/dashboard — Aggregated KB statistics for admin dashboard
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.services.qa_service import DashboardService
from app.utils.response import ResponseBuilder

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", summary="Get Knowledge Base dashboard statistics")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    """
    Returns aggregated statistics for the admin Knowledge Base dashboard:
      - total_documents:     Number of active documents in the KB
      - total_questions:     Total Q&A messages across all sessions
      - total_users:         Number of active user accounts

    Requires: admin role.
    """
    service = DashboardService(db)
    stats   = await service.get_stats()
    return ResponseBuilder.success(data=stats, message="Dashboard stats fetched successfully.")
