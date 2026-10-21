// ==============================================================================
// PVG Ops - GPS Geolocation Types & Verification Disclaimer
// Browser Geolocation API Domain Definitions
// ==============================================================================

export type GeolocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported' | 'unknown';

export type GPSCaptureStatus = 'idle' | 'requesting' | 'acquired' | 'error';

export type GPSErrorCode =
  | 'UNSUPPORTED'
  | 'INSECURE_CONTEXT'
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INVALID_COORDINATES'
  | 'UNKNOWN_ERROR';

export interface GPSError {
  code: GPSErrorCode;
  message: string;
  details?: string;
}

export const GPS_VERIFICATION_DISCLAIMER =
  'Browser-reported client telemetry. Coordinates are derived directly from device/browser geolocation and are not independently or cryptographically verified.';

export interface CapturedGPSLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitudeMeters?: number | null;
  altitudeAccuracyMeters?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  capturedAt: string;
  isIndependentlyVerified: false;
  verificationDisclaimer: string;
  elevationMeters?: number;
  address?: string;
}

export interface GPSCaptureOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface OfficerDutyLocation {
  officerUid: string;
  officerName: string;
  officerEmail: string;
  isLive: boolean;
  status: 'on_duty' | 'off_duty';
  dutyDate: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitudeMeters?: number | null;
  speed?: number | null;
  heading?: number | null;
  locationLink: string;
  startedAt: string;
  updatedAt: string;
}
