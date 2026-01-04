#!/usr/bin/env python3
"""
Gmail SMTP Test Script for Assurly Authentication
Run this to verify your Gmail setup works before integrating into FastAPI
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

# Configuration - UPDATE THESE VALUES
GMAIL_EMAIL = "tom@thetransformative.com"  # Your Gmail address
GMAIL_APP_PASSWORD = "eqro opjn pbxr eoja"  # Gmail App Password
TEST_RECIPIENT = "tom@thetransformative.com"  # Where to send test email

# Gmail SMTP settings
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

def test_gmail_smtp():
    """Test Gmail SMTP connection and send a test email"""
    
    print("🔧 Testing Gmail SMTP Configuration for Assurly...")
    print(f"📧 Sender: {GMAIL_EMAIL}")
    print(f"📨 Test recipient: {TEST_RECIPIENT}")
    print(f"🌐 SMTP Server: {SMTP_SERVER}:{SMTP_PORT}")
    print("-" * 50)
    
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = "Assurly SMTP Test - Success!"
        message["From"] = GMAIL_EMAIL
        message["To"] = TEST_RECIPIENT
        
        # Create HTML content
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #28a745;">✅ Assurly SMTP Test Successful!</h2>
              <p>This email confirms that Gmail SMTP is working correctly for your Assurly magic link authentication system.</p>
              
              <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <h3>Test Details:</h3>
                <ul>
                  <li><strong>Timestamp:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</li>
                  <li><strong>Sender:</strong> {GMAIL_EMAIL}</li>
                  <li><strong>SMTP Server:</strong> {SMTP_SERVER}:{SMTP_PORT}</li>
                  <li><strong>TLS:</strong> Enabled</li>
                </ul>
              </div>
              
              <p style="color: #6c757d; font-size: 14px;">
                You can now proceed with integrating magic link authentication into your FastAPI application.
              </p>
            </div>
          </body>
        </html>
        """
        
        # Create plain text version
        text = f"""
        Assurly SMTP Test Successful!
        
        This email confirms that Gmail SMTP is working correctly for your Assurly magic link authentication system.
        
        Test Details:
        - Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}
        - Sender: {GMAIL_EMAIL}
        - SMTP Server: {SMTP_SERVER}:{SMTP_PORT}
        - TLS: Enabled
        
        You can now proceed with integrating magic link authentication into your FastAPI application.
        """
        
        # Add text and HTML parts
        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        message.attach(part1)
        message.attach(part2)
        
        # Create secure connection and send email
        print("🔐 Creating secure SMTP connection...")
        context = ssl.create_default_context()
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            print("🔄 Starting TLS encryption...")
            server.starttls(context=context)
            
            print("🔑 Authenticating with Gmail...")
            server.login(GMAIL_EMAIL, GMAIL_APP_PASSWORD)
            
            print("📤 Sending test email...")
            server.sendmail(GMAIL_EMAIL, TEST_RECIPIENT, message.as_string())
            
        print("✅ SUCCESS: Test email sent successfully!")
        print("📬 Check your inbox for the test email.")
        print("\n🚀 Gmail SMTP is ready for Assurly magic link authentication!")
        
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print("❌ AUTHENTICATION ERROR:")
        print("   This usually means:")
        print("   1. Incorrect email or app password")
        print("   2. 2FA not enabled on Gmail")
        print("   3. App password not generated")
        print("   4. Using regular password instead of app password")
        print(f"   Error details: {e}")
        return False
        
    except smtplib.SMTPConnectError as e:
        print("❌ CONNECTION ERROR:")
        print("   This usually means:")
        print("   1. Network/firewall blocking SMTP")
        print("   2. Organization blocking external SMTP")
        print("   3. Gmail SMTP servers temporarily unavailable")
        print(f"   Error details: {e}")
        return False
        
    except smtplib.SMTPException as e:
        print("❌ SMTP ERROR:")
        print(f"   Error details: {e}")
        return False
        
    except Exception as e:
        print("❌ UNEXPECTED ERROR:")
        print(f"   Error details: {e}")
        return False

def setup_instructions():
    """Print setup instructions for Gmail App Password"""
    print("\n" + "=" * 60)
    print("📋 GMAIL APP PASSWORD SETUP INSTRUCTIONS")
    print("=" * 60)
    print("1. Go to your Google Account settings:")
    print("   https://myaccount.google.com/security")
    print("")
    print("2. Enable 2-Step Verification (if not already enabled)")
    print("")
    print("3. Generate App Password:")
    print("   - Security → App passwords")
    print("   - Select app: Mail")
    print("   - Select device: Other (Custom name)")
    print("   - Enter: 'Assurly Magic Links'")
    print("   - Copy the 16-character password")
    print("")
    print("4. Update this script with your credentials:")
    print(f"   GMAIL_EMAIL = 'your-actual-email@gmail.com'")
    print(f"   GMAIL_APP_PASSWORD = 'abcd-efgh-ijkl-mnop'  # 16-char app password")
    print(f"   TEST_RECIPIENT = 'where-to-send-test@gmail.com'")
    print("")
    print("5. Run this script to test the connection")
    print("=" * 60)

if __name__ == "__main__":
    # Check if credentials are still placeholder values
    if GMAIL_EMAIL == "your-email@gmail.com" or GMAIL_APP_PASSWORD == "your-16-char-app-password":
        print("⚠️  Please update the credentials in this script first!")
        setup_instructions()
    else:
        success = test_gmail_smtp()
        if success:
            print("\n🎉 Ready to implement magic link authentication!")
        else:
            print("\n🔧 Please resolve the issues above before proceeding.")
            setup_instructions()