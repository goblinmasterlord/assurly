// ============================================================================
// v4.0 Authentication & User Types
// ============================================================================

export interface User {
  user_id: string;           // "user7"
  email: string;
  full_name: string;         // "Tom Walch"
  mat_id: string;            // "OLT"
  mat_name?: string;         // "Opal Learning Trust"
  school_id: string | null;  // "cedar-park-primary" or null
  school_name?: string | null;
  role_title: string | null; // "MAT Administrator"
  is_active: boolean;
  last_login: string | null;
}

// Helper to get full name (for backward compatibility)
export function getUserFullName(user: User): string {
  return user.full_name;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user: User;
}

export interface SessionResponse {
  user: User;
}

// JWT Token Payload (decoded) - v4.0
export interface JWTPayload {
  user_id: string;       // Changed from 'sub' in v4
  email: string;
  mat_id: string;
  school_id: string | null;
  exp: number;
  iat?: number;
}
