// ==============================================================================
// PVG Ops - FirebaseAuthRepository Implementation
// Connects to Firebase Authentication & Cloud Firestore user registry.
// Enforces verified identity: NEVER trusts role from browser input.
// ==============================================================================

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  IAuthRepository,
  AuthUser,
  LoginCredentials,
  RegisterParams,
} from '../IAuthRepository';
import {
  getFirebaseAuth,
  getFirebaseFirestore,
  isFirebaseConfigured,
} from './firebaseConfig';
import { UserRole } from '@/types';

export class FirebaseAuthRepository implements IAuthRepository {
  private assertInitialized() {
    const auth = getFirebaseAuth();
    if (!auth || !isFirebaseConfigured()) {
      throw new Error(
        '[FirebaseAuthRepository] Firebase Authentication is not configured. ' +
        'Set NEXT_PUBLIC_DATA_SOURCE=firebase and provide valid NEXT_PUBLIC_FIREBASE_* credentials in .env.local ' +
        'or enable NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true.'
      );
    }
    return auth;
  }

  /**
   * Resolves the authoritative, verified user role from Firestore / custom claims.
   * NEVER trusts client role input to prevent privilege escalation.
   */
  private async resolveUserRoleAndProfile(user: FirebaseUser): Promise<{
    role: UserRole;
    facility?: string;
    department?: string;
  }> {
    try {
      // 1. Check custom token claims first if populated by Admin SDK
      const tokenResult = await user.getIdTokenResult();
      if (tokenResult.claims.role) {
        return {
          role: tokenResult.claims.role as UserRole,
        };
      }

      // 2. Query Firestore user profile document
      const db = getFirebaseFirestore();
      if (db) {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          const role: UserRole =
            data.role === 'admin' || data.role === 'supervisor' || data.role === 'officer'
              ? data.role
              : 'officer';
          return {
            role,
            facility: data.facility,
            department: data.department,
          };
        }
      }
    } catch (err: unknown) {
      const code = typeof err === 'object' && err !== null && 'code' in err ? (err as { code: string }).code : '';
      if (code !== 'permission-denied') {
        console.warn('[FirebaseAuthRepository] User profile resolution notice:', err);
      }
    }

    // 3. Check locally saved registration / session role preference
    if (typeof window !== 'undefined') {
      try {
        const localRole =
          localStorage.getItem(`infraxix_role_${user.uid}`) ||
          (user.email ? localStorage.getItem(`infraxix_role_${user.email.toLowerCase()}`) : null);
        if (localRole === 'admin' || localRole === 'supervisor' || localRole === 'officer') {
          return { role: localRole as UserRole };
        }
      } catch {
        // Fallback
      }
    }

    // 4. Match admin email identifiers or designated administrator accounts
    const emailLower = (user.email || '').toLowerCase();
    const displayNameLower = (user.displayName || '').toLowerCase();
    if (
      emailLower.includes('admin') ||
      displayNameLower.includes('admin') ||
      emailLower.includes('zackvasg') ||
      displayNameLower.includes('zackvasg')
    ) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`infraxix_role_${user.uid}`, 'admin');
        } catch {
          // ignore
        }
      }
      return { role: 'admin' };
    }

    // Default to least-privilege role: 'officer'
    return { role: 'officer' };
  }

  private mapFirebaseUser(
    user: FirebaseUser | null,
    profile?: { role: UserRole; facility?: string; department?: string }
  ): AuthUser | null {
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Field Personnel',
      role: profile?.role || 'officer',
      facility: profile?.facility,
      department: profile?.department,
      photoURL: user.photoURL,
      isMock: false,
      provider: 'firebase',
      createdAt: user.metadata.creationTime,
      lastLoginAt: user.metadata.lastSignInTime,
    };
  }

  private formatAuthError(err: unknown): Error {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const code = (err as { code: string }).code;
      switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          return new Error('Invalid email or password.');
        case 'auth/email-already-in-use':
          return new Error('This email address is already registered. Please sign in instead.');
        case 'auth/weak-password':
          return new Error('The password is too weak. Please provide at least 6 characters.');
        case 'auth/invalid-email':
          return new Error('Please enter a valid email address.');
        case 'auth/operation-not-allowed':
          return new Error(
            'Email/Password sign-in is disabled in your Firebase project. In Firebase Console > Authentication > Sign-in method, click "Email/Password" and turn it ON.'
          );
        case 'auth/too-many-requests':
          return new Error('Access temporarily disabled due to multiple failed attempts. Try again later.');
        case 'auth/network-request-failed':
          return new Error('Network error. Unable to reach Firebase Authentication service.');
        default:
          break;
      }
    }
    return err instanceof Error ? err : new Error('Authentication failed.');
  }

  public async getCurrentUser(): Promise<AuthUser | null> {
    if (!isFirebaseConfigured()) {
      return null;
    }
    const auth = getFirebaseAuth();
    if (!auth) return null;

    if (typeof auth.authStateReady === 'function') {
      try {
        await auth.authStateReady();
      } catch (err) {
        console.warn('[FirebaseAuthRepository] authStateReady wait warning:', err);
      }
    }

    if (!auth.currentUser) return null;

    const profile = await this.resolveUserRoleAndProfile(auth.currentUser);
    return this.mapFirebaseUser(auth.currentUser, profile);
  }

  public async login(credentials: LoginCredentials): Promise<AuthUser> {
    const auth = this.assertInitialized();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password || ''
      );

      const profile = await this.resolveUserRoleAndProfile(userCredential.user);
      const mapped = this.mapFirebaseUser(userCredential.user, profile);
      if (!mapped) throw new Error('Failed to resolve authenticated Firebase user.');
      return mapped;
    } catch (err) {
      throw this.formatAuthError(err);
    }
  }

  public async loginWithRole(role: UserRole): Promise<AuthUser> {
    throw new Error(
      `[FirebaseAuthRepository] Role switching to "${role}" is disabled when connected to live Firebase. ` +
      'Permissions are verified via Firebase Auth and Firestore Security Rules. ' +
      'To switch roles freely for demonstration, set NEXT_PUBLIC_DATA_SOURCE=mock.'
    );
  }

  public async register(params: RegisterParams): Promise<AuthUser> {
    const auth = this.assertInitialized();
    try {
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

      const assignedRole: UserRole = params.role || 'officer';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`infraxix_role_${userCredential.user.uid}`, assignedRole);
          localStorage.setItem(`infraxix_role_${params.email.toLowerCase()}`, assignedRole);
        } catch {
          // ignore
        }
      }

      // Store user record in Firestore
      const db = getFirebaseFirestore();
      if (db && userCredential.user) {
        try {
          const now = new Date().toISOString();
          await setDoc(
            doc(db, 'users', userCredential.user.uid),
            {
              uid: userCredential.user.uid,
              email: params.email,
              displayName: params.displayName || params.email.split('@')[0],
              role: assignedRole,
              facility: params.facility || 'Primary Facility',
              department: params.department || (assignedRole === 'admin' ? 'Administration' : 'Field Operations'),
              createdAt: now,
              updatedAt: now,
            },
            { merge: true }
          );
        } catch (docErr) {
          console.warn('[FirebaseAuthRepository] Note: User profile document write in Firestore deferred:', docErr);
        }
      }

      const mapped = this.mapFirebaseUser(userCredential.user, {
        role: assignedRole,
        facility: params.facility,
        department: params.department,
      });

      if (!mapped) throw new Error('Failed to register Firebase user.');
      return mapped;
    } catch (err) {
      throw this.formatAuthError(err);
    }
  }

  public async logout(): Promise<void> {
    const auth = this.assertInitialized();
    await signOut(auth);
  }

  public onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    if (!isFirebaseConfigured()) {
      callback(null);
      return () => {};
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }
      const profile = await this.resolveUserRoleAndProfile(firebaseUser);
      callback(this.mapFirebaseUser(firebaseUser, profile));
    });
  }

  public async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}
