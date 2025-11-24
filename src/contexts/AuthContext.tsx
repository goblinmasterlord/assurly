import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/auth-service';
import { logger } from '@/lib/logger';
import type { User, AuthState, LoginRequest, VerifyTokenRequest } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (request: LoginRequest) => Promise<void>;
  verifyToken: (request: VerifyTokenRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const setUser = useCallback((user: User | null) => {
    setAuthState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      error: null,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setAuthState(prev => ({
      ...prev,
      error,
    }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setAuthState(prev => ({
      ...prev,
      isLoading,
    }));
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      
      // If we have a token, try to validate it with the API
      if (token) {
        logger.debug('Token found, validating session...');
        const session = await authService.getCurrentSession();

        if (session?.user) {
          logger.debug('Session validated, user authenticated');
          setUser(session.user);
        } else {
          // API returned null but didn't throw - could be network issue
          // In development, create mock user to avoid blocking work
          if (import.meta.env.DEV) {
            logger.warn('API unavailable in dev, using mock user');
            const MOCK_USER: User = {
              id: 'mock-user-id',
              email: 'dev@assurly.com',
              name: 'Developer User',
              role: 'mat-admin',
              schools: ['cedar-park-primary'],
              permissions: ['all']
            };
            setUser(MOCK_USER);
          } else {
            // In production, if API returns null, clear token and logout
            logger.warn('Session validation returned null, logging out');
            authService.clearSession();
            setUser(null);
          }
        }
      } else {
        logger.debug('No token found, user not authenticated');
        setUser(null);
      }
    } catch (error) {
      logger.error('Failed to initialize auth', error);
      // Don't clear user on initialization errors - might be temporary
      // The error is already logged, just keep loading state
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  const login = useCallback(async (request: LoginRequest) => {
    try {
      setLoading(true);
      setError(null);
      await authService.requestMagicLink(request);
    } catch (error: any) {
      setError(error.message || 'Failed to send magic link');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const verifyToken = useCallback(async (request: VerifyTokenRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.verifyToken(request);

      if (response.user) {
        setUser(response.user);
        
        const from = location.state?.from?.pathname || '/app/assessments';
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      setError(error.message || 'Failed to verify token');
      navigate('/auth/login', { replace: true });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setUser, navigate, location]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      navigate('/auth/login');
    } catch (error) {
      logger.error('Logout failed');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUser, navigate]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await authService.refreshSession();
      if (response?.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      logger.error('Failed to refresh session');
      setUser(null);
    }
  }, [setUser]);

  useEffect(() => {
    initializeAuth();
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    verifyToken,
    logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth/login', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  return { isAuthenticated, isLoading, user };
}