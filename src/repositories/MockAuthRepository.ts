// ==============================================================================
// PVG Ops - MockAuthRepository Implementation
// Client-side mock authentication with role switching and demo safeguards
// ==============================================================================

import {
  IAuthRepository,
  AuthUser,
  LoginCredentials,
  RegisterParams,
} from './IAuthRepository';
import { UserRole } from '@/types';

const MOCK_STORAGE_KEY = 'pvg_mock_auth_session';

export const DEMO_MOCK_USERS: Record<UserRole, AuthUser> = {
  officer: {
    uid: 'mock-usr-officer-001',
    email: 'officer@pvg-ops.local',
    displayName: 'Officer Alex Rivera',
    role: 'officer',
    facility: 'Central Logistics Hub A',
    department: 'Safety & Metrology',
    photoURL: null,
    isMock: true,
    provider: 'mock',
    createdAt: '2026-01-15T08:00:00Z',
    lastLoginAt: '2026-03-30T09:15:00Z',
  },
  supervisor: {
    uid: 'mock-usr-supervisor-002',
    email: 'supervisor.dana@pvg-ops.local',
    displayName: 'Chief Inspector Dana',
    role: 'supervisor',
    facility: 'Central Logistics Hub A',
    department: 'Quality Oversight',
    photoURL: null,
    isMock: true,
    provider: 'mock',
    createdAt: '2026-01-10T08:00:00Z',
    lastLoginAt: '2026-03-30T10:00:00Z',
  },
  admin: {
    uid: 'mock-usr-admin-003',
    email: 'admin.root@pvg-ops.local',
    displayName: 'Root Operations Admin',
    role: 'admin',
    facility: 'Central Logistics Hub A',
    department: 'System Operations',
    photoURL: null,
    isMock: true,
    provider: 'mock',
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: '2026-03-30T07:45:00Z',
  },
};

export class MockAuthRepository implements IAuthRepository {
  private currentUser: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();
  private userStore: Map<string, AuthUser> = new Map();

  constructor(initialUser?: AuthUser | null) {
    // Populate demo accounts
    Object.values(DEMO_MOCK_USERS).forEach((u) => {
      this.userStore.set(u.email.toLowerCase(), { ...u });
    });

    if (initialUser !== undefined) {
      this.currentUser = initialUser;
    } else {
      // Attempt hydration from localStorage if available
      this.hydrateFromStorage();
    }

    // Default to officer if no user was found (seamless demo experience)
    if (!this.currentUser) {
      this.currentUser = { ...DEMO_MOCK_USERS.officer };
    }
  }

  private hydrateFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(MOCK_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          // Ensure mock flag is always preserved
          parsed.isMock = true;
          parsed.provider = 'mock';
          this.currentUser = parsed;
        }
      } catch {
        // Fall back gracefully if storage is unreadable
      }
    }
  }

  private persistSession(user: AuthUser | null): void {
    this.currentUser = user;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (user) {
          window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
        } else {
          window.localStorage.removeItem(MOCK_STORAGE_KEY);
        }
      } catch {
        // Storage quota / private mode safeguard
      }
    }
    this.notifyListeners(user);
    this.dispatchCustomEvent(user);
  }

  private notifyListeners(user: AuthUser | null): void {
    this.listeners.forEach((callback) => {
      try {
        callback(user ? { ...user } : null);
      } catch (err) {
        console.error('[MockAuthRepository] Listener error:', err);
      }
    });
  }

  private dispatchCustomEvent(user: AuthUser | null): void {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(
          new CustomEvent('pvg:auth-changed', {
            detail: { user: user ? { ...user } : null },
          })
        );
      } catch {
        // Safe fallback in non-browser or test environments
      }
    }
  }

  public async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser ? { ...this.currentUser } : null;
  }

  public async login(credentials: LoginCredentials): Promise<AuthUser> {
    const emailKey = credentials.email.trim().toLowerCase();
    let matchedUser = this.userStore.get(emailKey);

    if (!matchedUser) {
      // Create ad-hoc demo user if not in predefined registry
      matchedUser = {
        uid: `mock-usr-${Date.now()}`,
        email: credentials.email,
        displayName: credentials.email.split('@')[0] || 'Demo Officer',
        role: 'officer',
        facility: 'Central Logistics Hub A',
        department: 'Field Operations',
        photoURL: null,
        isMock: true,
        provider: 'mock',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      this.userStore.set(emailKey, matchedUser);
    } else {
      matchedUser = {
        ...matchedUser,
        lastLoginAt: new Date().toISOString(),
      };
      this.userStore.set(emailKey, matchedUser);
    }

    this.persistSession(matchedUser);
    return { ...matchedUser };
  }

  public async loginWithRole(role: UserRole): Promise<AuthUser> {
    const demoUser = DEMO_MOCK_USERS[role] || DEMO_MOCK_USERS.officer;
    const userToLogin: AuthUser = {
      ...demoUser,
      lastLoginAt: new Date().toISOString(),
    };
    this.userStore.set(userToLogin.email.toLowerCase(), userToLogin);
    this.persistSession(userToLogin);
    return { ...userToLogin };
  }

  public async register(params: RegisterParams): Promise<AuthUser> {
    const emailKey = params.email.trim().toLowerCase();
    const newUser: AuthUser = {
      uid: `mock-usr-${Date.now()}`,
      email: params.email,
      displayName: params.displayName || 'Field Inspector',
      role: params.role || 'officer',
      facility: params.facility || 'Central Logistics Hub A',
      department: params.department || 'Field Logistics',
      photoURL: null,
      isMock: true,
      provider: 'mock',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    this.userStore.set(emailKey, newUser);
    this.persistSession(newUser);
    return { ...newUser };
  }

  public async logout(): Promise<void> {
    this.persistSession(null);
  }

  public onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.add(callback);
    // Fire callback immediately with current user state
    callback(this.currentUser ? { ...this.currentUser } : null);

    return () => {
      this.listeners.delete(callback);
    };
  }

  public async isAuthenticated(): Promise<boolean> {
    return this.currentUser !== null;
  }

  public getDemoUsers(): AuthUser[] {
    return Object.values(DEMO_MOCK_USERS).map((u) => ({ ...u }));
  }
}

// Default singleton instance
export const mockAuthRepository = new MockAuthRepository();
