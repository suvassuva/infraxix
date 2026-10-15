'use client';

// ==============================================================================
// PVG Ops - useMediaUpload Hook
// Typed hook utilizing IMediaRepository contract for photo and video asset upload
// ==============================================================================

import { useState, useCallback } from 'react';
import {
  mediaRepository,
  MediaUploadResult,
  MediaUploadProgress,
  isMockMode,
} from '@/repositories';

export interface UseMediaUploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

export interface UseMediaUploadReturn {
  upload: (
    file: File | Blob,
    options?: {
      filename?: string;
      recordId?: string;
      mediaType?: 'photo' | 'video';
      customMetadata?: Record<string, string>;
    }
  ) => Promise<MediaUploadResult>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: MediaUploadResult | null;
  reset: () => void;
  isMock: boolean;
}

export function useMediaUpload(config?: UseMediaUploadOptions): UseMediaUploadReturn {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MediaUploadResult | null>(null);

  const maxSizeBytes = config?.maxSizeBytes;
  const allowedTypes = config?.allowedTypes;

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  const upload = useCallback(
    async (
      file: File | Blob,
      options?: {
        filename?: string;
        recordId?: string;
        mediaType?: 'photo' | 'video';
        customMetadata?: Record<string, string>;
      }
    ): Promise<MediaUploadResult> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Validate first
        const validation = mediaRepository.validateMedia(file, {
          maxSizeBytes,
          allowedTypes,
        });

        if (!validation.valid) {
          throw new Error(validation.error || 'Media file failed validation.');
        }

        const uploadResult = await mediaRepository.uploadMedia({
          file,
          filename: options?.filename,
          metadata: {
            recordId: options?.recordId,
            mediaType: options?.mediaType || (file.type.includes('video') ? 'video' : 'photo'),
            mimeType: file.type,
            customMetadata: options?.customMetadata,
          },
          onProgress: (p: MediaUploadProgress) => {
            setProgress(p.percentage);
          },
        });

        setResult(uploadResult);
        setProgress(100);
        return uploadResult;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed.';
        setError(msg);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [maxSizeBytes, allowedTypes]
  );

  return {
    upload,
    isUploading,
    progress,
    error,
    result,
    reset,
    isMock: isMockMode,
  };
}
