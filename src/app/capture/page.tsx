'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
  MapPin,
  Upload,
  CheckCircle,
  FileCheck,
  Shield,
  Crosshair,
  Video,
  RotateCcw,
  Eye,
  Trash2,
  AlertTriangle,
  Lock,
  Info,
  Check,
  Mic,
  MicOff,
  Square,
  FlipHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { MediaViewer } from '@/components/ui/MediaViewer';
import { useCreateRecord } from '@/hooks/useRecords';
import { useGPSCapture } from '@/hooks/useGPSCapture';
import { useMediaCapture } from '@/hooks/useMediaCapture';
import { useAuth } from '@/hooks/useAuth';
import {
  MediaAsset,
  CaptureLocation,
  GPS_VERIFICATION_DISCLAIMER,
  ListingType,
  PropertyCategory,
} from '@/types';

export default function CapturePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Workspace Form states
  const [workspaceCategory, setWorkspaceCategory] = useState<PropertyCategory>('Meeting Room');
  const [title, setTitle] = useState('');
  const [facility, setFacility] = useState('Tech Park Tower 1, Level 4, Bay Area');
  const [priority, setPriority] = useState('medium');
  const [capacitySeats, setCapacitySeats] = useState('12');
  // 11 Core Commercial Workspace Parameters
  const [areaSqFt, setAreaSqFt] = useState('1200');
  const [floorNumber, setFloorNumber] = useState('2');
  const [totalFloors, setTotalFloors] = useState('6');
  const [rent, setRent] = useState('65000');
  const [deposit, setDeposit] = useState('195000');
  const [clearHeightFt, setClearHeightFt] = useState('12.0');
  const [beamHeightFt, setBeamHeightFt] = useState('10.5');
  const [washrooms, setWashrooms] = useState('2');
  const [powerBackup, setPowerBackup] = useState('100% DG Backup');
  const [parkingSpaces, setParkingSpaces] = useState('2');
  const [manualLat, setManualLat] = useState('37.7749');
  const [manualLng, setManualLng] = useState('-122.4194');

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'High-Speed Wi-Fi 6',
    '4K Video Conferencing',
    'Acoustic Soundproofing',
  ]);
  const [workspaceRoomMode, setWorkspaceRoomMode] = useState<'wide' | 'workstation' | 'av_tech' | 'video_tour'>('wide');
  const [cameraAspectRatio, setCameraAspectRatio] = useState<'16/9' | '4/3' | '1/1'>('16/9');

  const [itemsInspected, setItemsInspected] = useState('12');
  const [defectsFound, setDefectsFound] = useState('0');
  const [notes, setNotes] = useState('');
  const [createdRecordId, setCreatedRecordId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Demo upload simulation states
  const [demoUploadEnabled, setDemoUploadEnabled] = useState(true);
  const [isDemoUploading, setIsDemoUploading] = useState(false);
  const [demoUploadProgress, setDemoUploadProgress] = useState(0);
  const [demoUploadStage, setDemoUploadStage] = useState('');
  const [demoUploadCancelled, setDemoUploadCancelled] = useState(false);
  const demoUploadTimersRef = useRef<NodeJS.Timeout[]>([]);

  const { createRecord, isSubmitting } = useCreateRecord();

  // Clean up demo upload timers on unmount
  useEffect(() => {
    return () => {
      demoUploadTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Real user-initiated camera & video capture hook
  const {
    status: mediaStatus,
    mode: cameraMode,
    facingMode: cameraFacing,
    includeAudio: micEnabled,
    audioDisclosure,
    isRecording,
    recordingSeconds,
    maxRecordingSeconds,
    error: mediaError,
    videoRef,
    stagedMedia,
    confirmedMedia,
    isSupported: isMediaSupported,
    isSecure: isMediaSecure,
    openCamera,
    closeCamera,
    switchMode: switchCameraMode,
    toggleFacingMode,
    setIncludeAudio,
    takePhoto,
    startRecording,
    stopRecording,
    confirmMedia,
    discardStagedMedia,
    removeConfirmedMedia,
  } = useMediaCapture();

  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);

  // Real user-initiated browser GPS capture hook
  const {
    status: gpsStatus,
    stagedPosition: stagedGps,
    confirmedPosition: confirmedGps,
    error: gpsError,
    permissionState: gpsPermissionState,
    isReviewModalOpen: isGpsReviewOpen,
    isSupported: isGpsSupported,
    isSecure: isGpsSecure,
    isAcquiring: isGpsAcquiring,
    getCurrentLocation,
    retry: retryGps,
    clear: clearGps,
    confirmLocation: confirmGps,
    discardStaged: discardStagedGps,
    openReview: openGpsReview,
    closeReview: closeGpsReview,
  } = useGPSCapture();

  // Submission success dialog
  const [submittedModalOpen, setSubmittedModalOpen] = useState(false);
  const [generatedRefId, setGeneratedRefId] = useState('');

  // Auto-sync manual coordinates whenever GPS is confirmed
  useEffect(() => {
    if (confirmedGps) {
      setManualLat(confirmedGps.latitude.toFixed(6));
      setManualLng(confirmedGps.longitude.toFixed(6));
    }
  }, [confirmedGps]);

  const cancelDemoUpload = useCallback(() => {
    demoUploadTimersRef.current.forEach(clearTimeout);
    demoUploadTimersRef.current = [];
    setIsDemoUploading(false);
    setDemoUploadCancelled(true);
    setDemoUploadProgress(0);
    setDemoUploadStage('');
  }, []);

  const commitRecord = useCallback(async () => {
    // Explicit confirmation constraint: only attach media if user confirmed it
    const mediaRef: MediaAsset | undefined = confirmedMedia
      ? {
          id: confirmedMedia.id,
          type: confirmedMedia.mediaType === 'video' ? 'video' : 'photo',
          fileName: confirmedMedia.name,
          fileSize: 3.6 * 1024 * 1024,
          fileSizeFormatted: confirmedMedia.size,
          mimeType: confirmedMedia.type,
          uri: confirmedMedia.uri,
          uploadState: 'completed',
          capturedAt: new Date().toISOString(),
          description: confirmedMedia.description,
          resolution: confirmedMedia.resolution,
          previewColor: confirmedMedia.previewColor,
          exif: confirmedMedia.exif,
        }
      : undefined;

    // Resolve coordinates from either confirmed browser GPS or manual input
    const effectiveLat = manualLat ? parseFloat(manualLat) : confirmedGps?.latitude;
    const effectiveLng = manualLng ? parseFloat(manualLng) : confirmedGps?.longitude;
    const hasValidCoords =
      effectiveLat !== undefined &&
      effectiveLng !== undefined &&
      !isNaN(effectiveLat) &&
      !isNaN(effectiveLng);

    const loc: CaptureLocation | undefined = hasValidCoords
      ? {
          latitude: effectiveLat!,
          longitude: effectiveLng!,
          accuracyMeters: confirmedGps?.accuracyMeters || 2.5,
          capturedAt: confirmedGps?.capturedAt || new Date().toISOString(),
          address: facility.trim() || confirmedGps?.address || 'On-site Workspace Location',
          elevationMeters: confirmedGps?.elevationMeters,
        }
      : undefined;

    try {
      const parsedRent = rent ? parseInt(rent, 10) : undefined;
      const parsedDeposit = deposit ? parseInt(deposit, 10) : undefined;

      const created = await createRecord({
        title: title.trim(),
        notes,
        category: workspaceCategory,
        facility: facility,
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        itemsInspected: parseInt(itemsInspected, 10) || 12,
        defectsFound: parseInt(defectsFound, 10) || 0,
        location: loc,
        mediaReferences: mediaRef ? [mediaRef] : [],
        consentVersion: 'v1.4-2026',
        propertyCategory: workspaceCategory,
        ownerUid: user?.uid || 'mock-usr-officer-001',
        authorName: user?.displayName || 'Officer Alex Rivera',
        authorEmail: user?.email || 'officer@pvg-ops.local',
        authorRole: user?.role || 'officer',
        specs: {
          areaSqFt: parseInt(areaSqFt, 10) || 0,
          floorNumber: floorNumber ? parseInt(floorNumber, 10) : undefined,
          totalFloors: totalFloors ? parseInt(totalFloors, 10) : undefined,
          rent: parsedRent,
          deposit: parsedDeposit,
          clearHeightFt: clearHeightFt ? parseFloat(clearHeightFt) : undefined,
          beamHeightFt: beamHeightFt ? parseFloat(beamHeightFt) : undefined,
          washrooms: washrooms ? parseInt(washrooms, 10) : undefined,
          powerBackup: powerBackup.trim() || undefined,
          parkingSpaces: parkingSpaces ? parseInt(parkingSpaces, 10) : undefined,
          capacitySeats: parseInt(capacitySeats, 10) || undefined,
          amenities: selectedAmenities,
        },
        pricing: {
          price: parsedRent,
          securityDeposit: parsedDeposit,
          currency: 'INR',
          pricePeriod: 'month',
        },
        verificationBadge: loc
          ? `PVG Verified GPS (±${loc.accuracyMeters.toFixed(1)}m)`
          : 'Pending GPS Lock',
        doorstepCoordinates: loc,
      });

      setGeneratedRefId(created.referenceNumber);
      setCreatedRecordId(created.id);
      setIsDemoUploading(false);
      setSubmittedModalOpen(true);
      setToastMessage(`Workspace ${created.referenceNumber} verified and saved to ledger!`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: unknown) {
      const e = err as Error;
      setIsDemoUploading(false);
      setErrorMessage(e.message || 'Validation error while saving record to repository.');
    }
  }, [
    confirmedMedia,
    confirmedGps,
    createRecord,
    title,
    notes,
    facility,
    priority,
    itemsInspected,
    defectsFound,
    workspaceCategory,
    capacitySeats,
    areaSqFt,
    floorNumber,
    totalFloors,
    rent,
    deposit,
    clearHeightFt,
    beamHeightFt,
    washrooms,
    powerBackup,
    parkingSpaces,
    manualLat,
    manualLng,
    selectedAmenities,
  ]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setDemoUploadCancelled(false);

    // Duplicate-submit prevention
    if (isSubmitting || isDemoUploading) {
      return;
    }

    // Validation checks
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      setErrorMessage('Inspection title must be at least 3 characters long before saving.');
      return;
    }
    if (trimmedTitle.length > 120) {
      setErrorMessage('Inspection title cannot exceed 120 characters.');
      return;
    }
    if (stagedMedia && !confirmedMedia) {
      setErrorMessage('You have captured media waiting for review. Please either click "Confirm & Attach to Record" or discard it before submitting.');
      return;
    }
    if (stagedGps && !confirmedGps) {
      setErrorMessage('You have acquired GPS coordinates waiting for review. Please either click "Confirm & Attach to Record" or discard them before submitting.');
      return;
    }

    // Check if Demo Upload Simulation is enabled
    if (demoUploadEnabled) {
      setIsDemoUploading(true);
      setDemoUploadProgress(10);
      setDemoUploadStage('Step 1/4: Packaging payload & validating schema (Demo upload)...');

      demoUploadTimersRef.current.forEach(clearTimeout);
      demoUploadTimersRef.current = [];

      const t1 = setTimeout(() => {
        setDemoUploadProgress(35);
        setDemoUploadStage('Step 2/4: Chunking optical payload & generating SHA-256 integrity hash (Demo upload)...');
      }, 400);

      const t2 = setTimeout(() => {
        setDemoUploadProgress(70);
        setDemoUploadStage('Step 3/4: Attaching WGS84 coordinates & telemetry metadata (Demo upload)...');
      }, 850);

      const t3 = setTimeout(() => {
        setDemoUploadProgress(95);
        setDemoUploadStage('Step 4/4: Committing to local mock repository session (Demo upload)...');
      }, 1300);

      const t4 = setTimeout(() => {
        setDemoUploadProgress(100);
        setDemoUploadStage('Demo upload complete! Finalizing mock record...');
        commitRecord();
      }, 1650);

      demoUploadTimersRef.current = [t1, t2, t3, t4];
    } else {
      commitRecord();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6 min-w-0 overflow-hidden">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between gap-3 text-xs font-medium shadow-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="pb-3 sm:pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Capture Workspace
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Record property specifications, capture on-site photos and video, and lock GPS coordinates.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs space-y-1">
          <strong className="block font-semibold">Validation Rejected:</strong>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Details Card: Workspace Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>1. Workspace Details & Specifications</CardTitle>
            <CardDescription>Enter property dimensions, pricing, and infrastructure capacity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Workspace Title"
                  required
                  placeholder="e.g., Apex Executive Boardroom & AV Suite"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <Select
                label="Category"
                required
                value={workspaceCategory}
                onChange={(e) => {
                  const val = e.target.value as PropertyCategory;
                  setWorkspaceCategory(val);
                }}
                options={[
                  { value: 'Meeting Room', label: 'Meeting Room' },
                  { value: 'Private Office', label: 'Private Office' },
                  { value: 'Dedicated Desk', label: 'Dedicated Desk' },
                  { value: 'Coworking Floor', label: 'Coworking Floor' },
                  { value: 'Lab / Studio', label: 'Lab / Studio' },
                  { value: 'Executive Suite', label: 'Executive Suite' },
                ]}
              />
            </div>

            {/* Building / Facility Location */}
            <Input
              label="Building & Facility Location"
              required
              placeholder="e.g., Tech Park Tower 1, Level 4, Bay Area"
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
            />

            {/* Core Commercial Workspace Specifications */}
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Workspace Dimensions & Commercial Terms
              </div>

              {/* Row 1: Area, Rent, Deposit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Area (sq ft)"
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 1200"
                  value={areaSqFt}
                  onChange={(e) => setAreaSqFt(e.target.value)}
                />

                <Input
                  label="Monthly Rent (₹)"
                  type="number"
                  min="0"
                  placeholder="e.g. 65000"
                  value={rent}
                  onChange={(e) => setRent(e.target.value)}
                />

                <Input
                  label="Security Deposit (₹)"
                  type="number"
                  min="0"
                  placeholder="e.g. 195000"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                />
              </div>

              {/* Row 2: Floor, Total Floors, Parking */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Floor Number"
                  type="number"
                  placeholder="e.g. 2"
                  value={floorNumber}
                  onChange={(e) => setFloorNumber(e.target.value)}
                />

                <Input
                  label="Total Floors in Building"
                  type="number"
                  placeholder="e.g. 6"
                  value={totalFloors}
                  onChange={(e) => setTotalFloors(e.target.value)}
                />

                <Input
                  label="Parking Spaces"
                  type="number"
                  min="0"
                  placeholder="e.g. 2"
                  value={parkingSpaces}
                  onChange={(e) => setParkingSpaces(e.target.value)}
                />
              </div>

              {/* Row 3: Clear Height, Beam Height, Washrooms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Clear Ceiling Height (ft)"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 12.0"
                  value={clearHeightFt}
                  onChange={(e) => setClearHeightFt(e.target.value)}
                />

                <Input
                  label="Beam Height (ft)"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g. 10.5"
                  value={beamHeightFt}
                  onChange={(e) => setBeamHeightFt(e.target.value)}
                />

                <Input
                  label="Washrooms Count"
                  type="number"
                  min="0"
                  placeholder="e.g. 2"
                  value={washrooms}
                  onChange={(e) => setWashrooms(e.target.value)}
                />
              </div>

              {/* Row 4: Power Backup, Capacity Seats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Power Backup"
                  value={powerBackup}
                  onChange={(e) => setPowerBackup(e.target.value)}
                  options={[
                    { value: '100% DG Backup', label: '100% DG Backup' },
                    { value: 'Partial DG Backup', label: 'Partial DG Backup' },
                    { value: 'UPS + DG Backup', label: 'UPS + DG Backup' },
                    { value: 'Dedicated Generator', label: 'Dedicated Industrial Generator' },
                    { value: 'None', label: 'No Power Backup' },
                  ]}
                />

                <Input
                  label="Seating Capacity"
                  type="number"
                  min="1"
                  placeholder="e.g. 12"
                  value={capacitySeats}
                  onChange={(e) => setCapacitySeats(e.target.value)}
                />
              </div>
            </div>

            {/* Inspection Checks & Observations */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Verification Urgency"
                required
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                options={[
                  { value: 'low', label: 'Standard Queue' },
                  { value: 'medium', label: 'Standard Verification' },
                  { value: 'high', label: 'Priority Verification' },
                  { value: 'urgent', label: 'Urgent Same-Day Stamp' },
                ]}
              />

              <Input
                label="Rooms Inspected"
                type="number"
                min="1"
                required
                value={itemsInspected}
                onChange={(e) => setItemsInspected(e.target.value)}
              />

              <Input
                label="Defects / Flagged Items"
                type="number"
                min="0"
                required
                value={defectsFound}
                onChange={(e) => setDefectsFound(e.target.value)}
              />
            </div>

            <Textarea
              label="Inspector Notes & Observations"
              required
              rows={3}
              placeholder="Record observations, key amenities, optical condition, or site remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Real User-Initiated Camera & Video Capture Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="leading-snug">2. Live Camera & Video Evidence Capture</span>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                {mediaStatus === 'idle' && !confirmedMedia && (
                  <Badge variant="neutral" dot>
                    Camera Idle (No Stream)
                  </Badge>
                )}
                {mediaStatus === 'requesting' && (
                  <Badge variant="info" dot>
                    Requesting Device Access...
                  </Badge>
                )}
                {mediaStatus === 'previewing' && (
                  <Badge variant="success" dot>
                    Live Viewfinder Active
                  </Badge>
                )}
                {mediaStatus === 'recording' && (
                  <Badge variant="error" dot>
                    Recording ({recordingSeconds}s / {maxRecordingSeconds}s)
                  </Badge>
                )}
                {mediaStatus === 'reviewing' && (
                  <Badge variant="pending" dot>
                    Pending Staged Confirmation
                  </Badge>
                )}
                {confirmedMedia && (
                  <Badge variant="success" dot>
                    Evidence Attached & Confirmed
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription>
              Capture high-resolution on-site photos and walkthrough video tours.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Warning banner if mediaDevices unsupported */}
            {!isMediaSupported && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Camera Hardware Unsupported:</strong> Your browser does not support <code>navigator.mediaDevices.getUserMedia</code>.
                </div>
              </div>
            )}

            {/* Warning banner if insecure context */}
            {!isMediaSecure && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Insecure Context:</strong> Camera and microphone hardware access require HTTPS or localhost (<code>window.isSecureContext === true</code>). Media capture is blocked on insecure HTTP origins.
                </div>
              </div>
            )}

            {/* Hardware error banner */}
            {mediaError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-950">
                        Camera Access Error ({mediaError.code})
                      </p>
                      <p className="text-rose-800 mt-0.5 leading-relaxed">
                        {mediaError.message}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-rose-300 text-rose-800 hover:bg-rose-100 shrink-0"
                    onClick={() => openCamera(cameraMode)}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Retry
                  </Button>
                </div>
                {mediaError.code === 'PERMISSION_DENIED' && (
                  <p className="text-[11px] text-rose-700 bg-rose-100/60 p-2 rounded-lg">
                    💡 <strong>Tip:</strong> Click the camera icon or site settings icon in your browser URL bar, set Camera (and Microphone if recording video with audio) to &quot;Allow&quot;, then click Retry.
                  </p>
                )}
              </div>
            )}

            {/* Viewfinder Controls Toolbar */}
            <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2.5 w-full">
                {mediaStatus === 'idle' || mediaStatus === 'error' ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => openCamera(cameraMode)}
                    disabled={!isMediaSupported}
                    leftIcon={<Camera className="w-4 h-4" />}
                  >
                    Open Camera Viewfinder
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={closeCamera}
                    leftIcon={<Square className="w-3.5 h-3.5" />}
                  >
                    Close Viewfinder
                  </Button>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Mode Selector (Photo vs Video) */}
                  <div className="flex items-center bg-slate-200 p-0.5 rounded-lg text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        switchCameraMode('photo');
                        if (workspaceRoomMode === 'video_tour') setWorkspaceRoomMode('wide');
                      }}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        cameraMode === 'photo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Photo Still
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchCameraMode('video');
                        setWorkspaceRoomMode('video_tour');
                      }}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        cameraMode === 'video' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Video Walkthrough
                    </button>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="flex items-center bg-slate-200 p-0.5 rounded-lg text-[11px] font-mono">
                    {(['16/9', '4/3', '1/1'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setCameraAspectRatio(ratio)}
                        className={`px-2 py-0.5 rounded transition-all ${
                          cameraAspectRatio === ratio ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Workspace Target Selector Pills */}
              <div className="w-full flex items-center gap-1.5 pt-2.5 border-t border-slate-200 overflow-x-auto no-scrollbar scrollbar-none pb-1 touch-pan-x min-w-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mr-1 shrink-0">
                  Target:
                </span>
                {[
                  { id: 'wide', label: '📐 Wide Workspace View', mode: 'photo' },
                  { id: 'workstation', label: '🖥️ Workstations & Desks', mode: 'photo' },
                  { id: 'av_tech', label: '🔌 AV & Power Infrastructure', mode: 'photo' },
                  { id: 'video_tour', label: '🎥 Video Walkthrough', mode: 'video' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setWorkspaceRoomMode(item.id as any);
                      if (item.mode === 'video' && cameraMode !== 'video') switchCameraMode('video');
                      if (item.mode === 'photo' && cameraMode !== 'photo') switchCameraMode('photo');
                    }}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      workspaceRoomMode === item.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Viewfinder Lens and Audio Options */}
              {(mediaStatus === 'previewing' || mediaStatus === 'recording') && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleFacingMode}
                    leftIcon={<FlipHorizontal className="w-3.5 h-3.5" />}
                    title="Flip between front and rear cameras"
                  >
                    {cameraFacing === 'environment' ? 'Rear Lens' : 'Front Lens'}
                  </Button>

                  {cameraMode === 'video' && (
                    <button
                      type="button"
                      onClick={() => setIncludeAudio(!micEnabled)}
                      className={`p-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                        micEnabled
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                      title={audioDisclosure}
                    >
                      {micEnabled ? <Mic className="w-3.5 h-3.5 text-blue-600" /> : <MicOff className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{micEnabled ? 'Mic Active' : 'Mic Muted'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Audio Disclosure Banner for Video Mode */}
            {cameraMode === 'video' && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="font-semibold block">Inspector Voiceover Commentary</strong>
                  <p className="text-blue-800 text-[11px] leading-relaxed">
                    Microphone is enabled for real-time inspector commentary during workspace walkthroughs.
                  </p>
                </div>
              </div>
            )}

            {/* Active Live Video Viewfinder Element */}
            {(mediaStatus === 'previewing' || mediaStatus === 'recording') && (
              <div
                className={`relative w-full max-h-96 bg-slate-950 rounded-xl overflow-hidden flex flex-col justify-between p-4 text-white border border-slate-800 animate-in fade-in shadow-xl ${
                  cameraAspectRatio === '16/9'
                    ? 'aspect-video'
                    : cameraAspectRatio === '4/3'
                    ? 'aspect-[4/3]'
                    : 'aspect-square'
                }`}
              >
                {/* HTMLVideoElement with live camera stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />

                {/* Viewfinder Header Overlay */}
                <div className="relative z-10 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2 bg-black/75 px-2.5 py-1 rounded-md backdrop-blur-xs text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>
                      {workspaceRoomMode.toUpperCase().replace('_', ' ')} • {cameraAspectRatio}
                    </span>
                  </div>

                  {confirmedGps ? (
                    <div className="bg-emerald-950/80 px-2 py-0.5 rounded text-[10px] text-emerald-300 border border-emerald-500/40">
                      GPS ±{confirmedGps.accuracyMeters.toFixed(1)}m LOCKED
                    </div>
                  ) : (
                    <div className="bg-amber-950/80 px-2 py-0.5 rounded text-[10px] text-amber-300 border border-amber-500/40">
                      GPS AWAITING DOORSTEP FIX
                    </div>
                  )}

                  {isRecording ? (
                    <div className="flex items-center gap-2 bg-rose-950/80 px-2.5 py-1 rounded-md backdrop-blur-xs text-rose-300 border border-rose-500/40">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="font-bold">REC: {recordingSeconds}s / {maxRecordingSeconds}s</span>
                    </div>
                  ) : (
                    <div className="bg-black/70 px-2.5 py-1 rounded-md backdrop-blur-xs text-slate-300">
                      <span>{cameraMode === 'video' ? (micEnabled ? 'AUDIO ARMED' : 'AUDIO MUTED') : 'AUTO-EXPOSURE'}</span>
                    </div>
                  )}
                </div>

                {/* Reticle Overlay */}
                <div className="relative z-10 my-auto flex flex-col items-center">
                  <Crosshair className={`w-12 h-12 text-blue-400/70 ${isRecording ? 'text-rose-400 animate-pulse' : ''}`} />
                  {isRecording && (
                    <p className="text-xs text-rose-300 font-mono mt-2 bg-black/60 px-2 py-0.5 rounded">
                      RECORDING MECHANICAL DIAGNOSTICS ({recordingSeconds}s)...
                    </p>
                  )}
                </div>

                {/* Shutter Bar Overlay */}
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {cameraMode === 'photo' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={takePhoto}
                      leftIcon={<Camera className="w-4 h-4" />}
                    >
                      Capture Still Photo
                    </Button>
                  ) : !isRecording ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={startRecording}
                      leftIcon={<Video className="w-4 h-4" />}
                    >
                      Start Recording ({maxRecordingSeconds}s max)
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={stopRecording}
                      leftIcon={<Square className="w-4 h-4" />}
                    >
                      Stop Recording ({recordingSeconds}s)
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Staged Media Review Panel (Inspect captured photo or video before attaching) */}
            {stagedMedia && (
              <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-4 text-white">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-semibold">
                        Inspect Staged {stagedMedia.type === 'video' ? 'Video Recording' : 'Still Photo'}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        {stagedMedia.fileName} • {stagedMedia.fileSizeFormatted}
                      </p>
                    </div>
                  </div>
                  <Badge variant="pending">Awaiting Confirmation</Badge>
                </div>

                {/* Media Playback / Preview */}
                <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-72 border border-slate-800">
                  {stagedMedia.type === 'photo' ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={stagedMedia.objectUrl}
                      alt="Captured inspection frame"
                      className="max-h-72 w-full object-contain"
                    />
                  ) : (
                    <video
                      src={stagedMedia.objectUrl}
                      controls
                      playsInline
                      className="w-full aspect-video max-h-72 bg-black"
                    />
                  )}
                </div>

                {/* Metadata Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Type</span>
                    {stagedMedia.type.toUpperCase()} ({stagedMedia.mimeType.split(';')[0]})
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">File Size</span>
                    {stagedMedia.fileSizeFormatted}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">
                      {stagedMedia.type === 'video' ? 'Duration' : 'Resolution'}
                    </span>
                    {stagedMedia.type === 'video' ? stagedMedia.durationFormatted : stagedMedia.resolution}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Audio Track</span>
                    {stagedMedia.hasAudio ? 'Included (Mic)' : 'Muted'}
                  </div>
                </div>

                {/* Staged Review Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-slate-300 border-slate-700 hover:bg-slate-800"
                      onClick={() => {
                        discardStagedMedia();
                        openCamera(cameraMode);
                      }}
                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Retake
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                      onClick={discardStagedMedia}
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Cancel / Discard
                    </Button>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={confirmMedia}
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    Confirm & Attach to Record
                  </Button>
                </div>
              </div>
            )}

            {/* Confirmed Media Card (Attached to inspection draft) */}
            {confirmedMedia && !stagedMedia && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                        Evidence Media Confirmed & Attached to Record
                      </h4>
                      <p className="text-xs text-emerald-700 font-mono">
                        {confirmedMedia.name} ({confirmedMedia.size} • {confirmedMedia.mediaType.toUpperCase()})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => setMediaViewerOpen(true)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Review in Media Viewer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-rose-300 text-rose-700 hover:bg-rose-50"
                      onClick={removeConfirmedMedia}
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Manual File Attachment Mock */}
            <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50/50 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                Or attach external telemetry documentation
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                PDF calibration certificates, CSV data logs (Demonstration file dropzone)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Real Browser GPS Geolocation Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="leading-snug">3. Spatial Geolocation & GPS Telemetry</span>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                {gpsStatus === 'idle' && (
                  <Badge variant="neutral" dot>
                    Sensor Idle (Unattached)
                  </Badge>
                )}
                {gpsStatus === 'requesting' && (
                  <Badge variant="info" dot>
                    Acquiring Geolocation...
                  </Badge>
                )}
                {gpsStatus === 'error' && (
                  <Badge variant="error" dot>
                    Capture Error
                  </Badge>
                )}
                {gpsStatus === 'acquired' && confirmedGps && (
                  <Badge variant="success" dot>
                    GPS Confirmed & Attached
                  </Badge>
                )}
                {gpsStatus === 'acquired' && !confirmedGps && stagedGps && (
                  <Badge variant="pending" dot>
                    Pending Review & Confirmation
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription>
              Lock doorstep GPS coordinates for workspace location verification.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Environment warning banners if unsupported or insecure */}
            {!isGpsSupported && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Geolocation API Unsupported:</strong> This browser environment does not support <code>navigator.geolocation</code>. GPS tagging is unavailable.
                </div>
              </div>
            )}

            {!isGpsSecure && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Insecure Context:</strong> The Geolocation API is restricted to secure origins (HTTPS or localhost). Queries on insecure HTTP origins are blocked by browser security.
                </div>
              </div>
            )}

            {/* Error banner with retry button */}
            {gpsError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-950">
                        GPS Capture Failed ({gpsError.code})
                      </p>
                      <p className="text-rose-800 mt-0.5 leading-relaxed">
                        {gpsError.message}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-rose-300 text-rose-800 hover:bg-rose-100 shrink-0"
                    onClick={() => retryGps()}
                    isLoading={isGpsAcquiring}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Retry
                  </Button>
                </div>
                {gpsError.code === 'PERMISSION_DENIED' && (
                  <p className="text-[11px] text-rose-700 bg-rose-100/60 p-2 rounded-lg">
                    💡 <strong>Tip:</strong> Look for the lock or site settings icon near the URL bar in your browser, set Location to &quot;Allow&quot;, and click Retry.
                  </p>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Device Geolocation Control
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {confirmedGps
                      ? `Attached fix: ${confirmedGps.latitude.toFixed(6)}°, ${confirmedGps.longitude.toFixed(6)}° (±${confirmedGps.accuracyMeters.toFixed(1)}m)`
                      : stagedGps
                      ? 'Fix acquired. Review and confirm attachment below.'
                      : 'No geographical metadata attached to this draft.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Primary Trigger Button */}
                  {!confirmedGps && !stagedGps && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => getCurrentLocation()}
                      isLoading={isGpsAcquiring}
                      disabled={!isGpsSupported}
                      leftIcon={<Crosshair className="w-4 h-4" />}
                    >
                      Get Current Location
                    </Button>
                  )}

                  {/* Staged fix controls */}
                  {stagedGps && !confirmedGps && (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={openGpsReview}
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        Review Fix
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={confirmGps}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Confirm & Attach
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => retryGps()}
                        isLoading={isGpsAcquiring}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Retry
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearGps}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        Clear
                      </Button>
                    </div>
                  )}

                  {/* Confirmed fix controls */}
                  {confirmedGps && (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={openGpsReview}
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        Review
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => getCurrentLocation()}
                        isLoading={isGpsAcquiring}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Recapture
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearGps}
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        className="text-rose-600 hover:text-rose-700"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional manual coordinate entry fallback */}
              {!confirmedGps && (
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                    <span className="text-xs font-semibold text-slate-700">
                      Manual Coordinates (Optional)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Auto-filled by GPS above or enter manually
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Latitude"
                      type="number"
                      step="0.000001"
                      placeholder="e.g. 37.774900"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                    />
                    <Input
                      label="Longitude"
                      type="number"
                      step="0.000001"
                      placeholder="e.g. -122.419400"
                      value={manualLng}
                      onChange={(e) => setManualLng(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Coordinates display grid (for either staged or confirmed fix) */}
              {(confirmedGps || stagedGps) && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  {stagedGps && !confirmedGps && (
                    <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Fix acquired from browser. Review and confirm attachment before submitting.</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={confirmGps}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Confirm & Attach
                      </Button>
                    </div>
                  )}

                  {confirmedGps && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>GPS coordinates confirmed and attached to record draft.</span>
                    </div>
                  )}

                  {(() => {
                    const activeLoc = confirmedGps || stagedGps;
                    if (!activeLoc) return null;
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block font-sans">
                            Latitude (WGS84)
                          </span>
                          <span className="font-mono font-medium text-slate-800 text-sm">
                            {activeLoc.latitude.toFixed(6)}°
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block font-sans">
                            Longitude (WGS84)
                          </span>
                          <span className="font-mono font-medium text-slate-800 text-sm">
                            {activeLoc.longitude.toFixed(6)}°
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block font-sans">
                            Reported Accuracy
                          </span>
                          <span className="font-mono font-medium text-slate-800 text-sm">
                            ±{activeLoc.accuracyMeters.toFixed(1)} m
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block font-sans">
                            Captured Timestamp
                          </span>
                          <span className="font-mono text-slate-700 text-xs truncate block" title={activeLoc.capturedAt}>
                            {new Date(activeLoc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Verification integrity notice / disclaimer */}
                  <p className="text-[11px] text-slate-500 italic flex items-start gap-1.5 pt-1 leading-relaxed">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{GPS_VERIFICATION_DISCLAIMER}</span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Submission & Simulated Demo Upload */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">4. Final Verification & Submission</CardTitle>
                <CardDescription>Review draft completeness and commit to local ledger</CardDescription>
              </div>
              <Badge variant="warning" className="self-start sm:self-auto">Demo upload</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Demo Upload Simulation Toggle & Disclosure */}
            <div className="flex items-start gap-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
              <input
                type="checkbox"
                id="demo-upload-toggle"
                checked={demoUploadEnabled}
                onChange={(e) => setDemoUploadEnabled(e.target.checked)}
                className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div className="text-xs space-y-0.5">
                <label htmlFor="demo-upload-toggle" className="font-semibold text-amber-950 flex flex-wrap items-center gap-1.5 cursor-pointer">
                  <span>Simulate packaging & upload transport before commit</span>
                  <Badge variant="warning" size="sm">Demo upload</Badge>
                </label>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  Demonstrates progress indicator, chunking, and SHA-256 fingerprinting entirely offline. Zero remote bandwidth or Firebase is used.
                </p>
              </div>
            </div>

            {/* Active Demo Upload Progress Card */}
            {isDemoUploading && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span className="font-bold text-amber-950">Demo Upload in Progress</span>
                    <Badge variant="warning" size="sm">Demo upload</Badge>
                  </div>
                  <span className="font-mono font-bold text-amber-900">{demoUploadProgress}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-amber-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-amber-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${demoUploadProgress}%` }}
                    role="progressbar"
                    aria-valuenow={demoUploadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] pt-1">
                  <span className="text-amber-900 font-medium">{demoUploadStage}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-900 hover:bg-amber-100"
                    onClick={cancelDemoUpload}
                  >
                    Cancel Demo Upload
                  </Button>
                </div>
              </div>
            )}

            {/* Cancelled Notice with Retry */}
            {demoUploadCancelled && !isDemoUploading && (
              <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Demo upload simulation was cancelled. Draft remains intact.</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmit()}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Retry Demo Upload
                </Button>
              </div>
            )}

            {/* Submit Action Bar */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Link href="/" className="w-full sm:w-auto">
                <Button type="button" variant="ghost" size="md" className="w-full sm:w-auto">
                  Discard Draft
                </Button>
              </Link>
              <div className="w-full sm:w-auto">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={isSubmitting || isDemoUploading}
                  isLoading={isSubmitting || isDemoUploading}
                  leftIcon={<FileCheck className="w-5 h-5" />}
                >
                  Submit Field Verification
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Media Viewer Modal Lightbox */}
      <MediaViewer
        attachment={confirmedMedia}
        isOpen={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
      />

      {/* Submission Success Dialog */}
      <Dialog
        isOpen={submittedModalOpen}
        onClose={() => setSubmittedModalOpen(false)}
        title="Field Inspection Recorded"
        description="Your record has been compiled and saved into the local demo session."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmittedModalOpen(false);
                setTitle('');
                setNotes('');
                removeConfirmedMedia();
                clearGps();
                setCreatedRecordId('');
              }}
            >
              Submit Another
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubmittedModalOpen(false);
                  router.push('/dashboard');
                }}
              >
                Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubmittedModalOpen(false);
                  router.push('/records');
                }}
              >
                Records Ledger
              </Button>
              {createdRecordId && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSubmittedModalOpen(false);
                    router.push(`/records/${createdRecordId}`);
                  }}
                >
                  View Record
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-800">
                Generated Reference ID
              </p>
              <p className="text-base font-bold font-mono text-emerald-950">
                {generatedRefId}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <p><strong>Title:</strong> {title || 'Untitled Inspection'}</p>
            <p><strong>Facility:</strong> {facility}</p>
            <p><strong>Category:</strong> {workspaceCategory}</p>
            <p><strong>Optical Attachment:</strong> {confirmedMedia ? confirmedMedia.name : 'None attached'}</p>
            <p>
              <strong>GPS Tag:</strong>{' '}
              {confirmedGps
                ? `${confirmedGps.latitude.toFixed(6)}°, ${confirmedGps.longitude.toFixed(6)}° (±${confirmedGps.accuracyMeters.toFixed(1)}m)`
                : 'Unattached'}
            </p>
            <p className="text-blue-700 font-semibold pt-1">
              • Saved to local in-memory session only. Never synced to remote databases.
            </p>
          </div>
        </div>
      </Dialog>

      {/* GPS Review & Explicit Confirmation Dialog */}
      <Dialog
        isOpen={isGpsReviewOpen}
        onClose={closeGpsReview}
        title="Review Browser-Captured GPS Telemetry"
        description="Inspect location coordinates and browser-reported uncertainty radius before confirming attachment to the draft record."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <div>
              {stagedGps && !confirmedGps ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={discardStagedGps}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Discard Fix
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearGps();
                    closeGpsReview();
                  }}
                  className="text-rose-600 hover:text-rose-700"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Remove Location
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => retryGps()}
                isLoading={isGpsAcquiring}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Retry Capture
              </Button>
              {stagedGps && !confirmedGps ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={confirmGps}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Confirm & Attach to Record
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={closeGpsReview}
                >
                  Done
                </Button>
              )}
            </div>
          </div>
        }
      >
        {(() => {
          const displayGps = stagedGps || confirmedGps;
          if (!displayGps) {
            return (
              <p className="text-xs text-slate-500 py-4 text-center">
                No GPS coordinates have been captured yet.
              </p>
            );
          }
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Latitude
                  </span>
                  <span className="font-mono text-base font-bold text-slate-900">
                    {displayGps.latitude.toFixed(6)}°
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">WGS84 Format</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Longitude
                  </span>
                  <span className="font-mono text-base font-bold text-slate-900">
                    {displayGps.longitude.toFixed(6)}°
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">WGS84 Format</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Browser-Reported Accuracy:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    ±{displayGps.accuracyMeters.toFixed(1)} meters
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Captured At:</span>
                  <span className="font-mono text-slate-900">
                    {new Date(displayGps.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">ISO Timestamp:</span>
                  <span className="font-mono text-slate-700 text-[11px]">
                    {displayGps.capturedAt}
                  </span>
                </div>
                {displayGps.elevationMeters != null && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500">Altitude / Elevation:</span>
                    <span className="font-mono text-slate-900">
                      +{displayGps.elevationMeters}m MSL
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Permission State:</span>
                  <Badge variant="success" size="sm">
                    {gpsPermissionState === 'granted' ? 'Access Granted' : gpsPermissionState}
                  </Badge>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-semibold block">Browser Telemetry Notice</strong>
                  <p className="text-blue-800 leading-relaxed text-[11px]">
                    {GPS_VERIFICATION_DISCLAIMER}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </Dialog>
    </div>
  );
}
