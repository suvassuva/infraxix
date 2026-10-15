import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RecordService } from '@/services/recordService';
import { MockRecordRepository } from '@/repositories/MockRecordRepository';
import { INITIAL_SEED_RECORDS } from '@/repositories/seedRecords';

describe('RecordService Layer Tests', () => {
  it('should list records through the repository', async () => {
    const repo = new MockRecordRepository(INITIAL_SEED_RECORDS);
    const service = new RecordService(repo);

    const result = await service.listRecords({ pageSize: 5 });
    assert.strictEqual(result.items.length, 5);
    assert.strictEqual(result.totalCount, INITIAL_SEED_RECORDS.length);
  });

  it('should reject record creation if title is under 3 characters', async () => {
    const repo = new MockRecordRepository(INITIAL_SEED_RECORDS);
    const service = new RecordService(repo);

    await assert.rejects(
      async () => {
        await service.createRecord({
          title: 'No', // Too short
          category: 'Equipment Safety',
          facility: 'Central Logistics Hub A',
          notes: 'Test failure',
        });
      },
      (err: unknown) => {
        return (err as { code?: string }).code === 'INVALID_TITLE';
      }
    );
  });

  it('should compute operational quick stats from repository status counts', async () => {
    const repo = new MockRecordRepository(INITIAL_SEED_RECORDS);
    const service = new RecordService(repo);

    const stats = await service.getQuickStats();
    assert.ok(stats.totalRecords >= 6);
    assert.ok(stats.approvedToday >= 1);
    assert.ok(stats.pendingReview >= 1);
    assert.strictEqual(stats.systemHealth, 99.8);
  });
});
