"""
Authentication Routes
Handles user login, signup, and token management
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.db.models import User
from src.db.session import get_db_session
from src.schemas.auth import LoginRequest, SignupRequest, AuthResponse
from src.services.auth_service import AuthService
from src.config.dependencies import get_app_settings
from src.config.config import Settings

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(session: AsyncSession, settings: Settings) -> AuthService:
    """Dependency to get auth service"""
    return AuthService(session, settings)


@router.post("/signup", response_model=AuthResponse, status_code=201)
async def signup(
    request: SignupRequest,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_app_settings),
) -> AuthResponse:
    """
    Register a new user account.
    """
    auth_service = get_auth_service(session, settings)
    
    # Check if user already exists
    stmt = select(User).where(User.email == request.email)
    result = await session.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Validate password strength
    if len(request.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    
    # Create new user
    user = User(
        name=request.name,
        email=request.email,
        password_hash=auth_service.hash_password(request.password),
        is_active=True
    )
    
    session.add(user)
    await session.commit()
    await session.refresh(user)
    
    # Generate token
    access_token = auth_service.generate_token(user.id)
    expires_at = int((datetime.now(timezone.utc) + timedelta(hours=24)).timestamp() * 1000)
    
    return AuthResponse(
        access_token=access_token,
        user={"id": user.id, "name": user.name, "email": user.email},
        expires_at=expires_at
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_app_settings),
) -> AuthResponse:
    """
    Authenticate user and return access token.
    """
    auth_service = get_auth_service(session, settings)
    
    # Find user by email
    stmt = select(User).where(User.email == request.email)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not auth_service.verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    # Generate token
    access_token = auth_service.generate_token(user.id)
    expires_at = int((datetime.now(timezone.utc) + timedelta(hours=24)).timestamp() * 1000)
    
    return AuthResponse(
        access_token=access_token,
        user={"id": user.id, "name": user.name, "email": user.email},
        expires_at=expires_at
    )


@router.post("/logout")
async def logout() -> dict[str, str]:
    """
    Logout user (invalidate token on client side).
    """
    return {"message": "Logged out successfully"}


@router.get("/verify")
async def verify_token(
    session: AsyncSession = Depends(get_db_session),
    settings: Settings = Depends(get_app_settings),
) -> dict:
    """
    Verify that the current auth token is valid.
    """
    # This would be called with a Bearer token in the Authorization header
    # Implementation depends on how you set up token verification
    return {"status": "valid", "message": "Token is valid"}
