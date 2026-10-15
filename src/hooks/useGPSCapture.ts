'use client';

// ==============================================================================
// PVG Ops - useGPSCapture Hook
// User-initiated browser GPS capture with review, retry, clear, and validation
// Offline-first: no background tracking, no automatic querying on mount
// ==============================================================================

import { useState, useCallback, useEffect } from 'react';
import {
  CapturedGPSLocation,
  GPSCaptureOptions,
  GPSCaptureStatus,
  GPSError,
  GeolocationPermissionState,
  GPS_VERIFICATION_DISCLAIMER,
} from '@/types';
import { geolocationService } from '@/services/geolocationService';

export interface UseGPSCaptureReturn {
  status: GPSCaptureStatus;
  stagedPosition: CapturedGPSLocation | null;
  confirmedPosition: CapturedGPSLocation | null;
  error: GPSError | null;
  permissionState: GeolocationPermissionState;
  isReviewModalOpen: boolean;
  isSupported: boolean;
  isSecure: boolean;
  disclaimer: string;
  isAcquiring: boolean;

  // Actions
  getCurrentLocation: (options?: GPSCaptureOptions) => Promise<CapturedGPSLocation | null>;
  retry: () => Promise<CapturedGPSLocation | null>;
  clear: () => void;
  confirmLocation: () => void;
  discardStaged: () => void;
  openReview: () => void;
  closeReview: () => void;
}

export function useGPSCapture(initialConfirmed?: CapturedGPSLocation | null): UseGPSCaptureReturn {
  const [status, setStatus] = useState<GPSCaptureStatus>('idle');
  const [stagedPosition, setStagedPosition] = useState<CapturedGPSLocation | null>(null);
  const [confirmedPosition, setConfirmedPosition] = useState<CapturedGPSLocation | null>(
    initialConfirmed ?? null
  );
  const [error, setError] = useState<GPSError | null>(null);
  const [permissionState, setPermissionState] = useState<GeolocationPermissionState>('unknown');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return geolocationService.checkGeolocationSupport().supported;
  });
  const [isSecure] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return geolocationService.checkGeolocationSupport().isSecure;
  });

  // Passive query of permission state if permissions API is available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      geolocationService
        .queryPermissionState()
        .then((perm) => {
          setPermissionState(perm);
        })
        .catch(() => {
          setPermissionState('unknown');
        });
    }
  }, []);

  /**
   * Real user-initiated capture.
   * NEVER called on mount, never runs in the background.
   */
  const getCurrentLocation = useCallback(
    async (options?: GPSCaptureOptions): Promise<CapturedGPSLocation | null> => {
      setStatus('requesting');
      setError(null);

      try {
        const captured = await geolocationService.captureCurrentPosition(options);
        setStagedPosition(captured);
        setStatus('acquired');
        setIsReviewModalOpen(true); // Open review so user can inspect and explicitly confirm
        setPermissionState('granted');
        return captured;
      } catch (err: unknown) {
        const mappedError = geolocationService.mapGeolocationError(err);
        setError(mappedError);
        setStatus('error');
        setStagedPosition(null);

        if (mappedError.code === 'PERMISSION_DENIED') {
          setPermissionState('denied');
        } else if (mappedError.code === 'UNSUPPORTED') {
          setPermissionState('unsupported');
        }

        return null;
      }
    },
    []
  );

  /**
   * Retries GPS acquisition with the same single-shot parameters.
   */
  const retry = useCallback(async (): Promise<CapturedGPSLocation | null> => {
    return getCurrentLocation();
  }, [getCurrentLocation]);

  /**
   * Resets all GPS states, clearing confirmed and staged coordinates.
   */
  const clear = useCallback(() => {
    setStagedPosition(null);
    setConfirmedPosition(null);
    setError(null);
    setStatus('idle');
    setIsReviewModalOpen(false);
  }, []);

  /**
   * Explicit user confirmation:
   * Commits the staged browser fix into the confirmed state attached to the draft record.
   */
  const confirmLocation = useCallback(() => {
    if (stagedPosition) {
      setConfirmedPosition(stagedPosition);
      setIsReviewModalOpen(false);
    }
  }, [stagedPosition]);

  /**
   * Discards the currently staged fix without affecting an existing confirmed position.
   */
  const discardStaged = useCallback(() => {
    setStagedPosition(null);
    setIsReviewModalOpen(false);
    if (!confirmedPosition) {
      setStatus('idle');
    } else {
      setStatus('acquired');
    }
  }, [confirmedPosition]);

  const openReview = useCallback(() => {
    setIsReviewModalOpen(true);
  }, []);

  const closeReview = useCallback(() => {
    setIsReviewModalOpen(false);
  }, []);

  return {
    status,
    stagedPosition,
    confirmedPosition,
    error,
    permissionState,
    isReviewModalOpen,
    isSupported,
    isSecure,
    disclaimer: GPS_VERIFICATION_DISCLAIMER,
    isAcquiring: status === 'requesting',
    getCurrentLocation,
    retry,
    clear,
    confirmLocation,
    discardStaged,
    openReview,
    closeReview,
  };
}
