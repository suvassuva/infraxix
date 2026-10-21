// ==============================================================================
// PVG Ops - Firebase Emulator, Security Rules & Ownership Unit Tests
// Tests verified identity, ownership enforcement, metadata-only storage,
// role isolation, and security rule validations.
// ==============================================================================

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { FirestoreRecordRepository } from '../src/repositories/firebase/FirestoreRecordRepository';
import { FirebaseAuthRepository } from '../src/repositories/firebase/FirebaseAuthRepository';
import {
  isEmulatorActive,
  isFirebaseConfigured,
  resetFirebaseCacheForTesting,
} from '../src/repositories/firebase/firebaseConfig';
import { validateCoordinates, validateTitle } from '../src/lib/validation';

describe('Firebase Security Rules & Ownership Enforcement Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetFirebaseCacheForTesting();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetFirebaseCacheForTesting();
  });

  describe('Firestore Security Rules File & Syntax Integrity', () => {
    it('should have a valid firestore.rules file present in the project root', () => {
      const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
      assert.ok(fs.existsSync(rulesPath), 'firestore.rules must exist in root');
      const rulesContent = fs.readFileSync(rulesPath, 'utf-8');
      assert.ok(rulesContent.includes("rules_version = '2'"));
      assert.ok(rulesContent.includes('service cloud.firestore'));
    });

    it('should enforce verified identity and forbid trusting client ownerUid in rules', () => {
      const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
      const content = fs.readFileSync(rulesPath, 'utf-8');

      // Crucial security assertions
      assert.ok(
        content.includes('request.resource.data.ownerUid == request.auth.uid'),
        'Rules must strictly enforce that ownerUid matches the authenticated UID'
      );
      assert.ok(
        content.includes('request.resource.data.ownerUid == resource.data.ownerUid'),
        'Rules must enforce that ownerUid is strictly immutable on update'
      );
    });

    it('should enforce metadata-only storage and prevent media binary payloads', () => {
      const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
      const content = fs.readFileSync(rulesPath, 'utf-8');

      assert.ok(content.includes('hasValidMetadataOnly()'), 'Rules must define hasValidMetadataOnly helper');
      assert.ok(content.includes("!('binary' in request.resource.data)"));
      assert.ok(content.includes("!('fileData' in request.resource.data)"));
      assert.ok(content.includes("!('blob' in request.resource.data)"));
    });

    it('should protect against privilege escalation on user registration', () => {
      const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
      const content = fs.readFileSync(rulesPath, 'utf-8');

      assert.ok(
        content.includes("role == 'officer'"),
        'User registration must never permit self-promotion to supervisor or admin'
      );
      assert.ok(
        content.includes('isAdmin()'),
        'Only administrators can alter role definitions in Firestore'
      );
    });

    it('should enforce valid title length and coordinate bounds in security rules', () => {
      const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
      const content = fs.readFileSync(rulesPath, 'utf-8');

      assert.ok(content.includes('request.resource.data.title.size() >= 3'));
      assert.ok(content.includes('request.resource.data.title.size() <= 120'));
      assert.ok(content.includes('loc.latitude >= -90.0'));
      assert.ok(content.includes('loc.latitude <= 90.0'));
      assert.ok(content.includes('loc.longitude >= -180.0'));
      assert.ok(content.includes('loc.longitude <= 180.0'));
    });
  });

  describe('Emulator Configuration & Safe Inactivity', () => {
    it('should detect when Firebase local emulator is targeted', () => {
      process.env.NEXT_PUBLIC_DATA_SOURCE = 'firebase';
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';

      assert.strictEqual(isEmulatorActive(), true);
      assert.strictEqual(isFirebaseConfigured(), true);
    });

    it('should detect FIRESTORE_EMULATOR_HOST environment variable', () => {
      process.env.NEXT_PUBLIC_DATA_SOURCE = 'firebase';
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

      assert.strictEqual(isEmulatorActive(), true);
      assert.strictEqual(isFirebaseConfigured(), true);
    });

    it('should reject unconfigured state when DATA_SOURCE is mock', () => {
      process.env.NEXT_PUBLIC_DATA_SOURCE = 'mock';
      assert.strictEqual(isFirebaseConfigured(), false);
    });
  });

  describe('Repository Identity & Ownership Protection Contracts', () => {
    it('should reject unauthenticated record creation in FirestoreRecordRepository', async () => {
      process.env.NEXT_PUBLIC_DATA_SOURCE = 'firebase';
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';

      const repo = new FirestoreRecordRepository();
      await assert.rejects(
        async () => {
          await repo.createRecord({
            title: 'Unauthorized Inspection',
            facility: 'Building 4',
            category: 'Meeting Room',
            priority: 'medium',
            authorName: 'Attacker',
            authorRole: 'officer',
            authorEmail: 'attacker@evil.com',
          });
        },
        /Unauthorized: You must be authenticated to create a record in Firestore/
      );
    });

    it('should reject unauthenticated record update in FirestoreRecordRepository', async () => {
      process.env.NEXT_PUBLIC_DATA_SOURCE = 'firebase';
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';

      const repo = new FirestoreRecordRepository();
      await assert.rejects(
        async () => {
          await repo.updateRecord('REC-2026-999999', { notes: 'Tampered notes' });
        },
        /Unauthorized: Authentication required to update records/
      );
    });

    it('should reject unauthenticated record deletion in FirestoreRecordRepository', async () => {
      process.env.NEXT_PUBLIC_DATA_SOURCE = 'firebase';
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';

      const repo = new FirestoreRecordRepository();
      await assert.rejects(
        async () => {
          await repo.deleteRecord('REC-2026-999999');
        },
        /Unauthorized: Authentication required to delete records/
      );
    });

    it('should forbid arbitrary direct role switching when connected to Firebase', async () => {
      process.env.NEXT_PUBLIC_DATA_SOURCE = 'firebase';
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'true';

      const authRepo = new FirebaseAuthRepository();
      await assert.rejects(
        async () => {
          await authRepo.loginWithRole('admin');
        },
        /Role switching to "admin" is disabled when connected to live Firebase/
      );
    });
  });

  describe('Field Validation Constraints (Metadata & GPS)', () => {
    it('should reject titles shorter than 3 characters before transmission', () => {
      const result = validateTitle('ab');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.message.includes('at least 3'));
    });

    it('should reject titles exceeding 120 characters before transmission', () => {
      const longTitle = 'A'.repeat(121);
      const result = validateTitle(longTitle);
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.message.includes('120 characters'));
    });

    it('should accept valid workspace title', () => {
      const result = validateTitle('Level 3 Conference Room Alpha');
      assert.strictEqual(result.valid, true);
    });

    it('should reject out-of-bounds latitude coordinates', () => {
      const result = validateCoordinates({
        latitude: 95.123,
        longitude: 77.594,
        accuracyMeters: 5.0,
      });
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.message.includes('Latitude'));
    });

    it('should reject out-of-bounds longitude coordinates', () => {
      const result = validateCoordinates({
        latitude: 12.971,
        longitude: -185.0,
        accuracyMeters: 5.0,
      });
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.message.includes('Longitude'));
    });

    it('should reject negative GPS accuracy radius', () => {
      const result = validateCoordinates({
        latitude: 12.971,
        longitude: 77.594,
        accuracyMeters: -2.5,
      });
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.message.includes('Accuracy radius'));
    });

    it('should approve valid GPS telemetry fix', () => {
      const result = validateCoordinates({
        latitude: 12.9716,
        longitude: 77.5946,
        accuracyMeters: 3.2,
      });
      assert.strictEqual(result.valid, true);
    });
  });

  describe('Metadata-Only Persistence Verification', () => {
    it('should sanitize media references to ensure metadata-only storage', () => {
      const repo = new FirestoreRecordRepository();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sanitize = (repo as any).sanitizeMediaMetadata.bind(repo);

      const rawItems = [
        {
          id: 'med-001',
          type: 'photo' as const,
          fileName: 'room-photo.jpg',
          fileSize: 2048000,
          fileSizeFormatted: '2.0 MB',
          mimeType: 'image/jpeg',
          uri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...', // Large data uri
          uploadState: 'completed' as const,
          capturedAt: '2026-10-17T10:00:00Z',
          resolution: { width: 1920, height: 1080 },
          // Mock extra binary property that shouldn't be saved
          binary: Buffer.from('fake-binary'),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sanitized = sanitize(rawItems as any);
      assert.strictEqual(sanitized.length, 1);
      assert.strictEqual(sanitized[0].id, 'med-001');
      assert.strictEqual(sanitized[0].fileName, 'room-photo.jpg');
      assert.strictEqual(sanitized[0].fileSize, 2048000);
      assert.strictEqual(sanitized[0].uri, 'metadata://med-001'); // Stripped data-uri
      assert.strictEqual('binary' in sanitized[0], false); // Binary stripped
    });
  });

  describe('Cloud Storage Rules & File Limits Enforcement', () => {
    it('should have a valid storage.rules file present in the project root', () => {
      const storageRulesPath = path.resolve(process.cwd(), 'storage.rules');
      assert.ok(fs.existsSync(storageRulesPath), 'storage.rules must exist in root');
      const content = fs.readFileSync(storageRulesPath, 'utf-8');
      assert.ok(content.includes("rules_version = '2'"));
      assert.ok(content.includes('service firebase.storage'));
    });

    it('should enforce 50 MB max file size limit in storage security rules', () => {
      const storageRulesPath = path.resolve(process.cwd(), 'storage.rules');
      const content = fs.readFileSync(storageRulesPath, 'utf-8');

      assert.ok(content.includes('50 * 1024 * 1024'), 'Rules must enforce 50MB file size');
      assert.ok(content.includes('isUnderMaxSize()'));
    });

    it('should restrict storage media types to images, videos, and pdfs', () => {
      const storageRulesPath = path.resolve(process.cwd(), 'storage.rules');
      const content = fs.readFileSync(storageRulesPath, 'utf-8');

      assert.ok(content.includes("image/.*"));
      assert.ok(content.includes("video/.*"));
      assert.ok(content.includes("application/pdf"));
    });

    it('should require authentication for storage read and write operations', () => {
      const storageRulesPath = path.resolve(process.cwd(), 'storage.rules');
      const content = fs.readFileSync(storageRulesPath, 'utf-8');

      assert.ok(content.includes('isAuthenticated()'));
      assert.ok(content.includes('allow read: if isAuthenticated()'));
      assert.ok(content.includes('allow create: if isAuthenticated()'));
    });

    it('should restrict media deletion in storage to administrators only', () => {
      const storageRulesPath = path.resolve(process.cwd(), 'storage.rules');
      const content = fs.readFileSync(storageRulesPath, 'utf-8');

      assert.ok(content.includes("request.auth.token.role == 'admin'"));
      assert.ok(content.includes('allow update: if false'));
    });
  });

  describe('Field Officer Submission Isolation & Multi-Officer Privacy', () => {
    it('should isolate field officer submissions so officers only see their own records', async () => {
      const { MockRecordRepository } = await import('../src/repositories/MockRecordRepository');
      const repo = new MockRecordRepository();

      // Create a submission by officer spotpage
      await repo.createRecord({
        title: 'Spotpage Meeting Room Alpha',
        authorName: 'spotpage',
        notes: 'Dedicated spotpage inspection',
      });

      // Create a submission by officer Akhil v
      await repo.createRecord({
        title: 'Akhil Private Desk Beta',
        authorName: 'Akhil v',
        notes: 'Dedicated Akhil inspection',
      });

      // Query for spotpage
      const spotpageResult = await repo.listRecords({ ownerUid: 'spotpage' });
      assert.ok(spotpageResult.items.length >= 1);
      assert.ok(spotpageResult.items.every(r => 
        r.ownerUid?.toLowerCase().includes('spotpage') ||
        r.capturedBy?.name.toLowerCase().includes('spotpage') ||
        r.capturedBy?.email?.toLowerCase().includes('spotpage')
      ), 'spotpage query must only return spotpage submissions');
      assert.ok(!spotpageResult.items.some(r => r.title.includes('Akhil')), 'spotpage must NOT see Akhil submissions');

      // Query for Akhil v
      const akhilResult = await repo.listRecords({ ownerUid: 'Akhil v' });
      assert.ok(akhilResult.items.length >= 1);
      assert.ok(akhilResult.items.every(r => 
        r.ownerUid?.toLowerCase().includes('akhil') ||
        r.capturedBy?.name.toLowerCase().includes('akhil') ||
        r.capturedBy?.email?.toLowerCase().includes('akhil')
      ), 'Akhil query must only return Akhil submissions');
      assert.ok(!akhilResult.items.some(r => r.title.includes('Spotpage')), 'Akhil must NOT see spotpage submissions');

      // Global query without ownerUid (Admin/Supervisor view)
      const globalResult = await repo.listRecords({ pageSize: 50 });
      assert.ok(globalResult.items.some(r => r.title.includes('Spotpage')), 'Admin sees spotpage submission');
      assert.ok(globalResult.items.some(r => r.title.includes('Akhil')), 'Admin sees Akhil submission');
    });

    it('should validate officerLiveLocations security rules and live location formatting', async () => {
      const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
      const content = fs.readFileSync(rulesPath, 'utf-8');

      assert.ok(content.includes('match /officerLiveLocations/{officerUid}'), 'Rules must define officerLiveLocations collection');
      assert.ok(content.includes('allow write: if isAuthenticated() && (request.auth.uid == officerUid || isAdmin())'), 'Only officer or admin can write live location');

      const { liveLocationService } = await import('../src/services/liveLocationService');
      const today = liveLocationService.getTodayDateString();
      assert.match(today, /^\d{4}-\d{2}-\d{2}$/, 'dutyDate format must be YYYY-MM-DD');

      const mapsLink = liveLocationService.buildGoogleMapsLink(12.9716, 77.5946);
      assert.strictEqual(mapsLink, 'https://www.google.com/maps?q=12.9716,77.5946');
    });
  });
});


