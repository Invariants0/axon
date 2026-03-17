"""
Authentication Schemas
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str = Field(..., min_length=1)


class SignupRequest(BaseModel):
    """Signup request schema"""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=255)


class UserResponse(BaseModel):
    """User info response"""
    id: str
    name: str
    email: str


class AuthResponse(BaseModel):
    """Authentication response"""
    access_token: str
    user: UserResponse
    expires_at: int  # Unix timestamp in milliseconds
