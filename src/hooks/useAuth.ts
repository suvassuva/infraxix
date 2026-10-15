'use client';

// ==============================================================================
// PVG Ops - useAuth Hook
// Consumes IAuthRepository interface for reactive authentication state
// ==============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  authRepository,
  AuthUser,
  LoginCredentials,
  RegisterParams,
  isMockMode,
  activeDataSource,
  DEMO_MOCK_USERS,
} from '@/repositories';
import { UserRole } from '@/types';

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isMock: boolean;
  activeDataSource: 'mock' | 'firebase';
  demoUsers: AuthUser[];
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  loginWithRole: (role: UserRole) => Promise<AuthUser>;
  register: (params: RegisterParams) => Promise<AuthUser>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Initial check
    authRepository
      .getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[useAuth] Failed to load current user:', err);
          setIsLoading(false);
        }
      });

    // Subscribe to repository auth state changes
    const unsubscribe = authRepository.onAuthStateChanged((nextUser) => {
      if (isMounted) {
        setUser(nextUser);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedIn = await authRepository.login(credentials);
      setUser(loggedIn);
      return loggedIn;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithRole = useCallback(async (role: UserRole): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedIn = await authRepository.loginWithRole(role);
      setUser(loggedIn);
      return loggedIn;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Role login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (params: RegisterParams): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await authRepository.register(params);
      setUser(newUser);
      return newUser;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await authRepository.logout();
      setUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Logout failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const demoUsers: AuthUser[] = Object.values(DEMO_MOCK_USERS);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: user !== null,
    isMock: user?.isMock ?? isMockMode,
    activeDataSource,
    demoUsers,
    login,
    loginWithRole,
    register,
    logout,
    clearError,
  };
}
