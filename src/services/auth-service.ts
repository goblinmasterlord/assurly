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
      
      // Map backend user to our User type (v3.0)
      let mappedUser: User | null = null;
      if (response.data.user) {
        const backendUser = response.data.user;
        mappedUser = {
          user_id: backendUser.user_id,
          email: backendUser.email,
          first_name: backendUser.first_name,
          last_name: backendUser.last_name,
          role_title: backendUser.role_title,
          mat_id: backendUser.mat_id,
          school_id: backendUser.school_id,
          created_at: backendUser.created_at,
          updated_at: backendUser.updated_at
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
    if (!token) {
      logger.debug('No token found in storage');
      return null;
    }

    logger.debug('Token found in localStorage:', token?.substring(0, 20) + '...');

    try {
      logger.debug('Fetching current session from /api/auth/me');
      const response = await apiClient.get<any>('/api/auth/me');
      
      // Map backend user to our User type (v3.0)
      if (response.data) {
        const backendUser = response.data;
        const user: User = {
          user_id: backendUser.user_id,
          email: backendUser.email,
          first_name: backendUser.first_name,
          last_name: backendUser.last_name,
          role_title: backendUser.role_title,
          mat_id: backendUser.mat_id,
          school_id: backendUser.school_id,
          created_at: backendUser.created_at,
          updated_at: backendUser.updated_at
        };
        logger.debug('Session validated successfully', { 
          userId: user.user_id, 
          role: user.role_title, 
          matId: user.mat_id 
        });
        return { user };
      }
      return null;
    } catch (error: any) {
      // Only clear token and logout on 401 (unauthorized)
      if (error.statusCode === 401 || error.response?.status === 401) {
        logger.warn('Token expired or invalid (401), clearing session');
        this.setStoredToken(null);
        return null;
      }
      
      // For other errors (network, 500, etc), don't logout - just log the error
      logger.error('Failed to validate session, but keeping token', { 
        statusCode: error.statusCode || error.response?.status,
        message: error.message 
      });
      
      // Return null but don't clear the token - let the user stay logged in
      // The token might still be valid, just API is temporarily unavailable
      return null;
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