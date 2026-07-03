"""
user_repository.py — User Table Queries
========================================
Handles all database operations for the users table.
No business logic here — only queries, filtering, pagination, sorting.
"""

from typing import Optional, List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from app.models.models import User
from app.repositories.base_repository import BaseRepository
from app.core.logger import logger


class UserRepository(BaseRepository[User]):
    """
    Repository for the 'users' table.
    Inherits generic CRUD from BaseRepository.
    Adds user-specific query methods.
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Args:
            db: Injected async database session.
        """
        super().__init__(db, User)

    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Fetches a user by email address (case-insensitive).
        Used during login to find the account.

        Args:
            email: The email address to look up.

        Returns:
            User ORM instance or None if not found / inactive.
        """
        logger.debug(f"[UserRepository] get_by_email: {email}")
        stmt = (
            select(User)
            .where(
                User.email == email.lower().strip(),
                User.is_active == True,
            )
            .options(selectinload(User.role))  # eager load role to avoid extra query
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_with_role(self, user_id: UUID) -> Optional[User]:
        """
        Fetches a user by ID and eagerly loads the role relationship.

        Args:
            user_id: UUID of the user.

        Returns:
            User with role loaded, or None.
        """
        logger.debug(f"[UserRepository] get_by_id_with_role: {user_id}")
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.role))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_id_any_status(self, user_id: UUID) -> Optional[User]:
        """
        Fetches a user by ID regardless of active/inactive status.
        Used by admin user management so admin can edit or reactivate inactive users.
        """
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.role))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_users(
        self,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[List[User], int]:
        """
        Lists users with pagination, search on name/email, and sorting.

        Args:
            page:       Page number (1-indexed).
            page_size:  Records per page.
            search:     Partial match on name or email.
            role:       Filter by role name.
            sort_by:    Column name to sort on.
            sort_order: 'asc' or 'desc'.

        Returns:
            Tuple of (list_of_users, total_count).
        """
        from sqlalchemy import or_, asc, desc, func

        logger.debug(f"[UserRepository] list_users page={page} search={search}")

        conditions = []
        if is_active is not None:
            conditions.append(User.is_active == is_active)

        if search:
            conditions.append(
                or_(
                    User.name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                )
            )

        # Build base query
        stmt = select(User).where(*conditions).options(selectinload(User.role))

        # Join Role if role filter is provided
        if role:
            from app.models.models import Role
            stmt = stmt.join(User.role).where(Role.name.ilike(role))

        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()

        # Sortable columns map
        sort_columns = {
            "name":       User.name,
            "email":      User.email,
            "created_at": User.created_at,
        }
        col = sort_columns.get(sort_by, User.created_at)
        order_fn = asc if sort_order == "asc" else desc

        stmt = (
            stmt
            .order_by(order_fn(col))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def email_exists(self, email: str) -> bool:
        """
        Checks whether an email is already registered.
        Used during user creation to prevent duplicates.

        Args:
            email: Email to check.

        Returns:
            True if email already exists (active or inactive).
        """
        
        stmt = select(func.count()).select_from(User).where(User.email == email.lower().strip())
        result = await self.db.execute(stmt)
        return result.scalar_one() > 0
