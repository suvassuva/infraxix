// ==============================================================================
// PVG Ops - Optional FirebaseAuthRepository Implementation
// Compiles cleanly with Firebase SDK typings without requiring credentials.
// Makes NO network calls unless explicitly configured and invoked.
// ==============================================================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  IAuthRepository,
  AuthUser,
  LoginCredentials,
  RegisterParams,
} from '../IAuthRepository';
import { getFirebaseAuth, isFirebaseConfigured } from './firebaseConfig';
import { UserRole } from '@/types';

export class FirebaseAuthRepository implements IAuthRepository {
  private assertInitialized() {
    const auth = getFirebaseAuth();
    if (!auth || !isFirebaseConfigured()) {
      throw new Error(
        '[FirebaseAuthRepository] Firebase Authentication is not configured. ' +
        'Set NEXT_PUBLIC_DATA_SOURCE=firebase and provide valid NEXT_PUBLIC_FIREBASE_* credentials in .env.local.'
      );
    }
    return auth;
  }

  private mapFirebaseUser(user: FirebaseUser | null): AuthUser | null {
    if (!user) return null;

    // Role will be populated via Firebase Custom Claims or user profile in production
    const role: UserRole = 'officer';

    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Firebase User',
      role,
      photoURL: user.photoURL,
      isMock: false,
      provider: 'firebase',
      createdAt: user.metadata.creationTime,
      lastLoginAt: user.metadata.lastSignInTime,
    };
  }

  public async getCurrentUser(): Promise<AuthUser | null> {
    if (!isFirebaseConfigured()) {
      return null;
    }
    const auth = getFirebaseAuth();
    if (!auth) return null;
    return this.mapFirebaseUser(auth.currentUser);
  }

  public async login(credentials: LoginCredentials): Promise<AuthUser> {
    const auth = this.assertInitialized();
    const userCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password || ''
    );
    const mapped = this.mapFirebaseUser(userCredential.user);
    if (!mapped) throw new Error('Failed to resolve authenticated Firebase user.');
    return mapped;
  }

  public async loginWithRole(role: UserRole): Promise<AuthUser> {
    // In production Firebase, role switching requires authenticated claims or service account.
    // For local evaluation, inform the operator to use email/password or mock mode.
    throw new Error(
      `[FirebaseAuthRepository] Direct role-switch to "${role}" is not supported in production Firebase. ` +
      'Please sign in with valid role-bearing credentials or switch NEXT_PUBLIC_DATA_SOURCE=mock.'
    );
  }

  public async register(params: RegisterParams): Promise<AuthUser> {
    const auth = this.assertInitialized();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      params.email,
      params.password || ''
    );

    if (params.displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: params.displayName,
      });
    }

    const mapped = this.mapFirebaseUser(userCredential.user);
    if (!mapped) throw new Error('Failed to register Firebase user.');
    return {
      ...mapped,
      role: params.role || 'officer',
      facility: params.facility,
      department: params.department,
    };
  }

  public async logout(): Promise<void> {
    const auth = this.assertInitialized();
    await signOut(auth);
  }

  public onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    if (!isFirebaseConfigured()) {
      // In unconfigured mode, safely fire null once and return inert unsubscribe
      callback(null);
      return () => {};
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(auth, (firebaseUser) => {
      callback(this.mapFirebaseUser(firebaseUser));
    });
  }

  public async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}
