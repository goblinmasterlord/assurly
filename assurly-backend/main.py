from fastapi import FastAPI, HTTPException, Query, Depends, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import pymysql
import os
from datetime import datetime, date
from decimal import Decimal
import uuid

# Import authentication modules
from auth_config import validate_config
from auth_models import (
    MagicLinkRequest, 
    MagicLinkResponse, 
    AuthTokenResponse, 
    UserResponse,
    LogoutResponse,
    ErrorResponse
)
from auth_utils import (
    generate_magic_link_data,
    generate_magic_link_url,
    create_access_token,
    verify_token,
    is_token_expired,
    format_user_response,
    clean_expired_tokens_query,
    get_token_expiry_minutes
)
from email_service import send_magic_link_email

# API Metadata and Documentation
tags_metadata = [
    {
        "name": "Authentication",
        "description": "Magic link authentication endpoints. Passwordless login via email with JWT tokens.",
    },
    {
        "name": "Aspects",
        "description": "MAT-specific assessment aspects with copy-on-write customization. "
                       "Aspects are top-level categories for standards (e.g., Education, Governance).",
    },
    {
        "name": "Standards",
        "description": "MAT-specific assessment standards with immutable versioning. "
                       "Standards are specific criteria within aspects, tracked with complete version history.",
    },
    {
        "name": "Assessments",
        "description": "Assessment management endpoints for schools. Create, view, and submit assessments with MAT isolation.",
    },
    {
        "name": "Schools",
        "description": "School management endpoints. View schools within your MAT.",
    },
    {
        "name": "Users",
        "description": "User management endpoints. View and manage users within your MAT.",
    },
    {
        "name": "Terms",
        "description": "Academic terms and periods management. View term schedules and academic years.",
    },
    {
        "name": "Debug",
        "description": "Internal debug and diagnostic endpoints. Not for production use.",
    },
]

app = FastAPI(
    title="Assurly API",
    description="""
# Assurly School Assessment Management Platform

A comprehensive multi-tenant API for managing school assessments across Multi-Academy Trusts (MATs).

## Key Features

### 🔐 Authentication
- Passwordless magic link authentication
- JWT-based session management
- Secure token validation

### 🏢 Multi-Tenant Architecture
- Complete MAT isolation
- Copy-on-write customization
- Tenant-specific aspects and standards

### 📊 Versioning System
- Immutable standard versions
- Complete audit trail
- Point-in-time accuracy
- Rollback capability

### 🎯 Assessment Management
- School-based assessments
- Progress tracking
- Evidence collection
- Bulk operations

## Architecture

The API implements a hierarchical multi-tenant structure:

```
MAT (Organization)
├── Aspects (Customizable categories)
│   └── Standards (Versioned criteria)
├── Schools (MAT members)
└── Users (MAT staff, optional school assignment)
```

## Getting Started

1. **Request magic link**: POST /api/auth/request-magic-link
2. **Click email link**: Opens with token parameter
3. **Get JWT**: GET /api/auth/verify/{token}
4. **Use JWT**: Include in Authorization header: `Bearer {token}`

## Tenant Isolation

All endpoints enforce MAT isolation:
- Users can only access data from their own MAT
- Cross-tenant queries return 403 Forbidden
- Data segregation at database level

## Version History

See `/api/standards/{id}/versions` for complete change tracking.
    """,
    version="3.0.0",
    openapi_tags=tags_metadata,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    contact={
        "name": "Assurly Support",
        "email": "support@assurly.com",
    },
    license_info={
        "name": "Proprietary",
    }
)

# Validate configuration on startup
try:
    validate_config()
    print("✅ Authentication configuration validated successfully")
except ValueError as e:
    print(f"⚠️ Configuration warning: {e}")

# Add CORS middleware with explicit origins
# Note: When allow_credentials=True, allow_origins cannot be ["*"]
# Must explicitly list allowed origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://www.assurly.co.uk",
        "https://assurly.co.uk",
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",   # Alternative dev port
        "https://assurly-frontend-400616570417.europe-west2.run.app",  # Backend URL (for self-calls)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Exception handler to ensure CORS headers are included in error responses
# This fixes the issue where 401/403 errors don't include CORS headers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Custom exception handler that ensures CORS headers are included in all responses,
    including error responses. Without this, authentication errors (401) would not
    include CORS headers, causing CORS errors in the browser instead of showing
    the actual authentication error.
    """
    origin = request.headers.get("origin")

    # List of allowed origins (must match CORS middleware config)
    allowed_origins = [
        "https://www.assurly.co.uk",
        "https://assurly.co.uk",
        "http://localhost:5173",
        "http://localhost:3000",
        "https://assurly-frontend-400616570417.europe-west2.run.app",
    ]

    # Prepare response
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

    # Add CORS headers if origin is allowed
    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Expose-Headers"] = "*"

    return response

# Security scheme for JWT authentication
security = HTTPBearer(auto_error=False)

# Read DB configuration from environment
DB_CONFIG = {
    'unix_socket': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME'),
    'autocommit': True,
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

# ================================
# PRODUCTION MODELS - Multi-Tenant Schema v2.0
# ================================

# Assessment Models
class StandardRatingSubmission(BaseModel):
    mat_standard_id: str  # Changed from standard_id
    rating: Optional[int] = None  # 1-4 or null for not rated
    evidence_comments: str = ""
    submitted_by: str

class AssessmentSubmission(BaseModel):
    assessment_id: str
    standards: List[StandardRatingSubmission]

class AssessmentCreateRequest(BaseModel):
    school_ids: List[str]
    mat_aspect_id: str  # Changed from category
    unique_term_id: str  # Changed from term_id
    academic_year: str
    due_date: Optional[str] = None
    assigned_to: Optional[List[str]] = None

# ================================
# ASPECT & STANDARD MODELS (MAT-Specific)
# ================================

# MAT Aspect Models
class MatAspectBase(BaseModel):
    mat_aspect_id: str
    aspect_code: str
    aspect_name: str
    aspect_description: Optional[str] = None
    sort_order: int = 0

class MatAspectCreate(BaseModel):
    aspect_code: str
    aspect_name: str
    aspect_description: Optional[str] = None
    sort_order: int = 0
    source_aspect_id: Optional[str] = None  # If copying from default

class MatAspectUpdate(BaseModel):
    aspect_name: Optional[str] = None
    aspect_description: Optional[str] = None
    sort_order: Optional[int] = None

class MatAspectResponse(MatAspectBase):
    mat_id: str
    is_custom: bool
    is_modified: bool
    standards_count: int = 0

# MAT Standard Models
class MatStandardBase(BaseModel):
    mat_standard_id: str
    standard_code: str
    standard_name: str
    standard_description: Optional[str] = None
    sort_order: int = 0

class MatStandardCreate(BaseModel):
    mat_aspect_id: str
    standard_code: str
    standard_name: str
    standard_description: Optional[str] = None
    sort_order: int = 0
    source_standard_id: Optional[str] = None  # If copying from default

class MatStandardUpdate(BaseModel):
    standard_name: Optional[str] = None
    standard_description: Optional[str] = None
    sort_order: Optional[int] = None
    change_reason: Optional[str] = None  # For version history

class MatStandardResponse(MatStandardBase):
    mat_id: str
    mat_aspect_id: str
    aspect_code: str
    aspect_name: str
    version_id: Optional[str] = None
    version_number: Optional[int] = None
    is_custom: bool
    is_modified: bool

# Version History
class StandardVersionResponse(BaseModel):
    version_id: str
    version_number: int
    standard_code: str
    standard_name: str
    standard_description: Optional[str] = None
    effective_from: datetime
    effective_to: Optional[datetime] = None
    created_by_user_id: Optional[str] = None
    change_reason: Optional[str] = None

# User Aspect Assignment Models
class UserAspectAssignmentCreate(BaseModel):
    mat_aspect_id: str
    school_id: Optional[str] = None  # NULL = all schools
    notify_on_term_open: bool = True
    notify_on_due_date: bool = True

class UserAspectAssignmentResponse(BaseModel):
    assignment_id: str
    user_id: str
    mat_aspect_id: str
    aspect_code: str
    aspect_name: str
    school_id: Optional[str] = None
    school_name: Optional[str] = None
    notify_on_term_open: bool
    notify_on_due_date: bool

# ================================
# LEGACY MODELS (Phase 4 - To Be Removed)
# These support old endpoints during migration
# ================================

class AspectResponse(BaseModel):
    """Legacy aspect response model - will be replaced by MatAspectResponse"""
    aspect_id: str
    aspect_name: str
    description: Optional[str] = None
    standards_count: int = 0

class AspectCreate(BaseModel):
    """Legacy aspect create model"""
    aspect_id: str
    aspect_name: str

class AspectUpdate(BaseModel):
    """Legacy aspect update model"""
    aspect_name: Optional[str] = None

class StandardResponse(BaseModel):
    """Legacy standard response model - will be replaced by MatStandardResponse"""
    standard_id: str
    standard_name: str
    aspect_id: str
    aspect_name: str
    description: Optional[str] = None
    sort_order: int = 0

class StandardCreate(BaseModel):
    """Legacy standard create model"""
    standard_id: str
    standard_name: str
    aspect_id: str
    description: Optional[str] = None
    sort_order: int = 0

class StandardUpdate(BaseModel):
    """Legacy standard update model"""
    standard_name: Optional[str] = None
    aspect_id: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None

class BulkStandardUpdateItem(BaseModel):
    """Legacy bulk update item model"""
    standard_id: str
    rating: Optional[int] = None
    evidence_comments: str = ""
    submitted_by: str

class BulkStandardUpdate(BaseModel):
    """Legacy bulk update model"""
    updates: List[BulkStandardUpdateItem]

# ================================
# AUTHENTICATION DEPENDENCIES
# ================================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserResponse:
    """
    Dependency to get current authenticated user from JWT token.
    Use this to protect endpoints that require authentication.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify JWT token
    token_data = verify_token(credentials.credentials)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database with new schema fields
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            SELECT user_id, email, full_name, role_title, mat_id, school_id,
                   is_active, last_login
            FROM users
            WHERE user_id = %s AND is_active = 1
        """
        cursor.execute(query, (token_data.sub,))
        user_data = cursor.fetchone()
        connection.close()

        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )

        return format_user_response(user_data)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during authentication"
        )

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[UserResponse]:
    """
    Optional authentication dependency.
    Returns user if authenticated, None if not (doesn't raise errors).
    """
    if not credentials:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

async def get_current_mat(current_user: UserResponse = Depends(get_current_user)) -> str:
    """
    Extract MAT ID from authenticated user for tenant isolation.
    All queries should use this to ensure proper MAT filtering.
    """
    return current_user.mat_id

async def get_current_school(current_user: UserResponse = Depends(get_current_user)) -> Optional[str]:
    """
    Extract school ID from authenticated user for school-level filtering.
    Returns None for MAT-wide access users.
    """
    return current_user.school_id

# ================================
# YOUR EXISTING HELPER FUNCTIONS (unchanged)
# ================================

def convert_for_json(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, (datetime, date)):
        return obj.isoformat()
    return obj

def process_row_for_json(row):
    """Process a database row to make it JSON serializable"""
    processed_row = {}
    for key, value in row.items():
        processed_row[key] = convert_for_json(value)
    return processed_row

def get_db_connection():
    return pymysql.connect(**DB_CONFIG)

# ================================
# NEW AUTHENTICATION ENDPOINTS
# ================================

@app.post("/api/auth/request-magic-link", response_model=MagicLinkResponse, tags=["Authentication"])
async def request_magic_link(request: MagicLinkRequest):
    """
    Send a magic link to user's email for passwordless authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check if user exists and is active
        user_query = """
            SELECT user_id, email, full_name, is_active 
            FROM users 
            WHERE email = %s
        """
        cursor.execute(user_query, (request.email,))
        user = cursor.fetchone()
        
        if not user:
            # Don't reveal if email exists for security
            return MagicLinkResponse(
                message="If this email is registered, you'll receive a login link shortly.",
                email=request.email,
                expires_in_minutes=get_token_expiry_minutes()
            )
        
        if not user.get('is_active', False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled. Please contact support."
            )
        
        # Generate magic link token and expiration
        token, expires_at = generate_magic_link_data()
        
        # Update user with magic link token
        update_query = """
            UPDATE users 
            SET magic_link_token = %s, token_expires_at = %s
            WHERE user_id = %s
        """
        cursor.execute(update_query, (token, expires_at, user['user_id']))
        
        # Generate magic link URL
        magic_link_url = generate_magic_link_url(token, request.redirect_url)
        
        # Send email
        email_sent = await send_magic_link_email(
            recipient_email=user['email'],
            user_name=user.get('full_name', 'User'),
            magic_link_url=magic_link_url
        )
        
        connection.close()
        
        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send email. Please try again."
            )
        
        return MagicLinkResponse(
            message="If this email is registered, you'll receive a login link shortly.",
            email=request.email,
            expires_in_minutes=get_token_expiry_minutes()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process magic link request: {str(e)}"
        )

@app.get("/api/auth/verify/{token}", response_model=AuthTokenResponse, tags=["Authentication"])
async def verify_magic_link(token: str):
    """
    Verify magic link token and return JWT access token.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Find user with this magic link token - using new schema
        user_query = """
            SELECT user_id, email, full_name, role_title, mat_id, school_id,
                   is_active, magic_link_token, token_expires_at
            FROM users
            WHERE magic_link_token = %s
        """
        cursor.execute(user_query, (token,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired magic link"
            )
        
        # Check if token has expired
        if is_token_expired(user['token_expires_at']):
            # Clean up expired token
            cleanup_query = """
                UPDATE users 
                SET magic_link_token = NULL, token_expires_at = NULL 
                WHERE user_id = %s
            """
            cursor.execute(cleanup_query, (user['user_id'],))
            connection.close()
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Magic link has expired. Please request a new one."
            )
        
        # Check if user is active
        if not user.get('is_active', False):
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled. Please contact support."
            )
        
        # Create JWT access token
        access_token = create_access_token(user)
        
        # Update last login and clear magic link token
        update_query = """
            UPDATE users 
            SET last_login = NOW(), magic_link_token = NULL, token_expires_at = NULL
            WHERE user_id = %s
        """
        cursor.execute(update_query, (user['user_id'],))
        
        # Clean up any other expired tokens
        cursor.execute(clean_expired_tokens_query())
        
        connection.close()
        
        # Format user response
        user_response = format_user_response(user)
        
        return AuthTokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=60 * 60,  # 1 hour in seconds
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify magic link: {str(e)}"
        )

@app.get("/api/auth/me", response_model=UserResponse, tags=["Authentication"])
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """Get current authenticated user's information."""
    return current_user

@app.post("/api/auth/logout", response_model=LogoutResponse, tags=["Authentication"])
async def logout(current_user: UserResponse = Depends(get_current_user)):
    """Logout current user."""
    return LogoutResponse(
        message="Successfully logged out. Please remove the token from your client.",
        status="success"
    )

@app.post("/api/auth/cleanup-expired-tokens", tags=["Authentication"])
async def cleanup_expired_tokens():
    """Admin endpoint to manually clean up expired magic link tokens."""
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        cursor.execute(clean_expired_tokens_query())
        cleaned_count = cursor.rowcount
        
        connection.close()
        
        return JSONResponse(
            content={
                "message": f"Cleaned up {cleaned_count} expired tokens",
                "status": "success"
            },
            status_code=200
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup tokens: {str(e)}"
        )

# ================================
# ALL YOUR EXISTING ENDPOINTS (exactly as you had them)
# ================================

@app.get("/api/assessments", tags=["Assessments"])
async def get_assessments(
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user),
    school_id: Optional[str] = Query(None),
    aspect_code: Optional[str] = Query(None),
    term_id: Optional[str] = Query(None),
    academic_year: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """
    Get assessment summaries grouped by school, aspect, and term.

    Query Parameters:
    - school_id: Filter by school (e.g., "cedar-park-primary")
    - aspect_code: Filter by aspect (e.g., "EDU", "HR")
    - term_id: Filter by term (e.g., "T1", "T2")
    - academic_year: Filter by year (e.g., "2024-25")
    - status: Filter by status
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Group assessments by school + aspect + term
        query = """
            SELECT
                CONCAT(s.school_id, '-', ma.aspect_code, '-', a.unique_term_id) as group_id,
                s.school_id,
                s.school_name,
                ma.mat_aspect_id,
                ma.aspect_code,
                ma.aspect_name,
                SUBSTRING(a.unique_term_id, 1, 2) as term_id,
                a.academic_year,
                MAX(a.due_date) as due_date,
                MAX(a.last_updated) as last_updated,
                CASE
                    WHEN COUNT(CASE WHEN a.rating IS NULL THEN 1 END) = COUNT(*) THEN 'not_started'
                    WHEN COUNT(CASE WHEN a.status = 'completed' THEN 1 END) = COUNT(*) THEN 'completed'
                    ELSE 'in_progress'
                END as status,
                COUNT(*) as total_standards,
                COUNT(CASE WHEN a.rating IS NOT NULL THEN 1 END) as completed_standards
            FROM assessments a
            JOIN schools s ON a.school_id = s.school_id
            JOIN mat_standards ms ON a.mat_standard_id = ms.mat_standard_id
            JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
            WHERE s.mat_id = %s
        """
        params = [current_mat_id]

        if school_id:
            query += " AND s.school_id = %s"
            params.append(school_id)

        if aspect_code:
            query += " AND ma.aspect_code = %s"
            params.append(aspect_code)

        if term_id:
            query += " AND SUBSTRING(a.unique_term_id, 1, 2) = %s"
            params.append(term_id)

        if academic_year:
            query += " AND a.academic_year = %s"
            params.append(academic_year)

        query += """
            GROUP BY s.school_id, s.school_name, ma.mat_aspect_id, ma.aspect_code,
                     ma.aspect_name, a.unique_term_id, a.academic_year
        """

        if status:
            query = f"""
                SELECT * FROM ({query}) grouped
                WHERE status = %s
            """
            params.append(status)

        query += " ORDER BY academic_year DESC, unique_term_id DESC, school_name"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        processed_rows = []
        for row in rows:
            processed_row = process_row_for_json(row)

            if processed_row.get('due_date'):
                if isinstance(row['due_date'], (datetime, date)):
                    processed_row['due_date'] = row['due_date'].strftime('%Y-%m-%d')

            if processed_row.get('last_updated'):
                if isinstance(row['last_updated'], datetime):
                    processed_row['last_updated'] = row['last_updated'].strftime('%Y-%m-%dT%H:%M:%SZ')

            processed_rows.append(processed_row)

        connection.close()
        return JSONResponse(content=processed_rows, status_code=200)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assessments", tags=["Assessments"])
async def create_assessments(
    assessment_data: dict,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Create assessments for schools/aspect/term combination.

    Request Body:
    {
        "school_ids": ["cedar-park-primary", "oak-hill-academy"],
        "aspect_code": "EDU",
        "term_id": "T1-2024-25",
        "due_date": "2024-12-20",
        "assigned_to": "user7"
    }

    Enforces MAT isolation - can only create assessments for schools in user's MAT.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        school_ids = assessment_data.get('school_ids', [])
        aspect_code = assessment_data.get('aspect_code')
        unique_term_id = assessment_data.get('term_id')  # Format: T1-2024-25
        due_date = assessment_data.get('due_date')
        assigned_to = assessment_data.get('assigned_to')

        # Extract academic_year from unique_term_id
        # T1-2024-25 -> 2024-25
        academic_year = unique_term_id.split('-', 1)[1] if '-' in unique_term_id else None

        # MAT isolation: Verify all school_ids belong to user's MAT
        if school_ids:
            placeholders = ','.join(['%s'] * len(school_ids))
            verify_query = f"""
                SELECT school_id FROM schools
                WHERE school_id IN ({placeholders}) AND mat_id = %s
            """
            cursor.execute(verify_query, school_ids + [current_mat_id])
            valid_schools = {row['school_id'] for row in cursor.fetchall()}

            invalid_schools = set(school_ids) - valid_schools
            if invalid_schools:
                connection.close()
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Cannot create assessments for schools outside your MAT: {', '.join(invalid_schools)}"
                )

        # Get all mat_standards for this aspect
        standards_query = """
            SELECT ms.mat_standard_id, sv.version_id
            FROM mat_standards ms
            JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
            JOIN standard_versions sv ON ms.current_version_id = sv.version_id
            WHERE ms.mat_id = %s
              AND ma.aspect_code = %s
              AND ms.is_active = TRUE
        """
        cursor.execute(standards_query, (current_mat_id, aspect_code))
        standards = cursor.fetchall()

        if not standards:
            connection.close()
            raise HTTPException(
                status_code=404,
                detail=f"No standards found for aspect: {aspect_code}"
            )

        # Create assessment for each (school, standard, term)
        created_count = 0
        created_assessment_ids = []

        for school_id in school_ids:
            for standard_row in standards:
                mat_standard_id = standard_row['mat_standard_id']
                version_id = standard_row['version_id']

                # Check if assessment already exists
                check_query = """
                    SELECT assessment_id FROM assessments
                    WHERE school_id = %s
                      AND mat_standard_id = %s
                      AND unique_term_id = %s
                """
                cursor.execute(check_query, (school_id, mat_standard_id, unique_term_id))
                existing = cursor.fetchone()

                if not existing:
                    # Create new assessment
                    insert_query = """
                        INSERT INTO assessments
                        (id, school_id, mat_standard_id, version_id,
                         unique_term_id, academic_year, due_date,
                         assigned_to, status, last_updated, updated_by)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'not_started', NOW(), %s)
                    """
                    new_id = str(uuid.uuid4())
                    cursor.execute(insert_query, (
                        new_id,
                        school_id,
                        mat_standard_id,
                        version_id,
                        unique_term_id,
                        academic_year,
                        due_date,
                        assigned_to or current_user.user_id,
                        current_user.user_id
                    ))
                    created_count += 1

                    # Get the generated assessment_id
                    cursor.execute(check_query, (school_id, mat_standard_id, unique_term_id))
                    result = cursor.fetchone()
                    if result:
                        created_assessment_ids.append(result['assessment_id'])
                elif existing and existing['assessment_id'] not in created_assessment_ids:
                    # Already exists - add to list if from this aspect
                    created_assessment_ids.append(existing['assessment_id'])

        connection.commit()
        connection.close()

        return JSONResponse(content={
            "message": f"Created {created_count} assessments for {len(school_ids)} schools",
            "assessments_created": created_count,
            "assessment_ids": created_assessment_ids,
            "schools": school_ids,
            "aspect_code": aspect_code,
            "term_id": unique_term_id
        }, status_code=201)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/schools", tags=["Schools"])
async def get_schools(
    include_central: bool = False,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get list of schools for the authenticated user's MAT.
    Enforces MAT isolation - users can only see schools in their own MAT.
    Requires authentication.

    Query Parameters:
    - include_central: If True, includes central office in results (default: False)
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # MAT isolation: only return schools belonging to user's MAT
        query = """
            SELECT school_id, school_name, school_type, is_central_office, is_active
            FROM schools
            WHERE mat_id = %s AND is_active = TRUE
        """

        if not include_central:
            query += " AND is_central_office = FALSE"

        query += " ORDER BY school_name"

        cursor.execute(query, (current_mat_id,))
        schools = cursor.fetchall()

        connection.close()
        return JSONResponse(content=schools, status_code=200)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# STANDARDS ENDPOINTS - FULL CRUD
# ================================

@app.get("/api/standards", response_model=List[MatStandardResponse], tags=["Standards"])
async def get_standards(
    aspect_code: Optional[str] = None,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get list of MAT-specific standards with current versions.
    Optionally filtered by aspect_code.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            SELECT ms.mat_standard_id, ms.standard_code, ms.standard_name,
                   ms.standard_description, ms.sort_order, ms.is_custom, ms.is_modified,
                   ma.mat_aspect_id, ma.aspect_code, ma.aspect_name,
                   sv.version_id as current_version_id, sv.version_number as current_version
            FROM mat_standards ms
            JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
            LEFT JOIN standard_versions sv ON ms.current_version_id = sv.version_id
            WHERE ms.mat_id = %s AND ms.is_active = TRUE AND ma.is_active = TRUE
        """
        params = [current_mat_id]

        # Optional filtering by aspect_code
        if aspect_code:
            query += " AND ma.aspect_code = %s"
            params.append(aspect_code)

        query += " ORDER BY ma.sort_order, ms.sort_order"

        cursor.execute(query, params)
        standards = cursor.fetchall()

        connection.close()
        return standards

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch standards: {str(e)}")

@app.get("/api/standards/{mat_standard_id}", tags=["Standards"])
async def get_standard(
    mat_standard_id: str,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get a specific MAT standard by ID with full version history.
    Used for viewing standard details and seeing what changed between versions.
    Enforces MAT isolation.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Get main standard info
        standard_query = """
            SELECT
                ms.mat_standard_id,
                ms.standard_code,
                ms.standard_name,
                ms.standard_description,
                ms.sort_order,
                ms.is_custom,
                ms.is_modified,
                ms.current_version_id,
                ma.mat_aspect_id,
                ma.aspect_code,
                ma.aspect_name,
                ms.created_at,
                ms.updated_at
            FROM mat_standards ms
            JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
            WHERE ms.mat_standard_id = %s
              AND ms.mat_id = %s
        """

        cursor.execute(standard_query, (mat_standard_id, current_mat_id))
        standard = cursor.fetchone()

        if not standard:
            connection.close()
            raise HTTPException(status_code=404, detail="Standard not found or access denied")

        # Get version history
        versions_query = """
            SELECT
                version_id,
                version_number,
                standard_code,
                standard_name,
                standard_description,
                effective_from,
                effective_to,
                change_reason,
                created_by_user_id,
                u.full_name as created_by_name
            FROM standard_versions sv
            LEFT JOIN users u ON sv.created_by_user_id = u.user_id
            WHERE mat_standard_id = %s
            ORDER BY version_number DESC
        """

        cursor.execute(versions_query, (mat_standard_id,))
        versions = cursor.fetchall()

        # Process versions
        version_history = []
        current_version = None

        for version in versions:
            version_data = {
                "version_id": version['version_id'],
                "version_number": version['version_number'],
                "standard_name": version['standard_name'],
                "standard_description": version['standard_description'],
                "effective_from": version['effective_from'].strftime('%Y-%m-%dT%H:%M:%SZ') if version['effective_from'] else None,
                "effective_to": version['effective_to'].strftime('%Y-%m-%dT%H:%M:%SZ') if version['effective_to'] else None,
                "change_reason": version['change_reason'],
                "created_by_name": version['created_by_name']
            }
            version_history.append(version_data)

            # If this is the current version (no effective_to)
            if version['effective_to'] is None:
                current_version = {
                    "version_id": version['version_id'],
                    "version_number": version['version_number'],
                    "effective_from": version['effective_from'].strftime('%Y-%m-%dT%H:%M:%SZ') if version['effective_from'] else None,
                    "effective_to": None
                }

        connection.close()

        return JSONResponse(content={
            "mat_standard_id": standard['mat_standard_id'],
            "standard_code": standard['standard_code'],
            "standard_name": standard['standard_name'],
            "standard_description": standard['standard_description'],
            "sort_order": standard['sort_order'],
            "is_custom": bool(standard['is_custom']),
            "is_modified": bool(standard['is_modified']),
            "mat_aspect_id": standard['mat_aspect_id'],
            "aspect_code": standard['aspect_code'],
            "aspect_name": standard['aspect_name'],
            "current_version": current_version,
            "version_history": version_history
        }, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch standard: {str(e)}")

@app.post("/api/standards", response_model=MatStandardResponse, status_code=status.HTTP_201_CREATED, tags=["Standards"])
async def create_standard(
    standard: MatStandardCreate,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Create a new MAT-specific standard with version 1.
    Supports copy-on-write from default standards.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Verify mat_aspect exists and belongs to user's MAT
        aspect_query = """
            SELECT mat_aspect_id FROM mat_aspects
            WHERE mat_aspect_id = %s AND mat_id = %s AND is_active = 1
        """
        cursor.execute(aspect_query, (standard.mat_aspect_id, current_mat_id))
        if not cursor.fetchone():
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Aspect not found or access denied"
            )

        # Check if standard_code already exists for this aspect
        check_query = """
            SELECT mat_standard_id FROM mat_standards
            WHERE mat_aspect_id = %s AND standard_code = %s AND is_active = 1
        """
        cursor.execute(check_query, (standard.mat_aspect_id, standard.standard_code))
        if cursor.fetchone():
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Standard with code '{standard.standard_code}' already exists for this aspect"
            )

        # Generate IDs
        mat_standard_id = str(uuid.uuid4())
        version_id = str(uuid.uuid4())

        # Insert mat_standard record
        insert_standard_query = """
            INSERT INTO mat_standards
            (mat_standard_id, mat_id, mat_aspect_id, standard_code, sort_order,
             source_standard_id, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, 1, NOW(), NOW())
        """
        cursor.execute(insert_standard_query, (
            mat_standard_id,
            current_mat_id,
            standard.mat_aspect_id,
            standard.standard_code,
            standard.sort_order,
            standard.source_standard_id
        ))

        # Insert version 1
        insert_version_query = """
            INSERT INTO standard_versions
            (version_id, mat_standard_id, version_number, standard_code,
             standard_name, standard_description, effective_from, effective_to,
             created_by_user_id, change_reason, created_at)
            VALUES (%s, %s, 1, %s, %s, %s, NOW(), NULL, %s, 'Initial version', NOW())
        """
        cursor.execute(insert_version_query, (
            version_id,
            mat_standard_id,
            standard.standard_code,
            standard.standard_name,
            standard.standard_description,
            current_user.user_id
        ))

        # Fetch the created standard with current version
        select_query = """
            SELECT
                ms.mat_standard_id, ms.standard_code,
                sv.standard_name, sv.standard_description,
                ms.sort_order, ms.mat_id, ms.mat_aspect_id,
                ma.aspect_code, ma.aspect_name,
                sv.version_id, sv.version_number,
                CASE WHEN ms.source_standard_id IS NULL THEN 1 ELSE 0 END as is_custom,
                0 as is_modified
            FROM mat_standards ms
            JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
            JOIN standard_versions sv ON ms.mat_standard_id = sv.mat_standard_id
            WHERE ms.mat_standard_id = %s AND sv.effective_to IS NULL
        """
        cursor.execute(select_query, (mat_standard_id,))
        created_standard = cursor.fetchone()

        connection.close()
        return created_standard

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create standard: {str(e)}")

@app.put("/api/standards/{mat_standard_id}", tags=["Standards"])
async def update_standard(
    mat_standard_id: str,
    update_data: dict,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update a standard's definition. Creates a new version (immutable history) rather than modifying in place.
    This preserves the exact wording used when assessments were made.

    Process:
    1. Get current version info
    2. Set current version's effective_to = NOW()
    3. Create new version with incremented version_number
    4. Update mat_standards.current_version_id to new version
    5. Update mat_standards name/description fields
    6. Set is_modified = TRUE
    7. Log to standard_edit_log
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Get current version info
        cursor.execute("""
            SELECT ms.current_version_id, ms.standard_code, sv.version_number
            FROM mat_standards ms
            JOIN standard_versions sv ON ms.current_version_id = sv.version_id
            WHERE ms.mat_standard_id = %s AND ms.mat_id = %s
        """, (mat_standard_id, current_mat_id))

        current = cursor.fetchone()
        if not current:
            connection.close()
            raise HTTPException(status_code=404, detail="Standard not found")

        old_version_id = current['current_version_id']
        standard_code = current['standard_code']
        new_version_num = current['version_number'] + 1
        new_version_id = f"{mat_standard_id}-v{new_version_num}"

        new_name = update_data.get('standard_name')
        new_description = update_data.get('standard_description')
        change_reason = update_data.get('change_reason', '')

        # Close old version
        cursor.execute("""
            UPDATE standard_versions SET effective_to = NOW() WHERE version_id = %s
        """, (old_version_id,))

        # Create new version
        cursor.execute("""
            INSERT INTO standard_versions
            (version_id, mat_standard_id, version_number, standard_code, standard_name,
             standard_description, parent_version_id, effective_from, created_at,
             created_by_user_id, change_reason)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s)
        """, (new_version_id, mat_standard_id, new_version_num, standard_code,
              new_name, new_description, old_version_id, current_user.user_id, change_reason))

        # Update mat_standards
        cursor.execute("""
            UPDATE mat_standards
            SET standard_name = %s, standard_description = %s,
                current_version_id = %s, is_modified = TRUE, updated_at = NOW()
            WHERE mat_standard_id = %s AND mat_id = %s
        """, (new_name, new_description, new_version_id, mat_standard_id, current_mat_id))

        # Log edit (store old/new as JSON)
        import json
        log_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO standard_edit_log
            (log_id, mat_standard_id, version_id, action_type, edited_by_user_id,
             edited_at, old_values, new_values, change_reason)
            VALUES (%s, %s, %s, 'edited', %s, NOW(), %s, %s, %s)
        """, (log_id, mat_standard_id, new_version_id, current_user.user_id,
              json.dumps({"version_id": old_version_id}),
              json.dumps({"version_id": new_version_id, "name": new_name}),
              change_reason))

        connection.commit()
        connection.close()

        return JSONResponse(content={
            "message": "Standard updated successfully",
            "mat_standard_id": mat_standard_id,
            "new_version_id": new_version_id,
            "version_number": new_version_num,
            "previous_version_id": old_version_id
        }, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        if connection:
            connection.rollback()
            connection.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/standards/{mat_standard_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Standards"])
async def delete_standard(
    mat_standard_id: str,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Soft delete a MAT standard (sets is_active = 0).
    Enforces MAT isolation.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Check if standard exists and belongs to user's MAT
        check_query = """
            SELECT mat_standard_id FROM mat_standards
            WHERE mat_standard_id = %s AND mat_id = %s AND is_active = 1
        """
        cursor.execute(check_query, (mat_standard_id, current_mat_id))
        if not cursor.fetchone():
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Standard not found or access denied"
            )

        # Check if there are active assessments using this standard
        # Note: In production schema, assessments reference mat_standard_id + version_id
        assessments_query = """
            SELECT COUNT(*) as count FROM assessments
            WHERE mat_standard_id = %s
        """
        cursor.execute(assessments_query, (mat_standard_id,))
        result = cursor.fetchone()

        if result and result['count'] > 0:
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot delete standard because it is used in {result['count']} assessments."
            )

        # Soft delete standard
        delete_query = """
            UPDATE mat_standards
            SET is_active = 0, updated_at = NOW()
            WHERE mat_standard_id = %s
        """
        cursor.execute(delete_query, (mat_standard_id,))

        connection.close()
        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete standard: {str(e)}")

# Version History Endpoint
@app.get("/api/standards/{mat_standard_id}/versions", response_model=List[StandardVersionResponse], tags=["Standards"])
async def get_standard_versions(
    mat_standard_id: str,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get version history for a MAT standard.
    Returns all versions ordered by version_number descending (newest first).
    Enforces MAT isolation.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Verify standard belongs to user's MAT
        check_query = """
            SELECT mat_standard_id FROM mat_standards
            WHERE mat_standard_id = %s AND mat_id = %s
        """
        cursor.execute(check_query, (mat_standard_id, current_mat_id))
        if not cursor.fetchone():
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Standard not found or access denied"
            )

        # Get all versions
        versions_query = """
            SELECT
                version_id,
                version_number,
                standard_code,
                standard_name,
                standard_description,
                effective_from,
                effective_to,
                created_by_user_id,
                change_reason
            FROM standard_versions
            WHERE mat_standard_id = %s
            ORDER BY version_number DESC
        """
        cursor.execute(versions_query, (mat_standard_id,))
        versions = cursor.fetchall()

        connection.close()
        return versions

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch version history: {str(e)}")

# ================================
# ASPECTS ENDPOINTS - FULL CRUD
# ================================

@app.get("/api/aspects", response_model=List[MatAspectResponse], tags=["Aspects"])
async def get_aspects(
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get list of MAT-specific aspects with standard counts.
    Returns aspects for the authenticated user's MAT, including both default and custom aspects.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Get MAT-specific aspects with standard counts
        query = """
            SELECT mat_aspect_id, aspect_code, aspect_name, aspect_description,
                   sort_order, is_custom,
                   (SELECT COUNT(*) FROM mat_standards ms
                    WHERE ms.mat_aspect_id = ma.mat_aspect_id AND ms.is_active = TRUE) as standards_count
            FROM mat_aspects ma
            WHERE mat_id = %s AND is_active = TRUE
            ORDER BY sort_order
        """

        cursor.execute(query, (current_mat_id,))
        aspects = cursor.fetchall()

        connection.close()
        return aspects

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch aspects: {str(e)}")

@app.get("/api/aspects/{mat_aspect_id}", response_model=MatAspectResponse, tags=["Aspects"])
async def get_aspect(
    mat_aspect_id: str,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get a specific MAT aspect by ID with its standard count.
    Enforces MAT isolation - can only view aspects from user's MAT.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            SELECT
                ma.mat_aspect_id,
                ma.aspect_code,
                ma.aspect_name,
                ma.aspect_description,
                ma.sort_order,
                ma.mat_id,
                ma.source_aspect_id,
                CASE WHEN ma.source_aspect_id IS NULL THEN 1 ELSE 0 END as is_custom,
                CASE WHEN ma.source_aspect_id IS NOT NULL AND
                     (ma.aspect_name != COALESCE(da.aspect_name, '') OR
                      ma.aspect_description != COALESCE(da.aspect_description, ''))
                THEN 1 ELSE 0 END as is_modified,
                COUNT(ms.mat_standard_id) as standards_count
            FROM mat_aspects ma
            LEFT JOIN mat_standards ms ON ma.mat_aspect_id = ms.mat_aspect_id
            LEFT JOIN aspects da ON ma.source_aspect_id = da.aspect_id
            WHERE ma.mat_aspect_id = %s AND ma.mat_id = %s AND ma.is_active = 1
            GROUP BY ma.mat_aspect_id, ma.aspect_code, ma.aspect_name,
                     ma.aspect_description, ma.sort_order, ma.mat_id,
                     ma.source_aspect_id, da.aspect_name, da.aspect_description
        """

        cursor.execute(query, (mat_aspect_id, current_mat_id))
        aspect = cursor.fetchone()

        connection.close()

        if not aspect:
            raise HTTPException(status_code=404, detail=f"Aspect not found or access denied")

        return aspect

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch aspect: {str(e)}")

@app.post("/api/aspects", response_model=MatAspectResponse, status_code=status.HTTP_201_CREATED, tags=["Aspects"])
async def create_aspect(
    aspect: MatAspectCreate,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Create a new MAT-specific aspect.
    Can either create a custom aspect or copy from default aspects (copy-on-write).
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Generate new mat_aspect_id
        mat_aspect_id = str(uuid.uuid4())

        # If copying from source aspect, verify it exists
        if aspect.source_aspect_id:
            source_query = "SELECT aspect_id, aspect_name, aspect_description FROM aspects WHERE aspect_id = %s"
            cursor.execute(source_query, (aspect.source_aspect_id,))
            source = cursor.fetchone()

            if not source:
                connection.close()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Source aspect '{aspect.source_aspect_id}' not found"
                )

        # Check if aspect_code already exists for this MAT
        check_query = """
            SELECT mat_aspect_id FROM mat_aspects
            WHERE mat_id = %s AND aspect_code = %s AND is_active = 1
        """
        cursor.execute(check_query, (current_mat_id, aspect.aspect_code))
        if cursor.fetchone():
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Aspect with code '{aspect.aspect_code}' already exists for your MAT"
            )

        # Insert new MAT aspect
        insert_query = """
            INSERT INTO mat_aspects
            (mat_aspect_id, mat_id, aspect_code, aspect_name, aspect_description,
             sort_order, source_aspect_id, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 1, NOW(), NOW())
        """
        cursor.execute(insert_query, (
            mat_aspect_id,
            current_mat_id,
            aspect.aspect_code,
            aspect.aspect_name,
            aspect.aspect_description,
            aspect.sort_order,
            aspect.source_aspect_id
        ))

        # Fetch the created aspect
        fetch_query = """
            SELECT mat_aspect_id, aspect_code, aspect_name, aspect_description,
                   sort_order, mat_id, source_aspect_id,
                   CASE WHEN source_aspect_id IS NULL THEN 1 ELSE 0 END as is_custom,
                   0 as is_modified,
                   0 as standards_count
            FROM mat_aspects
            WHERE mat_aspect_id = %s
        """
        cursor.execute(fetch_query, (mat_aspect_id,))
        created_aspect = cursor.fetchone()

        connection.close()
        return created_aspect

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create aspect: {str(e)}")

@app.put("/api/aspects/{mat_aspect_id}", response_model=MatAspectResponse, tags=["Aspects"])
async def update_aspect(
    mat_aspect_id: str,
    aspect: MatAspectUpdate,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update an existing MAT aspect.
    Enforces MAT isolation - can only update aspects in user's MAT.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Check if aspect exists and belongs to user's MAT
        check_query = """
            SELECT mat_aspect_id FROM mat_aspects
            WHERE mat_aspect_id = %s AND mat_id = %s AND is_active = 1
        """
        cursor.execute(check_query, (mat_aspect_id, current_mat_id))
        if not cursor.fetchone():
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Aspect not found or access denied"
            )

        # Build update query based on provided fields
        update_fields = []
        update_values = []

        if aspect.aspect_name is not None:
            update_fields.append("aspect_name = %s")
            update_values.append(aspect.aspect_name)

        if aspect.aspect_description is not None:
            update_fields.append("aspect_description = %s")
            update_values.append(aspect.aspect_description)

        if aspect.sort_order is not None:
            update_fields.append("sort_order = %s")
            update_values.append(aspect.sort_order)

        if not update_fields:
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        update_fields.append("updated_at = NOW()")
        update_values.append(mat_aspect_id)

        update_query = f"""
            UPDATE mat_aspects
            SET {', '.join(update_fields)}
            WHERE mat_aspect_id = %s
        """
        cursor.execute(update_query, update_values)

        # Fetch updated aspect
        select_query = """
            SELECT
                ma.mat_aspect_id, ma.aspect_code, ma.aspect_name, ma.aspect_description,
                ma.sort_order, ma.mat_id, ma.source_aspect_id,
                CASE WHEN ma.source_aspect_id IS NULL THEN 1 ELSE 0 END as is_custom,
                CASE WHEN ma.source_aspect_id IS NOT NULL AND
                     (ma.aspect_name != COALESCE(da.aspect_name, '') OR
                      ma.aspect_description != COALESCE(da.aspect_description, ''))
                THEN 1 ELSE 0 END as is_modified,
                COUNT(ms.mat_standard_id) as standards_count
            FROM mat_aspects ma
            LEFT JOIN mat_standards ms ON ma.mat_aspect_id = ms.mat_aspect_id
            LEFT JOIN aspects da ON ma.source_aspect_id = da.aspect_id
            WHERE ma.mat_aspect_id = %s
            GROUP BY ma.mat_aspect_id, ma.aspect_code, ma.aspect_name,
                     ma.aspect_description, ma.sort_order, ma.mat_id,
                     ma.source_aspect_id, da.aspect_name, da.aspect_description
        """
        cursor.execute(select_query, (mat_aspect_id,))
        updated_aspect = cursor.fetchone()

        connection.close()
        return updated_aspect

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update aspect: {str(e)}")

@app.delete("/api/aspects/{mat_aspect_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Aspects"])
async def delete_aspect(
    mat_aspect_id: str,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Soft delete a MAT aspect (sets is_active = 0).
    Enforces MAT isolation - can only delete aspects in user's MAT.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Check if aspect exists and belongs to user's MAT
        check_query = """
            SELECT mat_aspect_id FROM mat_aspects
            WHERE mat_aspect_id = %s AND mat_id = %s AND is_active = 1
        """
        cursor.execute(check_query, (mat_aspect_id, current_mat_id))
        if not cursor.fetchone():
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Aspect not found or access denied"
            )

        # Check if there are standards using this aspect
        standards_query = """
            SELECT COUNT(*) as count FROM mat_standards
            WHERE mat_aspect_id = %s AND is_active = 1
        """
        cursor.execute(standards_query, (mat_aspect_id,))
        result = cursor.fetchone()

        if result['count'] > 0:
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot delete aspect because it has {result['count']} active standards. Delete the standards first."
            )

        # Soft delete aspect
        delete_query = """
            UPDATE mat_aspects
            SET is_active = 0, updated_at = NOW()
            WHERE mat_aspect_id = %s
        """
        cursor.execute(delete_query, (mat_aspect_id,))

        connection.close()
        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete aspect: {str(e)}")

@app.get("/api/terms", tags=["Terms"])
async def get_terms(academic_year: Optional[str] = None):
    """
    Get list of all terms and academic periods.
    Optionally filtered by academic_year.

    Query Parameters:
    - academic_year: Filter by specific academic year (e.g., "2024-25")
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            SELECT unique_term_id, term_id, term_name, start_date, end_date, academic_year,
                   CASE WHEN CURDATE() BETWEEN start_date AND end_date THEN TRUE ELSE FALSE END as is_current
            FROM terms
        """

        params = []
        if academic_year:
            query += " WHERE academic_year = %s"
            params.append(academic_year)

        query += " ORDER BY academic_year DESC, FIELD(term_id, 'T1', 'T2', 'T3')"

        cursor.execute(query, params)
        terms = cursor.fetchall()

        # Process terms for JSON serialization
        processed_terms = []
        for term in terms:
            processed_term = process_row_for_json(term)
            processed_terms.append(processed_term)

        connection.close()
        return JSONResponse(content=processed_terms, status_code=200)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users", tags=["Users"])
async def get_users(
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user),
    school_id: Optional[str] = Query(None),
    role_title: Optional[str] = Query(None)
):
    """
    Get list of users in the authenticated user's MAT.
    Enforces MAT isolation - users can only see other users in their own MAT.
    Optionally filtered by school and role.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # MAT isolation: only return users from the same MAT
        query = """
            SELECT user_id, full_name as name, email, role_title, school_id, mat_id, is_active
            FROM users
            WHERE mat_id = %s AND is_active = 1
        """
        params = [current_mat_id]

        # Optional school filter (must be within user's MAT)
        if school_id:
            query += " AND school_id = %s"
            params.append(school_id)

        # Optional role filter
        if role_title:
            query += " AND role_title = %s"
            params.append(role_title)

        query += " ORDER BY full_name"

        cursor.execute(query, params)
        users = cursor.fetchall()

        # Add permissions (simplified for now)
        for user in users:
            user['permissions'] = ["complete_assessments", "view_school_data"]

        connection.close()
        return JSONResponse(content=users, status_code=200)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users/me", tags=["Users"])
async def get_current_user_context(
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get current authenticated user's context.
    Returns user information from JWT token.
    Requires authentication.
    """
    try:
        # Return the authenticated user information
        user_context = {
            "user_id": current_user.user_id,
            "name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role_title,
            "school_id": current_user.school_id,
            "mat_id": current_user.mat_id,
            "permissions": ["complete_assessments", "view_school_data"],
            "is_active": current_user.is_active,
            "active_assessments": []  # TODO: Query from database in Phase 4
        }

        return JSONResponse(content=user_context, status_code=200)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assessments/{assessment_id}", tags=["Assessments"])
async def get_assessment_details(
    assessment_id: str,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get detailed assessment information.

    Path Parameter:
    - assessment_id: Format {school_id}-{standard_code}-{unique_term_id}
                     Example: cedar-park-primary-ES1-T1-2024-25
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Query using virtual assessment_id column - much simpler!
        query = """
            SELECT
                a.id,
                a.assessment_id,
                a.school_id,
                s.school_name,
                a.mat_standard_id,
                ms.standard_code,
                ms.standard_name,
                ms.standard_description,
                ma.mat_aspect_id,
                ma.aspect_code,
                ma.aspect_name,
                a.version_id,
                sv.version_number,
                a.unique_term_id,
                a.academic_year,
                a.rating,
                a.evidence_comments,
                a.status,
                a.due_date,
                a.assigned_to,
                u_assigned.full_name as assigned_to_name,
                a.submitted_at,
                a.submitted_by,
                u_submitted.full_name as submitted_by_name,
                a.last_updated,
                a.updated_by
            FROM assessments a
            JOIN schools s ON a.school_id = s.school_id
            JOIN mat_standards ms ON a.mat_standard_id = ms.mat_standard_id
            JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
            JOIN standard_versions sv ON a.version_id = sv.version_id
            LEFT JOIN users u_assigned ON a.assigned_to = u_assigned.user_id
            LEFT JOIN users u_submitted ON a.submitted_by = u_submitted.user_id
            WHERE a.assessment_id = %s
              AND s.mat_id = %s
        """
        cursor.execute(query, (assessment_id, current_mat_id))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Assessment not found")

        # Format response
        assessment_data = process_row_for_json(row)

        # Format dates
        if assessment_data.get('due_date') and isinstance(row['due_date'], date):
            assessment_data['due_date'] = row['due_date'].strftime('%Y-%m-%d')
        if assessment_data.get('submitted_at') and isinstance(row['submitted_at'], datetime):
            assessment_data['submitted_at'] = row['submitted_at'].strftime('%Y-%m-%dT%H:%M:%SZ')
        if assessment_data.get('last_updated') and isinstance(row['last_updated'], datetime):
            assessment_data['last_updated'] = row['last_updated'].strftime('%Y-%m-%dT%H:%M:%SZ')

        connection.close()
        return JSONResponse(content=assessment_data, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assessments/by-aspect/{aspect_code}", tags=["Assessments"])
async def get_assessments_by_aspect(
    aspect_code: str,
    school_id: str = Query(..., description="School ID (required)"),
    term_id: str = Query(..., description="Term ID in format T1-2024-25 (required)"),
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get all assessments for a specific aspect (all standards within that aspect) for a school/term.
    Powers the assessment form view where users rate all standards in one aspect.

    Path Parameter:
    - aspect_code: e.g., EDU, HR, FIN

    Query Parameters:
    - school_id: e.g., cedar-park-primary (required)
    - term_id: e.g., T1-2024-25 (required)

    Returns all standards in the aspect with their assessment data (if exists).
    Standards without assessments will have null rating/evidence fields.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Get school and aspect info
        info_query = """
            SELECT s.school_id, s.school_name, ma.mat_aspect_id, ma.aspect_code, ma.aspect_name,
                   SUBSTRING(%s, 1, 2) as term_part,
                   SUBSTRING(%s, 4) as academic_year
            FROM schools s
            CROSS JOIN mat_aspects ma
            WHERE s.school_id = %s
              AND s.mat_id = %s
              AND ma.aspect_code = %s
              AND ma.mat_id = %s
              AND s.is_active = TRUE
              AND ma.is_active = TRUE
        """
        cursor.execute(info_query, (term_id, term_id, school_id, current_mat_id, aspect_code, current_mat_id))
        info = cursor.fetchone()

        if not info:
            connection.close()
            raise HTTPException(
                status_code=404,
                detail="School or aspect not found in your MAT"
            )

        # Get all standards with their assessments (LEFT JOIN)
        standards_query = """
            SELECT
                a.assessment_id,
                a.id,
                a.mat_standard_id,
                ms.standard_code,
                ms.standard_name,
                ms.standard_description,
                ms.sort_order,
                a.rating,
                a.evidence_comments,
                a.version_id,
                sv.version_number,
                a.status,
                a.due_date,
                a.assigned_to,
                u.full_name as assigned_to_name,
                a.submitted_at,
                a.last_updated
            FROM mat_standards ms
            JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
            LEFT JOIN assessments a ON ms.mat_standard_id = a.mat_standard_id
                AND a.school_id = %s
                AND a.unique_term_id = %s
            LEFT JOIN standard_versions sv ON a.version_id = sv.version_id
            LEFT JOIN users u ON a.assigned_to = u.user_id
            WHERE ma.aspect_code = %s
              AND ms.mat_id = %s
              AND ms.is_active = TRUE
            ORDER BY ms.sort_order
        """

        cursor.execute(standards_query, (school_id, term_id, aspect_code, current_mat_id))
        standards = cursor.fetchall()

        # Process standards
        standards_list = []
        total_standards = 0
        completed_standards = 0

        for row in standards:
            total_standards += 1
            if row['status'] == 'completed':
                completed_standards += 1

            standard = {
                "assessment_id": row['assessment_id'],
                "id": row['id'],
                "mat_standard_id": row['mat_standard_id'],
                "standard_code": row['standard_code'],
                "standard_name": row['standard_name'],
                "standard_description": row['standard_description'],
                "sort_order": row['sort_order'],
                "rating": row['rating'],
                "evidence_comments": row['evidence_comments'],
                "version_id": row['version_id'],
                "version_number": row['version_number'],
                "status": row['status'] if row['status'] else 'not_started',
                "due_date": row['due_date'].strftime('%Y-%m-%d') if row['due_date'] else None,
                "assigned_to": row['assigned_to'],
                "assigned_to_name": row['assigned_to_name'],
                "submitted_at": row['submitted_at'].strftime('%Y-%m-%dT%H:%M:%SZ') if row['submitted_at'] else None,
                "last_updated": row['last_updated'].strftime('%Y-%m-%dT%H:%M:%SZ') if row['last_updated'] else None
            }
            standards_list.append(standard)

        # Determine overall status
        if completed_standards == 0:
            overall_status = 'not_started'
        elif completed_standards == total_standards:
            overall_status = 'completed'
        else:
            overall_status = 'in_progress'

        connection.close()

        return JSONResponse(content={
            "school_id": info['school_id'],
            "school_name": info['school_name'],
            "aspect_code": info['aspect_code'],
            "aspect_name": info['aspect_name'],
            "mat_aspect_id": info['mat_aspect_id'],
            "term_id": term_id,
            "academic_year": info['academic_year'],
            "total_standards": total_standards,
            "completed_standards": completed_standards,
            "status": overall_status,
            "standards": standards_list
        }, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/debug/assessment-parsing/{assessment_id}", tags=["Debug"])
async def debug_assessment_parsing(assessment_id: str):
    """
    Debug endpoint to see how assessment_id is being parsed
    """
    try:
        # Parse assessment_id to get components
        parts = assessment_id.split('-')
        
        # Find the term pattern (T1, T2, T3, etc.)
        term_index = None
        for i, part in enumerate(parts):
            if part.startswith('T') and part[1:].isdigit():
                term_index = i
                break
        
        if term_index is None:
            return {"error": "No term found", "parts": parts}
        
        # Split the parts correctly
        school_parts = parts[:term_index-1]
        category = parts[term_index-1]
        term_id = parts[term_index]
        academic_year_parts = parts[term_index+1:]
        
        school_id = '-'.join(school_parts)
        academic_year = '-'.join(academic_year_parts)
        
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Check what actually exists in the database
        check_query = """
            SELECT school_id, standard_id, term_id, academic_year, s.aspect_id
            FROM assessments a 
            JOIN standards s ON a.standard_id = s.standard_id 
            WHERE a.school_id = %s AND a.term_id = %s AND a.academic_year = %s
            LIMIT 5
        """
        cursor.execute(check_query, (school_id, term_id, academic_year))
        db_records = cursor.fetchall()
        
        connection.close()
        
        return {
            "original_assessment_id": assessment_id,
            "parsed_parts": parts,
            "term_index": term_index,
            "parsed_school_id": school_id,
            "parsed_category": category,
            "parsed_term_id": term_id, 
            "parsed_academic_year": academic_year,
            "database_records": db_records
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/assessments/{assessment_id}/submit", tags=["Assessments"])
async def submit_assessment_ratings(
    assessment_id: str,
    submission: AssessmentSubmission,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Submit or update ratings for multiple standards within an assessment.
    Enforces MAT isolation - can only submit for assessments in user's MAT.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Parse assessment_id to get components
        parts = assessment_id.split('-')
        if len(parts) < 4:
            raise HTTPException(status_code=400, detail="Invalid assessment_id format")

        # For assessment_id like: cedar-park-primary-education-T1-2024-25
        # We need to find where the school_id ends and category begins
        # Look for the term pattern (T1, T2, T3, etc.)
        term_index = None
        for i, part in enumerate(parts):
            if part.startswith('T') and part[1:].isdigit():
                term_index = i
                break

        if term_index is None or term_index < 2:
            raise HTTPException(status_code=400, detail="Invalid assessment_id format - no term found")

        # Split the parts correctly
        school_parts = parts[:term_index-1]  # Everything before category
        category = parts[term_index-1]       # The category (education, governance, etc.)
        term_id = parts[term_index]          # The term (T1, T2, T3)
        academic_year_parts = parts[term_index+1:]  # Academic year parts (2024, 25)

        school_id = '-'.join(school_parts)
        academic_year = '-'.join(academic_year_parts)

        # MAT isolation: Verify school belongs to user's MAT
        mat_check_query = "SELECT school_id FROM schools WHERE school_id = %s AND mat_id = %s"
        cursor.execute(mat_check_query, (school_id, current_mat_id))
        if not cursor.fetchone():
            connection.close()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot submit assessment for school outside your MAT"
            )

        # Verify assessment exists by checking if any standards exist for this combination
        verify_query = """
            SELECT COUNT(*) as count FROM assessments
            WHERE school_id = %s AND term_id = %s AND academic_year = %s
        """
        cursor.execute(verify_query, (school_id, term_id, academic_year))
        result = cursor.fetchone()

        if not result or result['count'] == 0:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Update each standard rating with UPSERT logic
        updated_standards = []
        for standard in submission.standards:
            # Check if record exists using standard_id (the lowest data level)
            check_query = """
                SELECT id FROM assessments 
                WHERE school_id = %s AND standard_id = %s AND term_id = %s AND academic_year = %s
            """
            cursor.execute(check_query, (school_id, standard.standard_id, term_id, academic_year))
            existing_record = cursor.fetchone()
            
            if existing_record:
                # Update existing record
                update_query = """
                    UPDATE assessments 
                    SET rating = %s, evidence_comments = %s, submitted_by = %s, 
                        last_updated = CONVERT_TZ(NOW(), @@session.time_zone, '+01:00'), 
                        updated_by = %s
                    WHERE school_id = %s AND standard_id = %s AND term_id = %s AND academic_year = %s
                """
                cursor.execute(update_query, (
                    standard.rating,
                    standard.evidence_comments,
                    standard.submitted_by,
                    standard.submitted_by,
                    school_id,
                    standard.standard_id,
                    term_id,
                    academic_year
                ))
            else:
                # Insert new record
                insert_query = """
                    INSERT INTO assessments 
                    (id, school_id, standard_id, term_id, academic_year, rating, evidence_comments, 
                     submitted_by, last_updated, updated_by)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 
                            CONVERT_TZ(NOW(), @@session.time_zone, '+01:00'), %s)
                """
                new_uuid = str(uuid.uuid4())
                cursor.execute(insert_query, (
                    new_uuid,
                    school_id,
                    standard.standard_id,
                    term_id,
                    academic_year,
                    standard.rating,
                    standard.evidence_comments,
                    standard.submitted_by,
                    standard.submitted_by
                ))
            
            updated_standards.append(standard.standard_id)
        
        connection.close()
        
        return JSONResponse(content={
            "message": f"Successfully updated {len(updated_standards)} standards",
            "assessment_id": assessment_id,
            "updated_standards": updated_standards,
            "status": "success"
        }, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/assessments/{assessment_id}", tags=["Assessments"])
async def update_assessment(
    assessment_id: str,
    update_data: dict,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update assessment rating and evidence.

    Path Parameter:
    - assessment_id: Format {school_id}-{standard_code}-{unique_term_id}
                     Example: cedar-park-primary-ES1-T1-2024-25

    Request Body:
    {
        "rating": 4,
        "evidence_comments": "Excellent progress in all areas"
    }

    Enforces MAT isolation - can only update assessments in user's MAT.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        rating = update_data.get('rating')
        evidence_comments = update_data.get('evidence_comments')

        # Update query with MAT isolation via JOIN with schools
        update_query = """
            UPDATE assessments a
            JOIN schools s ON a.school_id = s.school_id
            SET
                a.rating = %s,
                a.evidence_comments = %s,
                a.status = CASE
                    WHEN %s IS NOT NULL THEN 'completed'
                    ELSE 'in_progress'
                END,
                a.submitted_by = %s,
                a.last_updated = NOW(),
                a.updated_by = %s
            WHERE a.assessment_id = %s
              AND s.mat_id = %s
        """

        cursor.execute(update_query, (
            rating,
            evidence_comments,
            rating,
            current_user.user_id,
            current_user.user_id,
            assessment_id,
            current_mat_id
        ))

        if cursor.rowcount == 0:
            connection.close()
            raise HTTPException(status_code=404, detail="Assessment not found")

        connection.commit()
        connection.close()

        return JSONResponse(content={
            "message": "Assessment updated successfully",
            "assessment_id": assessment_id,
            "status": "completed" if rating else "in_progress"
        }, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assessments/bulk-update", tags=["Assessments"])
async def bulk_update_assessments(
    bulk_data: dict,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Bulk update multiple assessments.

    Request Body:
    {
        "updates": [
            {
                "assessment_id": "cedar-park-primary-ES1-T1-2024-25",
                "rating": 4,
                "evidence_comments": "Excellent"
            },
            {
                "assessment_id": "cedar-park-primary-ES2-T1-2024-25",
                "rating": 3,
                "evidence_comments": "Good"
            }
        ]
    }

    Enforces MAT isolation - can only update assessments for schools in user's MAT.
    Requires authentication.
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        updates = bulk_data.get('updates', [])
        updated_count = 0

        # Update query with MAT isolation via JOIN with schools
        update_query = """
            UPDATE assessments a
            JOIN schools s ON a.school_id = s.school_id
            SET
                a.rating = %s,
                a.evidence_comments = %s,
                a.status = CASE WHEN %s IS NOT NULL THEN 'completed' ELSE 'in_progress' END,
                a.submitted_by = %s,
                a.last_updated = NOW(),
                a.updated_by = %s
            WHERE a.assessment_id = %s
              AND s.mat_id = %s
        """

        for update in updates:
            assessment_id = update.get('assessment_id')
            rating = update.get('rating')
            evidence_comments = update.get('evidence_comments')

            cursor.execute(update_query, (
                rating,
                evidence_comments,
                rating,
                current_user.user_id,
                current_user.user_id,
                assessment_id,
                current_mat_id
            ))
            updated_count += cursor.rowcount

        connection.commit()
        connection.close()

        return JSONResponse(content={
            "message": f"Updated {updated_count} assessments",
            "updated_count": updated_count,
            "failed_count": len(updates) - updated_count
        }, status_code=200)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# ANALYTICS ENDPOINTS
# ================================

@app.get("/api/analytics/trends", tags=["Analytics"])
async def get_trends(
    school_id: Optional[str] = None,
    aspect_code: Optional[str] = None,
    from_term: Optional[str] = None,
    to_term: Optional[str] = None,
    current_mat_id: str = Depends(get_current_mat),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get rating trends over time for analytics dashboard.
    Shows how ratings have improved (or not) across terms.

    Query Parameters:
    - school_id (optional): Filter to single school
    - aspect_code (optional): Filter to single aspect
    - from_term (optional): Start term, e.g., T1-2023-24
    - to_term (optional): End term, e.g., T1-2025-26
    """
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        query = """
            SELECT
                a.unique_term_id,
                a.academic_year,
                SUBSTRING(a.unique_term_id, 1, 2) as term_id,
                COUNT(*) as assessments_count,
                COUNT(CASE WHEN a.rating IS NOT NULL THEN 1 END) as rated_count,
                ROUND(AVG(a.rating), 2) as average_rating,
                MIN(a.rating) as min_rating,
                MAX(a.rating) as max_rating,
                COUNT(CASE WHEN a.rating = 1 THEN 1 END) as inadequate_count,
                COUNT(CASE WHEN a.rating = 2 THEN 1 END) as requires_improvement_count,
                COUNT(CASE WHEN a.rating = 3 THEN 1 END) as good_count,
                COUNT(CASE WHEN a.rating = 4 THEN 1 END) as outstanding_count
            FROM assessments a
            JOIN schools s ON a.school_id = s.school_id
            JOIN mat_standards ms ON a.mat_standard_id = ms.mat_standard_id
            JOIN mat_aspects ma ON ms.mat_aspect_id = ma.mat_aspect_id
            WHERE s.mat_id = %s
              AND a.rating IS NOT NULL
        """
        params = [current_mat_id]

        if school_id:
            query += " AND a.school_id = %s"
            params.append(school_id)

        if aspect_code:
            query += " AND ma.aspect_code = %s"
            params.append(aspect_code)

        if from_term:
            query += " AND a.unique_term_id >= %s"
            params.append(from_term)

        if to_term:
            query += " AND a.unique_term_id <= %s"
            params.append(to_term)

        query += """
            GROUP BY a.unique_term_id, a.academic_year
            ORDER BY a.academic_year, FIELD(SUBSTRING(a.unique_term_id, 1, 2), 'T1', 'T2', 'T3')
        """

        cursor.execute(query, params)
        rows = cursor.fetchall()

        # Build response
        trends = []
        for row in rows:
            trends.append({
                "unique_term_id": row['unique_term_id'],
                "term_id": row['term_id'],
                "academic_year": row['academic_year'],
                "assessments_count": row['assessments_count'],
                "rated_count": row['rated_count'],
                "average_rating": float(row['average_rating']) if row['average_rating'] else None,
                "min_rating": row['min_rating'],
                "max_rating": row['max_rating'],
                "rating_distribution": {
                    "inadequate": row['inadequate_count'],
                    "requires_improvement": row['requires_improvement_count'],
                    "good": row['good_count'],
                    "outstanding": row['outstanding_count']
                }
            })

        # Calculate summary
        if trends:
            first_avg = trends[0]['average_rating'] or 0
            last_avg = trends[-1]['average_rating'] or 0
            improvement = round(last_avg - first_avg, 2)
            overall_avg = round(sum(t['average_rating'] or 0 for t in trends) / len(trends), 2)
            trend_direction = "improving" if improvement > 0 else "declining" if improvement < 0 else "stable"
        else:
            improvement = 0
            overall_avg = 0
            trend_direction = "no_data"

        connection.close()

        return JSONResponse(content={
            "mat_id": current_mat_id,
            "filters": {
                "school_id": school_id,
                "aspect_code": aspect_code,
                "from_term": from_term,
                "to_term": to_term
            },
            "summary": {
                "total_terms": len(trends),
                "overall_average": overall_avg,
                "trend_direction": trend_direction,
                "improvement": improvement
            },
            "trends": trends
        }, status_code=200)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# STARTUP EVENT
# ================================

@app.on_event("startup")
async def startup_event():
    """Run startup tasks"""
    print("🚀 Assurly API starting up...")
    print("📧 Email service configured")
    print("🔐 Authentication system ready")
    
    # Test email service connection (optional)
    try:
        from email_service import email_service
        # Uncomment next line to test email on startup
        # connection_ok = await email_service.test_connection()
        # print(f"📧 Email service connection: {'✅ OK' if connection_ok else '❌ Failed'}")
    except Exception as e:
        print(f"⚠️ Email service test skipped: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)