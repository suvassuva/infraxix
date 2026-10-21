import {
  CaptureRecord,
  CreateRecordDTO,
  UpdateRecordDTO,
  RecordFilterOptions,
  PaginatedResult,
  AppError,
} from '@/types';
import { IRecordRepository } from './IRecordRepository';
import { INITIAL_SEED_RECORDS } from './seedRecords';
import { validateCreateRecord } from '@/lib/validation';

const STORAGE_KEY = 'pvg_workspaces_demo_store_v4';

export class MockRecordRepository implements IRecordRepository {
  private records: CaptureRecord[] = [];
  private isBrowser: boolean;

  constructor(initialData?: CaptureRecord[]) {
    this.isBrowser = typeof window !== 'undefined';
    if (initialData) {
      this.records = JSON.parse(JSON.stringify(initialData));
    } else {
      this.records = this.loadInitialRecords();
    }
  }

  private loadInitialRecords(): CaptureRecord[] {
    if (this.isBrowser) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Fallback to seeds on any localStorage read error
      }
    }
    return JSON.parse(JSON.stringify(INITIAL_SEED_RECORDS));
  }

  private persist(): void {
    if (this.isBrowser) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
        window.dispatchEvent(new CustomEvent('pvg:records-updated'));
      } catch {
        // Ignore quota errors in restricted demo sandboxes
      }
    }
  }

  public async listRecords(options: RecordFilterOptions = {}): Promise<PaginatedResult<CaptureRecord>> {
    // Artificial minimal latency (10-30ms) to ensure async behavior
    await new Promise((resolve) => setTimeout(resolve, 20));

    const {
      searchTerm = '',
      category = 'all',
      status = 'all',
      priority = 'all',
      ownerUid,
      sortBy = 'newest',
      page = 1,
      pageSize = 5,
      listingType = 'all',
      propertyCategory = 'all',
      minPrice,
      maxPrice,
    } = options;

    let filtered = [...this.records];

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.referenceNumber.toLowerCase().includes(q) ||
          r.facility.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.propertyCategory && r.propertyCategory.toLowerCase().includes(q)) ||
          r.capturedBy.name.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          (r.location?.address && r.location.address.toLowerCase().includes(q))
      );
    }

    // Filter by Listing Type (Rent, Sell, Buy)
    if (listingType && listingType !== 'all') {
      filtered = filtered.filter((r) => r.listingType === listingType);
    }

    // Filter by Property Category
    if (propertyCategory && propertyCategory !== 'all') {
      filtered = filtered.filter(
        (r) =>
          (r.propertyCategory && r.propertyCategory.toLowerCase() === propertyCategory.toLowerCase()) ||
          r.category.toLowerCase() === propertyCategory.toLowerCase()
      );
    }

    // Filter by Category
    if (category && category !== 'all') {
      filtered = filtered.filter(
        (r) =>
          r.category.toLowerCase() === category.toLowerCase() ||
          (r.propertyCategory && r.propertyCategory.toLowerCase() === category.toLowerCase())
      );
    }

    // Filter by Status
    if (status && status !== 'all') {
      filtered = filtered.filter((r) => r.status === status);
    }

    // Filter by Priority
    if (priority && priority !== 'all') {
      filtered = filtered.filter((r) => r.priority === priority);
    }

    // Filter by Price range
    if (minPrice !== undefined) {
      filtered = filtered.filter((r) => (r.pricing?.price ?? 0) >= minPrice);
    }
    if (maxPrice !== undefined) {
      filtered = filtered.filter((r) => (r.pricing?.price ?? 0) <= maxPrice);
    }

    // Filter by Owner UID or Officer identity
    if (ownerUid) {
      const targets = ownerUid.toLowerCase().split('|').map((s) => s.trim()).filter(Boolean);
      filtered = filtered.filter((r) => {
        const rUid = (r.ownerUid || '').toLowerCase().trim();
        const rEmail = (r.capturedBy?.email || '').toLowerCase().trim();
        const rName = (r.capturedBy?.name || '').toLowerCase().trim();

        return targets.some(
          (target) =>
            (rUid && rUid === target) ||
            (target.includes('officer') && r.ownerUid === 'usr-alex-rivera') ||
            (target.includes('rivera') && r.ownerUid === 'usr-alex-rivera') ||
            (rEmail && rEmail === target) ||
            (rName && (rName === target || rName.includes(target) || target.includes(rName)))
        );
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'score':
          return b.metrics.complianceScore - a.metrics.complianceScore;
        case 'price_low':
          return (a.pricing?.price ?? 0) - (b.pricing?.price ?? 0);
        case 'price_high':
          return (b.pricing?.price ?? 0) - (a.pricing?.price ?? 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    // Pagination calculations
    const totalCount = filtered.length;
    const safePageSize = Math.max(1, pageSize);
    const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const startIndex = (safePage - 1) * safePageSize;
    const items = filtered.slice(startIndex, startIndex + safePageSize);

    return {
      items,
      totalCount,
      page: safePage,
      pageSize: safePageSize,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    };
  }

  public async getRecord(id: string): Promise<CaptureRecord | null> {
    await new Promise((resolve) => setTimeout(resolve, 15));
    const found = this.records.find((r) => r.id === id || r.referenceNumber === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  public async createRecord(data: CreateRecordDTO): Promise<CaptureRecord> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    // Validate inputs
    const validation = validateCreateRecord(data);
    if (!validation.valid && validation.errors.length > 0) {
      const err = validation.errors[0];
      throw err;
    }

    const nextNumericId = Math.floor(1000 + Math.random() * 9000);
    const isProperty = Boolean(data.listingType || data.propertyCategory || data.pricing || data.specs);
    const newId = isProperty ? `PROP-2026-${String(nextNumericId).padStart(3, '0')}` : `REC-2026-${String(nextNumericId).padStart(3, '0')}`;
    const newRef = isProperty ? `PVG-PROP-${nextNumericId}` : `PVG-OPS-${nextNumericId}`;
    const timestamp = new Date().toISOString();

    const newRecord: CaptureRecord = {
      id: newId,
      referenceNumber: newRef,
      ownerUid: data.ownerUid || 'demo-officer-local',
      capturedBy: {
        name: data.authorName || 'Field Officer (Demo)',
        role: data.authorRole || 'Field Inspector',
        email: data.authorEmail || 'officer@pvg-ops.local',
      },
      title: data.title.trim(),
      category: data.category || (data.propertyCategory ? String(data.propertyCategory) : 'Equipment Safety'),
      facility: data.facility || (data.location?.address ? data.location.address : 'Central Logistics Hub A'),
      priority: data.priority || 'medium',
      status: 'pending',
      notes: data.notes || '',
      location: data.location,
      mediaReferences: data.mediaReferences || [],
      metrics: {
        complianceScore: data.metrics?.complianceScore ?? 85,
        itemsInspected: data.metrics?.itemsInspected ?? 10,
        defectsFound: data.metrics?.defectsFound ?? 0,
      },
      tags: data.tags || ['Property Verification'],
      consentVersion: data.consentVersion || 'v1.0-field-consent',
      createdAt: timestamp,
      updatedAt: timestamp,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp,
          author: data.authorName || 'Field Officer (Demo)',
          action: 'Captured onsite record',
          note: 'Submitted to local repository queue',
        },
      ],
      // Commercial Workspace Properties
      listingType: data.listingType || 'rent',
      propertyCategory: data.propertyCategory || (data.category as any),
      specs: data.specs as any,
      pricing: data.pricing || (data.specs?.rent ? {
        price: data.specs.rent,
        securityDeposit: data.specs.deposit,
        currency: 'INR',
        pricePeriod: 'month',
      } : undefined),
      verificationBadge: data.verificationBadge || (data.location ? `PVG Verified GPS (±${data.location.accuracyMeters.toFixed(1)}m)` : 'Pending GPS Lock'),
      doorstepCoordinates: data.doorstepCoordinates || data.location,
      mobileNumber: data.mobileNumber,
      locationLink: data.locationLink,
      retentionExpiresAt: data.retentionExpiresAt,
    };

    this.records.unshift(newRecord);
    this.persist();
    return JSON.parse(JSON.stringify(newRecord));
  }

  public async updateRecord(id: string, updates: UpdateRecordDTO): Promise<CaptureRecord> {
    await new Promise((resolve) => setTimeout(resolve, 25));

    const index = this.records.findIndex((r) => r.id === id || r.referenceNumber === id);
    if (index === -1) {
      const error: AppError = {
        code: 'NOT_FOUND',
        message: `Record with id "${id}" was not found in the local repository.`,
        field: 'id',
      };
      throw error;
    }

    const current = this.records[index];
    const timestamp = new Date().toISOString();

    const updatedTimeline = [...current.timeline];
    if (updates.supervisorNote || updates.status) {
      updatedTimeline.push({
        id: `tl-${Date.now()}`,
        timestamp,
        author: updates.reviewerName || 'Current Supervisor (Demo)',
        action: updates.status
          ? `Status changed to ${updates.status.toUpperCase()}`
          : 'Updated record notes',
        note: updates.supervisorNote,
      });
    }

    const updatedSpecs = updates.specs ? { ...current.specs, ...updates.specs } : current.specs;
    const updatedLocation = updates.location ? { ...current.location, ...updates.location } : current.location;

    let updatedPricing = current.pricing;
    if (updates.pricing) {
      updatedPricing = { ...current.pricing, ...updates.pricing };
    } else if (updates.specs?.rent !== undefined || updates.specs?.deposit !== undefined) {
      updatedPricing = {
        ...current.pricing,
        ...(updates.specs?.rent !== undefined ? { price: updates.specs.rent } : {}),
        ...(updates.specs?.deposit !== undefined ? { securityDeposit: updates.specs.deposit } : {}),
        currency: current.pricing?.currency || 'INR',
        pricePeriod: current.pricing?.pricePeriod || 'month',
      };
    }

    const updatedRecord: CaptureRecord = {
      ...current,
      title: updates.title !== undefined ? updates.title.trim() : current.title,
      notes: updates.notes !== undefined ? updates.notes : current.notes,
      category: updates.category || current.category,
      facility: updates.facility || current.facility,
      status: updates.status || current.status,
      priority: updates.priority || current.priority,
      metrics: {
        ...current.metrics,
        ...(updates.metrics || {}),
      },
      tags: updates.tags || current.tags,
      updatedAt: timestamp,
      reviewedAt: updates.status ? timestamp : current.reviewedAt,
      certifiedAt: updates.status === 'verified' ? timestamp : current.certifiedAt,
      timeline: updatedTimeline,
      listingType: updates.listingType || current.listingType,
      propertyCategory: updates.propertyCategory || current.propertyCategory,
      specs: updatedSpecs as any,
      pricing: updatedPricing as any,
      location: updatedLocation as any,
      verificationBadge: updates.verificationBadge || current.verificationBadge,
      mobileNumber: updates.mobileNumber !== undefined ? updates.mobileNumber : current.mobileNumber,
      locationLink: updates.locationLink !== undefined ? updates.locationLink : current.locationLink,
      supervisorNote: updates.supervisorNote !== undefined ? updates.supervisorNote : current.supervisorNote,
      reviewerName: updates.reviewerName || current.reviewerName,
    };

    this.records[index] = updatedRecord;
    this.persist();
    return JSON.parse(JSON.stringify(updatedRecord));
  }

  public async deleteRecord(id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 20));

    const index = this.records.findIndex((r) => r.id === id || r.referenceNumber === id);
    if (index === -1) {
      return false;
    }

    this.records.splice(index, 1);
    this.persist();
    return true;
  }

  public async resetToSeeds(): Promise<void> {
    this.records = JSON.parse(JSON.stringify(INITIAL_SEED_RECORDS));
    if (this.isBrowser) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('pvg:records-updated'));
      } catch {
        // Ignore in restricted environment
      }
    }
  }

  public async getStatusCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {
      total: this.records.length,
      pending: 0,
      verified: 0,
      flagged: 0,
      rejected: 0,
      draft: 0,
    };

    for (const r of this.records) {
      counts[r.status] = (counts[r.status] || 0) + 1;
    }

    return counts;
  }

  /**
   * Helper to retrieve all IDs for Next.js static prerendering
   */
  public getAllIds(): string[] {
    return this.records.map((r) => r.id);
  }
}

// Singleton repository export
export const mockRecordRepository = new MockRecordRepository();
