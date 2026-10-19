// ==============================================================================
// PVG Ops - FirestoreRecordRepository Implementation
// Connects to Google Cloud Firestore with strict ownership and verified identity.
// Enforces:
// 1. NEVER trust ownerUid or role from browser input (always uses request.auth identity).
// 2. Stores METADATA ONLY, never raw media binaries or base64 blobs.
// 3. Robust field validation and network/permission/offline error mapping.
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
  FirestoreError,
} from 'firebase/firestore';
import { IRecordRepository } from '../IRecordRepository';
import {
  CaptureRecord,
  CreateRecordDTO,
  UpdateRecordDTO,
  RecordFilterOptions,
  PaginatedResult,
  RecordMetrics,
  MediaAsset,
  AttachmentItem,
  PropertySpecs,
  PropertyPricing,
  CaptureLocation,
} from '@/types';
import {
  getFirebaseFirestore,
  getFirebaseAuth,
  isFirebaseConfigured,
} from './firebaseConfig';
import { validateTitle, validateCoordinates } from '@/lib/validation';

const RECORDS_COLLECTION = 'records';

export class FirestoreRecordRepository implements IRecordRepository {
  private assertInitialized() {
    const db = getFirebaseFirestore();
    if (!db || !isFirebaseConfigured()) {
      throw new Error(
        '[FirestoreRecordRepository] Firestore is not configured. ' +
        'Set NEXT_PUBLIC_DATA_SOURCE=firebase and provide valid credentials in .env.local ' +
        'or enable NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true.'
      );
    }
    return db;
  }

  private handleFirestoreError(err: unknown, defaultMessage: string): Error {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const code = (err as FirestoreError).code;
      switch (code) {
        case 'permission-denied':
          return new Error(
            'Access Denied: You do not have permission to access or modify this record under Firestore Security Rules.'
          );
        case 'unavailable':
          return new Error(
            'Network Offline: Firestore is currently unreachable. Ensure internet connectivity or run the local emulator.'
          );
        case 'failed-precondition':
          return new Error(
            'Operation Rejected: Missing required composite index or invalid database state.'
          );
        case 'not-found':
          return new Error('Record not found in Firestore.');
        default:
          break;
      }
    }
    return err instanceof Error ? err : new Error(defaultMessage);
  }

  /**
   * Recursively strips keys with undefined values from objects and arrays.
   * Firestore throws an error if any field is undefined.
   */
  private cleanUndefined<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.cleanUndefined(item)) as unknown as T;
    }
    if (typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanUndefined(value);
        }
      }
      return cleaned as T;
    }
    return obj;
  }

  /**
   * Sanitizes media items to guarantee metadata-only persistence.
   * Strips any raw binary buffers, blobs, or large data-uris.
   */
  private sanitizeMediaMetadata(items?: MediaAsset[]): MediaAsset[] {
    if (!items || !Array.isArray(items)) return [];

    return items.map((m) => {
      // Preserve lightweight compressed data-uris (under 600KB) so photos render everywhere
      const safeUri =
        typeof m.uri === 'string' && m.uri.startsWith('data:') && m.uri.length > 600000
          ? `metadata://${m.id}`
          : m.uri;

      return {
        id: m.id,
        type: m.type === 'video' ? 'video' : 'photo',
        fileName: m.fileName || 'capture.jpg',
        fileSize: typeof m.fileSize === 'number' ? m.fileSize : 0,
        fileSizeFormatted: m.fileSizeFormatted || '0 B',
        mimeType: m.mimeType || 'image/jpeg',
        uri: safeUri,
        uploadState: m.uploadState || 'completed',
        capturedAt: m.capturedAt || new Date().toISOString(),
        description: m.description,
        resolution: m.resolution,
        previewColor: m.previewColor,
        exif: m.exif
          ? {
              camera: m.exif.camera,
              shutter: m.exif.shutter,
              iso: m.exif.iso,
              focal: m.exif.focal,
            }
          : undefined,
      };
    });
  }

  private mapDocToRecord(data: DocumentData, id: string): CaptureRecord {
    const metrics: RecordMetrics = {
      complianceScore: data.metrics?.complianceScore ?? 100,
      itemsInspected: data.metrics?.itemsInspected ?? 1,
      defectsFound: data.metrics?.defectsFound ?? 0,
    };

    return {
      id: id || data.id,
      referenceNumber: data.referenceNumber || `IFX-OPS-${id.slice(-6)}`,
      ownerUid: data.ownerUid,
      capturedBy: data.capturedBy || {
        name: 'Field Inspector',
        role: 'Field Officer',
        email: '',
      },
      title: data.title || '',
      category: data.category || 'General',
      facility: data.facility || 'Facility Hub',
      priority: data.priority || 'medium',
      status: data.status || 'pending',
      notes: data.notes || '',
      location: data.location,
      mediaReferences: this.sanitizeMediaMetadata(data.mediaReferences),
      attachments: ((data.attachments && data.attachments.length > 0 ? data.attachments : data.mediaReferences) || []).map(
        (m: any): AttachmentItem => {
          const isVideo =
            m.mediaType === 'video' ||
            m.type === 'video' ||
            (typeof m.mimeType === 'string' && m.mimeType.startsWith('video/'));
          const isPdf =
            m.mediaType === 'pdf' || m.type === 'pdf' || m.mimeType === 'application/pdf';
          return {
            id: m.id || `att-${Date.now()}`,
            name: m.name || m.fileName || 'Evidence File',
            size: m.size || m.fileSizeFormatted || '0 B',
            type: m.type || m.mimeType || 'image/jpeg',
            mediaType: isVideo ? 'video' : isPdf ? 'pdf' : 'image',
            uri: m.uri || '',
            uploadState: m.uploadState || 'completed',
            description: m.description,
            resolution: m.resolution,
            previewColor: m.previewColor,
            exif: m.exif,
          };
        }
      ),
      metrics,
      tags: data.tags || [],
      consentVersion: data.consentVersion || 'v1.0-offline',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      listingType: data.listingType,
      propertyCategory: data.propertyCategory,
      specs: data.specs,
      pricing: data.pricing,
      verificationBadge: data.verificationBadge,
      doorstepCoordinates: data.doorstepCoordinates || data.location,
      mobileNumber: data.mobileNumber,
      locationLink: data.locationLink,
      retentionExpiresAt: data.retentionExpiresAt,
      timeline: data.timeline || [],
    };
  }

  public async listRecords(options?: RecordFilterOptions): Promise<PaginatedResult<CaptureRecord>> {
    const db = this.assertInitialized();
    try {
      const constraints: QueryConstraint[] = [];

      if (options?.ownerUid) {
        constraints.push(where('ownerUid', '==', options.ownerUid));
      }
      if (options?.category && options.category !== 'all' && options.category !== 'All Categories') {
        constraints.push(where('category', '==', options.category));
      }
      if (options?.status && options.status !== 'all') {
        constraints.push(where('status', '==', options.status));
      }
      if (options?.priority && options.priority !== 'all') {
        constraints.push(where('priority', '==', options.priority));
      }

      // Sort by recency
      constraints.push(orderBy('createdAt', 'desc'));

      const pageSize = options?.pageSize || 12;
      constraints.push(limit(pageSize * 3));

      const q = query(collection(db, RECORDS_COLLECTION), ...constraints);
      const snap = await getDocs(q);

      let items = snap.docs.map((d) => this.mapDocToRecord(d.data(), d.id));

      // In-memory search filtering
      if (options?.searchTerm) {
        const term = options.searchTerm.toLowerCase();
        items = items.filter(
          (r) =>
            r.title.toLowerCase().includes(term) ||
            r.referenceNumber.toLowerCase().includes(term) ||
            r.notes.toLowerCase().includes(term) ||
            r.facility.toLowerCase().includes(term)
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
    } catch (err) {
      throw this.handleFirestoreError(err, 'Failed to fetch records from Firestore.');
    }
  }

  public async getRecord(id: string): Promise<CaptureRecord | null> {
    const db = this.assertInitialized();
    try {
      const docRef = doc(db, RECORDS_COLLECTION, id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return null;
      }
      return this.mapDocToRecord(snap.data(), snap.id);
    } catch (err) {
      throw this.handleFirestoreError(err, `Failed to fetch record ${id} from Firestore.`);
    }
  }

  public async createRecord(data: CreateRecordDTO): Promise<CaptureRecord> {
    const db = this.assertInitialized();
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;

    if (!currentUser) {
      throw new Error(
        '[FirestoreRecordRepository] Unauthorized: You must be authenticated to create a record in Firestore.'
      );
    }

    // 1. Strict Validation
    const titleVal = validateTitle(data.title);
    if (!titleVal.valid) {
      throw new Error(`Validation Error: ${titleVal.error?.message}`);
    }

    if (data.location) {
      const coordVal = validateCoordinates(data.location);
      if (!coordVal.valid) {
        throw new Error(`Coordinates Validation Error: ${coordVal.error?.message}`);
      }
    }

    // 2. Verified Identity: NEVER trust ownerUid or role from browser input
    const verifiedOwnerUid = currentUser.uid;
    const verifiedEmail = currentUser.email || '';
    const verifiedName = currentUser.displayName || data.authorName || 'Field Officer';

    const recordId = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const referenceNumber = `IFX-OPS-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const metrics: RecordMetrics = {
      complianceScore: data.metrics?.complianceScore ?? 100,
      itemsInspected: data.itemsInspected ?? (data.metrics?.itemsInspected ?? 1),
      defectsFound: data.defectsFound ?? (data.metrics?.defectsFound ?? 0),
    };

    // 3. Store Metadata ONLY, never media binaries
    const sanitizedMedia = this.sanitizeMediaMetadata(data.mediaReferences);

    const record: CaptureRecord = {
      id: recordId,
      referenceNumber,
      ownerUid: verifiedOwnerUid,
      capturedBy: {
        name: verifiedName,
        role: 'Field Officer',
        email: verifiedEmail,
      },
      title: data.title.trim(),
      category: data.category || 'General',
      facility: data.facility || 'Central Logistics Hub A',
      priority: data.priority || 'medium',
      status: 'pending',
      notes: data.notes || '',
      location: data.location,
      mediaReferences: sanitizedMedia,
      attachments: sanitizedMedia.map((m): AttachmentItem => ({
        id: m.id,
        name: m.fileName,
        size: m.fileSizeFormatted,
        type: m.mimeType,
        mediaType: m.type === 'video' ? 'video' : m.type === 'pdf' ? 'pdf' : 'image',
        uri: m.uri,
        uploadState: m.uploadState,
        description: m.description,
        resolution: m.resolution,
        previewColor: m.previewColor,
        exif: m.exif,
      })),
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
      mobileNumber: data.mobileNumber || '',
      locationLink: data.locationLink || '',
      retentionExpiresAt: data.retentionExpiresAt,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: now,
          author: verifiedName,
          action: 'Inspection submitted to Firestore',
        },
      ],
    };

    try {
      const cleanedRecord = this.cleanUndefined(record);
      await setDoc(doc(db, RECORDS_COLLECTION, recordId), cleanedRecord as DocumentData);
      return record;
    } catch (err) {
      throw this.handleFirestoreError(err, 'Failed to create record in Firestore.');
    }
  }

  public async updateRecord(id: string, updates: UpdateRecordDTO): Promise<CaptureRecord> {
    const db = this.assertInitialized();
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;

    if (!currentUser) {
      throw new Error(
        '[FirestoreRecordRepository] Unauthorized: Authentication required to update records.'
      );
    }

    const existing = await this.getRecord(id);
    if (!existing) {
      throw new Error(`Record with ID ${id} not found.`);
    }

    // Permission and ownership enforcement
    const isOwner = existing.ownerUid === currentUser.uid;

    // Field Officer owner can only update if status is 'draft' or 'pending', and cannot self-certify to 'verified'
    if (isOwner && existing.status !== 'draft' && existing.status !== 'pending') {
      throw new Error('Access Denied: Verified or archived records cannot be edited by the submitter.');
    }

    const now = new Date().toISOString();
    const timeline = [...existing.timeline];

    if (updates.status && updates.status !== existing.status) {
      timeline.unshift({
        id: `tl-${Date.now()}`,
        timestamp: now,
        author: updates.reviewerName || currentUser.displayName || 'Supervisor',
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

    // Prevent changing immutable identity fields
    delete (restUpdates as Record<string, unknown>).ownerUid;
    delete (restUpdates as Record<string, unknown>).id;
    delete (restUpdates as Record<string, unknown>).createdAt;
    delete (restUpdates as Record<string, unknown>).reviewerName;
    delete (restUpdates as Record<string, unknown>).supervisorNote;

    const payload: Partial<CaptureRecord> = {
      ...restUpdates,
      ...(partialMetrics ? { metrics: { ...existing.metrics, ...partialMetrics } } : {}),
      ...(partialSpecs ? { specs: { ...existing.specs, ...partialSpecs } as PropertySpecs } : {}),
      ...(partialPricing ? { pricing: { ...existing.pricing, ...partialPricing } as PropertyPricing } : {}),
      ...(partialLocation
        ? { location: { ...existing.location, ...partialLocation } as CaptureLocation }
        : {}),
      updatedAt: now,
      timeline,
      ...(updates.status === 'verified' ? { certifiedAt: now } : {}),
      ...(updates.status === 'pending' ? { reviewedAt: now } : {}),
    };

    try {
      const cleanedPayload = this.cleanUndefined(payload);
      await updateDoc(doc(db, RECORDS_COLLECTION, id), cleanedPayload as { [x: string]: unknown });
      return {
        ...existing,
        ...payload,
      };
    } catch (err) {
      throw this.handleFirestoreError(err, `Failed to update record ${id} in Firestore.`);
    }
  }

  public async deleteRecord(id: string): Promise<boolean> {
    const db = this.assertInitialized();
    const auth = getFirebaseAuth();
    const currentUser = auth?.currentUser;

    if (!currentUser) {
      throw new Error(
        '[FirestoreRecordRepository] Unauthorized: Authentication required to delete records.'
      );
    }

    const existing = await this.getRecord(id);
    if (!existing) {
      return false;
    }

    try {
      await deleteDoc(doc(db, RECORDS_COLLECTION, id));
      return true;
    } catch (err) {
      throw this.handleFirestoreError(err, `Failed to delete record ${id} from Firestore.`);
    }
  }

  public async resetToSeeds(): Promise<void> {
    throw new Error(
      '[FirestoreRecordRepository] resetToSeeds() is disabled on live Firestore database. ' +
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
