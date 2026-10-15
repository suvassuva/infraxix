// ==============================================================================
// PVG Ops - Repository Factory & Dependency Injection Entry Point
// Default data source: MOCK (Zero network calls, offline-first)
// Activates Firebase only when NEXT_PUBLIC_DATA_SOURCE=firebase and configured.
// ==============================================================================

import { IAuthRepository } from './IAuthRepository';
import { IRecordRepository } from './IRecordRepository';
import { IMediaRepository } from './IMediaRepository';

import { MockAuthRepository, mockAuthRepository, DEMO_MOCK_USERS } from './MockAuthRepository';
import { MockRecordRepository, mockRecordRepository } from './MockRecordRepository';
import { MockMediaRepository, mockMediaRepository } from './MockMediaRepository';

import {
  isFirebaseConfigured,
  isMockDataSource,
  getFirebaseEnvConfig,
} from './firebase/firebaseConfig';
import { FirebaseAuthRepository } from './firebase/FirebaseAuthRepository';
import { FirestoreRecordRepository } from './firebase/FirestoreRecordRepository';
import { FirebaseStorageMediaRepository } from './firebase/FirebaseStorageMediaRepository';

export * from './IAuthRepository';
export * from './IRecordRepository';
export * from './IMediaRepository';
export { MockAuthRepository, mockAuthRepository, DEMO_MOCK_USERS };
export { MockRecordRepository, mockRecordRepository };
export { MockMediaRepository, mockMediaRepository };
export {
  FirebaseAuthRepository,
  FirestoreRecordRepository,
  FirebaseStorageMediaRepository,
  isFirebaseConfigured,
  isMockDataSource,
  getFirebaseEnvConfig,
};

/**
 * Determines current active data source based on environment configuration.
 * Defaults to 'mock' if undefined or unconfigured.
 */
export function getActiveDataSource(): 'mock' | 'firebase' {
  if (typeof process !== 'undefined' && process.env) {
    const specified = (process.env.NEXT_PUBLIC_DATA_SOURCE || '').toLowerCase().trim();
    if (specified === 'firebase') {
      if (isFirebaseConfigured()) {
        return 'firebase';
      } else {
        if (typeof window !== 'undefined') {
          console.warn(
            '[RepositoryFactory] NEXT_PUBLIC_DATA_SOURCE was set to "firebase", ' +
            'but credentials are missing or incomplete. Falling back safely to "mock" mode.'
          );
        }
      }
    }
  }
  return 'mock';
}

export const activeDataSource = getActiveDataSource();
export const isMockMode = activeDataSource === 'mock';

// Singleton instances based on active configuration
export const authRepository: IAuthRepository =
  activeDataSource === 'firebase'
    ? new FirebaseAuthRepository()
    : mockAuthRepository;

export const recordRepository: IRecordRepository =
  activeDataSource === 'firebase'
    ? new FirestoreRecordRepository()
    : mockRecordRepository;

export const mediaRepository: IMediaRepository =
  activeDataSource === 'firebase'
    ? new FirebaseStorageMediaRepository()
    : mockMediaRepository;
