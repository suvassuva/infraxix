// ==============================================================================
// PVG Ops - Optional FirebaseStorageMediaRepository Implementation
// Compiles cleanly with Firebase Storage SDK typings without requiring credentials.
// Makes NO network calls unless explicitly configured and invoked.
// ==============================================================================

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadMetadata,
} from 'firebase/storage';
import {
  IMediaRepository,
  MediaUploadOptions,
  MediaUploadResult,
  MediaValidationResult,
} from '../IMediaRepository';
import { getFirebaseStorage, isFirebaseConfigured } from './firebaseConfig';
import {
  DEFAULT_MAX_MEDIA_BYTES,
  ALLOWED_MEDIA_TYPES,
} from '../MockMediaRepository';

export class FirebaseStorageMediaRepository implements IMediaRepository {
  private assertInitialized() {
    const storage = getFirebaseStorage();
    if (!storage || !isFirebaseConfigured()) {
      throw new Error(
        '[FirebaseStorageMediaRepository] Firebase Storage is not configured. ' +
        'Set NEXT_PUBLIC_DATA_SOURCE=firebase and provide valid NEXT_PUBLIC_FIREBASE_* credentials in .env.local.'
      );
    }
    return storage;
  }

  public validateMedia(
    file: File | Blob,
    options?: { maxSizeBytes?: number; allowedTypes?: string[] }
  ): MediaValidationResult {
    const limit = options?.maxSizeBytes ?? DEFAULT_MAX_MEDIA_BYTES;
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
    const storage = this.assertInitialized();
    const { file, filename, metadata, onProgress } = options;

    const validation = this.validateMedia(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Media validation failed.');
    }

    const id = `fb-media-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const extension = file.type.includes('video') ? 'webm' : 'jpg';
    const safeName = filename || `${id}.${extension}`;
    const storagePath = `media/${metadata?.recordId || 'general'}/${safeName}`;

    const storageRef = ref(storage, storagePath);

    const uploadMetadata: UploadMetadata = {
      contentType: file.type || 'application/octet-stream',
      customMetadata: {
        recordId: metadata?.recordId || 'unassigned',
        mediaType: metadata?.mediaType || 'photo',
        ...(metadata?.customMetadata || {}),
      },
    };

    let isSettled = false;
    let isCancelled = false;

    const uploadTask = uploadBytesResumable(storageRef, file, uploadMetadata);

    const uploadPromise = new Promise<MediaUploadResult>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress && snapshot.totalBytes > 0) {
            const percentage = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            onProgress({
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage,
            });
          }
        },
        (error) => {
          if (isSettled) return;
          isSettled = true;
          const isCancelErr =
            isCancelled ||
            (typeof error === 'object' &&
              error !== null &&
              'code' in error &&
              (error as { code: string }).code === 'storage/canceled');

          if (isCancelErr) {
            reject(new Error('Firebase Storage upload canceled/timed out. Falling back to local evidence storage.'));
          } else {
            reject(error);
          }
        },
        async () => {
          if (isSettled) return;
          isSettled = true;
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              id,
              storagePath,
              downloadUrl,
              sizeBytes: file.size,
              mimeType: file.type || 'application/octet-stream',
              createdAt: new Date().toISOString(),
              isMock: false,
            });
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });

    // Suppress unhandled promise rejection in runtime when uploadTask is cancelled
    uploadPromise.catch(() => {});

    // Enforce 4-second safety timeout on cloud storage upload to prevent freezing
    const timeoutPromise = new Promise<MediaUploadResult>((_, reject) => {
      const timer = setTimeout(() => {
        if (!isSettled) {
          isCancelled = true;
          isSettled = true;
          try {
            uploadTask.cancel();
          } catch {
            // ignore cancel error
          }
          reject(new Error('Firebase Storage upload timed out after 4 seconds.'));
        }
      }, 4000);

      uploadPromise.finally(() => clearTimeout(timer));
    });

    return Promise.race([uploadPromise, timeoutPromise]);
  }

  public async getMediaUrl(storagePathOrId: string): Promise<string> {
    const storage = this.assertInitialized();
    if (storagePathOrId.startsWith('http')) {
      return storagePathOrId;
    }
    const storageRef = ref(storage, storagePathOrId);
    return getDownloadURL(storageRef);
  }

  public async deleteMedia(storagePathOrId: string): Promise<boolean> {
    const storage = this.assertInitialized();
    try {
      const storageRef = ref(storage, storagePathOrId);
      await deleteObject(storageRef);
      return true;
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: unknown }).code === 'storage/object-not-found'
      ) {
        return false;
      }
      throw err;
    }
  }
}
