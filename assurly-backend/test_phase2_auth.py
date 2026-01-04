"""
Phase 2 Authentication Integration Test
This script verifies that all authentication components work with the new multi-tenant schema.
"""

from auth_utils import (
    create_access_token,
    verify_token,
    format_user_response,
    generate_magic_link_data
)
from datetime import datetime

def test_jwt_creation_and_verification():
    """Test JWT creation with mat_id and school_id"""
    print("\n=== Testing JWT Creation and Verification ===")

    # Mock user data with new schema
    user_data = {
        "user_id": "test-user-123",
        "email": "test@example.com",
        "full_name": "Test User",
        "role_title": "Teacher",
        "mat_id": "mat-001",
        "school_id": "school-123",
        "is_active": True,
        "last_login": datetime.utcnow()
    }

    # Create JWT token
    token = create_access_token(user_data)
    print(f"✓ JWT token created: {token[:50]}...")

    # Verify token
    token_payload = verify_token(token)

    if token_payload:
        print(f"✓ Token verified successfully")
        print(f"  - User ID: {token_payload.sub}")
        print(f"  - Email: {token_payload.email}")
        print(f"  - MAT ID: {token_payload.mat_id}")
        print(f"  - School ID: {token_payload.school_id}")
        print(f"  - Token type: {token_payload.type}")

        # Verify MAT context is preserved
        assert token_payload.mat_id == user_data["mat_id"], "MAT ID mismatch!"
        assert token_payload.school_id == user_data["school_id"], "School ID mismatch!"
        print("✓ MAT context preserved correctly")
    else:
        print("✗ Token verification failed")
        return False

    return True

def test_mat_wide_access():
    """Test JWT with MAT-wide access (no school_id)"""
    print("\n=== Testing MAT-Wide Access (NULL school_id) ===")

    user_data = {
        "user_id": "admin-456",
        "email": "admin@example.com",
        "full_name": "MAT Admin",
        "role_title": "MAT Administrator",
        "mat_id": "mat-001",
        "school_id": None,  # NULL for MAT-wide access
        "is_active": True,
        "last_login": datetime.utcnow()
    }

    token = create_access_token(user_data)
    print(f"✓ JWT token created for MAT-wide user")

    token_payload = verify_token(token)

    if token_payload:
        print(f"✓ Token verified successfully")
        print(f"  - User ID: {token_payload.sub}")
        print(f"  - MAT ID: {token_payload.mat_id}")
        print(f"  - School ID: {token_payload.school_id} (None = MAT-wide access)")

        assert token_payload.mat_id == user_data["mat_id"], "MAT ID mismatch!"
        assert token_payload.school_id is None, "School ID should be None for MAT-wide access!"
        print("✓ MAT-wide access configuration correct")
    else:
        print("✗ Token verification failed")
        return False

    return True

def test_user_response_formatting():
    """Test format_user_response with new schema"""
    print("\n=== Testing User Response Formatting ===")

    user_data = {
        "user_id": "test-789",
        "email": "teacher@school.com",
        "full_name": "Jane Teacher",
        "role_title": "Head of Department",  # Using role_title instead of role
        "mat_id": "mat-002",
        "school_id": "school-456",
        "is_active": 1,
        "last_login": datetime.utcnow()
    }

    user_response = format_user_response(user_data)
    print(f"✓ User response formatted successfully")
    print(f"  - User ID: {user_response.user_id}")
    print(f"  - Email: {user_response.email}")
    print(f"  - Full Name: {user_response.full_name}")
    print(f"  - Role Title: {user_response.role_title}")
    print(f"  - MAT ID: {user_response.mat_id}")
    print(f"  - School ID: {user_response.school_id}")
    print(f"  - Is Active: {user_response.is_active}")

    assert user_response.role_title == "Head of Department", "Role title mismatch!"
    assert user_response.mat_id == "mat-002", "MAT ID mismatch!"
    print("✓ All fields correctly mapped to new schema")

    return True

def test_magic_link_generation():
    """Test magic link token generation"""
    print("\n=== Testing Magic Link Generation ===")

    token, expires_at = generate_magic_link_data()
    print(f"✓ Magic link token generated: {token[:30]}...")
    print(f"✓ Expiration time: {expires_at}")
    print(f"  - Token length: {len(token)} characters")

    assert len(token) > 0, "Token should not be empty!"
    assert expires_at > datetime.utcnow(), "Expiration should be in the future!"
    print("✓ Magic link generation working correctly")

    return True

if __name__ == "__main__":
    print("=" * 60)
    print("Phase 2 Authentication Integration Tests")
    print("Testing multi-tenant schema compatibility")
    print("=" * 60)

    all_tests_passed = True

    try:
        all_tests_passed &= test_jwt_creation_and_verification()
        all_tests_passed &= test_mat_wide_access()
        all_tests_passed &= test_user_response_formatting()
        all_tests_passed &= test_magic_link_generation()

        print("\n" + "=" * 60)
        if all_tests_passed:
            print("✅ ALL TESTS PASSED - Phase 2 authentication integration complete!")
            print("\nKey Changes Verified:")
            print("  ✓ JWT tokens include mat_id and school_id")
            print("  ✓ Token verification extracts MAT context")
            print("  ✓ User responses use role_title instead of role")
            print("  ✓ MAT-wide access (NULL school_id) works correctly")
            print("  ✓ Magic link generation functional")
        else:
            print("❌ SOME TESTS FAILED - Please review the output above")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ ERROR during testing: {str(e)}")
        import traceback
        traceback.print_exc()
