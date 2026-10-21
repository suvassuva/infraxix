import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateCoordinates,
  validateTitle,
  validateMediaAsset,
  validateCreateRecord,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/validation';
import { CaptureLocation, MediaAsset, CreateRecordDTO } from '@/types';

describe('Validation Layer Tests', () => {
  describe('validateCoordinates', () => {
    it('should approve valid latitude, longitude, and accuracy', () => {
      const loc: CaptureLocation = {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracyMeters: 2.5,
        capturedAt: new Date().toISOString(),
      };
      const result = validateCoordinates(loc);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.error, undefined);
    });

    it('should allow undefined location (optional field)', () => {
      const result = validateCoordinates(undefined);
      assert.strictEqual(result.valid, true);
    });

    it('should reject latitude > 90', () => {
      const loc: CaptureLocation = {
        latitude: 91.2,
        longitude: 0,
        accuracyMeters: 5,
        capturedAt: new Date().toISOString(),
      };
      const result = validateCoordinates(loc);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error?.code, 'INVALID_COORDINATES');
    });

    it('should reject latitude < -90', () => {
      const loc: CaptureLocation = {
        latitude: -95.0,
        longitude: 0,
        accuracyMeters: 5,
        capturedAt: new Date().toISOString(),
      };
      const result = validateCoordinates(loc);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error?.code, 'INVALID_COORDINATES');
    });

    it('should reject longitude > 180 or < -180', () => {
      const loc1: CaptureLocation = {
        latitude: 0,
        longitude: 181.5,
        accuracyMeters: 5,
        capturedAt: new Date().toISOString(),
      };
      const loc2: CaptureLocation = {
        latitude: 0,
        longitude: -180.1,
        accuracyMeters: 5,
        capturedAt: new Date().toISOString(),
      };
      assert.strictEqual(validateCoordinates(loc1).valid, false);
      assert.strictEqual(validateCoordinates(loc2).valid, false);
    });

    it('should reject negative accuracy radius', () => {
      const loc: CaptureLocation = {
        latitude: 37.0,
        longitude: -122.0,
        accuracyMeters: -1.5,
        capturedAt: new Date().toISOString(),
      };
      const result = validateCoordinates(loc);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error?.code, 'INVALID_COORDINATES');
    });
  });

  describe('validateTitle', () => {
    it('should accept valid title between 3 and 120 characters', () => {
      const result = validateTitle('Conveyor Belt Calibration');
      assert.strictEqual(result.valid, true);
    });

    it('should reject titles shorter than 3 characters', () => {
      const result = validateTitle('AB');
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error?.code, 'INVALID_TITLE');
    });

    it('should reject empty or whitespace titles', () => {
      const result = validateTitle('     ');
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error?.code, 'INVALID_TITLE');
    });

    it('should reject titles exceeding 120 characters', () => {
      const longTitle = 'A'.repeat(125);
      const result = validateTitle(longTitle);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error?.code, 'INVALID_TITLE');
    });
  });

  describe('validateMediaAsset', () => {
    it('should accept valid photo media asset under size limit', () => {
      const asset: MediaAsset = {
        id: 'med-1',
        type: 'photo',
        fileName: 'inspection.jpg',
        fileSize: 4 * 1024 * 1024, // 4 MB
        fileSizeFormatted: '4.0 MB',
        mimeType: 'image/jpeg',
        uploadState: 'completed',
        capturedAt: new Date().toISOString(),
      };
      const result = validateMediaAsset(asset);
      assert.strictEqual(result.valid, true);
    });

    it('should reject file sizes exceeding 50 MB', () => {
      const asset: MediaAsset = {
        id: 'med-2',
        type: 'video',
        fileName: 'huge_recording.mp4',
        fileSize: MAX_FILE_SIZE_BYTES + 1024, // > 50 MB
        fileSizeFormatted: '51 MB',
        mimeType: 'video/mp4',
        uploadState: 'completed',
        capturedAt: new Date().toISOString(),
      };
      const result = validateMediaAsset(asset);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error?.code, 'FILE_LIMIT_EXCEEDED');
    });

    it('should reject unsupported MIME types', () => {
      const asset: MediaAsset = {
        id: 'med-3',
        type: 'pdf',
        fileName: 'executable.exe',
        fileSize: 1024,
        fileSizeFormatted: '1 KB',
        mimeType: 'application/x-msdownload',
        uploadState: 'completed',
        capturedAt: new Date().toISOString(),
      };
      const result = validateMediaAsset(asset);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error?.code, 'VALIDATION_ERROR');
    });
  });

  describe('validateCreateRecord', () => {
    it('should reject records exceeding 10 media assets', () => {
      const mediaList: MediaAsset[] = Array.from({ length: 11 }, (_, i) => ({
        id: `med-${i}`,
        type: 'photo',
        fileName: `still_${i}.jpg`,
        fileSize: 1000,
        fileSizeFormatted: '1 KB',
        mimeType: 'image/jpeg',
        uploadState: 'completed',
        capturedAt: new Date().toISOString(),
      }));

      const dto: CreateRecordDTO = {
        title: 'Overloaded Assets Inspection',
        category: 'Equipment Safety',
        facility: 'Hub A',
        notes: 'Testing limit',
        mediaReferences: mediaList,
      };

      const result = validateCreateRecord(dto);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.some((e) => e.code === 'FILE_LIMIT_EXCEEDED'), true);
    });

    it('should approve partial records with auto-generated title and optional specs/notes omitted', () => {
      const now = new Date();
      const dateFormatted = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const autoTitle = `Meeting Room Verification - ${dateFormatted}`;

      const dto: CreateRecordDTO = {
        title: autoTitle,
        category: 'Meeting Room',
        facility: 'On-site Verification',
        notes: 'Field verification submitted on-site.',
        itemsInspected: 1,
      };

      const result = validateCreateRecord(dto);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });
  });
});
