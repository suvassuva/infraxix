// ==============================================================================
// PVG Ops - IMediaRepository Interface Contract
// Storage and media persistence contract supporting Mock and Firebase Storage
// ==============================================================================

export interface MediaUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface MediaUploadOptions {
  file: File | Blob;
  filename?: string;
  path?: string;
  metadata?: {
    recordId?: string;
    mediaType: 'photo' | 'video';
    mimeType?: string;
    customMetadata?: Record<string, string>;
  };
  onProgress?: (progress: MediaUploadProgress) => void;
}

export interface MediaUploadResult {
  id: string;
  storagePath: string;
  downloadUrl: string;
  sizeBytes: number;
  mimeType: string;
  checksumSha256?: string;
  createdAt: string;
  isMock: boolean;
}

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
}

export interface IMediaRepository {
  /**
   * Uploads a media asset (photo/video) with optional progress reporting.
   */
  uploadMedia(options: MediaUploadOptions): Promise<MediaUploadResult>;

  /**
   * Retrieves a resolvable download/playback URL for an uploaded media asset.
   */
  getMediaUrl(storagePathOrId: string): Promise<string>;

  /**
   * Deletes a media asset from storage by its ID or storage path.
   */
  deleteMedia(storagePathOrId: string): Promise<boolean>;

  /**
   * Pre-upload validation for file size, MIME type and format constraints.
   */
  validateMedia(
    file: File | Blob,
    options?: { maxSizeBytes?: number; allowedTypes?: string[] }
  ): MediaValidationResult;
}
