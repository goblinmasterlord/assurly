#Authentication Configuration for Assurly
#Handles environment variables and settings for magic link authentication


import os
from typing import Optional

# JWT Configuration - REQUIRED environment variables
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required")

JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRE_MINUTES', '60'))  # 1 hour

# Magic Link Configuration
MAGIC_LINK_EXPIRE_MINUTES = int(os.getenv('MAGIC_LINK_EXPIRE_MINUTES', '15'))  # 15 minutes

# Frontend URL - REQUIRED environment variable
FRONTEND_URL = os.getenv('FRONTEND_URL')
if not FRONTEND_URL:
    raise ValueError("FRONTEND_URL environment variable is required")

# Email Configuration - REQUIRED environment variables
GMAIL_SMTP_EMAIL = os.getenv('GMAIL_SMTP_EMAIL')
if not GMAIL_SMTP_EMAIL:
    raise ValueError("GMAIL_SMTP_EMAIL environment variable is required")

GMAIL_SMTP_PASSWORD = os.getenv('GMAIL_SMTP_PASSWORD')
if not GMAIL_SMTP_PASSWORD:
    raise ValueError("GMAIL_SMTP_PASSWORD environment variable is required")

# Email Server Configuration (these have sensible defaults)
GMAIL_SMTP_HOST = os.getenv('GMAIL_SMTP_HOST', 'smtp.gmail.com')
GMAIL_SMTP_PORT = int(os.getenv('GMAIL_SMTP_PORT', '587'))

# Email Templates Configuration
EMAIL_FROM_NAME = os.getenv('EMAIL_FROM_NAME', 'Assurly Platform')
EMAIL_REPLY_TO = os.getenv('EMAIL_REPLY_TO', GMAIL_SMTP_EMAIL)

# Security Configuration
BCRYPT_ROUNDS = int(os.getenv('BCRYPT_ROUNDS', '12'))

# Rate Limiting (for future implementation)
MAGIC_LINK_RATE_LIMIT_PER_EMAIL = int(os.getenv('MAGIC_LINK_RATE_LIMIT_PER_EMAIL', '3'))  # 3 requests per hour
MAGIC_LINK_RATE_LIMIT_WINDOW_HOURS = int(os.getenv('MAGIC_LINK_RATE_LIMIT_WINDOW_HOURS', '1'))

def validate_config() -> bool:
    """
    Validate that all required configuration is present.
    This function is now simplified since required vars are checked at import time.
    
    Returns True if config is valid, raises ValueError if not
    """
    print("✅ All required environment variables are present")
    print(f"📧 Email: {GMAIL_SMTP_EMAIL}")
    print(f"🌐 Frontend URL: {FRONTEND_URL}")
    print(f"🔐 JWT Algorithm: {JWT_ALGORITHM}")
    print(f"⏰ Magic Link Expiry: {MAGIC_LINK_EXPIRE_MINUTES} minutes")
    return True

# Environment variables you need to set in Cloud Run:
"""
Required environment variables:
- JWT_SECRET_KEY=your-actual-secret-key-here
- GMAIL_SMTP_EMAIL=tom@thetransformative.com
- GMAIL_SMTP_PASSWORD=your-16-char-app-password
- FRONTEND_URL=https://your-actual-frontend-url.com

Optional overrides (have defaults):
- JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
- MAGIC_LINK_EXPIRE_MINUTES=15
- EMAIL_FROM_NAME=Assurly Platform
- GMAIL_SMTP_HOST=smtp.gmail.com
- GMAIL_SMTP_PORT=587
"""