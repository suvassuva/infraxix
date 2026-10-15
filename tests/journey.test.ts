import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MockRecordRepository } from '@/repositories/MockRecordRepository';
import { RecordService } from '@/services/recordService';
import { GeolocationService } from '@/services/geolocationService';
import { MediaCaptureService } from '@/services/mediaCaptureService';
import { INITIAL_SEED_RECORDS } from '@/repositories/seedRecords';
import {
  CreateRecordDTO,
  UpdateRecordDTO,
  MediaAsset,
  CaptureLocation,
} from '@/types';

describe('Complete Mock User Journey End-to-End Tests', () => {
  let repository: MockRecordRepository;
  let service: RecordService;
  let geoService: GeolocationService;
  let mediaService: MediaCaptureService;

  beforeEach(() => {
    // Isolated repository initialized with standard demo seed records
    repository = new MockRecordRepository(INITIAL_SEED_RECORDS);
    service = new RecordService(repository);
    geoService = new GeolocationService();
    mediaService = new MediaCaptureService();
  });

  describe('Journey Step 1: Pre-flight Validation & Duplicate Submission Guards', () => {
    it('should reject title under 3 characters', async () => {
      const invalidInput: CreateRecordDTO = {
        title: 'Hi',
        category: 'Equipment Safety',
        facility: 'Station A',
      };

      await assert.rejects(
        async () => {
          await service.createRecord(invalidInput);
        },
        (err: { code?: string }) => {
          return err.code === 'INVALID_TITLE';
        }
      );
    });

    it('should reject title over 120 characters', async () => {
      const longTitle = 'A'.repeat(125);
      const invalidInput: CreateRecordDTO = {
        title: longTitle,
        category: 'Equipment Safety',
        facility: 'Station A',
      };

      await assert.rejects(
        async () => {
          await service.createRecord(invalidInput);
        },
        (err: { code?: string }) => {
          return err.code === 'INVALID_TITLE';
        }
      );
    });

    it('should reject invalid coordinates (out of range latitude > 90)', async () => {
      const invalidLoc: CaptureLocation = {
        latitude: 95.123,
        longitude: -122.4194,
        accuracyMeters: 5,
      };

      const invalidInput: CreateRecordDTO = {
        title: 'Invalid GPS Inspection',
        category: 'Equipment Safety',
        facility: 'Station A',
        location: invalidLoc,
      };

      await assert.rejects(
        async () => {
          await service.createRecord(invalidInput);
        },
        (err: { code?: string }) => {
          return err.code === 'INVALID_COORDINATES';
        }
      );
    });
  });

  describe('Journey Step 2 & 3: Capture, Review & Confirm Sensors (GPS & Media)', () => {
    it('should validate GPS telemetry with accuracy radius before confirmation', () => {
      const validCoord = geoService.validateGPSCoordinates(37.774929, -122.419416, 4.2);
      assert.strictEqual(validCoord.valid, true);

      const invalidCoord = geoService.validateGPSCoordinates(95, 0, 5);
      assert.strictEqual(invalidCoord.valid, false);
      assert.strictEqual(invalidCoord.error?.code, 'INVALID_COORDINATES');
    });

    it('should isolate microphone constraints during still photo capture', () => {
      const constraints = mediaService.getRecommendedConstraints({
        facingMode: 'environment',
        includeAudio: false,
      });
      assert.strictEqual(constraints.audio, false);
      const video = constraints.video as MediaTrackConstraints;
      assert.deepStrictEqual(video.facingMode, { ideal: 'environment' });
      // Non-4K safe parameters
      assert.deepStrictEqual(video.width, { ideal: 1280, max: 1920 });
    });

    it('should request audio constraints only when commentary is enabled for video recording', () => {
      const constraints = mediaService.getRecommendedConstraints({
        facingMode: 'user',
        includeAudio: true,
      });
      assert.deepStrictEqual(constraints.audio, {
        echoCancellation: true,
        noiseSuppression: true,
      });
    });

    it('should NOT attach media or GPS if user discarded them prior to confirmation', async () => {
      // User captured sensor data, but clicked Discard
      const inputWithoutSensors: CreateRecordDTO = {
        title: 'Manual Visual Inspection',
        notes: 'Inspector conducted manual walkthrough without sensors.',
        category: 'Structural Integrity',
        facility: 'Substation West',
        priority: 'low',
        mediaReferences: [],
        location: undefined,
      };

      const created = await service.createRecord(inputWithoutSensors);
      assert.ok(created.id);
      assert.strictEqual(created.mediaReferences.length, 0);
      assert.strictEqual(created.location, undefined);
    });
  });

  describe('Journey Step 4, 5 & 6: Demo Upload, Explicit Confirmation & Record Creation', () => {
    it('should simulate demo upload flow and create record with confirmed photo and GPS', async () => {
      const initialStats = await service.getQuickStats();
      const initialTotal = initialStats.totalRecords;
      const initialPending = initialStats.pendingReview;

      const confirmedPhoto: MediaAsset = {
        id: 'med-photo-jou-01',
        fileName: 'turbine-blade-surface.jpg',
        fileSize: 2.4 * 1024 * 1024,
        fileSizeFormatted: '2.4 MB',
        mimeType: 'image/jpeg',
        uri: 'blob:http://localhost:3000/mock-turbine-photo-blob',
        type: 'photo',
        capturedAt: '2026-10-13T14:30:00.000Z',
        uploadState: 'completed',
      };

      const confirmedGps: CaptureLocation = {
        latitude: 37.7833,
        longitude: -122.4167,
        accuracyMeters: 3.8,
        capturedAt: '2026-10-13T14:29:55.000Z',
        address: 'San Francisco Marine Terminal Bay 4',
      };

      const recordInput: CreateRecordDTO = {
        title: 'Wind Turbine Blade Rotor Crack Inspection',
        notes: 'Micro-fractures detected at leading edge pitch bearing 2B.',
        category: 'Equipment Safety',
        facility: 'Harbor Energy Park Unit 4',
        priority: 'urgent',
        mediaReferences: [confirmedPhoto],
        location: confirmedGps,
        authorName: 'Senior Inspector Elena Vance',
      };

      const created = await service.createRecord(recordInput);

      // Verify generated ID conventions
      assert.ok(created.id.startsWith('REC-2026-'));
      assert.ok(created.referenceNumber.startsWith('PVG-OPS-'));
      assert.strictEqual(created.status, 'pending');
      assert.strictEqual(created.priority, 'urgent');
      assert.strictEqual(created.title, 'Wind Turbine Blade Rotor Crack Inspection');
      assert.strictEqual(created.mediaReferences.length, 1);
      assert.strictEqual(created.mediaReferences[0].fileName, 'turbine-blade-surface.jpg');
      assert.strictEqual(created.location?.latitude, 37.7833);
      assert.strictEqual(created.location?.accuracyMeters, 3.8);

      // Verify KPI stats reflected the new record
      const updatedStats = await service.getQuickStats();
      assert.strictEqual(updatedStats.totalRecords, initialTotal + 1);
      assert.strictEqual(updatedStats.pendingReview, initialPending + 1);
    });

    it('should create record with confirmed video recording and audio commentary', async () => {
      const confirmedVideo: MediaAsset = {
        id: 'med-video-jou-02',
        fileName: 'hydraulic-leak-investigation.webm',
        fileSize: 18.5 * 1024 * 1024,
        fileSizeFormatted: '18.5 MB',
        mimeType: 'video/webm;codecs=vp9,opus',
        uri: 'blob:http://localhost:3000/mock-video-blob',
        type: 'video',
        duration: '00:28',
        capturedAt: '2026-10-13T14:40:00.000Z',
        uploadState: 'completed',
      };

      const recordInput: CreateRecordDTO = {
        title: 'Hydraulic Piston Sump Fluid Leak',
        notes: 'Active fluid dripping recorded during heavy load cycle with spoken commentary.',
        category: 'Equipment Safety',
        facility: 'Heavy Assembly Plant 1',
        priority: 'high',
        mediaReferences: [confirmedVideo],
      };

      const created = await service.createRecord(recordInput);
      assert.ok(created.id);
      assert.strictEqual(created.mediaReferences.length, 1);
      assert.strictEqual(created.mediaReferences[0].type, 'video');
      assert.strictEqual(created.mediaReferences[0].duration, '00:28');
    });
  });

  describe('Journey Step 7 & 8: Dashboard & Records Ledger Synchronization', () => {
    it('should display newly created record at the top of the records ledger', async () => {
      const newRecord = await service.createRecord({
        title: 'Transformer Substation Bushing Thermal Scan',
        notes: 'FLIR thermal anomaly localized at phase C terminal.',
        category: 'Electrical Infrastructure',
        facility: 'Substation Alpha',
        priority: 'high',
      });

      const listResult = await service.listRecords({ sortBy: 'newest', pageSize: 10 });
      assert.ok(listResult.items.length > 0);
      assert.strictEqual(listResult.items[0].id, newRecord.id);
      assert.strictEqual(listResult.items[0].title, 'Transformer Substation Bushing Thermal Scan');
    });

    it('should allow search and filtering for the newly created record', async () => {
      const uniqueTitle = 'Cryogenic Tank Insulation Inspection 998';
      const created = await service.createRecord({
        title: uniqueTitle,
        category: 'Pipeline Integrity',
        facility: 'Liquid Gas Terminal',
        priority: 'medium',
      });

      // Search by exact reference number
      const searchByRef = await service.listRecords({ searchTerm: created.referenceNumber });
      assert.strictEqual(searchByRef.totalCount, 1);
      assert.strictEqual(searchByRef.items[0].id, created.id);

      // Search by title keyword
      const searchByTitle = await service.listRecords({ searchTerm: 'Cryogenic Tank' });
      assert.strictEqual(searchByTitle.totalCount, 1);
      assert.strictEqual(searchByTitle.items[0].id, created.id);

      // Filter by category
      const filterCategory = await service.listRecords({ category: 'Pipeline Integrity' });
      const foundInCat = filterCategory.items.find((r) => r.id === created.id);
      assert.ok(foundInCat);
    });

    it('should return empty state when filters match zero records', async () => {
      const emptyResult = await service.listRecords({ searchTerm: 'DOES_NOT_EXIST_QUERY_XYZ' });
      assert.strictEqual(emptyResult.items.length, 0);
      assert.strictEqual(emptyResult.totalCount, 0);
      assert.strictEqual(emptyResult.totalPages, 1);
    });
  });

  describe('Journey Step 9 & 10: Details View & Edit Allowed Fields', () => {
    it('should fetch complete record details by ID', async () => {
      const created = await service.createRecord({
        title: 'Perimeter Fence Security Grounding Test',
        notes: 'Resistance metrology within 5 ohms specification.',
        category: 'Equipment Safety',
        facility: 'North Perimeter Gate',
        priority: 'low',
      });

      const details = await service.getRecord(created.id);
      assert.ok(details);
      assert.strictEqual(details?.id, created.id);
      assert.strictEqual(details?.title, 'Perimeter Fence Security Grounding Test');
      assert.strictEqual(details?.status, 'pending');
      assert.ok(details?.timeline.length >= 1);
    });

    it('should edit allowed fields (notes, priority, facility, category) and record audit entry', async () => {
      const created = await service.createRecord({
        title: 'Conveyor Belt Roller Alignment',
        notes: 'Initial observation: minor belt drift.',
        category: 'Equipment Safety',
        facility: 'Warehouse C',
        priority: 'low',
      });

      const updates: UpdateRecordDTO = {
        notes: 'Updated observation: Severe bearing wear on idler roller 14.',
        priority: 'urgent',
        facility: 'Warehouse C - South Line',
        category: 'Structural Integrity',
        supervisorNote: 'Re-inspected after shift handoff. Wear accelerated.',
        reviewerName: 'Lead Inspector Marcus',
      };

      const updated = await service.updateRecord(created.id, updates);
      assert.strictEqual(updated.notes, 'Updated observation: Severe bearing wear on idler roller 14.');
      assert.strictEqual(updated.priority, 'urgent');
      assert.strictEqual(updated.facility, 'Warehouse C - South Line');
      assert.strictEqual(updated.category, 'Structural Integrity');

      // Verify audit timeline entry was appended
      const latestTimeline = updated.timeline[updated.timeline.length - 1];
      assert.strictEqual(latestTimeline.author, 'Lead Inspector Marcus');
      assert.ok(latestTimeline.note?.includes('Re-inspected after shift handoff'));

      // Verify changes persist in repository retrieval
      const reFetched = await service.getRecord(created.id);
      assert.strictEqual(reFetched?.priority, 'urgent');
      assert.strictEqual(reFetched?.facility, 'Warehouse C - South Line');
    });

    it('should certify and approve record via updateRecord', async () => {
      const created = await service.createRecord({
        title: 'Exhaust Fan Vibration Verification',
        notes: 'Vibration sweep normal.',
        priority: 'medium',
      });

      const approved = await service.updateRecord(created.id, {
        status: 'verified',
        supervisorNote: 'Signed off by Engineering Supervisor.',
        reviewerName: 'Dr. Katherine Pulaski',
      });

      assert.strictEqual(approved.status, 'verified');
      assert.ok(approved.certifiedAt);

      // Verify status counts updated
      const stats = await service.getQuickStats();
      assert.ok(stats.approvedToday >= 1);
    });
  });

  describe('Journey Step 11: Delete Record with Confirmation Flow', () => {
    it('should permanently delete record and remove it from lists and metrics', async () => {
      const created = await service.createRecord({
        title: 'Temporary Staging Rack Check',
        notes: 'Discardable test record.',
        category: 'Equipment Safety',
        facility: 'Temporary Yard',
        priority: 'low',
      });

      const statsBefore = await service.getQuickStats();
      const totalBefore = statsBefore.totalRecords;

      // Delete the record
      const deleted = await service.deleteRecord(created.id);
      assert.strictEqual(deleted, true);

      // Fetching deleted record returns null
      const fetchAfter = await service.getRecord(created.id);
      assert.strictEqual(fetchAfter, null);

      // Verify it is no longer returned in list
      const listAfter = await service.listRecords({ searchTerm: created.referenceNumber });
      assert.strictEqual(listAfter.totalCount, 0);

      // Verify total count decreased
      const statsAfter = await service.getQuickStats();
      assert.strictEqual(statsAfter.totalRecords, totalBefore - 1);
    });

    it('should return false gracefully when attempting to delete nonexistent record', async () => {
      const result = await service.deleteRecord('REC-NON-EXISTENT-99999');
      assert.strictEqual(result, false);
    });
  });
});
