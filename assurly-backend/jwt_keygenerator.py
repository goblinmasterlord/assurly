
#Generate a secure JWT secret key for Assurly authentication
#Run this once to generate your secret key

import secrets
import string

def generate_jwt_secret():
    """Generate a cryptographically secure secret key"""
    # Generate 64 random characters (letters, digits, punctuation)
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    secret_key = ''.join(secrets.choice(alphabet) for _ in range(64))
    return secret_key

if __name__ == "__main__":
    secret = generate_jwt_secret()
    print("🔑 Your JWT Secret Key:")
    print(f"JWT_SECRET_KEY={secret}")
    print("\n📝 Add this to your Cloud Run environment variables")
    print("⚠️  Keep this secret secure - don't share it publicly!")