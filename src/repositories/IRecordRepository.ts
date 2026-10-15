import {
  CaptureRecord,
  CreateRecordDTO,
  UpdateRecordDTO,
  RecordFilterOptions,
  PaginatedResult,
} from '@/types';

export interface IRecordRepository {
  /**
   * Retrieves a paginated list of records based on optional filters.
   */
  listRecords(options?: RecordFilterOptions): Promise<PaginatedResult<CaptureRecord>>;

  /**
   * Fetches a single record by its unique ID. Returns null if not found.
   */
  getRecord(id: string): Promise<CaptureRecord | null>;

  /**
   * Inserts a new record into the repository.
   */
  createRecord(data: CreateRecordDTO): Promise<CaptureRecord>;

  /**
   * Updates an existing record by ID.
   */
  updateRecord(id: string, updates: UpdateRecordDTO): Promise<CaptureRecord>;

  /**
   * Deletes a record by ID. Returns true if deleted, false if not found.
   */
  deleteRecord(id: string): Promise<boolean>;

  /**
   * Resets local in-memory dataset to initial seed records.
   */
  resetToSeeds(): Promise<void>;

  /**
   * Returns a count of records grouped by status.
   */
  getStatusCounts(): Promise<Record<string, number>>;

  /**
   * Optional synchronous helper to list record IDs for static generation.
   */
  getAllIds?(): string[];
}
