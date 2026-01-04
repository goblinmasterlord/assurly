#Pydantic models for authentication requests and responses

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# Request Models
class MagicLinkRequest(BaseModel):
    """Request model for magic link generation"""
    email: EmailStr = Field(..., description="User's email address")
    redirect_url: Optional[str] = Field(None, description="Optional redirect URL after login")

class TokenVerificationRequest(BaseModel):
    """Request model for token verification"""
    token: str = Field(..., description="Magic link token")

class RefreshTokenRequest(BaseModel):
    """Request model for JWT token refresh"""
    refresh_token: str = Field(..., description="JWT refresh token")

# Response Models
class MagicLinkResponse(BaseModel):
    """Response model for magic link generation"""
    message: str
    email: str
    expires_in_minutes: int
    status: str = "success"

class AuthTokenResponse(BaseModel):
    """Response model for successful authentication"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserResponse"

class UserResponse(BaseModel):
    """User information response model"""
    user_id: str
    email: str
    full_name: Optional[str]
    role_title: Optional[str]  # Changed from 'role' - job title for display
    mat_id: str  # Required - MAT context for tenant isolation
    school_id: Optional[str]  # NULL for MAT-wide access
    is_active: bool
    last_login: Optional[datetime]

class LogoutResponse(BaseModel):
    """Response model for logout"""
    message: str
    status: str = "success"

class ErrorResponse(BaseModel):
    """Standard error response model"""
    error: str
    detail: Optional[str]
    status: str = "error"

# Internal Models (for database operations)
class TokenPayload(BaseModel):
    """JWT token payload model"""
    sub: str  # user_id
    email: str
    mat_id: str  # MAT context
    school_id: Optional[str]  # NULL for MAT-wide access
    exp: datetime
    iat: datetime
    type: str = "access"  # access or refresh

class MagicLinkToken(BaseModel):
    """Magic link token model"""
    token: str
    user_id: str
    expires_at: datetime
    created_at: datetime

# Database Update Models
class UserAuthUpdate(BaseModel):
    """Model for updating user authentication fields"""
    magic_link_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

# Rate Limiting Models
class RateLimitInfo(BaseModel):
    """Rate limiting information"""
    email: str
    requests_made: int
    window_start: datetime
    remaining_requests: int
    reset_time: datetime

# Email Template Data Models
class MagicLinkEmailData(BaseModel):
    """Data for magic link email template"""
    user_name: str
    magic_link_url: str
    expiry_minutes: int
    user_email: str
    timestamp: str
    company_name: str = "Assurly"
    support_email: str

# Update the UserResponse forward reference
UserResponse.model_rebuild()