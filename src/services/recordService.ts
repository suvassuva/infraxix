import {
  CaptureRecord,
  CreateRecordDTO,
  UpdateRecordDTO,
  RecordFilterOptions,
  PaginatedResult,
  QuickStats,
} from '@/types';
import { IRecordRepository, recordRepository } from '@/repositories';

export class RecordService {
  private repository: IRecordRepository;

  constructor(repository: IRecordRepository = recordRepository) {
    this.repository = repository;
  }

  public async listRecords(options?: RecordFilterOptions): Promise<PaginatedResult<CaptureRecord>> {
    return this.repository.listRecords(options);
  }

  public async getRecord(id: string): Promise<CaptureRecord | null> {
    if (!id || typeof id !== 'string') {
      return null;
    }
    return this.repository.getRecord(id);
  }

  public async createRecord(data: CreateRecordDTO): Promise<CaptureRecord> {
    const record = await this.repository.createRecord(data);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pvg:records-updated'));
    }
    return record;
  }

  public async updateRecord(id: string, updates: UpdateRecordDTO): Promise<CaptureRecord> {
    const record = await this.repository.updateRecord(id, updates);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pvg:records-updated'));
    }
    return record;
  }

  public async deleteRecord(id: string): Promise<boolean> {
    const result = await this.repository.deleteRecord(id);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pvg:records-updated'));
    }
    return result;
  }

  public async resetToSeeds(): Promise<void> {
    await this.repository.resetToSeeds();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pvg:records-updated'));
    }
  }

  public async getQuickStats(): Promise<QuickStats> {
    const counts = await this.repository.getStatusCounts();
    return {
      totalRecords: counts.total || 0,
      pendingReview: counts.pending || 0,
      approvedToday: counts.verified || 0,
      flaggedItems: counts.flagged || 0,
      systemHealth: 99.8,
    };
  }

  public getAllRecordIds(): string[] {
    if (this.repository.getAllIds) {
      return this.repository.getAllIds();
    }
    return [
      'PROP-2026-001',
      'PROP-2026-002',
      'PROP-2026-003',
      'PROP-2026-004',
      'PROP-2026-005',
      'PROP-2026-006',
      'REC-2026-001',
      'REC-2026-002',
      'REC-2026-003',
      'REC-2026-004',
      'REC-2026-005',
      'REC-2026-006',
    ];
  }
}

// Singleton export
export const recordService = new RecordService();
