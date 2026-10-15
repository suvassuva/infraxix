// ==============================================================================
// PVG Ops - Media Capture Types & Browser Device Telemetry
// Camera, Audio, HTMLVideoElement, Canvas, MediaRecorder Domain
// Offline-first: mocked persistence and client-only stream lifecycle
// ==============================================================================

export type MediaCaptureMode = 'photo' | 'video';

export type MediaCaptureStatus =
  | 'idle'
  | 'requesting'
  | 'previewing'
  | 'recording'
  | 'reviewing'
  | 'error';

export type MediaErrorCode =
  | 'UNSUPPORTED'
  | 'INSECURE_CONTEXT'
  | 'PERMISSION_DENIED'
  | 'DEVICE_NOT_FOUND'
  | 'DEVICE_IN_USE'
  | 'OVERCONSTRAINED'
  | 'RECORDING_FAILED'
  | 'FILE_LIMIT_EXCEEDED'
  | 'UNKNOWN_ERROR';

export interface MediaCaptureError {
  code: MediaErrorCode;
  message: string;
  details?: string;
}

export interface CapturedMediaItem {
  id: string;
  type: 'photo' | 'video';
  mimeType: string;
  blob: Blob;
  objectUrl: string;
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  durationFormatted?: string;
  hasAudio: boolean;
  capturedAt: string;
  resolution?: string;
}

export interface MediaDeviceOptions {
  facingMode?: 'environment' | 'user';
  includeAudio?: boolean;
  maxDurationSeconds?: number;
  maxSizeBytes?: number;
}
