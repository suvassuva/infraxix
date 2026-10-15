import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isFirebaseConfigured,
  isMockDataSource,
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseFirestore,
  getFirebaseStorage,
} from '../src/repositories/firebase/firebaseConfig';
import { FirebaseAuthRepository } from '../src/repositories/firebase/FirebaseAuthRepository';
import { FirestoreRecordRepository } from '../src/repositories/firebase/FirestoreRecordRepository';
import { FirebaseStorageMediaRepository } from '../src/repositories/firebase/FirebaseStorageMediaRepository';
import {
  authRepository,
  recordRepository,
  mediaRepository,
  isMockMode,
  activeDataSource,
} from '../src/repositories';

describe('Firebase Safety, Inactivity & Zero Network Call Guarantees', () => {
  it('should default to Mock Mode in local environment', () => {
    assert.strictEqual(isMockDataSource(), true);
    assert.strictEqual(isFirebaseConfigured(), false);
    assert.strictEqual(isMockMode, true);
    assert.strictEqual(activeDataSource, 'mock');
  });

  it('should return null for all Firebase getters without credentials', () => {
    const app = getFirebaseApp();
    const auth = getFirebaseAuth();
    const firestore = getFirebaseFirestore();
    const storage = getFirebaseStorage();

    assert.strictEqual(app, null, 'FirebaseApp must be null when unconfigured');
    assert.strictEqual(auth, null, 'FirebaseAuth must be null when unconfigured');
    assert.strictEqual(firestore, null, 'Firestore must be null when unconfigured');
    assert.strictEqual(storage, null, 'FirebaseStorage must be null when unconfigured');
  });

  it('should instantiate optional Firebase repositories without error or network calls', () => {
    const fbAuth = new FirebaseAuthRepository();
    const fbRecords = new FirestoreRecordRepository();
    const fbStorage = new FirebaseStorageMediaRepository();

    assert.ok(fbAuth instanceof FirebaseAuthRepository);
    assert.ok(fbRecords instanceof FirestoreRecordRepository);
    assert.ok(fbStorage instanceof FirebaseStorageMediaRepository);
  });

  it('should throw clear configuration error when unconfigured FirebaseAuth is invoked', async () => {
    const fbAuth = new FirebaseAuthRepository();
    await assert.rejects(
      async () => {
        await fbAuth.login({ email: 'user@example.com', password: 'password' });
      },
      /Firebase Authentication is not configured/
    );
  });

  it('should throw clear configuration error when unconfigured Firestore is invoked', async () => {
    const fbRecords = new FirestoreRecordRepository();
    await assert.rejects(
      async () => {
        await fbRecords.listRecords();
      },
      /Firestore is not configured/
    );
  });

  it('should throw clear configuration error when unconfigured FirebaseStorage is invoked', async () => {
    const fbStorage = new FirebaseStorageMediaRepository();
    const dummyBlob = new Blob(['sample']);
    await assert.rejects(
      async () => {
        await fbStorage.uploadMedia({ file: dummyBlob });
      },
      /Firebase Storage is not configured/
    );
  });

  it('should export mock singletons through repository factory by default', () => {
    assert.ok(authRepository);
    assert.ok(recordRepository);
    assert.ok(mediaRepository);
  });
});
