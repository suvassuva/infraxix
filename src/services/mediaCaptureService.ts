// ==============================================================================
// PVG Ops - Media Capture Service
// Camera, Audio, HTMLVideoElement, Canvas, MediaRecorder Service Layer
// Offline-first: zero remote uploads, safe stream lifecycle, HTTPS verification
// ==============================================================================

import { MediaCaptureError, MediaDeviceOptions } from '@/types';

export const MAX_VIDEO_RECORD_SECONDS = 30; // 30 second inspection clip maximum
export const MAX_CAPTURE_FILE_BYTES = 50 * 1024 * 1024; // 50 MB limit
export const AUDIO_DISCLOSURE_NOTICE =
  'Microphone audio is requested solely to record spoken inspection commentary during video capture. Audio is never transmitted to remote servers.';

export class MediaCaptureService {
  /**
   * Probes for supported browser video recording MIME types using MediaRecorder.isTypeSupported().
   * Tests preferred modern codecs (VP9, VP8, MP4) and falls back safely.
   */
  public getOptimalVideoMimeType(): string {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
      return 'video/webm';
    }

    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
    ];

    for (const candidate of candidates) {
      try {
        if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(candidate)) {
          return candidate;
        }
      } catch {
        // Continue checking other candidates
      }
    }

    return '';
  }

  /**
   * Validates browser environment capabilities, checking navigator.mediaDevices and HTTPS secure context.
   */
  public checkMediaSupport(win?: Window): {
    supported: boolean;
    isSecure: boolean;
    error?: MediaCaptureError;
  } {
    const currentWindow = win ?? (typeof window !== 'undefined' ? window : undefined);

    if (!currentWindow) {
      return {
        supported: false,
        isSecure: false,
        error: {
          code: 'UNSUPPORTED',
          message: 'Media capture APIs are unavailable in non-browser environments.',
        },
      };
    }

    // Geolocation and MediaDevices (camera/mic) require HTTPS or localhost in all modern browsers
    if (currentWindow.isSecureContext === false) {
      return {
        supported: true,
        isSecure: false,
        error: {
          code: 'INSECURE_CONTEXT',
          message:
            'Camera and microphone access require a secure context (HTTPS or localhost). This origin is insecure and hardware access is blocked by browser security.',
        },
      };
    }

    if (
      !currentWindow.navigator ||
      !currentWindow.navigator.mediaDevices ||
      typeof currentWindow.navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      return {
        supported: false,
        isSecure: true,
        error: {
          code: 'UNSUPPORTED',
          message: 'The MediaDevices getUserMedia API is not supported by your browser.',
        },
      };
    }

    return {
      supported: true,
      isSecure: true,
    };
  }

  /**
   * Generates safe, responsive media constraints without assuming 4K or rigid parameters.
   * Requests audio ONLY if clearly disclosed and requested.
   */
  public getRecommendedConstraints(options: MediaDeviceOptions = {}): MediaStreamConstraints {
    const { facingMode = 'environment', includeAudio = false } = options;

    return {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
      },
      audio: includeAudio
        ? {
            echoCancellation: true,
            noiseSuppression: true,
          }
        : false,
    };
  }

  /**
   * Maps browser DOMExceptions from getUserMedia or MediaRecorder into typed error objects.
   */
  public mapMediaError(err: unknown): MediaCaptureError {
    if (!err) {
      return {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown media capture error occurred.',
      };
    }

    const errorObj = err as Record<string, unknown>;
    const name = typeof errorObj.name === 'string' ? errorObj.name : '';
    const message = typeof errorObj.message === 'string' ? errorObj.message : '';

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return {
        code: 'PERMISSION_DENIED',
        message:
          'Camera or microphone permission was denied. Please allow permissions in your browser URL bar/settings.',
        details: message || undefined,
      };
    }

    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return {
        code: 'DEVICE_NOT_FOUND',
        message:
          'No camera or microphone device was found on this system. Verify device connection.',
        details: message || undefined,
      };
    }

    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return {
        code: 'DEVICE_IN_USE',
        message:
          'The camera or microphone is already in use by another tab or operating system application.',
        details: message || undefined,
      };
    }

    if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
      return {
        code: 'OVERCONSTRAINED',
        message:
          'The requested video constraints could not be satisfied by your camera hardware.',
        details: message || undefined,
      };
    }

    if (name === 'SecurityError' || message.toLowerCase().includes('secure')) {
      return {
        code: 'INSECURE_CONTEXT',
        message:
          'Camera access requires a secure origin (HTTPS or localhost). Hardware access blocked.',
        details: message || undefined,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: message || 'Failed to access camera or video recording hardware.',
      details: String(err),
    };
  }

  /**
   * Stops every audio and video track on a MediaStream to ensure camera/mic hardware is released.
   */
  public stopMediaStream(stream?: MediaStream | null): void {
    if (!stream) return;

    try {
      const tracks = stream.getTracks();
      for (const track of tracks) {
        track.stop();
      }
    } catch {
      // Ignore errors during stream cleanup
    }
  }

  /**
   * Safely revokes an object URL if it is a blob URI to prevent memory leaks.
   */
  public revokeMediaUrl(url?: string | null): void {
    if (!url || typeof window === 'undefined') return;

    if (url.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore revocation errors
      }
    }
  }

  /**
   * Captures a single image frame from an HTMLVideoElement and converts to Blob via canvas.toBlob().
   */
  public async captureVideoFrameToBlob(
    video: HTMLVideoElement,
    mimeType: string = 'image/jpeg',
    quality: number = 0.92
  ): Promise<{ blob: Blob; width: number; height: number }> {
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not initialize 2D canvas context for frame capture.');
    }

    ctx.drawImage(video, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas failed to render image frame to Blob.'));
            return;
          }
          resolve({ blob, width, height });
        },
        mimeType,
        quality
      );
    });
  }

  /**
   * Formats byte counts into human-readable string (e.g. "3.4 MB", "820 KB").
   */
  public formatFileSize(bytes: number): string {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
    return `${val} ${sizes[i]}`;
  }

  /**
   * Formats seconds into MM:SS string (e.g. 65 -> "01:05").
   */
  public formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}

// Singleton export
export const mediaCaptureService = new MediaCaptureService();
