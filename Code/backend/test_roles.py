import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models.models import Role
from sqlalchemy import select
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
import sys

async def main():
    async with AsyncSessionLocal() as db:
        stmt = select(Role)
        result = await db.execute(stmt)
        roles = result.scalars().all()
        out = [{"id": r.id, "name": r.name} for r in roles]
        
        try:
            body = {"success": True, "data": out}
            JSONResponse(content=body, status_code=200)
            print("Success")
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(main())
