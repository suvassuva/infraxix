// ==============================================================================
// PVG Ops - Safe Firebase Client Configuration & Lazy Initializer
// CRITICAL: Does NOT initialize Firebase or perform network calls unless
// explicit credentials are provided and NEXT_PUBLIC_DATA_SOURCE=firebase.
// ==============================================================================

import { FirebaseApp, getApps, getApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
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
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

/**
 * Checks whether Firebase is fully configured with non-placeholder credentials
 * and explicitly enabled via NEXT_PUBLIC_DATA_SOURCE=firebase.
 */
export function isFirebaseConfigured(): boolean {
  const dataSource = (process.env.NEXT_PUBLIC_DATA_SOURCE || '').toLowerCase().trim();
  if (dataSource !== 'firebase') {
    return false;
  }

  const config = getFirebaseEnvConfig();
  const requiredKeys: (keyof FirebaseClientConfig)[] = ['apiKey', 'projectId', 'appId'];

  for (const key of requiredKeys) {
    const val = config[key];
    if (!val || typeof val !== 'string' || val.trim() === '' || val.includes('placeholder') || val.includes('your-')) {
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
 * Returns null if Firebase is unconfigured.
 */
export function getFirebaseAuth(): Auth | null {
  if (cachedAuth) return cachedAuth;
  const app = getFirebaseApp();
  if (!app) return null;
  cachedAuth = getAuth(app);
  return cachedAuth;
}

/**
 * Lazily retrieves the Firestore instance.
 * Returns null if Firebase is unconfigured.
 */
export function getFirebaseFirestore(): Firestore | null {
  if (cachedFirestore) return cachedFirestore;
  const app = getFirebaseApp();
  if (!app) return null;
  cachedFirestore = getFirestore(app);
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
