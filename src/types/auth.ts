export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_title: string;  // e.g., "Teacher", "Administrator", "Head of Department"
  mat_id: string;      // REQUIRED - tenant isolation
  school_id: string | null;  // nullable for MAT-wide users
  created_at?: string;
  updated_at?: string;
}

// Helper to get full name
export function getUserFullName(user: User): string {
  return `${user.first_name} ${user.last_name}`;
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
  user: User | null;
  expires_at?: string;
}

export interface SessionResponse {
  user: User | null;
  expires_at?: string;
}

// JWT Token Payload (decoded) - v3.0
export interface JWTPayload {
  sub: string;         // user_id
  email: string;
  mat_id: string;
  school_id: string | null;
  exp: number;
  iat: number;
  type: string;        // "access"
}