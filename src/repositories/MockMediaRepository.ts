// ==============================================================================
// PVG Ops - MockMediaRepository Implementation
// In-memory / client-side mock media repository with progress and URL lifecycles
// ==============================================================================

import {
  IMediaRepository,
  MediaUploadOptions,
  MediaUploadResult,
  MediaValidationResult,
} from './IMediaRepository';

export const DEFAULT_MAX_MEDIA_BYTES = 50 * 1024 * 1024; // 50 MB
export const ALLOWED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/webm',
  'video/mp4',
  'video/quicktime',
];

interface StoredMockMedia {
  id: string;
  storagePath: string;
  downloadUrl: string;
  sizeBytes: number;
  mimeType: string;
  blobUrl?: string;
  createdAt: string;
}

export class MockMediaRepository implements IMediaRepository {
  private mediaStore: Map<string, StoredMockMedia> = new Map();
  private maxSizeBytes: number;

  constructor(maxSizeBytes: number = DEFAULT_MAX_MEDIA_BYTES) {
    this.maxSizeBytes = maxSizeBytes;
  }

  public validateMedia(
    file: File | Blob,
    options?: { maxSizeBytes?: number; allowedTypes?: string[] }
  ): MediaValidationResult {
    const limit = options?.maxSizeBytes ?? this.maxSizeBytes;
    const allowed = options?.allowedTypes ?? ALLOWED_MEDIA_TYPES;

    if (!file) {
      return { valid: false, error: 'No media file or blob provided.' };
    }

    if (file.size <= 0) {
      return { valid: false, error: 'Media file is empty (0 bytes).' };
    }

    if (file.size > limit) {
      const limitMb = (limit / (1024 * 1024)).toFixed(0);
      return {
        valid: false,
        error: `File size exceeds the allowable limit of ${limitMb} MB.`,
      };
    }

    if (file.type && !allowed.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported MIME type (${file.type}). Allowed: ${allowed.join(', ')}`,
      };
    }

    return { valid: true };
  }

  public async uploadMedia(options: MediaUploadOptions): Promise<MediaUploadResult> {
    const { file, filename, metadata, onProgress } = options;

    // Validate before proceeding
    const validation = this.validateMedia(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Media validation failed.');
    }

    const id = `mock-media-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const extension = file.type.includes('video') ? 'webm' : 'jpg';
    const safeName = filename || `${id}.${extension}`;
    const storagePath = `mock://media/${metadata?.recordId || 'unassigned'}/${safeName}`;

    // Simulate progress updates if callback provided
    if (onProgress) {
      onProgress({ bytesTransferred: 0, totalBytes: file.size, percentage: 0 });
      await new Promise((resolve) => setTimeout(resolve, 30));
      onProgress({
        bytesTransferred: Math.floor(file.size * 0.4),
        totalBytes: file.size,
        percentage: 40,
      });
      await new Promise((resolve) => setTimeout(resolve, 30));
      onProgress({
        bytesTransferred: Math.floor(file.size * 0.8),
        totalBytes: file.size,
        percentage: 80,
      });
      await new Promise((resolve) => setTimeout(resolve, 20));
      onProgress({ bytesTransferred: file.size, totalBytes: file.size, percentage: 100 });
    }

    // Generate browser blob URL if in window context and URL.createObjectURL exists
    let downloadUrl = `https://mock-storage.pvg-ops.local/media/${id}`;
    let blobUrl: string | undefined = undefined;

    if (typeof window !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        blobUrl = URL.createObjectURL(file);
        downloadUrl = blobUrl;
      } catch {
        // Fall back to mock URL
      }
    }

    const stored: StoredMockMedia = {
      id,
      storagePath,
      downloadUrl,
      sizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      blobUrl,
      createdAt: new Date().toISOString(),
    };

    this.mediaStore.set(id, stored);
    this.mediaStore.set(storagePath, stored);

    return {
      id,
      storagePath,
      downloadUrl,
      sizeBytes: file.size,
      mimeType: stored.mimeType,
      checksumSha256: `mock-sha256-${Date.now().toString(16)}`,
      createdAt: stored.createdAt,
      isMock: true,
    };
  }

  public async getMediaUrl(storagePathOrId: string): Promise<string> {
    const item = this.mediaStore.get(storagePathOrId);
    if (item) {
      return item.downloadUrl;
    }
    // Return direct string if already an http or blob URL
    if (storagePathOrId.startsWith('http') || storagePathOrId.startsWith('blob:')) {
      return storagePathOrId;
    }
    return `https://mock-storage.pvg-ops.local/media/${encodeURIComponent(storagePathOrId)}`;
  }

  public async deleteMedia(storagePathOrId: string): Promise<boolean> {
    const item = this.mediaStore.get(storagePathOrId);
    if (!item) {
      return false;
    }

    // Revoke object URL to prevent memory leaks
    if (item.blobUrl && typeof window !== 'undefined' && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(item.blobUrl);
      } catch {
        // Safe fallback
      }
    }

    this.mediaStore.delete(item.id);
    this.mediaStore.delete(item.storagePath);
    return true;
  }

  /**
   * Cleans up all stored object URLs to prevent leaks during tests
   */
  public reset(): void {
    if (typeof window !== 'undefined' && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      this.mediaStore.forEach((item) => {
        if (item.blobUrl) {
          try {
            URL.revokeObjectURL(item.blobUrl);
          } catch {
            // Safe fallback
          }
        }
      });
    }
    this.mediaStore.clear();
  }
}

// Default singleton instance
export const mockMediaRepository = new MockMediaRepository();
