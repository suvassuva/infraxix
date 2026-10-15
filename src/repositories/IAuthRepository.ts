// ==============================================================================
// PVG Ops - IAuthRepository Interface Contract
// Authentication contract supporting both Mock and Firebase implementations
// ==============================================================================

import { UserRole } from '@/types';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  facility?: string;
  department?: string;
  photoURL?: string | null;
  /**
   * Explicit flag indicating whether this is a demo/mock account.
   * Prevents demo accounts from being mistaken for production Firebase users.
   */
  isMock: boolean;
  provider: 'mock' | 'firebase' | 'anonymous';
  createdAt?: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterParams {
  email: string;
  password?: string;
  displayName: string;
  role?: UserRole;
  facility?: string;
  department?: string;
}

export interface AuthSession {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isMock: boolean;
  token?: string;
}

export interface IAuthRepository {
  /**
   * Retrieves the currently authenticated user, or null if unauthenticated.
   */
  getCurrentUser(): Promise<AuthUser | null>;

  /**
   * Authenticates with email and password credentials.
   */
  login(credentials: LoginCredentials): Promise<AuthUser>;

  /**
   * Instant helper for demo/evaluation mode to sign in as a specific role.
   */
  loginWithRole(role: UserRole): Promise<AuthUser>;

  /**
   * Registers a new user account.
   */
  register(params: RegisterParams): Promise<AuthUser>;

  /**
   * Signs out the current user session and purges local session tokens.
   */
  logout(): Promise<void>;

  /**
   * Subscribes to authentication state changes.
   * Returns an unsubscribe function.
   */
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;

  /**
   * Checks whether there is an active valid session.
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * Optional helper to inspect available demo accounts.
   */
  getDemoUsers?(): AuthUser[];
}
