export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'mat-admin' | 'department-head';
  schools?: string[];
  permissions?: string[];
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