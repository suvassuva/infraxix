// ==============================================================================
// PVG Ops - Geolocation Service
// Real browser Geolocation API interaction with validation and error handling
// Offline-first: no remote backend or Firebase telemetry connection
// ==============================================================================

import {
  CapturedGPSLocation,
  GPSCaptureOptions,
  GPSError,
  GPS_VERIFICATION_DISCLAIMER,
} from '@/types';

export class GeolocationService {
  /**
   * Validates geographical coordinates against WGS84 bounds.
   * Latitude must be -90..90 degrees.
   * Longitude must be -180..180 degrees.
   * Accuracy must be >= 0 meters.
   */
  public validateGPSCoordinates(
    latitude: number,
    longitude: number,
    accuracyMeters: number
  ): { valid: boolean; error?: GPSError } {
    if (
      typeof latitude !== 'number' ||
      Number.isNaN(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      return {
        valid: false,
        error: {
          code: 'INVALID_COORDINATES',
          message: `Latitude must be a valid number between -90 and 90 degrees. Received: ${latitude}`,
        },
      };
    }

    if (
      typeof longitude !== 'number' ||
      Number.isNaN(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return {
        valid: false,
        error: {
          code: 'INVALID_COORDINATES',
          message: `Longitude must be a valid number between -180 and 180 degrees. Received: ${longitude}`,
        },
      };
    }

    if (
      typeof accuracyMeters !== 'number' ||
      Number.isNaN(accuracyMeters) ||
      accuracyMeters < 0
    ) {
      return {
        valid: false,
        error: {
          code: 'INVALID_COORDINATES',
          message: `Browser-reported accuracy must be a positive number of meters. Received: ${accuracyMeters}`,
        },
      };
    }

    return { valid: true };
  }

  /**
   * Checks whether the browser environment supports the Geolocation API
   * and satisfies the secure context requirement (HTTPS or localhost).
   */
  public checkGeolocationSupport(win?: Window): {
    supported: boolean;
    isSecure: boolean;
    error?: GPSError;
  } {
    const currentWindow = win ?? (typeof window !== 'undefined' ? window : undefined);

    if (!currentWindow) {
      return {
        supported: false,
        isSecure: false,
        error: {
          code: 'UNSUPPORTED',
          message: 'The Geolocation API is unavailable in non-browser environments.',
        },
      };
    }

    // Geolocation requires a secure context in all modern browsers (HTTPS or localhost)
    if (currentWindow.isSecureContext === false) {
      return {
        supported: true,
        isSecure: false,
        error: {
          code: 'INSECURE_CONTEXT',
          message:
            'Geolocation requires a secure context (HTTPS or localhost). The current connection is insecure and cannot capture GPS.',
        },
      };
    }

    if (
      !currentWindow.navigator ||
      !('geolocation' in currentWindow.navigator) ||
      !currentWindow.navigator.geolocation
    ) {
      return {
        supported: false,
        isSecure: true,
        error: {
          code: 'UNSUPPORTED',
          message: 'The Geolocation API is not supported by this browser or device.',
        },
      };
    }

    return {
      supported: true,
      isSecure: true,
    };
  }

  /**
   * Maps browser-specific GeolocationPositionError or exceptions
   * into typed, user-friendly GPSError objects.
   */
  public mapGeolocationError(err: unknown): GPSError {
    if (!err) {
      return {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown geolocation error occurred.',
      };
    }

    if (typeof err === 'object' && err !== null && 'code' in err && typeof (err as { code: unknown }).code === 'string') {
      // Already a GPSError
      const maybeGpsErr = err as GPSError;
      if (
        [
          'UNSUPPORTED',
          'INSECURE_CONTEXT',
          'PERMISSION_DENIED',
          'POSITION_UNAVAILABLE',
          'TIMEOUT',
          'INVALID_COORDINATES',
          'UNKNOWN_ERROR',
        ].includes(maybeGpsErr.code)
      ) {
        return maybeGpsErr;
      }
    }

    // Standard GeolocationPositionError codes:
    // 1: PERMISSION_DENIED
    // 2: POSITION_UNAVAILABLE
    // 3: TIMEOUT
    const errObj = err as Record<string, unknown>;
    const code = errObj.code;
    const message = typeof errObj.message === 'string' ? errObj.message : '';

    if (code === 1 || code === 'PERMISSION_DENIED') {
      return {
        code: 'PERMISSION_DENIED',
        message:
          'Location access was denied. Please allow location permissions in your browser address bar/settings to capture GPS.',
        details: message || undefined,
      };
    }

    if (code === 2 || code === 'POSITION_UNAVAILABLE') {
      return {
        code: 'POSITION_UNAVAILABLE',
        message:
          'Location information is unavailable. Ensure your device GPS, WiFi, or cellular location services are enabled.',
        details: message || undefined,
      };
    }

    if (code === 3 || code === 'TIMEOUT') {
      return {
        code: 'TIMEOUT',
        message:
          'The request to obtain your current location timed out. Please check your signal and click Retry.',
        details: message || undefined,
      };
    }

    if (
      message.toLowerCase().includes('insecure') ||
      message.toLowerCase().includes('secure context') ||
      message.toLowerCase().includes('secure origin')
    ) {
      return {
        code: 'INSECURE_CONTEXT',
        message:
          'Geolocation requires a secure context (HTTPS or localhost). Connection is insecure.',
        details: message,
      };
    }

    if (message.toLowerCase().includes('not supported') || message.toLowerCase().includes('unsupported')) {
      return {
        code: 'UNSUPPORTED',
        message: 'The Geolocation API is not supported by this browser.',
        details: message,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: message || 'Failed to capture GPS coordinates from the browser.',
      details: String(err),
    };
  }

  /**
   * Queries real user-initiated GPS coordinates once via `navigator.geolocation.getCurrentPosition`.
   * GUARANTEES:
   * - Does NOT track in the background (no watchPosition or intervals).
   * - Sets isIndependentlyVerified to false with explicit disclaimer.
   * - Validates latitude -90..90 and longitude -180..180.
   */
  public async captureCurrentPosition(
    options: GPSCaptureOptions = {},
    win?: Window
  ): Promise<CapturedGPSLocation> {
    const currentWindow = win ?? (typeof window !== 'undefined' ? window : undefined);

    const supportCheck = this.checkGeolocationSupport(currentWindow);
    if (!supportCheck.supported || !supportCheck.isSecure) {
      throw supportCheck.error || {
        code: 'UNSUPPORTED',
        message: 'Geolocation cannot be accessed.',
      };
    }

    const geolocation = currentWindow!.navigator.geolocation;

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 15000,
      maximumAge: options.maximumAge ?? 0,
    };

    return new Promise<CapturedGPSLocation>((resolve, reject) => {
      geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const { coords, timestamp } = position;
          const lat = coords.latitude;
          const lng = coords.longitude;
          const accuracy = coords.accuracy;

          // Strict coordinate range validation
          const validation = this.validateGPSCoordinates(lat, lng, accuracy);
          if (!validation.valid && validation.error) {
            reject(validation.error);
            return;
          }

          const resolvedTimestamp = timestamp || Date.now();
          const capturedAtIso = new Date(resolvedTimestamp).toISOString();

          const result: CapturedGPSLocation = {
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lng.toFixed(6)),
            accuracyMeters: Number(accuracy.toFixed(1)),
            altitudeMeters: coords.altitude != null ? Number(coords.altitude.toFixed(1)) : null,
            altitudeAccuracyMeters:
              coords.altitudeAccuracy != null ? Number(coords.altitudeAccuracy.toFixed(1)) : null,
            heading: coords.heading != null ? Number(coords.heading.toFixed(1)) : null,
            speed: coords.speed != null ? Number(coords.speed.toFixed(2)) : null,
            timestamp: resolvedTimestamp,
            capturedAt: capturedAtIso,
            isIndependentlyVerified: false,
            verificationDisclaimer: GPS_VERIFICATION_DISCLAIMER,
            elevationMeters: coords.altitude != null ? Math.round(coords.altitude) : undefined,
            address: `Browser Geolocation Fix (±${Math.round(accuracy)}m)`,
          };

          resolve(result);
        },
        (error: GeolocationPositionError) => {
          const mapped = this.mapGeolocationError(error);
          reject(mapped);
        },
        geoOptions
      );
    });
  }

  /**
   * Queries permission status if supported by navigator.permissions.
   * Safe to call without prompting the user.
   */
  public async queryPermissionState(
    win?: Window
  ): Promise<'prompt' | 'granted' | 'denied' | 'unsupported'> {
    const currentWindow = win ?? (typeof window !== 'undefined' ? window : undefined);
    if (!currentWindow?.navigator?.permissions?.query) {
      return 'unsupported';
    }

    try {
      const status = await currentWindow.navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });
      return status.state;
    } catch {
      return 'unsupported';
    }
  }
}

// Export singleton instance
export const geolocationService = new GeolocationService();
