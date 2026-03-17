"""
Authentication Service
Handles password hashing and JWT token generation
"""

import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Optional

from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.config import Settings


class AuthService:
    """Service for authentication operations"""
    
    def __init__(self, session: AsyncSession, settings: Settings):
        self.session = session
        self.settings = settings
        self.secret_key = settings.secret_key or "default-secret-key-change-in-production"
        self.algorithm = "HS256"
        self.token_expiry_hours = 24
        self._pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt (includes per-user salt)"""
        return self._pwd_context.hash(password)
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a password against its bcrypt hash (constant-time comparison)"""
        return self._pwd_context.verify(password, password_hash)
    
    def generate_token(self, user_id: str) -> str:
        """
        Generate a simple JWT-like token
        Format: header.payload.signature
        """
        # Create header
        header = {"alg": self.algorithm, "typ": "JWT"}
        header_encoded = self._base64url_encode(json.dumps(header, separators=(',', ':'), sort_keys=True))
        
        # Create payload
        now = datetime.now(timezone.utc)
        expires = now + timedelta(hours=self.token_expiry_hours)
        payload = {
            "sub": user_id,
            "iat": int(now.timestamp()),
            "exp": int(expires.timestamp()),
        }
        payload_encoded = self._base64url_encode(json.dumps(payload, separators=(',', ':'), sort_keys=True))
        
        # Create signature
        message = f"{header_encoded}.{payload_encoded}".encode()
        signature = hmac.new(
            self.secret_key.encode(),
            message,
            hashlib.sha256
        ).digest()
        signature_encoded = self._base64url_encode(signature)
        
        # Return token
        return f"{header_encoded}.{payload_encoded}.{signature_encoded}"
    
    def verify_token(self, token: str) -> Optional[str]:
        """
        Verify and decode JWT token
        Returns user_id if valid, None otherwise
        """
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None
            
            header_encoded, payload_encoded, signature_encoded = parts
            
            # Verify signature
            message = f"{header_encoded}.{payload_encoded}".encode()
            expected_signature = hmac.new(
                self.secret_key.encode(),
                message,
                hashlib.sha256
            ).digest()
            expected_signature_encoded = self._base64url_encode(expected_signature)
            
            if signature_encoded != expected_signature_encoded:
                return None
            
            # Decode payload
            payload_json = self._base64url_decode(payload_encoded)
            payload = json.loads(payload_json)
            
            # Check expiration
            exp = payload.get("exp", 0)
            if exp < datetime.now(timezone.utc).timestamp():
                return None
            
            return payload.get("sub")
        except Exception:
            return None
    
    @staticmethod
    def _base64url_encode(data: bytes | str) -> str:
        """Encode bytes/string to base64url"""
        if isinstance(data, str):
            data = data.encode()
        import base64
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")
    
    @staticmethod
    def _base64url_decode(data: str) -> str:
        """Decode base64url to string"""
        import base64
        padding = (-len(data)) % 4
        data_padded = data + ("=" * padding)
        return base64.urlsafe_b64decode(data_padded).decode("utf-8")
