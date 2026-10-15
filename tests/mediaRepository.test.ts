import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  MockMediaRepository,
} from '../src/repositories/MockMediaRepository';

describe('MockMediaRepository Unit & Contract Tests', () => {
  let mediaRepo: MockMediaRepository;

  beforeEach(() => {
    mediaRepo = new MockMediaRepository();
  });

  it('should validate valid media file blob successfully', () => {
    const fakeBlob = new Blob(['sample-photo-data'], { type: 'image/jpeg' });
    const result = mediaRepo.validateMedia(fakeBlob);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.error, undefined);
  });

  it('should reject file that exceeds maximum size limit (50 MB)', () => {
    // Fake blob claiming 60 MB
    const fakeLargeBlob = {
      size: 60 * 1024 * 1024,
      type: 'image/jpeg',
    } as Blob;

    const result = mediaRepo.validateMedia(fakeLargeBlob);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('exceeds the allowable limit'));
  });

  it('should reject unsupported MIME type', () => {
    const fakeExecutableBlob = new Blob(['bin'], { type: 'application/x-msdownload' });
    const result = mediaRepo.validateMedia(fakeExecutableBlob);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('Unsupported MIME type'));
  });

  it('should upload media, provide progress, and return valid mock result', async () => {
    const progressList: number[] = [];
    const photoBlob = new Blob(['simulated-photo-bytes'], { type: 'image/jpeg' });

    const result = await mediaRepo.uploadMedia({
      file: photoBlob,
      filename: 'turbine-inspection.jpg',
      metadata: {
        recordId: 'REC-2026-999',
        mediaType: 'photo',
      },
      onProgress: (p) => {
        progressList.push(p.percentage);
      },
    });

    assert.ok(result.id.startsWith('mock-media-'));
    assert.ok(result.storagePath.includes('REC-2026-999'));
    assert.strictEqual(result.mimeType, 'image/jpeg');
    assert.strictEqual(result.isMock, true);
    assert.ok(progressList.includes(100));

    // Verify retrieval by ID
    const url = await mediaRepo.getMediaUrl(result.id);
    assert.ok(url.length > 0);

    // Delete media
    const deleted = await mediaRepo.deleteMedia(result.id);
    assert.strictEqual(deleted, true);
  });

  it('should return false when deleting non-existent media', async () => {
    const deleted = await mediaRepo.deleteMedia('non-existent-media-id-123');
    assert.strictEqual(deleted, false);
  });
});
