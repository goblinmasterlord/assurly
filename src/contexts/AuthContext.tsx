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
      const session = await authService.getCurrentSession();

      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      logger.error('Failed to initialize auth');
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