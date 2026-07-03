"""
seeder.py — Initial Data Seeder
===============================
Adds default roles, statuses, categories, admin user, and demo user.

This file runs when the FastAPI app starts.
It is safe to run again because it checks if data already exists.
"""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.core.logger import logger
from app.models.models import Role, User, DocumentStatus, DocumentCategory


SEED_ROLES = [
    {"name": "admin", "description": "Full access to manage the system"},
    {"name": "editor", "description": "Can upload and manage documents"},
    {"name": "viewer", "description": "Can view documents and ask questions"},
]

SEED_STATUSES = [
    "pending",
    "processing",
    "processed",
    "published",
    "failed",
    "archived",
]

SEED_CATEGORIES = [
    {"name": "Setup Guide", "description": "Installation and setup guides"},
    {"name": "API Guide", "description": "API endpoints and authentication"},
    {"name": "User Manual", "description": "User instructions and guides"},
    {"name": "FAQ", "description": "Frequently asked questions"},
    {"name": "Database Design", "description": "Database schema and design notes"},
    {"name": "Deployment", "description": "Deployment and hosting guides"},
]

DEFAULT_ADMIN = {
    "name": "System Admin",
    "email": "admin@kbsystem.com",
    "password": "Admin@1234",
}

DEFAULT_USER = {
    "name": "Demo User",
    "email": "user@askdocs.com",
    "password": "User@1234",
}


async def seed_roles(db: AsyncSession) -> dict:
    """
    Creates default roles and returns role IDs.
    """

    role_ids = {}

    for role_data in SEED_ROLES:
        result = await db.execute(
            select(Role).where(Role.name == role_data["name"])
        )
        role = result.scalar_one_or_none()

        if not role:
            role = Role(
                name=role_data["name"],
                description=role_data["description"],
            )
            db.add(role)
            await db.flush()
            logger.info(f"[Seeder] Created role: {role.name}")

        role_ids[role.name] = role.id

    return role_ids


async def seed_statuses(db: AsyncSession) -> None:
    """
    Creates default document statuses.
    """

    for status_name in SEED_STATUSES:
        result = await db.execute(
            select(DocumentStatus).where(DocumentStatus.status_name == status_name)
        )
        status = result.scalar_one_or_none()

        if not status:
            db.add(DocumentStatus(status_name=status_name))
            logger.info(f"[Seeder] Created status: {status_name}")


async def seed_categories(db: AsyncSession) -> None:
    """
    Creates default document categories.
    """

    for category_data in SEED_CATEGORIES:
        result = await db.execute(
            select(DocumentCategory).where(DocumentCategory.name == category_data["name"])
        )
        category = result.scalar_one_or_none()

        if not category:
            db.add(
                DocumentCategory(
                    name=category_data["name"],
                    description=category_data["description"],
                )
            )
            logger.info(f"[Seeder] Created category: {category_data['name']}")


async def seed_admin_user(db: AsyncSession, role_ids: dict) -> None:
    """
    Creates one default admin user if no admin exists.
    """

    admin_role_id = role_ids.get("admin")

    if not admin_role_id:
        logger.error("[Seeder] Admin role not found.")
        return

    result = await db.execute(
        select(func.count()).select_from(User).where(User.role_id == admin_role_id)
    )
    admin_count = result.scalar_one()

    if admin_count > 0:
        return

    admin = User(
        name=DEFAULT_ADMIN["name"],
        email=DEFAULT_ADMIN["email"],
        password_hash=hash_password(DEFAULT_ADMIN["password"]),
        role_id=admin_role_id,
    )

    db.add(admin)
    logger.info(f"[Seeder] Created default admin: {DEFAULT_ADMIN['email']}")


async def seed_demo_user(db: AsyncSession, role_ids: dict) -> None:
    """
    Creates one demo viewer user if it does not exist.
    """

    viewer_role_id = role_ids.get("viewer")

    if not viewer_role_id:
        logger.error("[Seeder] Viewer role not found.")
        return

    result = await db.execute(
        select(User).where(User.email == DEFAULT_USER["email"])
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        return

    user = User(
        name=DEFAULT_USER["name"],
        email=DEFAULT_USER["email"],
        password_hash=hash_password(DEFAULT_USER["password"]),
        role_id=viewer_role_id,
    )

    db.add(user)
    logger.info(f"[Seeder] Created demo user: {DEFAULT_USER['email']}")


async def run_seeders() -> None:
    """
    Runs all seeders in correct order.
    """

    logger.info("[Seeder] Starting seed data setup...")

    async with AsyncSessionLocal() as db:
        try:
            role_ids = await seed_roles(db)

            await seed_statuses(db)
            await seed_categories(db)
            await seed_admin_user(db, role_ids)
            await seed_demo_user(db, role_ids)

            await db.commit()

            logger.info("[Seeder] Seed data setup completed successfully.")

        except Exception as exc:
            await db.rollback()
            logger.error(f"[Seeder] Seeding failed: {exc}", exc_info=True)
            raise