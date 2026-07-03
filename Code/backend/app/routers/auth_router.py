"""
auth_router.py — Authentication Endpoints
==========================================
Endpoints:
  POST /api/v1/auth/login          — Login with email + password
  POST /api/v1/auth/refresh        — Get new access token using refresh token
  POST /api/v1/auth/register       — Register a new user (admin only)
  GET  /api/v1/auth/me             — Get current user profile

"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.schemas.schemas import LoginRequest, RefreshTokenRequest, UserCreate, UserOut
from app.services.auth_service import AuthService
from app.utils.response import ResponseBuilder

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", summary="Login with email and password")
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticates a user and returns JWT access + refresh tokens.

    Request body:
        - email:    Registered email address
        - password: Account password

    Returns:
        access_token, refresh_token, token_type, and basic user info.
    """
    service = AuthService(db)
    result  = await service.login(credentials)
    return ResponseBuilder.success(data=result, message="Login successful.")


@router.post("/refresh", summary="Refresh access token")
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Exchanges a valid refresh token for a new access token.

    Request body:
        - refresh_token: The long-lived refresh JWT

    Returns:
        New access_token string.
    """
    service = AuthService(db)
    result  = await service.refresh_access_token(payload.refresh_token)
    return ResponseBuilder.success(data=result, message="Token refreshed successfully.")


@router.post("/register", summary="Register a new user (Admin only)")
async def register_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    """
    Creates a new user account. Only admins can register users.

    Request body:
        - name:     Full name
        - email:    Email address (must be unique)
        - password: Min 6 characters
        - role_id:  UUID of the role to assign

    Returns:
        Created user record (without password hash).
    """
    service  = AuthService(db)
    new_user = await service.register_user(data, created_by=current_user.id)
    user_out = UserOut.model_validate(new_user)     #model_validate() → convert DB object into Pydantic schema
                                                    # model_dump()     → convert Pydantic schema into JSON-safe dictionary
    return ResponseBuilder.success(
        data=user_out.model_dump(mode="json"),
        message="User registered successfully.",
        status_code=201,
    )


@router.get("/me", summary="Get current user profile")
async def get_me(current_user=Depends(get_current_user)):
    """
    Returns the profile of the currently authenticated user.

    Requires: Bearer token in Authorization header.

    Returns:
        User profile including role.
    """
    user_out = UserOut.model_validate(current_user)
    return ResponseBuilder.success(
        data=user_out.model_dump(mode="json"),
        message="Profile fetched successfully.",
    )
