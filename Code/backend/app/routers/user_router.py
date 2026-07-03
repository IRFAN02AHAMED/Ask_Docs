"""
user_router.py — User Management Endpoints
==========================================
Endpoints:
  GET   /api/v1/users          — List users (Admin only)
  GET   /api/v1/users/{id}     — Get user detail (Admin only)
  PATCH /api/v1/users/{id}     — Update user (Admin only)
  DELETE /api/v1/users/{id}    — Deactivate user (Admin only)
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.repositories.user_repository import UserRepository
from app.schemas.schemas import UserOut, UserListOut, UserUpdate
from app.utils.response import ResponseBuilder

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/roles", summary="List all roles (Admin only)")
async def list_roles(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    """Returns a list of all available roles."""
    from sqlalchemy import select
    from app.models.models import Role
    stmt = select(Role)
    result = await db.execute(stmt)
    roles = result.scalars().all()
    # Return as { id, name }
    out = [{"id": str(r.id), "name": r.name} for r in roles]
    return ResponseBuilder.success(data=out, message="Roles fetched successfully.")

@router.get("", summary="List all users (Admin only)")
async def list_users(
    page:       int           = Query(default=1,    ge=1),
    page_size:  int           = Query(default=10,   ge=1, le=100),
    search:     Optional[str] = Query(default=None, description="Search by name or email"),
    role:       Optional[str] = Query(default=None, description="Filter by role name"),
    is_active:  Optional[bool] = Query(default=None, description="Filter by active status"),
    sort_by:    str           = Query(default="created_at"),
    sort_order: str           = Query(default="desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    """Returns a paginated list of all registered users. Admin only."""
    repo = UserRepository(db)
    items, total = await repo.list_users(page, page_size, search, role, is_active, sort_by, sort_order)
    out = [UserListOut.model_validate(u).model_dump(mode="json") for u in items]
    return ResponseBuilder.paginated(items=out, total=total, page=page, page_size=page_size)


@router.get("/{user_id}", summary="Get user detail (Admin only)")
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_role("admin")),
):
    """Returns full profile of a specific user. Admin only."""
    repo = UserRepository(db)
    user = await repo.get_by_id_with_role(user_id)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found.")
    return ResponseBuilder.success(
        data=UserOut.model_validate(user).model_dump(mode="json"),
        message="User fetched successfully.",
    )


@router.patch("/{user_id}", summary="Update user (Admin only)")
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """Updates user name or active status. Admin only."""
    from fastapi import HTTPException
    repo = UserRepository(db)
    user = await repo.get_by_id_any_status(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    update_data["updated_by"] = current_user.id
    
    updated = await repo.update(user, update_data)
    
    updated = await repo.get_by_id_with_role(updated.id)
    return ResponseBuilder.success(
        data=UserOut.model_validate(updated).model_dump(mode="json"),
        message="User updated successfully.",
    )


@router.delete("/{user_id}", summary="Deactivate user (Admin only)")
async def deactivate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """
    Soft-deletes (deactivates) a user account.
    The user's historical data is preserved.
    """
    from fastapi import HTTPException
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if str(user.id) == str(current_user.id):
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account.")
    await repo.soft_delete(user)
    return ResponseBuilder.success(message="User deactivated successfully.")
