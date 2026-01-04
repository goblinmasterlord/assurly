"""
Email service for sending magic link authentication emails
"""

import aiosmtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime
from jinja2 import Template

from auth_config import (
    GMAIL_SMTP_EMAIL,
    GMAIL_SMTP_PASSWORD, 
    GMAIL_SMTP_HOST,
    GMAIL_SMTP_PORT,
    EMAIL_FROM_NAME,
    EMAIL_REPLY_TO,
    MAGIC_LINK_EXPIRE_MINUTES
)
from auth_models import MagicLinkEmailData

# HTML Email Template
MAGIC_LINK_HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Assurly Login Link</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #000000;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .content {
            margin-bottom: 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .login-button {
            display: inline-block;
            background-color: #2563eb !important;
            color: #ffffff !important;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
        }
        .login-button:hover {
            background-color: #1d4ed8;
        }
        .expiry-notice {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            text-align: center;
        }
        .security-note {
            font-size: 14px;
            color: #6b7280;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: #9ca3af;
        }
        .alternative-link {
            font-size: 12px;
            color: #6b7280;
            word-break: break-all;
            margin-top: 15px;
            padding: 10px;
            background-color: #f9fafb;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{ company_name }}</div>
            <div class="subtitle">School Assessment Management Platform</div>
        </div>
        
        <div class="content">
            <div class="greeting">Hello {{ user_name }},</div>
            
            <p>You requested to log into your Assurly account. Click the button below to securely access your dashboard:</p>
            
            <div style="text-align: center;">
                <a href="{{ magic_link_url }}" class="login-button">Log into Assurly</a>
            </div>
            
            <div class="expiry-notice">
                <strong>⏰ This link expires in {{ expiry_minutes }} minutes</strong> for your security.
            </div>
            
            <p>If you didn't request this login link, you can safely ignore this email. No one can access your account without clicking the link above.</p>
            
            <div class="alternative-link">
                <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
                {{ magic_link_url }}
            </div>
        </div>
        
        <div class="security-note">
            <strong>Security note:</strong> This email was sent to {{ user_email }} because a login was requested for your Assurly account. If you have concerns about your account security, please contact our support team.
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The Assurly Team</p>
            <p>Questions? Contact us at <a href="mailto:{{ support_email }}">{{ support_email }}</a></p>
            <p style="margin-top: 20px; font-size: 11px;">
                This email was sent on {{ timestamp }} UTC
            </p>
        </div>
    </div>
</body>
</html>
"""

# Plain Text Email Template
MAGIC_LINK_TEXT_TEMPLATE = """
{{ company_name }} - Your Login Link

Hello {{ user_name }},

You requested to log into your Assurly account. Click the link below to securely access your dashboard:

{{ magic_link_url }}

⏰ This link expires in {{ expiry_minutes }} minutes for your security.

If you didn't request this login link, you can safely ignore this email. No one can access your account without clicking the link above.

Security note: This email was sent to {{ user_email }} because a login was requested for your Assurly account. If you have concerns about your account security, please contact our support team.

Best regards,
The Assurly Team

Questions? Contact us at {{ support_email }}

This email was sent on {{ timestamp }} UTC
"""

class EmailService:
    """Service for sending authentication emails"""
    
    def __init__(self):
        self.smtp_host = GMAIL_SMTP_HOST
        self.smtp_port = GMAIL_SMTP_PORT
        self.smtp_email = GMAIL_SMTP_EMAIL
        self.smtp_password = GMAIL_SMTP_PASSWORD
        self.from_name = EMAIL_FROM_NAME
        self.reply_to = EMAIL_REPLY_TO

    async def send_magic_link_email(
        self, 
        recipient_email: str, 
        user_name: str, 
        magic_link_url: str
    ) -> bool:
        """
        Send magic link authentication email.
        
        Args:
            recipient_email: User's email address
            user_name: User's display name
            magic_link_url: Complete magic link URL
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Prepare email data
            email_data = MagicLinkEmailData(
                user_name=user_name or "User",
                magic_link_url=magic_link_url,
                expiry_minutes=MAGIC_LINK_EXPIRE_MINUTES,
                user_email=recipient_email,
                timestamp=datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S'),
                company_name="Assurly",
                support_email=self.reply_to
            )
            
            # Create email message
            message = MIMEMultipart("alternative")
            message["Subject"] = "Your Assurly Login Link"
            message["From"] = f"{self.from_name} <{self.smtp_email}>"
            message["To"] = recipient_email
            message["Reply-To"] = self.reply_to
            
            # Generate email content from templates
            html_content = self._render_template(MAGIC_LINK_HTML_TEMPLATE, email_data)
            text_content = self._render_template(MAGIC_LINK_TEXT_TEMPLATE, email_data)
            
            # Create text and HTML parts
            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            
            # Add parts to message
            message.attach(part1)
            message.attach(part2)
            
            # Send email
            await self._send_email(message)
            
            return True
            
        except Exception as e:
            print(f"Failed to send magic link email to {recipient_email}: {str(e)}")
            return False

    def _render_template(self, template_str: str, data: MagicLinkEmailData) -> str:
        """Render email template with data"""
        template = Template(template_str)
        return template.render(**data.dict())  # Convert Pydantic model to dict

    async def _send_email(self, message: MIMEMultipart) -> None:
        """Send email via SMTP"""
        try:
            # Send the email with corrected SSL settings
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_email,
                password=self.smtp_password,
                start_tls=True,  # Use STARTTLS instead of use_tls
                validate_certs=True,
                timeout=30
            )
        except Exception as e:
            print(f"SMTP send failed: {e}")
            raise

    async def test_connection(self) -> bool:
        """Test SMTP connection"""
        try:
            # Create SSL context
            context = ssl.create_default_context()
            
            # Test connection
            smtp = aiosmtplib.SMTP(
                hostname=self.smtp_host,
                port=self.smtp_port,
                use_tls=True,
                tls_context=context
            )
            
            await smtp.connect()
            await smtp.login(self.smtp_email, self.smtp_password)
            await smtp.quit()
            
            return True
            
        except Exception as e:
            print(f"SMTP connection test failed: {str(e)}")
            return False

# Initialize global email service instance
email_service = EmailService()

# Convenience function for sending magic link emails
async def send_magic_link_email(recipient_email: str, user_name: str, magic_link_url: str) -> bool:
    """
    Convenience function to send magic link email.
    
    Args:
        recipient_email: User's email address
        user_name: User's display name  
        magic_link_url: Complete magic link URL
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    return await email_service.send_magic_link_email(recipient_email, user_name, magic_link_url)