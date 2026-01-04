# Assurly Frontend API

FastAPI-based RESTful API service for the Assurly School Assessment Management Platform.

## Overview

This is the primary API service for managing school assessments, users, and related data for Multi-Academy Trusts (MATs). Features passwordless magic link authentication, JWT token management, and comprehensive CRUD operations.

## Recent Updates

### ✨ Production-Grade Aspects & Standards Endpoints

**Branch:** `claude/aspects-mj7q251wgs0dopwj-EiE0X`

Upgraded the aspects and standards endpoints to production-grade with full CRUD capabilities:

#### New Features:
✅ **Aspects CRUD** - Full Create, Read, Update, Delete operations
- `GET /api/aspects` - List all aspects
- `GET /api/aspects/{aspect_id}` - Get single aspect
- `POST /api/aspects` - Create aspect (authenticated)
- `PUT /api/aspects/{aspect_id}` - Update aspect (authenticated)
- `DELETE /api/aspects/{aspect_id}` - Delete aspect (authenticated)

✅ **Standards CRUD** - Full Create, Read, Update, Delete operations
- `GET /api/standards` - List all standards (filterable by aspect)
- `GET /api/standards/{standard_id}` - Get single standard
- `POST /api/standards` - Create standard (authenticated)
- `PUT /api/standards/{standard_id}` - Update standard (authenticated)
- `DELETE /api/standards/{standard_id}` - Delete standard (authenticated)

#### Security & Validation:
- ✅ JWT authentication on all write operations
- ✅ Input validation using Pydantic models
- ✅ Dependency checks (prevent deletion of resources with dependencies)
- ✅ Conflict detection (prevent duplicate IDs)
- ✅ Proper HTTP status codes (400, 401, 404, 409, 500)
- ✅ Detailed error messages

**Frontend Integration:** Read operations (GET) are public - no auth required. Write operations (POST, PUT, DELETE) require Bearer token in Authorization header.

📖 **See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete endpoint documentation and examples.**

## Project Structure

```
Assurly-backend/
├── main.py                    # FastAPI application with all endpoints
├── API_DOCUMENTATION.md       # Comprehensive API documentation
├── README.md                  # This file
│
├── auth_config.py            # Authentication configuration
├── auth_models.py            # Pydantic models for auth (magic link, JWT)
├── auth_utils.py             # JWT and token utility functions
├── email_service.py          # SMTP email service for magic links
│
├── requirements.txt          # Python dependencies
├── Dockerfile               # Container configuration
│
├── smtp.py                  # Email testing utilities
├── jwt_keygenerator.py      # JWT key generation utility
└── gmail_creds_test.py      # Gmail credentials testing
```

## Features

### 🔐 Authentication
- **Magic Link Authentication** - Passwordless email-based login
- **JWT Tokens** - Secure API access with JSON Web Tokens
- **Session Management** - Token expiration and validation
- **Email Service** - Automated email delivery via SMTP

### 📊 Core Functionality
- **Assessments** - Create, read, update assessment data for schools
- **Aspects** - Full CRUD for assessment aspects/categories **(NEW)**
- **Standards** - Full CRUD for assessment standards **(NEW)**
- **Schools** - Manage school information and assignments
- **Terms** - Academic term and period management
- **Users** - User management, roles, and permissions

### 🎯 Key Capabilities
- RESTful API design with consistent patterns
- Automatic data validation via Pydantic
- Comprehensive error handling
- CORS support for frontend integration
- MySQL database with connection pooling
- Async email sending (non-blocking)

## Tech Stack

- **Framework:** FastAPI 0.110.1
- **Server:** Uvicorn 0.29.0 (ASGI)
- **Database:** MySQL via PyMySQL 1.1.0
- **Authentication:** JWT (python-jose 3.3.0), Passlib/bcrypt
- **Email:** aiosmtplib 3.0.1, Jinja2 templates
- **Validation:** Pydantic, email-validator
- **Configuration:** python-dotenv, python-decouple

## Quick Start

### Prerequisites
- Python 3.11+
- MySQL database (Cloud SQL recommended)
- SMTP email service (Gmail or similar)

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables (see below)
cp .env.example .env
# Edit .env with your configuration

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Environment Configuration

Create a `.env` file with the following:

```env
# Database Configuration (Cloud SQL Unix Socket)
DB_HOST=/cloudsql/your-project:region:instance-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=assurly_db

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60

# Magic Link Configuration
MAGIC_LINK_TOKEN_EXPIRY_MINUTES=15
FRONTEND_URL=https://your-frontend-domain.com

# Email Configuration (Gmail Example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM=noreply@assurly.com
EMAIL_FROM_NAME=Assurly Platform
```

### Access Points

Once running:
- **API Base:** http://localhost:8000
- **Swagger Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Authentication Flow

### 1. Request Magic Link

```bash
POST /api/auth/request-magic-link
Content-Type: application/json

{
  "email": "user@example.com",
  "redirect_url": "https://frontend.com/dashboard"
}
```

### 2. Verify Token (from email link)

```bash
GET /api/auth/verify/{token}
```

Returns JWT access token:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": { ... }
}
```

### 3. Use JWT for Authenticated Requests

```bash
POST /api/aspects
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "aspect_id": "safeguarding",
  "aspect_name": "Safeguarding"
}
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/request-magic-link` - Request passwordless login link
- `GET /api/auth/verify/{token}` - Verify magic link, get JWT
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### Assessments
- `GET /api/assessments` - List assessments (filterable)
- `GET /api/assessments/{id}` - Get assessment details
- `POST /api/assessments` - Create assessments
- `POST /api/assessments/{id}/submit` - Submit assessment ratings

### Aspects ✨ NEW
- `GET /api/aspects` - List all aspects
- `GET /api/aspects/{id}` - Get single aspect
- `POST /api/aspects` - Create aspect 🔐
- `PUT /api/aspects/{id}` - Update aspect 🔐
- `DELETE /api/aspects/{id}` - Delete aspect 🔐

### Standards ✨ NEW
- `GET /api/standards` - List all standards
- `GET /api/standards/{id}` - Get single standard
- `POST /api/standards` - Create standard 🔐
- `PUT /api/standards/{id}` - Update standard 🔐
- `DELETE /api/standards/{id}` - Delete standard 🔐

### Other Resources
- `GET /api/schools` - List schools
- `GET /api/terms` - List academic terms
- `GET /api/users` - List users

🔐 = Requires authentication

## Frontend Integration Example

For complete frontend integration details, see [`../assurly-frontend/README.md`](../assurly-frontend/README.md).

```javascript
// Authenticate and create an aspect
async function createAspect(email, aspectData) {
  // 1. Request magic link
  await fetch('https://api.assurly.com/api/auth/request-magic-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, redirect_url: window.location.origin })
  });

  // 2. User clicks link in email, gets redirected with token
  // 3. Verify token and get JWT
  const authResponse = await fetch(`https://api.assurly.com/api/auth/verify/${token}`);
  const { access_token } = await authResponse.json();

  // 4. Create aspect with JWT
  const response = await fetch('https://api.assurly.com/api/aspects', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(aspectData)
  });

  return response.json();
}
```

**See also:**
- Frontend API Client: [`../assurly-frontend/src/lib/api-client.ts`](../assurly-frontend/src/lib/api-client.ts)
- Frontend Auth Service: [`../assurly-frontend/src/services/auth-service.ts`](../assurly-frontend/src/services/auth-service.ts)
- Frontend Types: [`../assurly-frontend/src/types/`](../assurly-frontend/src/types/)

## Database Schema

### Key Tables

**aspects**
- `aspect_id` (VARCHAR, PK) - Unique identifier (e.g., "education", "governance")
- `aspect_name` (VARCHAR) - Display name (e.g., "Education Quality")

**standards**
- `standard_id` (VARCHAR, PK) - Unique identifier (e.g., "EDU001")
- `standard_name` (VARCHAR) - Display name
- `aspect_id` (VARCHAR, FK) - Links to aspects table

**assessments**
- `id` (VARCHAR, PK) - UUID
- `school_id` (VARCHAR, FK) - Links to schools
- `standard_id` (VARCHAR, FK) - Links to standards
- `term_id` (VARCHAR) - Academic term
- `academic_year` (VARCHAR) - e.g., "2024-25"
- `rating` (INT) - Assessment rating 1-4 or NULL
- `evidence_comments` (TEXT) - Supporting evidence
- `submitted_by` (VARCHAR) - User who submitted
- `last_updated` (DATETIME)

**users**
- `user_id` (VARCHAR, PK)
- `email` (VARCHAR, UNIQUE)
- `full_name` (VARCHAR)
- `role` (VARCHAR) - e.g., "teacher", "admin"
- `school_id` (VARCHAR, FK)
- `mat_id` (VARCHAR) - Multi-Academy Trust ID
- `magic_link_token` (VARCHAR) - Temporary auth token
- `token_expires_at` (DATETIME)
- `is_active` (BOOLEAN)
- `last_login` (DATETIME)

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate or dependency conflict
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "detail": "Descriptive error message"
}
```

## Testing

### Manual Testing with curl

```bash
# Get all aspects (public)
curl http://localhost:8000/api/aspects

# Create aspect (requires JWT)
curl -X POST http://localhost:8000/api/aspects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"aspect_id":"safety","aspect_name":"Safety & Wellbeing"}'

# Update standard (requires JWT)
curl -X PUT http://localhost:8000/api/standards/EDU001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"standard_name":"Updated Name"}'
```

## Docker Deployment

```bash
# Build image
docker build -t assurly-api .

# Run container
docker run -p 8080:8080 --env-file .env assurly-api
```

## Google Cloud Run Deployment

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/assurly-api

# Deploy
gcloud run deploy assurly-api \
  --image gcr.io/PROJECT_ID/assurly-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "$(cat .env | tr '\n' ',' | sed 's/,$//')"
```

## Security Checklist

### Production Deployment

- [ ] Change `JWT_SECRET_KEY` to a strong random value
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS only (no HTTP)
- [ ] Restrict CORS to specific frontend origins
- [ ] Use Gmail app passwords, not account passwords
- [ ] Implement rate limiting on auth endpoints
- [ ] Set up database backups
- [ ] Enable Cloud SQL high availability
- [ ] Use Secret Manager for sensitive data
- [ ] Configure proper IAM roles
- [ ] Enable Cloud Run authentication if needed
- [ ] Set up monitoring and alerting

### Current Security Features

✅ JWT token-based authentication
✅ Magic link tokens expire after 15 minutes
✅ Passwords hashed with bcrypt
✅ SQL injection prevention via parameterized queries
✅ Input validation using Pydantic
✅ CORS middleware configured
✅ Automatic cleanup of expired tokens

## Troubleshooting

**Database connection errors:**
- Verify `DB_HOST` unix socket path for Cloud SQL
- Check database credentials
- Ensure database and tables exist

**Email not sending:**
- Verify SMTP credentials
- Use Gmail app password (not regular password)
- Check SMTP port (587 for TLS)

**Authentication errors:**
- Ensure JWT token is valid and not expired
- Check Authorization header format: `Bearer {token}`
- Verify JWT_SECRET_KEY matches between sessions

**CORS errors:**
- Update `allow_origins` in main.py CORS config
- Ensure frontend origin is allowed

## Documentation

- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference with examples
- **Swagger UI** - Interactive docs at `/docs`
- **ReDoc** - Alternative docs at `/redoc`

## Development Guidelines

### Commit Messages
- Use descriptive commit messages
- Include what changed and why
- Reference features or issues

### Code Style
- Follow PEP 8 guidelines
- Use type hints where appropriate
- Add docstrings to all endpoints
- Keep functions focused and single-purpose

### Testing Before Commit
1. Test all modified endpoints manually
2. Verify authentication works
3. Check error handling for edge cases
4. Validate database operations

## Support

For questions or issues, contact the Assurly development team.

## License

Proprietary - Harbour Learning Trust

---

**Current Branch:** `claude/aspects-mj7q251wgs0dopwj-EiE0X`
**Last Updated:** December 2025
**Version:** 2.0.0 (with production-grade Aspects & Standards CRUD)
