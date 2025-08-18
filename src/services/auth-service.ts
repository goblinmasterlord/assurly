import apiClient from '@/lib/api-client';
import type { 
  LoginRequest, 
  VerifyTokenRequest, 
  AuthResponse, 
  SessionResponse,
  User 
} from '@/types/auth';

const AUTH_TOKEN_KEY = 'assurly_auth_token';

class AuthService {
  private tokenCache: string | null = null;

  constructor() {
    this.tokenCache = this.getStoredToken();
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private setStoredToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (token) {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
      }
      this.tokenCache = token;
    } catch (error) {
      console.error('Failed to store auth token:', error);
    }
  }

  getToken(): string | null {
    return this.tokenCache;
  }

  async requestMagicLink(request: LoginRequest): Promise<void> {
    try {
      const response = await apiClient.post('/api/auth/request-magic-link', {
        email: request.email,
        redirect_url: window.location.origin + '/auth/verify'
      });
      
      // Log success for debugging
      if (import.meta.env.DEV) {
        console.log('Magic link request successful:', response.data);
      }
    } catch (error: any) {
      console.error('Failed to request magic link:', error);
      
      // In development, if email still sent despite error, it's likely CORS
      if (import.meta.env.DEV && error.isNetworkError) {
        console.warn('Network error (likely CORS) but request may have succeeded on backend');
      }
      
      throw new Error(
        error.userMessage || 'Failed to send magic link. Please try again.'
      );
    }
  }

  async verifyToken(request: VerifyTokenRequest): Promise<AuthResponse> {
    try {
      if (import.meta.env.DEV) {
        console.log('Verifying token:', request.token);
      }
      
      const response = await apiClient.get<any>(
        `/api/auth/verify/${request.token}`
      );
      
      if (import.meta.env.DEV) {
        console.log('Verification response:', response.data);
      }
      
      if (response.data.access_token) {
        this.setStoredToken(response.data.access_token);
      }
      
      // Map backend user to our User type
      let mappedUser = null;
      if (response.data.user) {
        const user = response.data.user;
        mappedUser = {
          id: user.user_id || user.id || 'unknown',
          email: user.email,
          name: user.full_name || user.name || null,
          role: (user.role === 'mat_admin' || user.role === 'mat-admin') ? 'mat-admin' : 'department-head',
          schools: user.school_id ? [user.school_id] : []
        };
      }
      
      return {
        access_token: response.data.access_token,
        user: mappedUser,
        expires_at: response.data.expires_at
      };
    } catch (error: any) {
      console.error('Failed to verify token:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(
        error.response?.data?.detail || 
        error.userMessage || 
        'Invalid or expired link. Please request a new one.'
      );
    }
  }

  async getCurrentSession(): Promise<SessionResponse | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await apiClient.get<any>('/api/auth/me');
      
      // Map backend user to our User type
      if (response.data) {
        const backendUser = response.data;
        const user: User = {
          id: backendUser.user_id,
          email: backendUser.email,
          name: backendUser.full_name,
          role: backendUser.role === 'mat_admin' ? 'mat-admin' : 'department-head',
          schools: backendUser.school_id ? [backendUser.school_id] : []
        };
        return { user };
      }
      return null;
    } catch (error: any) {
      if (error.statusCode === 401) {
        this.setStoredToken(null);
        return null;
      }
      console.error('Failed to get current session:', error);
      throw new Error(
        error.userMessage || 'Failed to load user session.'
      );
    }
  }

  async refreshSession(): Promise<AuthResponse | null> {
    // Note: The backend doesn't have a refresh endpoint yet
    // For now, we'll try to get the current session
    const session = await this.getCurrentSession();
    if (session?.user) {
      return {
        access_token: this.getToken() || '',
        user: session.user
      };
    }
    return null;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.setStoredToken(null);
    }
  }

  clearSession(): void {
    this.setStoredToken(null);
  }
}

export const authService = new AuthService();