'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
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
import { useMediaCapture } from '@/hooks/useMediaCapture';
import { useAuth } from '@/hooks/useAuth';
import {
  MediaAsset,
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

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'High-Speed Wi-Fi 6',
    '4K Video Conferencing',
    'Acoustic Soundproofing',
  ]);

  const [itemsInspected, setItemsInspected] = useState('12');
  const [defectsFound, setDefectsFound] = useState('0');
  const [notes, setNotes] = useState('');
  const [createdRecordId, setCreatedRecordId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File input ref for photo/video upload from device
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    stageFileMedia,
  } = useMediaCapture();

  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);

  // Submission success dialog
  const [submittedModalOpen, setSubmittedModalOpen] = useState(false);
  const [generatedRefId, setGeneratedRefId] = useState('');

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
        location: undefined,
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
        verificationBadge: 'Field Verified',
        doorstepCoordinates: undefined,
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
        setDemoUploadStage('Step 3/4: Packaging property parameters & evidence files (Demo upload)...');
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
          Record property specifications and capture on-site photos and video evidence.
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
                <span className="leading-snug">2. Photo & Video Evidence Capture</span>
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
              Capture high-resolution on-site photos and walkthrough video tours, or upload media files.
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
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
                    className="w-full sm:w-auto text-white bg-slate-800 hover:bg-slate-700"
                    onClick={closeCamera}
                    leftIcon={<Square className="w-3.5 h-3.5" />}
                  >
                    Close Viewfinder
                  </Button>
                )}

                {/* Optional Lens Flip when viewfinder active */}
                {(mediaStatus === 'previewing' || mediaStatus === 'recording') && (
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
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* Mode Selector (Photo vs Video) */}
                <div className="flex items-center bg-slate-200 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => switchCameraMode('photo')}
                    className={`px-3 py-1.5 rounded-md transition-all font-semibold ${
                      cameraMode === 'photo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Photo Still
                  </button>
                  <button
                    type="button"
                    onClick={() => switchCameraMode('video')}
                    className={`px-3 py-1.5 rounded-md transition-all font-semibold ${
                      cameraMode === 'video' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Video Walkthrough
                  </button>
                </div>

                {/* Mic toggle when in video mode and active */}
                {(mediaStatus === 'previewing' || mediaStatus === 'recording') && cameraMode === 'video' && (
                  <button
                    type="button"
                    onClick={() => setIncludeAudio(!micEnabled)}
                    className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-medium transition-colors ${
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
              <div className="relative w-full max-h-96 bg-slate-950 rounded-xl overflow-hidden flex flex-col justify-between p-4 text-white border border-slate-800 animate-in fade-in shadow-xl aspect-video">
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
                      {cameraMode === 'video' ? 'LIVE VIDEO STREAM' : 'LIVE PHOTO VIEWFINDER'}
                    </span>
                  </div>

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

            {/* Upload Photo or Video File from Device */}
            {!confirmedMedia && !stagedMedia && mediaStatus !== 'previewing' && mediaStatus !== 'recording' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
                    stageFileMedia(file);
                  }
                }}
                className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 text-center hover:bg-blue-50/20 transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      stageFileMedia(file);
                      e.target.value = '';
                    }
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  Or upload photos & videos from device
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click to select or drag & drop high-resolution photos or video walkthroughs
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Submission & Simulated Demo Upload */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">3. Final Verification & Submission</CardTitle>
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
                  router.push('/');
                }}
              >
                Workspaces Catalog
              </Button>
              {user?.role === 'admin' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSubmittedModalOpen(false);
                    router.push('/admin');
                  }}
                >
                  Admin Review Hub
                </Button>
              )}
              {createdRecordId && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSubmittedModalOpen(false);
                    router.push(`/records/${createdRecordId}`);
                  }}
                >
                  View Details
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
            <p className="text-blue-700 font-semibold pt-1">
              • Submitted for verification. Once approved in Admin Hub, it goes live in the public catalog.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
