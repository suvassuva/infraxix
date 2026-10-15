import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  MediaCaptureService,
  MAX_VIDEO_RECORD_SECONDS,
  MAX_CAPTURE_FILE_BYTES,
  AUDIO_DISCLOSURE_NOTICE,
} from '@/services/mediaCaptureService';
import { MockRecordRepository } from '@/repositories/MockRecordRepository';
import { CreateRecordDTO, MediaAsset } from '@/types';

describe('Media Capture Service & Workflow Unit Tests', () => {
  let service: MediaCaptureService;

  beforeEach(() => {
    service = new MediaCaptureService();
  });

  describe('checkMediaSupport & HTTPS / Insecure Context Handling', () => {
    it('should reject non-browser environments when window is undefined', () => {
      const res = service.checkMediaSupport(undefined);
      assert.strictEqual(res.supported, false);
      assert.strictEqual(res.isSecure, false);
      assert.strictEqual(res.error?.code, 'UNSUPPORTED');
    });

    it('should detect insecure context and flag HTTPS requirement when isSecureContext is false', () => {
      const fakeWindow = {
        isSecureContext: false,
        navigator: {
          mediaDevices: {
            getUserMedia: () => Promise.resolve({} as MediaStream),
          },
        },
      } as unknown as Window;

      const res = service.checkMediaSupport(fakeWindow);
      assert.strictEqual(res.isSecure, false);
      assert.strictEqual(res.error?.code, 'INSECURE_CONTEXT');
      assert.ok(res.error?.message.includes('HTTPS or localhost'));
    });

    it('should reject when navigator.mediaDevices or getUserMedia is absent', () => {
      const fakeWindowWithoutMediaDevices = {
        isSecureContext: true,
        navigator: {},
      } as unknown as Window;

      const res = service.checkMediaSupport(fakeWindowWithoutMediaDevices);
      assert.strictEqual(res.supported, false);
      assert.strictEqual(res.isSecure, true);
      assert.strictEqual(res.error?.code, 'UNSUPPORTED');
    });

    it('should approve when running in secure context with getUserMedia available', () => {
      const fakeWindow = {
        isSecureContext: true,
        navigator: {
          mediaDevices: {
            getUserMedia: () => Promise.resolve({} as MediaStream),
          },
        },
      } as unknown as Window;

      const res = service.checkMediaSupport(fakeWindow);
      assert.strictEqual(res.supported, true);
      assert.strictEqual(res.isSecure, true);
      assert.strictEqual(res.error, undefined);
    });
  });

  describe('getRecommendedConstraints (Non-4K & Audio Isolation)', () => {
    it('should never demand 4K resolution (uses responsive ideal 720p/1080p)', () => {
      const constraints = service.getRecommendedConstraints({
        facingMode: 'environment',
        includeAudio: false,
      });

      const video = constraints.video as MediaTrackConstraints;
      assert.ok(video);
      // Width must be ideal 1280 max 1920 (HD/FHD), NOT exact 3840 (4K)
      assert.deepStrictEqual(video.width, { ideal: 1280, max: 1920 });
      assert.deepStrictEqual(video.height, { ideal: 720, max: 1080 });
      assert.deepStrictEqual(video.facingMode, { ideal: 'environment' });
    });

    it('should isolate microphone access when includeAudio is false (photo mode or silent video)', () => {
      const constraints = service.getRecommendedConstraints({
        facingMode: 'environment',
        includeAudio: false,
      });

      assert.strictEqual(constraints.audio, false);
    });

    it('should request microphone only when includeAudio is true with audio enhancement constraints', () => {
      const constraints = service.getRecommendedConstraints({
        facingMode: 'user',
        includeAudio: true,
      });

      assert.deepStrictEqual(constraints.audio, {
        echoCancellation: true,
        noiseSuppression: true,
      });
      const video = constraints.video as MediaTrackConstraints;
      assert.deepStrictEqual(video.facingMode, { ideal: 'user' });
    });

    it('should fall back to safe defaults when empty options provided', () => {
      const constraints = service.getRecommendedConstraints();
      assert.strictEqual(constraints.audio, false);
      const video = constraints.video as MediaTrackConstraints;
      assert.deepStrictEqual(video.facingMode, { ideal: 'environment' });
    });
  });

  describe('getOptimalVideoMimeType (MediaRecorder.isTypeSupported)', () => {
    it('should return default video/webm in non-browser Node environment', () => {
      const mime = service.getOptimalVideoMimeType();
      assert.strictEqual(mime, 'video/webm');
    });

    it('should select VP9 when MediaRecorder reports VP9 support', () => {
      const originalMediaRecorder = (globalThis as unknown as { MediaRecorder?: unknown }).MediaRecorder;
      const originalWindow = (globalThis as unknown as { window?: unknown }).window;

      (globalThis as unknown as { window?: unknown }).window = {} as Window;
      (globalThis as unknown as { MediaRecorder?: unknown }).MediaRecorder = {
        isTypeSupported: (type: string) => type === 'video/webm;codecs=vp9,opus',
      };

      try {
        const mime = service.getOptimalVideoMimeType();
        assert.strictEqual(mime, 'video/webm;codecs=vp9,opus');
      } finally {
        (globalThis as unknown as { MediaRecorder?: unknown }).MediaRecorder = originalMediaRecorder;
        (globalThis as unknown as { window?: unknown }).window = originalWindow;
      }
    });

    it('should select MP4 when MediaRecorder only supports MP4 (Safari / iOS)', () => {
      const originalMediaRecorder = (globalThis as unknown as { MediaRecorder?: unknown }).MediaRecorder;
      const originalWindow = (globalThis as unknown as { window?: unknown }).window;

      (globalThis as unknown as { window?: unknown }).window = {} as Window;
      (globalThis as unknown as { MediaRecorder?: unknown }).MediaRecorder = {
        isTypeSupported: (type: string) => type === 'video/mp4;codecs=avc1,mp4a.40.2',
      };

      try {
        const mime = service.getOptimalVideoMimeType();
        assert.strictEqual(mime, 'video/mp4;codecs=avc1,mp4a.40.2');
      } finally {
        (globalThis as unknown as { MediaRecorder?: unknown }).MediaRecorder = originalMediaRecorder;
        (globalThis as unknown as { window?: unknown }).window = originalWindow;
      }
    });

    it('should return empty string if no candidate mime types are supported', () => {
      const originalMediaRecorder = (globalThis as unknown as { MediaRecorder?: unknown }).MediaRecorder;
      const originalWindow = (globalThis as unknown as { window?: unknown }).window;

      (globalThis as unknown as { window?: unknown }).window = {} as Window;
      (globalThis as unknown as { MediaRecorder?: unknown }).MediaRecorder = {
        isTypeSupported: () => false,
      };

      try {
        const mime = service.getOptimalVideoMimeType();
        assert.strictEqual(mime, '');
      } finally {
        (globalThis as unknown as { MediaRecorder?: unknown }).MediaRecorder = originalMediaRecorder;
        (globalThis as unknown as { window?: unknown }).window = originalWindow;
      }
    });
  });

  describe('stopMediaStream Track Cleanup', () => {
    it('should safely do nothing when stream is null or undefined', () => {
      assert.doesNotThrow(() => service.stopMediaStream(null));
      assert.doesNotThrow(() => service.stopMediaStream(undefined));
    });

    it('should stop every audio and video track on the stream', () => {
      let videoStopped = false;
      let audioStopped = false;

      const fakeStream = {
        getTracks: () => [
          {
            kind: 'video',
            stop: () => {
              videoStopped = true;
            },
          },
          {
            kind: 'audio',
            stop: () => {
              audioStopped = true;
            },
          },
        ],
      } as unknown as MediaStream;

      service.stopMediaStream(fakeStream);
      assert.strictEqual(videoStopped, true);
      assert.strictEqual(audioStopped, true);
    });
  });

  describe('revokeMediaUrl Cleanup', () => {
    it('should safely do nothing for undefined, empty, or non-blob URLs', () => {
      assert.doesNotThrow(() => service.revokeMediaUrl(undefined));
      assert.doesNotThrow(() => service.revokeMediaUrl(''));
      assert.doesNotThrow(() => service.revokeMediaUrl('https://example.com/photo.jpg'));
    });

    it('should invoke URL.revokeObjectURL for blob URLs', () => {
      let revokedUrl = '';
      const originalRevoke = URL.revokeObjectURL;
      const originalWindow = (globalThis as unknown as { window?: unknown }).window;

      (globalThis as unknown as { window?: unknown }).window = {} as Window;
      URL.revokeObjectURL = (url: string) => {
        revokedUrl = url;
      };

      try {
        const testBlobUrl = 'blob:http://localhost:3000/123e4567-e89b-12d3-a456-426614174000';
        service.revokeMediaUrl(testBlobUrl);
        assert.strictEqual(revokedUrl, testBlobUrl);
      } finally {
        URL.revokeObjectURL = originalRevoke;
        (globalThis as unknown as { window?: unknown }).window = originalWindow;
      }
    });
  });

  describe('mapMediaError Mapping', () => {
    it('should map NotAllowedError to PERMISSION_DENIED', () => {
      const err = { name: 'NotAllowedError', message: 'Permission dismissed' };
      const res = service.mapMediaError(err);
      assert.strictEqual(res.code, 'PERMISSION_DENIED');
      assert.ok(res.message.includes('permission was denied'));
    });

    it('should map NotFoundError to DEVICE_NOT_FOUND', () => {
      const err = { name: 'NotFoundError', message: 'Requested device not found' };
      const res = service.mapMediaError(err);
      assert.strictEqual(res.code, 'DEVICE_NOT_FOUND');
    });

    it('should map NotReadableError to DEVICE_IN_USE', () => {
      const err = { name: 'NotReadableError', message: 'Hardware in use' };
      const res = service.mapMediaError(err);
      assert.strictEqual(res.code, 'DEVICE_IN_USE');
    });

    it('should map OverconstrainedError to OVERCONSTRAINED', () => {
      const err = { name: 'OverconstrainedError', message: 'Resolution too high' };
      const res = service.mapMediaError(err);
      assert.strictEqual(res.code, 'OVERCONSTRAINED');
    });

    it('should map SecurityError to INSECURE_CONTEXT', () => {
      const err = { name: 'SecurityError', message: 'Only secure origins are allowed' };
      const res = service.mapMediaError(err);
      assert.strictEqual(res.code, 'INSECURE_CONTEXT');
    });

    it('should map unknown errors gracefully', () => {
      const res = service.mapMediaError('Some random string error');
      assert.strictEqual(res.code, 'UNKNOWN_ERROR');
    });

    it('should handle falsy error input', () => {
      const res = service.mapMediaError(null);
      assert.strictEqual(res.code, 'UNKNOWN_ERROR');
    });
  });

  describe('Formatting & Constants Validation', () => {
    it('should enforce duration and size limits constants', () => {
      assert.strictEqual(MAX_VIDEO_RECORD_SECONDS, 30);
      assert.strictEqual(MAX_CAPTURE_FILE_BYTES, 50 * 1024 * 1024);
      assert.ok(AUDIO_DISCLOSURE_NOTICE.includes('solely to record spoken inspection commentary'));
      assert.ok(AUDIO_DISCLOSURE_NOTICE.includes('never transmitted to remote servers'));
    });

    it('should format file sizes accurately', () => {
      assert.strictEqual(service.formatFileSize(0), '0 B');
      assert.strictEqual(service.formatFileSize(500), '500 B');
      assert.strictEqual(service.formatFileSize(1024), '1 KB');
      assert.strictEqual(service.formatFileSize(1024 * 1024 * 3.4), '3.4 MB');
    });

    it('should format recording duration in MM:SS', () => {
      assert.strictEqual(service.formatDuration(0), '00:00');
      assert.strictEqual(service.formatDuration(9), '00:09');
      assert.strictEqual(service.formatDuration(30), '00:30');
      assert.strictEqual(service.formatDuration(65), '01:05');
    });
  });

  describe('Mock Persistence & Explicit Confirmation Flow', () => {
    let repository: MockRecordRepository;

    beforeEach(() => {
      repository = new MockRecordRepository();
    });

    it('should NOT attach captured media if user cancelled or did not confirm', async () => {
      // User creates record without confirming media
      const recordInput: CreateRecordDTO = {
        title: 'Inspection without media',
        notes: 'User discarded staged photo',
        category: 'Infrastructure',
        priority: 'low',
        mediaReferences: [], // Empty because staged media was discarded
      };

      const record = await repository.createRecord(recordInput);
      assert.ok(record.id);
      assert.strictEqual(record.mediaReferences.length, 0);
    });

    it('should persist confirmed captured photo in MockRecordRepository without Firebase', async () => {
      const confirmedPhoto: MediaAsset = {
        id: 'att-captured-photo-1',
        fileName: 'field-capture-20261013-120000.jpg',
        type: 'photo',
        fileSize: 1024 * 850, // 850 KB
        fileSizeFormatted: '850 KB',
        mimeType: 'image/jpeg',
        uri: 'blob:http://localhost:3000/mock-photo-blob',
        capturedAt: new Date().toISOString(),
        uploadState: 'completed',
      };

      const recordInput: CreateRecordDTO = {
        title: 'Bridge Expansion Joint Inspection',
        notes: 'Captured high-res still frame with field camera',
        category: 'Infrastructure',
        priority: 'high',
        mediaReferences: [confirmedPhoto],
      };

      const record = await repository.createRecord(recordInput);
      assert.ok(record.id);
      assert.strictEqual(record.mediaReferences.length, 1);
      assert.strictEqual(record.mediaReferences[0].id, 'att-captured-photo-1');
      assert.strictEqual(record.mediaReferences[0].type, 'photo');
      assert.strictEqual(record.mediaReferences[0].uri, 'blob:http://localhost:3000/mock-photo-blob');
      assert.strictEqual(record.status, 'pending');

      // Verify retrieval from repository
      const fetched = await repository.getRecord(record.id);
      assert.ok(fetched);
      assert.strictEqual(fetched?.mediaReferences.length, 1);
      assert.strictEqual(fetched?.mediaReferences[0].fileName, 'field-capture-20261013-120000.jpg');
    });

    it('should persist confirmed captured video with audio commentary in MockRecordRepository', async () => {
      const confirmedVideo: MediaAsset = {
        id: 'att-captured-video-1',
        fileName: 'inspection-recording-20261013-120500.webm',
        type: 'video',
        fileSize: 1024 * 1024 * 12, // 12 MB
        fileSizeFormatted: '12 MB',
        mimeType: 'video/webm;codecs=vp9,opus',
        uri: 'blob:http://localhost:3000/mock-video-blob',
        duration: '00:25',
        capturedAt: new Date().toISOString(),
        uploadState: 'completed',
      };

      const recordInput: CreateRecordDTO = {
        title: 'Culvert Water Flow Assessment',
        notes: 'Recorded 25-second inspection video with microphone commentary',
        category: 'Environmental',
        priority: 'urgent',
        mediaReferences: [confirmedVideo],
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          accuracyMeters: 5.2,
          capturedAt: new Date().toISOString(),
          address: 'Field inspection coordinates',
        },
      };

      const record = await repository.createRecord(recordInput);
      assert.ok(record.id);
      assert.strictEqual(record.mediaReferences.length, 1);
      assert.strictEqual(record.mediaReferences[0].type, 'video');
      assert.strictEqual(record.mediaReferences[0].mimeType, 'video/webm;codecs=vp9,opus');
      assert.strictEqual(record.mediaReferences[0].duration, '00:25');
      assert.ok(record.location);
      assert.strictEqual(record.location.latitude, 37.7749);
      assert.strictEqual(record.location.accuracyMeters, 5.2);
    });
  });
});
