import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.repositories.user_repository import UserRepository
import sys

async def main():
    async with AsyncSessionLocal() as db:
        repo = UserRepository(db)
        # get any user
        users, _ = await repo.list_users(page=1, page_size=1)
        if not users:
            print("No users found")
            return
        user = users[0]
        print(f"Testing user ID: {user.id}")
        
        # Test get_by_id_with_role
        user_with_role = await repo.get_by_id_with_role(user.id)
        if user_with_role:
            print(f"Success: {user_with_role.name}, Role: {user_with_role.role.name}")
        else:
            print("Failed to get_by_id_with_role")

asyncio.run(main())
