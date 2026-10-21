// ==============================================================================
// Infraxix - Local IndexedDB Media Store
// Caches full photo and video Blobs locally on the user's device so that
// evidence files can be viewed and played with full video and audio,
// even when Firebase Cloud Storage is unprovisioned or offline.
// ==============================================================================

const DB_NAME = 'infraxix_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

export interface StoredMediaRecord {
  id: string;
  fileName: string;
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  recordId?: string;
  updatedAt: string;
}

class LocalMediaStore {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  }

  private async getDB(): Promise<IDBDatabase | null> {
    if (!this.isAvailable()) return null;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('fileName', 'fileName', { unique: false });
            store.createIndex('recordId', 'recordId', { unique: false });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('[LocalMediaStore] Failed to open IndexedDB:', req.error);
          resolve(null);
        };
      } catch (err) {
        console.warn('[LocalMediaStore] IndexedDB error:', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  /**
   * Caches a media file/blob into local IndexedDB
   */
  public async saveMedia(
    id: string,
    blob: Blob,
    meta?: { fileName?: string; recordId?: string; mimeType?: string }
  ): Promise<boolean> {
    const db = await this.getDB();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const record: StoredMediaRecord = {
          id,
          fileName: meta?.fileName || id,
          blob,
          mimeType: meta?.mimeType || blob.type || 'application/octet-stream',
          sizeBytes: blob.size,
          recordId: meta?.recordId,
          updatedAt: new Date().toISOString(),
        };

        const req = store.put(record);
        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          console.warn('[LocalMediaStore] Save failed:', req.error);
          resolve(false);
        };
      } catch (err) {
        console.warn('[LocalMediaStore] Transaction error:', err);
        resolve(false);
      }
    });
  }

  /**
   * Retrieves a cached Blob by ID or filename
   */
  public async getMediaBlob(idOrName: string): Promise<Blob | null> {
    const db = await this.getDB();
    if (!db || !idOrName) return null;

    // Try direct ID lookup first
    const directResult = await new Promise<Blob | null>((resolve) => {
      try {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(idOrName);

        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve(req.result.blob);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    if (directResult) return directResult;

    // Fallback: search by fileName index
    return new Promise<Blob | null>((resolve) => {
      try {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('fileName');
        const cleanName = idOrName.replace(/^(video|metadata):\/\//, '');
        const req = index.get(cleanName);

        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve(req.result.blob);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Resolves a media URI or attachment into a valid playable/viewable URL.
   * Handles:
   * - standard http/https/blob/data URLs -> returns directly
   * - rawBlob if attached -> creates object URL
   * - video:// or metadata:// or ID lookup in IndexedDB -> creates object URL
   * - returns null if not playable locally
   */
  public async resolvePlayableUrl(
    uri?: string | null,
    fallbackId?: string,
    fallbackName?: string,
    rawBlob?: Blob | null
  ): Promise<string | null> {
    if (rawBlob) {
      try {
        return URL.createObjectURL(rawBlob);
      } catch {
        // Continue
      }
    }

    if (uri && typeof uri === 'string') {
      const clean = uri.trim();
      if (
        clean.startsWith('http://') ||
        clean.startsWith('https://') ||
        clean.startsWith('blob:') ||
        clean.startsWith('data:')
      ) {
        return clean;
      }
    }

    // Try finding in IndexedDB using uri, fallbackId, or fallbackName
    const lookupKeys = [
      uri?.replace(/^(video|metadata):\/\//, ''),
      fallbackId,
      fallbackName,
    ].filter(Boolean) as string[];

    for (const key of lookupKeys) {
      const blob = await this.getMediaBlob(key);
      if (blob) {
        try {
          return URL.createObjectURL(blob);
        } catch (err) {
          console.warn('[LocalMediaStore] Failed to create object URL for cached blob:', err);
        }
      }
    }

    return null;
  }
}

export const localMediaStore = new LocalMediaStore();
