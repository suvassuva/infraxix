// ==============================================================================
// PVG Ops - Optional FirestoreRecordRepository Implementation
// Compiles cleanly with Firebase Firestore SDK typings without requiring credentials.
// Makes NO network calls unless explicitly configured and invoked.
// ==============================================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { IRecordRepository } from '../IRecordRepository';
import {
  CaptureRecord,
  CreateRecordDTO,
  UpdateRecordDTO,
  RecordFilterOptions,
  PaginatedResult,
  RecordMetrics,
  AttachmentItem,
  PropertySpecs,
  PropertyPricing,
  CaptureLocation,
} from '@/types';
import { getFirebaseFirestore, isFirebaseConfigured } from './firebaseConfig';

const RECORDS_COLLECTION = 'records';

export class FirestoreRecordRepository implements IRecordRepository {
  private assertInitialized() {
    const db = getFirebaseFirestore();
    if (!db || !isFirebaseConfigured()) {
      throw new Error(
        '[FirestoreRecordRepository] Firestore is not configured. ' +
        'Set NEXT_PUBLIC_DATA_SOURCE=firebase and provide valid NEXT_PUBLIC_FIREBASE_* credentials in .env.local.'
      );
    }
    return db;
  }

  private mapDocToRecord(data: DocumentData, id: string): CaptureRecord {
    const metrics: RecordMetrics = {
      complianceScore: data.metrics?.complianceScore ?? 100,
      itemsInspected: data.metrics?.itemsInspected ?? 1,
      defectsFound: data.metrics?.defectsFound ?? 0,
    };

    return {
      id: id || data.id,
      referenceNumber: data.referenceNumber || `PVG-OPS-${id.slice(-6)}`,
      ownerUid: data.ownerUid || 'mock-usr-officer-001',
      capturedBy: data.capturedBy || {
        name: 'Field Officer',
        role: 'Field Inspector',
        email: 'officer@pvg-ops.local',
      },
      title: data.title || '',
      category: data.category || 'General',
      facility: data.facility || 'Facility Hub',
      priority: data.priority || 'medium',
      status: data.status || 'pending',
      notes: data.notes || '',
      location: data.location,
      mediaReferences: data.mediaReferences || [],
      attachments: data.attachments || [],
      metrics,
      tags: data.tags || [],
      consentVersion: data.consentVersion || 'v1.0-offline',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      timeline: data.timeline || [],
    };
  }

  public async listRecords(options?: RecordFilterOptions): Promise<PaginatedResult<CaptureRecord>> {
    const db = this.assertInitialized();
    const constraints: QueryConstraint[] = [];

    if (options?.category && options.category !== 'All Categories') {
      constraints.push(where('category', '==', options.category));
    }
    if (options?.status && options.status !== 'all') {
      constraints.push(where('status', '==', options.status));
    }
    if (options?.priority && options.priority !== 'all') {
      constraints.push(where('priority', '==', options.priority));
    }

    // Default sorting
    constraints.push(orderBy('createdAt', 'desc'));

    const pageSize = options?.pageSize || 10;
    constraints.push(limit(pageSize * 2)); // Fetch buffer for client-side search/pagination

    const q = query(collection(db, RECORDS_COLLECTION), ...constraints);
    const snap = await getDocs(q);

    let items = snap.docs.map((d) => this.mapDocToRecord(d.data(), d.id));

    // Optional text filtering in memory
    if (options?.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          r.referenceNumber.toLowerCase().includes(term) ||
          r.notes.toLowerCase().includes(term)
      );
    }

    const page = options?.page || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      totalCount: items.length,
      page,
      pageSize,
      totalPages: Math.ceil(items.length / pageSize) || 1,
      hasNextPage: startIndex + pageSize < items.length,
      hasPrevPage: page > 1,
    };
  }

  public async getRecord(id: string): Promise<CaptureRecord | null> {
    const db = this.assertInitialized();
    const docRef = doc(db, RECORDS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    return this.mapDocToRecord(snap.data(), snap.id);
  }

  public async createRecord(data: CreateRecordDTO): Promise<CaptureRecord> {
    const db = this.assertInitialized();
    const recordId = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const referenceNumber = `PVG-OPS-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const metrics: RecordMetrics = {
      complianceScore: data.metrics?.complianceScore ?? 100,
      itemsInspected: data.itemsInspected ?? (data.metrics?.itemsInspected ?? 1),
      defectsFound: data.defectsFound ?? (data.metrics?.defectsFound ?? 0),
    };

    const record: CaptureRecord = {
      id: recordId,
      referenceNumber,
      ownerUid: data.ownerUid || 'mock-usr-officer-001',
      capturedBy: {
        name: data.authorName || 'Field Officer',
        role: data.authorRole || 'Field Inspector',
        email: data.authorEmail || 'officer@pvg-ops.local',
      },
      title: data.title,
      category: data.category || 'General',
      facility: data.facility || 'Central Logistics Hub A',
      priority: data.priority || 'medium',
      status: 'pending',
      notes: data.notes || '',
      location: data.location,
      mediaReferences: data.mediaReferences || [],
      attachments: data.mediaReferences
        ? (data.mediaReferences as unknown as AttachmentItem[])
        : [],
      metrics,
      tags: data.tags || ['field-inspection'],
      consentVersion: data.consentVersion || 'v1.0-offline',
      createdAt: now,
      updatedAt: now,
      listingType: data.listingType,
      propertyCategory: data.propertyCategory,
      specs: data.specs as PropertySpecs | undefined,
      pricing: data.pricing as PropertyPricing | undefined,
      verificationBadge: data.verificationBadge,
      doorstepCoordinates: data.doorstepCoordinates || data.location,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: now,
          author: data.authorName || 'Field Officer',
          action: 'Record initialized in Firestore',
        },
      ],
    };

    await setDoc(doc(db, RECORDS_COLLECTION, recordId), record);
    return record;
  }

  public async updateRecord(id: string, updates: UpdateRecordDTO): Promise<CaptureRecord> {
    const db = this.assertInitialized();
    const existing = await this.getRecord(id);
    if (!existing) {
      throw new Error(`Record with ID ${id} not found.`);
    }

    const now = new Date().toISOString();
    const timeline = [...existing.timeline];

    if (updates.status && updates.status !== existing.status) {
      timeline.unshift({
        id: `tl-${Date.now()}`,
        timestamp: now,
        author: updates.reviewerName || 'Supervisor',
        action: `Status modified to ${updates.status}`,
        note: updates.supervisorNote,
      });
    }

    const {
      metrics: partialMetrics,
      specs: partialSpecs,
      pricing: partialPricing,
      location: partialLocation,
      ...restUpdates
    } = updates;
    delete (restUpdates as Record<string, unknown>).reviewerName;
    delete (restUpdates as Record<string, unknown>).supervisorNote;

    const updatedMetrics: RecordMetrics | undefined = partialMetrics
      ? {
          complianceScore: partialMetrics.complianceScore ?? existing.metrics.complianceScore,
          itemsInspected: partialMetrics.itemsInspected ?? existing.metrics.itemsInspected,
          defectsFound: partialMetrics.defectsFound ?? existing.metrics.defectsFound,
        }
      : undefined;

    const updatedSpecs: PropertySpecs | undefined = partialSpecs
      ? ({
          ...existing.specs,
          ...partialSpecs,
        } as PropertySpecs)
      : existing.specs;

    const updatedPricing: PropertyPricing | undefined = partialPricing
      ? ({
          ...existing.pricing,
          ...partialPricing,
        } as PropertyPricing)
      : existing.pricing;

    const updatedLocation: CaptureLocation | undefined = partialLocation
      ? ({
          ...existing.location,
          ...partialLocation,
        } as CaptureLocation)
      : existing.location;

    const payload: Partial<CaptureRecord> = {
      ...restUpdates,
      ...(updatedMetrics ? { metrics: updatedMetrics } : {}),
      ...(updatedSpecs ? { specs: updatedSpecs } : {}),
      ...(updatedPricing ? { pricing: updatedPricing } : {}),
      ...(updatedLocation ? { location: updatedLocation, doorstepCoordinates: updatedLocation } : {}),
      updatedAt: now,
      timeline,
      ...(updates.status === 'verified' ? { certifiedAt: now } : {}),
      ...(updates.status === 'pending' ? { reviewedAt: now } : {}),
    };

    await updateDoc(doc(db, RECORDS_COLLECTION, id), payload as { [x: string]: unknown });
    return {
      ...existing,
      ...payload,
    };
  }

  public async deleteRecord(id: string): Promise<boolean> {
    const db = this.assertInitialized();
    const existing = await this.getRecord(id);
    if (!existing) {
      return false;
    }
    await deleteDoc(doc(db, RECORDS_COLLECTION, id));
    return true;
  }

  public async resetToSeeds(): Promise<void> {
    throw new Error(
      '[FirestoreRecordRepository] resetToSeeds() is disabled on production Firestore database. ' +
      'Use MockRecordRepository for demo resets.'
    );
  }

  public async getStatusCounts(): Promise<Record<string, number>> {
    const result = await this.listRecords({ pageSize: 500 });
    const counts: Record<string, number> = {
      total: result.items.length,
      pending: 0,
      verified: 0,
      flagged: 0,
      draft: 0,
      rejected: 0,
    };
    result.items.forEach((r) => {
      if (counts[r.status] !== undefined) {
        counts[r.status]++;
      }
    });
    return counts;
  }
}
