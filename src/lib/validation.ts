import { AppError, CaptureLocation, CreateRecordDTO, MediaAsset } from '@/types';

export const MAX_MEDIA_ASSETS_PER_RECORD = 10;
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 Megabytes
export const MIN_TITLE_LENGTH = 3;
export const MAX_TITLE_LENGTH = 120;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
];

/**
 * Validates geographical coordinates according to international WGS84 bounds.
 */
export function validateCoordinates(location?: CaptureLocation): {
  valid: boolean;
  error?: AppError;
} {
  if (!location) {
    return { valid: true }; // Location is optional
  }

  const { latitude, longitude, accuracyMeters } = location;

  if (typeof latitude !== 'number' || Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    return {
      valid: false,
      error: {
        code: 'INVALID_COORDINATES',
        message: `Latitude must be a valid number between -90 and 90 degrees. Received: ${latitude}`,
        field: 'latitude',
      },
    };
  }

  if (typeof longitude !== 'number' || Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    return {
      valid: false,
      error: {
        code: 'INVALID_COORDINATES',
        message: `Longitude must be a valid number between -180 and 180 degrees. Received: ${longitude}`,
        field: 'longitude',
      },
    };
  }

  if (typeof accuracyMeters !== 'number' || Number.isNaN(accuracyMeters) || accuracyMeters < 0) {
    return {
      valid: false,
      error: {
        code: 'INVALID_COORDINATES',
        message: `Accuracy radius must be a positive number of meters. Received: ${accuracyMeters}`,
        field: 'accuracyMeters',
      },
    };
  }

  return { valid: true };
}

/**
 * Validates record title length and content.
 */
export function validateTitle(title: string): {
  valid: boolean;
  error?: AppError;
} {
  const trimmed = (title || '').trim();

  if (!trimmed || trimmed.length < MIN_TITLE_LENGTH) {
    return {
      valid: false,
      error: {
        code: 'INVALID_TITLE',
        message: `Title must be at least ${MIN_TITLE_LENGTH} characters long.`,
        field: 'title',
      },
    };
  }

  if (trimmed.length > MAX_TITLE_LENGTH) {
    return {
      valid: false,
      error: {
        code: 'INVALID_TITLE',
        message: `Title exceeds maximum allowed length of ${MAX_TITLE_LENGTH} characters (current length: ${trimmed.length}).`,
        field: 'title',
      },
    };
  }

  return { valid: true };
}

/**
 * Validates mock file limits including size and MIME type.
 */
export function validateMediaAsset(asset: MediaAsset): {
  valid: boolean;
  error?: AppError;
} {
  if (asset.fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: {
        code: 'FILE_LIMIT_EXCEEDED',
        message: `File "${asset.fileName}" exceeds the maximum limit of 50 MB (size: ${(asset.fileSize / (1024 * 1024)).toFixed(2)} MB).`,
        field: 'mediaReferences',
      },
    };
  }

  if (asset.mimeType) {
    const baseMime = asset.mimeType.split(';')[0].trim().toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(baseMime)) {
      return {
        valid: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `File "${asset.fileName}" has unsupported MIME type "${asset.mimeType}". Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
          field: 'mimeType',
        },
      };
    }
  }

  return { valid: true };
}

/**
 * Validates an entire record creation payload.
 */
export function validateCreateRecord(data: CreateRecordDTO): {
  valid: boolean;
  errors: AppError[];
} {
  const errors: AppError[] = [];

  // Title validation
  const titleResult = validateTitle(data.title);
  if (!titleResult.valid && titleResult.error) {
    errors.push(titleResult.error);
  }

  // Location validation (if present)
  if (data.location) {
    const locResult = validateCoordinates(data.location);
    if (!locResult.valid && locResult.error) {
      errors.push(locResult.error);
    }
  }

  // Media assets count and individual validation
  if (data.mediaReferences) {
    if (data.mediaReferences.length > MAX_MEDIA_ASSETS_PER_RECORD) {
      errors.push({
        code: 'FILE_LIMIT_EXCEEDED',
        message: `Record contains ${data.mediaReferences.length} media assets. Maximum allowed is ${MAX_MEDIA_ASSETS_PER_RECORD}.`,
        field: 'mediaReferences',
      });
    }

    for (const asset of data.mediaReferences) {
      const assetResult = validateMediaAsset(asset);
      if (!assetResult.valid && assetResult.error) {
        errors.push(assetResult.error);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
