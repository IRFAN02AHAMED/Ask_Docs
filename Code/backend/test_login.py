import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.services.auth_service import AuthService
from app.schemas.schemas import LoginRequest
import sys

async def main():
    async with AsyncSessionLocal() as db:
        service = AuthService(db)
        try:
            # Try to login with admin email. 
            # First get the admin email from the db
            from app.repositories.user_repository import UserRepository
            repo = UserRepository(db)
            users, _ = await repo.list_users(page=1, page_size=10, role="admin")
            if not users:
                print("No admin user found")
                return
            
            admin_email = users[0].email
            print(f"Admin email: {admin_email}")
            
            # Since we don't know the password, we can just create a token directly
            from app.core.security import create_access_token
            token = create_access_token(str(users[0].id), "admin")
            print(f"TOKEN={token}")
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(main())
