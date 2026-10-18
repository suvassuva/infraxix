// ==============================================================================
// PVG Ops - Safe Firebase Client Configuration & Lazy Initializer
// CRITICAL: Does NOT initialize Firebase or perform network calls unless
// explicit credentials are provided and NEXT_PUBLIC_DATA_SOURCE=firebase,
// or NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true is enabled.
// NEVER imports or exposes Admin SDK or service account private keys.
// ==============================================================================

import { FirebaseApp, getApps, getApp, initializeApp } from 'firebase/app';
import { Auth, getAuth, connectAuthEmulator } from 'firebase/auth';
import { Firestore, getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

export interface FirebaseClientConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

/**
 * Reads public client environment variables for Firebase.
 * Note: Never place service account private keys or secrets here.
 */
export function getFirebaseEnvConfig(): FirebaseClientConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || (isEmulatorActive() ? 'emulator-api-key' : undefined),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || (isEmulatorActive() ? 'localhost' : undefined),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || (isEmulatorActive() ? 'infraxix' : undefined),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || (isEmulatorActive() ? '1:1234567890:web:emulator' : undefined),
  };
}

/**
 * Checks if the Firebase local emulator is targeted.
 */
export function isEmulatorActive(): boolean {
  if (typeof process === 'undefined' || !process.env) return false;
  return (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' ||
    Boolean(process.env.FIRESTORE_EMULATOR_HOST) ||
    Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST)
  );
}

/**
 * Checks whether Firebase is fully configured with valid credentials
 * (or active emulator) and explicitly enabled via NEXT_PUBLIC_DATA_SOURCE=firebase.
 */
export function isFirebaseConfigured(): boolean {
  if (typeof process === 'undefined' || !process.env) return false;
  const dataSource = (process.env.NEXT_PUBLIC_DATA_SOURCE || '').toLowerCase().trim();
  if (dataSource !== 'firebase') {
    return false;
  }

  // Local Firebase emulator mode
  if (isEmulatorActive()) {
    return true;
  }

  const config = getFirebaseEnvConfig();
  const requiredKeys: (keyof FirebaseClientConfig)[] = ['apiKey', 'projectId', 'appId'];

  for (const key of requiredKeys) {
    const val = config[key];
    if (
      !val ||
      typeof val !== 'string' ||
      val.trim() === '' ||
      val.includes('placeholder') ||
      val.includes('your-')
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Returns whether the application is running in Mock Mode (default: true).
 */
export function isMockDataSource(): boolean {
  return !isFirebaseConfigured();
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedFirestore: Firestore | null = null;
let cachedStorage: FirebaseStorage | null = null;

let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;

/**
 * Safely retrieves or initializes the FirebaseApp instance.
 * Returns null if Firebase is not enabled or credentials are missing.
 * Guarantees ZERO network calls when in mock mode.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (cachedApp) {
    return cachedApp;
  }

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      cachedApp = getApp();
      return cachedApp;
    }

    const config = getFirebaseEnvConfig();
    cachedApp = initializeApp(config);
    return cachedApp;
  } catch (err) {
    console.warn('[FirebaseConfig] Failed to initialize Firebase App safely:', err);
    return null;
  }
}

/**
 * Lazily retrieves the Firebase Auth instance.
 * Connects to the Auth emulator if emulator mode is active.
 * Returns null if Firebase is unconfigured.
 */
export function getFirebaseAuth(): Auth | null {
  if (cachedAuth) return cachedAuth;
  const app = getFirebaseApp();
  if (!app) return null;
  cachedAuth = getAuth(app);

  if (isEmulatorActive() && !authEmulatorConnected) {
    try {
      const authHost =
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ||
        process.env.FIREBASE_AUTH_EMULATOR_HOST ||
        '127.0.0.1:9099';
      const url = authHost.startsWith('http') ? authHost : `http://${authHost}`;
      connectAuthEmulator(cachedAuth, url, { disableWarnings: true });
      authEmulatorConnected = true;
    } catch {
      // Ignore if already connected in test run
    }
  }

  return cachedAuth;
}

/**
 * Lazily retrieves the Firestore instance.
 * Connects to the Firestore emulator if emulator mode is active.
 * Returns null if Firebase is unconfigured.
 */
export function getFirebaseFirestore(): Firestore | null {
  if (cachedFirestore) return cachedFirestore;
  const app = getFirebaseApp();
  if (!app) return null;
  cachedFirestore = getFirestore(app);

  if (isEmulatorActive() && !firestoreEmulatorConnected) {
    try {
      const firestoreHost =
        process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST ||
        process.env.FIRESTORE_EMULATOR_HOST ||
        '127.0.0.1:8080';
      const cleanHost = firestoreHost.replace(/^https?:\/\//, '');
      const [host, portStr] = cleanHost.split(':');
      connectFirestoreEmulator(cachedFirestore, host || '127.0.0.1', Number(portStr) || 8080);
      firestoreEmulatorConnected = true;
    } catch {
      // Ignore if already connected in test run
    }
  }

  return cachedFirestore;
}

/**
 * Lazily retrieves the Firebase Storage instance.
 * Returns null if Firebase is unconfigured.
 */
export function getFirebaseStorage(): FirebaseStorage | null {
  if (cachedStorage) return cachedStorage;
  const app = getFirebaseApp();
  if (!app) return null;
  cachedStorage = getStorage(app);
  return cachedStorage;
}

/**
 * Reset cached instances for isolated test environments.
 */
export function resetFirebaseCacheForTesting(): void {
  cachedApp = null;
  cachedAuth = null;
  cachedFirestore = null;
  cachedStorage = null;
  authEmulatorConnected = false;
  firestoreEmulatorConnected = false;
}
