import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MockRecordRepository } from '@/repositories/MockRecordRepository';
import { INITIAL_SEED_RECORDS } from '@/repositories/seedRecords';

describe('MockRecordRepository Tests', () => {
  let repository: MockRecordRepository;

  beforeEach(() => {
    // Create clean isolated repository instance with seeds
    repository = new MockRecordRepository(INITIAL_SEED_RECORDS);
  });

  describe('Seed Records Coverage', () => {
    it('should include photo seed record', async () => {
      const result = await repository.listRecords({ pageSize: 20 });
      const photoRecord = result.items.find((r) =>
        r.mediaReferences.some((m) => m.type === 'photo')
      );
      assert.ok(photoRecord, 'A record with photo media should exist in seeds');
    });

    it('should include video seed record', async () => {
      const result = await repository.listRecords({ pageSize: 20 });
      const videoRecord = result.items.find((r) =>
        r.mediaReferences.some((m) => m.type === 'video')
      );
      assert.ok(videoRecord, 'A record with video media should exist in seeds');
      assert.ok(
        videoRecord?.id === 'PROP-2026-002' ||
          videoRecord?.id === 'PROP-2026-006' ||
          videoRecord?.id === 'REC-2026-002' ||
          videoRecord?.id === 'WORK-2026-002' ||
          videoRecord?.id === 'WORK-2026-006',
        `Expected video record ID to match known video seed, got ${videoRecord?.id}`
      );
    });

    it('should include seed record with missing location (undefined GPS)', async () => {
      const result = await repository.listRecords({ pageSize: 20 });
      const missingLocRecord = result.items.find((r) => r.location === undefined);
      assert.ok(missingLocRecord, 'A record with undefined location should exist in seeds');
      assert.ok(
        missingLocRecord?.id === 'PROP-2026-003' ||
          missingLocRecord?.id === 'REC-2026-003' ||
          missingLocRecord?.id === 'WORK-2026-003',
        `Expected missing location record ID to match known pending seed, got ${missingLocRecord?.id}`
      );
    });

    it('should include seed record with failed upload state', async () => {
      const result = await repository.listRecords({ pageSize: 20 });
      const failedUploadRecord = result.items.find((r) =>
        r.mediaReferences.some((m) => m.uploadState === 'failed')
      );
      assert.ok(failedUploadRecord, 'A record with failed media upload state should exist');
      assert.ok(
        failedUploadRecord?.id === 'PROP-2026-004' ||
          failedUploadRecord?.id === 'REC-2026-004' ||
          failedUploadRecord?.id === 'WORK-2026-004',
        `Expected failed upload record ID to match known failed seed, got ${failedUploadRecord?.id}`
      );
    });

    it('should handle empty result query gracefully', async () => {
      const result = await repository.listRecords({ searchTerm: 'NON_EXISTENT_QUERY_12345' });
      assert.strictEqual(result.items.length, 0);
      assert.strictEqual(result.totalCount, 0);
      assert.strictEqual(result.totalPages, 1);
    });
  });

  describe('CRUD Operations', () => {
    it('should create a valid record and retrieve it by ID', async () => {
      const created = await repository.createRecord({
        title: 'Generator Rotor Bearing Inspection',
        category: 'Equipment Safety',
        facility: 'Central Logistics Hub A',
        priority: 'high',
        notes: 'Vibration sweep within tolerance limits.',
        authorName: 'Alex Rivera',
      });

      assert.ok(created.id.startsWith('REC-2026-'));
      assert.ok(created.referenceNumber.startsWith('PVG-OPS-'));
      assert.strictEqual(created.title, 'Generator Rotor Bearing Inspection');

      const fetched = await repository.getRecord(created.id);
      assert.ok(fetched);
      assert.strictEqual(fetched?.id, created.id);
    });

    it('should update status and record supervisor notes in timeline', async () => {
      const created = await repository.createRecord({
        title: 'Transformer Inspection Checklist',
        category: 'Equipment Safety',
        facility: 'Central Logistics Hub A',
        notes: 'Initial checks.',
      });

      const updated = await repository.updateRecord(created.id, {
        status: 'verified',
        supervisorNote: 'All metrology confirmed.',
        reviewerName: 'Chief Inspector Dana',
      });

      assert.strictEqual(updated.status, 'verified');
      assert.ok(updated.certifiedAt);
      assert.strictEqual(
        updated.timeline.some((t) => t.note === 'All metrology confirmed.'),
        true
      );
    });

    it('should delete a record by ID', async () => {
      const created = await repository.createRecord({
        title: 'Temporary Calibration Item',
        category: 'Equipment Safety',
        facility: 'Central Logistics Hub A',
        notes: 'To be removed.',
      });

      const deleteSuccess = await repository.deleteRecord(created.id);
      assert.strictEqual(deleteSuccess, true);

      const check = await repository.getRecord(created.id);
      assert.strictEqual(check, null);
    });

    it('should paginate results accurately', async () => {
      const page1 = await repository.listRecords({ page: 1, pageSize: 3 });
      assert.strictEqual(page1.items.length, 3);
      assert.strictEqual(page1.page, 1);
      assert.strictEqual(page1.hasNextPage, true);

      const page2 = await repository.listRecords({ page: 2, pageSize: 3 });
      assert.strictEqual(page2.items.length, 3);
      assert.strictEqual(page2.page, 2);
      assert.notStrictEqual(page1.items[0].id, page2.items[0].id);
    });
  });
});
