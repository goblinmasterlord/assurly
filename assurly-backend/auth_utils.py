import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from auth_config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_ABSOLUTE_SESSION_HOURS,
    MAGIC_LINK_EXPIRE_MINUTES,
    FRONTEND_URL
)
from auth_models import TokenPayload, UserResponse

# Password hashing context (for future use if needed)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_magic_link_token() -> str:
    """
    Generate a cryptographically secure random token for magic links.
    
    Returns:
        str: A URL-safe random token (43 characters)
    """
    return secrets.token_urlsafe(32)

def generate_magic_link_data() -> tuple[str, datetime]:
    """
    Generate magic link token and expiration time.
    
    Returns:
        tuple: (token, expiration_datetime)
    """
    token = generate_magic_link_token()
    expires_at = datetime.utcnow() + timedelta(minutes=MAGIC_LINK_EXPIRE_MINUTES)
    return token, expires_at

def is_token_expired(expires_at: Optional[datetime]) -> bool:
    """
    Check if a magic link token has expired.
    
    Args:
        expires_at: The expiration datetime from database
        
    Returns:
        bool: True if token is expired, False if still valid
    """
    if expires_at is None:
        return True
    
    return datetime.utcnow() > expires_at

def generate_magic_link_url(token: str, redirect_url: Optional[str] = None) -> str:
    """
    Generate the complete magic link URL.
    
    Args:
        token: The magic link token
        redirect_url: Optional redirect URL after login
        
    Returns:
        str: Complete magic link URL
    """
    base_url = FRONTEND_URL.rstrip('/')
    magic_link = f"{base_url}/auth/verify?token={token}"
    
    if redirect_url:
        magic_link += f"&redirect={redirect_url}"
    
    return magic_link

def _to_epoch_seconds(value: datetime) -> int:
    """
    Convert a naive UTC datetime to epoch seconds.

    python-jose encodes the registered `exp` and `iat` claims by treating a naive
    datetime as UTC. `datetime.timestamp()` treats one as local time, so using it
    here would shift `auth_time` by the host's offset and make the absolute cap
    wrong by that amount on any machine not running in UTC.
    """
    return int((value - datetime(1970, 1, 1)).total_seconds())


def create_access_token(
    user_data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
    auth_time: Optional[datetime] = None
) -> str:
    """
    Create a JWT access token for the user.

    Args:
        user_data: User information dictionary
        expires_delta: Optional custom expiration time
        auth_time: When the user last proved their identity via a magic link.
                   Omitted on login (this call is that proof); passed through
                   unchanged by POST /api/auth/refresh so that renewing a token
                   cannot extend the absolute session ceiling.

    Returns:
        str: JWT access token
    """
    issued_at = datetime.utcnow()

    if expires_delta:
        expire = issued_at + expires_delta
    else:
        expire = issued_at + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": user_data["user_id"],  # subject - user ID
        "email": user_data["email"],
        "mat_id": user_data["mat_id"],  # MAT context for tenant isolation
        "school_id": user_data.get("school_id"),  # NULL for MAT-wide access
        "exp": expire,
        "iat": issued_at,
        # Original authentication time, carried across renewals. Named after the
        # OIDC claim with the same meaning. This is what the absolute cap measures
        # from — `iat` moves on every renewal and would cap nothing.
        "auth_time": _to_epoch_seconds(auth_time or issued_at),
        "type": "access"
    }

    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def renewal_allowed(auth_time: Optional[datetime]) -> bool:
    """
    Whether a token authenticated at `auth_time` may still be renewed.

    The sliding window keeps active users signed in; this ceiling bounds how long
    a single magic-link login can be extended for. It matters because **nothing in
    the platform can revoke a JWT** — logout is stateless — so without a ceiling a
    stolen token renews indefinitely.

    Args:
        auth_time: Original authentication time (naive UTC), from the token

    Returns:
        bool: True if still inside the absolute session window
    """
    if auth_time is None:
        # No known authentication time: refuse rather than grant an uncapped
        # session. Tokens minted before this claim existed fall back to `iat`
        # in verify_token, so they are capped from issue rather than rejected.
        return False

    return datetime.utcnow() < auth_time + timedelta(hours=JWT_ABSOLUTE_SESSION_HOURS)

def verify_token(token: str) -> Optional[TokenPayload]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        TokenPayload: Decoded token data if valid, None if invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Extract required fields including MAT context
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        mat_id: str = payload.get("mat_id")
        school_id: Optional[str] = payload.get("school_id")
        exp: datetime = datetime.fromtimestamp(payload.get("exp"))
        iat: datetime = datetime.fromtimestamp(payload.get("iat"))
        token_type: str = payload.get("type", "access")

        # Tokens minted before the sliding-expiry change carry no auth_time. Fall
        # back to their own iat so they are capped from issue — at most one token
        # lifetime old — rather than refused, which would sign everyone out at
        # deploy. Read as UTC to match how it was written; see _to_epoch_seconds.
        auth_time_claim = payload.get("auth_time", payload.get("iat"))
        auth_time: Optional[datetime] = (
            datetime.utcfromtimestamp(auth_time_claim) if auth_time_claim else None
        )

        if user_id is None or email is None or mat_id is None:
            return None

        return TokenPayload(
            sub=user_id,
            email=email,
            mat_id=mat_id,
            school_id=school_id,
            exp=exp,
            iat=iat,
            auth_time=auth_time,
            type=token_type
        )
    except JWTError:
        return None

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        str: Hashed password
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database
        
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def generate_token_hash(token: str) -> str:
    """
    Generate a hash of the magic link token for storage.
    This adds extra security - even with database access, tokens can't be used directly.
    
    Args:
        token: Raw magic link token
        
    Returns:
        str: SHA-256 hash of the token
    """
    return hashlib.sha256(token.encode()).hexdigest()

def format_user_response(user_data: Dict[str, Any]) -> UserResponse:
    """
    Format user data into UserResponse model.
    
    Args:
        user_data: Raw user data from database
        
    Returns:
        UserResponse: Formatted user response
    """
    return UserResponse(
        user_id=user_data["user_id"],
        email=user_data["email"],
        full_name=user_data.get("full_name"),
        role_title=user_data.get("role_title"),  # Changed from 'role'
        mat_id=user_data["mat_id"],  # Required field now
        school_id=user_data.get("school_id"),
        is_active=bool(user_data.get("is_active", True)),
        last_login=user_data.get("last_login")
    )

def clean_expired_tokens_query() -> str:
    """
    SQL query to clean up expired magic link tokens.
    Can be run periodically or after each verification.
    
    Returns:
        str: SQL query string
    """
    return """
        UPDATE users 
        SET magic_link_token = NULL, token_expires_at = NULL 
        WHERE token_expires_at IS NOT NULL 
        AND token_expires_at < NOW()
    """

def get_token_expiry_minutes() -> int:
    """Get the magic link expiry time in minutes"""
    return MAGIC_LINK_EXPIRE_MINUTES

def get_jwt_expiry_minutes() -> int:
    """Get the JWT expiry time in minutes"""
    return JWT_ACCESS_TOKEN_EXPIRE_MINUTES