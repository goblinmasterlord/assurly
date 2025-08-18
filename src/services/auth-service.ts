import apiClient from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { tokenStorage } from '@/lib/secure-storage';
import type { 
  LoginRequest, 
  VerifyTokenRequest, 
  AuthResponse, 
  SessionResponse,
  User 
} from '@/types/auth';

class AuthService {
  getToken(): string | null {
    return tokenStorage.getToken();
  }

  private setStoredToken(token: string | null): void {
    if (token) {
      tokenStorage.setToken(token);
    } else {
      tokenStorage.clearToken();
    }
  }

  async requestMagicLink(request: LoginRequest): Promise<void> {
    try {
      const response = await apiClient.post('/api/auth/request-magic-link', {
        email: request.email,
        redirect_url: window.location.origin + '/auth/verify'
      });
      
      // Log success for debugging (only in dev)
      logger.debug('Magic link request successful:', response.data?.status);
    } catch (error: any) {
      logger.error('Failed to request magic link');
      
      // Security event tracking
      logger.securityEvent('AUTH_MAGIC_LINK_FAILED', { 
        isNetworkError: error.isNetworkError 
      });
      
      throw new Error(
        error.userMessage || 'Failed to send magic link. Please try again.'
      );
    }
  }

  async verifyToken(request: VerifyTokenRequest): Promise<AuthResponse> {
    try {
      logger.debug('Verifying token');
      
      const response = await apiClient.get<any>(
        `/api/auth/verify/${request.token}`
      );
      
      logger.debug('Verification successful');
      
      if (response.data.access_token) {
        this.setStoredToken(response.data.access_token);
      }
      
      // Map backend user to our User type
      let mappedUser: User | null = null;
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
      logger.error('Failed to verify token');
      logger.securityEvent('AUTH_VERIFY_FAILED', { 
        statusCode: error.response?.status 
      });
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
      logger.error('Failed to get current session');
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
      logger.error('Logout request failed');
    } finally {
      this.setStoredToken(null);
    }
  }

  clearSession(): void {
    this.setStoredToken(null);
  }
}

export const authService = new AuthService();