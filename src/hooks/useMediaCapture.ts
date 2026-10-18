'use client';

// ==============================================================================
// PVG Ops - useMediaCapture Hook
// User-controlled camera & video capture with live preview, MediaRecorder,
// canvas.toBlob, duration/size limits, safe track cleanup, and object URL revocation
// ==============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  MediaCaptureMode,
  MediaCaptureStatus,
  MediaCaptureError,
  CapturedMediaItem,
  AttachmentItem,
} from '@/types';
import {
  mediaCaptureService,
  MAX_VIDEO_RECORD_SECONDS,
  MAX_CAPTURE_FILE_BYTES,
  AUDIO_DISCLOSURE_NOTICE,
} from '@/services/mediaCaptureService';

export interface UseMediaCaptureReturn {
  // State
  status: MediaCaptureStatus;
  mode: MediaCaptureMode;
  facingMode: 'environment' | 'user';
  includeAudio: boolean;
  audioDisclosure: string;
  isRecording: boolean;
  recordingSeconds: number;
  maxRecordingSeconds: number;
  error: MediaCaptureError | null;
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stagedMedia: CapturedMediaItem | null;
  confirmedMedia: AttachmentItem | null;
  isSupported: boolean;
  isSecure: boolean;

  // Actions
  openCamera: (initialMode?: MediaCaptureMode) => Promise<boolean>;
  closeCamera: () => void;
  switchMode: (newMode: MediaCaptureMode) => Promise<void>;
  toggleFacingMode: () => Promise<void>;
  setIncludeAudio: (include: boolean) => Promise<void>;
  takePhoto: () => Promise<CapturedMediaItem | null>;
  startRecording: () => void;
  stopRecording: () => void;
  confirmMedia: () => AttachmentItem | null;
  discardStagedMedia: () => void;
  removeConfirmedMedia: () => void;
  stageFileMedia: (file: File) => void;
  attachDirectFile: (file: File) => AttachmentItem;
}

export function useMediaCapture(initialAttachment?: AttachmentItem | null): UseMediaCaptureReturn {
  const [status, setStatus] = useState<MediaCaptureStatus>('idle');
  const [mode, setMode] = useState<MediaCaptureMode>('photo');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [includeAudio, setIncludeAudioState] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [error, setError] = useState<MediaCaptureError | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [stagedMedia, setStagedMedia] = useState<CapturedMediaItem | null>(null);
  const [confirmedMedia, setConfirmedMedia] = useState<AttachmentItem | null>(
    initialAttachment ?? null
  );

  const [isSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return mediaCaptureService.checkMediaSupport().supported;
  });

  const [isSecure] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return mediaCaptureService.checkMediaSupport().isSecure;
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // Helper to register and track object URLs for cleanup
  const registerObjectUrl = useCallback((url: string) => {
    objectUrlsRef.current.add(url);
    return url;
  }, []);

  // Helper to safely revoke object URL
  const revokeRegisteredUrl = useCallback((url?: string | null) => {
    if (url && objectUrlsRef.current.has(url)) {
      mediaCaptureService.revokeMediaUrl(url);
      objectUrlsRef.current.delete(url);
    }
  }, []);

  /**
   * Internal stream initializer: requests hardware permissions ONLY on explicit user invocation.
   */
  const startStream = useCallback(
    async (
      targetMode: MediaCaptureMode,
      targetFacing: 'environment' | 'user',
      targetAudio: boolean
    ): Promise<boolean> => {
      // Clean up any existing stream before starting a new one
      if (streamRef.current) {
        mediaCaptureService.stopMediaStream(streamRef.current);
        streamRef.current = null;
        setStream(null);
      }

      const support = mediaCaptureService.checkMediaSupport();
      if (!support.supported || !support.isSecure) {
        const err = support.error || {
          code: 'UNSUPPORTED',
          message: 'Media capture is not supported or origin is insecure.',
        };
        setError(err);
        setStatus('error');
        return false;
      }

      setStatus('requesting');
      setError(null);

      try {
        const constraints = mediaCaptureService.getRecommendedConstraints({
          facingMode: targetFacing,
          // Disclose & request audio ONLY when in video mode AND user opted into microphone
          includeAudio: targetMode === 'video' && targetAudio,
        });

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = newStream;
        setStream(newStream);
        setStatus('previewing');

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.play().catch(() => {
            // Ignore autoplay catch
          });
        }

        return true;
      } catch (err: unknown) {
        const mapped = mediaCaptureService.mapMediaError(err);
        setError(mapped);
        setStatus('error');
        return false;
      }
    },
    []
  );

  /**
   * User-initiated camera opening.
   */
  const openCamera = useCallback(
    async (initialMode: MediaCaptureMode = 'photo'): Promise<boolean> => {
      setMode(initialMode);
      return startStream(initialMode, facingMode, includeAudio);
    },
    [facingMode, includeAudio, startStream]
  );

  /**
   * Stops all media tracks and closes live viewfinder.
   */
  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      mediaCaptureService.stopMediaStream(streamRef.current);
      streamRef.current = null;
      setStream(null);
    }

    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setIsRecording(false);
    setRecordingSeconds(0);
    setStatus('idle');
  }, []);

  /**
   * Switches capture mode between photo still and video recording.
   */
  const switchMode = useCallback(
    async (newMode: MediaCaptureMode) => {
      if (mode === newMode) return;
      setMode(newMode);
      if (status === 'previewing' || status === 'requesting') {
        await startStream(newMode, facingMode, includeAudio);
      }
    },
    [facingMode, includeAudio, mode, startStream, status]
  );

  /**
   * Toggles facing camera lens (environment / back vs user / front).
   */
  const toggleFacingMode = useCallback(async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (status === 'previewing' || status === 'requesting') {
      await startStream(mode, nextFacing, includeAudio);
    }
  }, [facingMode, includeAudio, mode, startStream, status]);

  /**
   * Toggles microphone audio inclusion (with disclosure notice).
   */
  const setIncludeAudio = useCallback(
    async (include: boolean) => {
      setIncludeAudioState(include);
      if (mode === 'video' && (status === 'previewing' || status === 'requesting')) {
        await startStream(mode, facingMode, include);
      }
    },
    [facingMode, mode, startStream, status]
  );

  /**
   * Captures a still photo from the live video element using canvas.toBlob().
   */
  const takePhoto = useCallback(async (): Promise<CapturedMediaItem | null> => {
    if (!videoRef.current || status !== 'previewing') {
      return null;
    }

    try {
      const { blob, width, height } = await mediaCaptureService.captureVideoFrameToBlob(
        videoRef.current,
        'image/jpeg',
        0.92
      );

      const objectUrl = registerObjectUrl(URL.createObjectURL(blob));
      const fileSizeBytes = blob.size;
      const fileSizeFormatted = mediaCaptureService.formatFileSize(fileSizeBytes);
      const timestamp = new Date().toISOString();
      const id = `photo-${Date.now()}`;

      const item: CapturedMediaItem = {
        id,
        type: 'photo',
        mimeType: 'image/jpeg',
        blob,
        objectUrl,
        fileName: `field_photo_${Date.now()}.jpg`,
        fileSizeBytes,
        fileSizeFormatted,
        width,
        height,
        hasAudio: false,
        capturedAt: timestamp,
        resolution: `${width} x ${height}`,
      };

      setStagedMedia(item);
      setStatus('reviewing');

      // Stop viewfinder stream while inspecting captured still
      if (streamRef.current) {
        mediaCaptureService.stopMediaStream(streamRef.current);
        streamRef.current = null;
        setStream(null);
      }

      return item;
    } catch (err: unknown) {
      const mapped = mediaCaptureService.mapMediaError(err);
      setError(mapped);
      setStatus('error');
      return null;
    }
  }, [registerObjectUrl, status]);

  /**
   * Stops video recording and processes recorded chunks into video Blob.
   */
  const stopRecording = useCallback(() => {
    if (!recorderRef.current || recorderRef.current.state === 'inactive') {
      return;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    try {
      recorderRef.current.stop();
    } catch {
      // ignore
    }

    setIsRecording(false);
  }, []);

  /**
   * Starts video recording using MediaRecorder and probed supported MIME type.
   */
  const startRecording = useCallback(() => {
    if (!streamRef.current || status !== 'previewing') {
      return;
    }

    recordedChunksRef.current = [];
    setRecordingSeconds(0);
    setError(null);

    const optimalMime = mediaCaptureService.getOptimalVideoMimeType();
    const options: MediaRecorderOptions = optimalMime ? { mimeType: optimalMime } : {};

    try {
      const recorder = new MediaRecorder(streamRef.current, options);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = optimalMime || 'video/webm';
        const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });

        if (videoBlob.size > MAX_CAPTURE_FILE_BYTES) {
          setError({
            code: 'FILE_LIMIT_EXCEEDED',
            message: `Recorded video size exceeds limit of 50 MB (${mediaCaptureService.formatFileSize(videoBlob.size)}).`,
          });
          setStatus('error');
          return;
        }

        const objectUrl = registerObjectUrl(URL.createObjectURL(videoBlob));
        const fileSizeBytes = videoBlob.size;
        const duration = recordingSeconds || 1;
        const timestamp = new Date().toISOString();
        const id = `video-${Date.now()}`;

        const item: CapturedMediaItem = {
          id,
          type: 'video',
          mimeType,
          blob: videoBlob,
          objectUrl,
          fileName: `field_diagnostics_${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`,
          fileSizeBytes,
          fileSizeFormatted: mediaCaptureService.formatFileSize(fileSizeBytes),
          durationSeconds: duration,
          durationFormatted: mediaCaptureService.formatDuration(duration),
          hasAudio: includeAudio,
          capturedAt: timestamp,
          resolution: '1280 x 720 (Auto-Scale)',
        };

        setStagedMedia(item);
        setStatus('reviewing');

        // Stop camera stream while reviewing video
        if (streamRef.current) {
          mediaCaptureService.stopMediaStream(streamRef.current);
          streamRef.current = null;
          setStream(null);
        }
      };

      recorder.start(1000); // 1-second timeslices
      setIsRecording(true);
      setStatus('recording');

      // Setup countdown / elapsed duration timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_VIDEO_RECORD_SECONDS) {
            stopRecording();
            return MAX_VIDEO_RECORD_SECONDS;
          }
          return next;
        });
      }, 1000);
    } catch (err: unknown) {
      const mapped = mediaCaptureService.mapMediaError(err);
      setError(mapped);
      setStatus('error');
    }
  }, [includeAudio, recordingSeconds, registerObjectUrl, status, stopRecording]);

  /**
   * Explicit user confirmation: commits staged captured photo/video to the inspection draft.
   */
  const confirmMedia = useCallback((): AttachmentItem | null => {
    if (!stagedMedia) return null;

    const attachment: AttachmentItem = {
      id: stagedMedia.id,
      name: stagedMedia.fileName,
      size: stagedMedia.fileSizeFormatted,
      type: stagedMedia.mimeType,
      mediaType: stagedMedia.type === 'video' ? 'video' : 'image',
      uri: stagedMedia.objectUrl,
      description: `Field ${stagedMedia.type} evidence captured via device hardware. ${
        stagedMedia.hasAudio ? 'Includes inspection audio commentary.' : 'Visual telemetry only.'
      }`,
      resolution: stagedMedia.resolution || '1280 x 720',
      duration: stagedMedia.durationFormatted,
      previewColor:
        stagedMedia.type === 'video'
          ? 'from-slate-900 to-slate-950'
          : 'from-blue-700 to-indigo-950',
      exif: {
        camera: `Device Hardware Sensor (${facingMode === 'environment' ? 'Rear Lens' : 'Front Lens'})`,
        shutter: 'Auto-Exposure',
        iso: 'ISO-Auto',
        focal: facingMode === 'environment' ? 'Wide Angle' : 'Standard',
      },
      rawBlob: stagedMedia.blob,
    };

    setConfirmedMedia(attachment);
    setStagedMedia(null);
    setStatus('idle');
    return attachment;
  }, [facingMode, stagedMedia]);

  /**
   * Discards staged media and revokes object URL without affecting any previously confirmed media.
   */
  const discardStagedMedia = useCallback(() => {
    if (stagedMedia) {
      revokeRegisteredUrl(stagedMedia.objectUrl);
      setStagedMedia(null);
    }
    setStatus('idle');
  }, [revokeRegisteredUrl, stagedMedia]);

  /**
   * Removes confirmed media and revokes its object URL.
   */
  const removeConfirmedMedia = useCallback(() => {
    if (confirmedMedia?.uri) {
      revokeRegisteredUrl(confirmedMedia.uri);
    }
    setConfirmedMedia(null);
  }, [confirmedMedia, revokeRegisteredUrl]);

  /**
   * Stages an uploaded photo or video file directly from the user's device.
   */
  const stageFileMedia = useCallback(
    (file: File) => {
      const isVideo = file.type.startsWith('video');
      const objectUrl = registerObjectUrl(URL.createObjectURL(file));
      const item: CapturedMediaItem = {
        id: `${isVideo ? 'video' : 'photo'}-${Date.now()}`,
        type: isVideo ? 'video' : 'photo',
        mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        blob: file,
        objectUrl,
        fileName: file.name,
        fileSizeBytes: file.size,
        fileSizeFormatted: mediaCaptureService.formatFileSize(file.size),
        durationSeconds: isVideo ? 1 : undefined,
        durationFormatted: isVideo ? 'Video File' : undefined,
        hasAudio: false,
        capturedAt: new Date().toISOString(),
        resolution: isVideo ? 'Uploaded Video' : 'Uploaded Photo',
      };
      setStagedMedia(item);
      setStatus('reviewing');
    },
    [registerObjectUrl]
  );

  /**
   * Immediately attaches and confirms a captured media file from native camera.
   */
  const attachDirectFile = useCallback(
    (file: File): AttachmentItem => {
      const isVideo = file.type.startsWith('video');
      const objectUrl = registerObjectUrl(URL.createObjectURL(file));

      const attachment: AttachmentItem = {
        id: `direct-${isVideo ? 'video' : 'photo'}-${Date.now()}`,
        name: file.name || (isVideo ? `Video_${Date.now()}.mp4` : `Photo_${Date.now()}.jpg`),
        size: mediaCaptureService.formatFileSize(file.size),
        type: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        mediaType: isVideo ? 'video' : 'image',
        uri: objectUrl,
        rawBlob: file,
        description: `Direct native ${isVideo ? 'video' : 'photo'} camera capture.`,
        resolution: isVideo ? 'High Definition Video' : 'High Resolution Photo',
        previewColor: isVideo ? 'from-slate-900 to-slate-950' : 'from-blue-700 to-indigo-950',
      };

      setConfirmedMedia(attachment);
      setStagedMedia(null);
      setStatus('idle');
      return attachment;
    },
    [registerObjectUrl]
  );

  // Clean up all tracks and object URLs on unmount
  useEffect(() => {
    const urlsToRevoke = objectUrlsRef.current;
    return () => {
      if (streamRef.current) {
        mediaCaptureService.stopMediaStream(streamRef.current);
        streamRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      // Revoke all created Object URLs
      for (const url of urlsToRevoke) {
        mediaCaptureService.revokeMediaUrl(url);
      }
      urlsToRevoke.clear();
    };
  }, []);

  return {
    status,
    mode,
    facingMode,
    includeAudio,
    audioDisclosure: AUDIO_DISCLOSURE_NOTICE,
    isRecording,
    recordingSeconds,
    maxRecordingSeconds: MAX_VIDEO_RECORD_SECONDS,
    error,
    stream,
    videoRef,
    stagedMedia,
    confirmedMedia,
    isSupported,
    isSecure,
    openCamera,
    closeCamera,
    switchMode,
    toggleFacingMode,
    setIncludeAudio,
    takePhoto,
    startRecording,
    stopRecording,
    confirmMedia,
    discardStagedMedia,
    removeConfirmedMedia,
    stageFileMedia,
    attachDirectFile,
  };
}
