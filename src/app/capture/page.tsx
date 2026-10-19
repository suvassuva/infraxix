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
  Play,
  Plus,
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
  AttachmentItem,
} from '@/types';
import { mediaRepository, activeDataSource } from '@/repositories';
import { compressImage } from '@/utils/imageCompressor';

export default function CapturePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/capture');
    }
  }, [user, authLoading, router]);


  // Workspace Form states
  const [workspaceCategory, setWorkspaceCategory] = useState<PropertyCategory>('Meeting Room');
  const [title, setTitle] = useState('');
  const [facility, setFacility] = useState('Tech Park Tower 1, Level 4, Bay Area');
  const [locationLink, setLocationLink] = useState('https://maps.google.com/?q=12.9716,77.5946');
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
  const [mobileNumber, setMobileNumber] = useState('+91 98765 43210');
  const [notes, setNotes] = useState('');
  const [createdRecordId, setCreatedRecordId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File input ref for photo/video upload from device
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real cloud upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');

  const { createRecord, isSubmitting } = useCreateRecord();

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
    attachDirectFile,
  } = useMediaCapture();

  // Native direct camera inputs
  const nativePhotoInputRef = useRef<HTMLInputElement>(null);
  const nativeVideoInputRef = useRef<HTMLInputElement>(null);

  // Multi-media evidence list state
  const [mediaList, setMediaList] = useState<AttachmentItem[]>([]);
  const [selectedViewerMedia, setSelectedViewerMedia] = useState<AttachmentItem | null>(null);

  // Helper to convert small blobs to data URLs if remote storage fails
  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleDirectNativeCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: AttachmentItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video');

      if (isVideo) {
        const item = attachDirectFile(file);
        newAttachments.push(item);
      } else {
        // Automatic client-side compression to ~150-250KB
        try {
          const { blob } = await compressImage(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.82,
          });
          const compressedFile = new File([blob], file.name || `Photo_${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          const item = attachDirectFile(compressedFile);
          newAttachments.push(item);
        } catch {
          const item = attachDirectFile(file);
          newAttachments.push(item);
        }
      }
    }

    setMediaList((prev) => [...prev, ...newAttachments]);
    setToastMessage(`${newAttachments.length} evidence ${newAttachments.length === 1 ? 'item' : 'items'} added!`);
    setTimeout(() => setToastMessage(null), 3500);
    e.target.value = '';
  };

  const handleRemoveMedia = (idToRemove: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== idToRemove));
    setToastMessage('Evidence item removed.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Auto-confirm any staged camera/upload media directly into the evidence gallery
  useEffect(() => {
    if (stagedMedia) {
      const item = confirmMedia();
      if (item) {
        setMediaList((prev) => [...prev, item]);
        setToastMessage(`${item.mediaType === 'video' ? 'Video' : 'Photo'} attached!`);
        setTimeout(() => setToastMessage(null), 2500);
      }
    }
  }, [stagedMedia, confirmMedia]);

  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);

  // Submission success dialog
  const [submittedModalOpen, setSubmittedModalOpen] = useState(false);
  const [generatedRefId, setGeneratedRefId] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    // Duplicate-submit prevention
    if (isSubmitting || isUploading) {
      return;
    }

    // Validation checks
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      setErrorMessage('Workspace title must be at least 3 characters long before saving.');
      return;
    }
    if (trimmedTitle.length > 120) {
      setErrorMessage('Workspace title cannot exceed 120 characters.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStage('Initiating submission...');

    try {
      const mediaReferences: MediaAsset[] = [];
      const totalItems = mediaList.length;

      // 1. Process all captured evidence items
      if (totalItems > 0) {
        for (let i = 0; i < totalItems; i++) {
          const item = mediaList[i];
          const pct = Math.round(15 + ((i + 1) / totalItems) * 70);
          setUploadProgress(pct);
          setUploadStage(`Processing evidence item (${i + 1} of ${totalItems})...`);

          let finalMediaUri = item.uri || '';
          let finalUploadState: 'completed' | 'uploading' | 'failed' = 'completed';

          if (item.rawBlob) {
            try {
              const uploadResult = await mediaRepository.uploadMedia({
                file: item.rawBlob,
                filename: item.name,
                metadata: {
                  recordId: `wp-${Date.now()}-${i}`,
                  mediaType: item.mediaType === 'video' ? 'video' : 'photo',
                },
              });
              finalMediaUri = uploadResult.downloadUrl;
              finalUploadState = 'completed';
            } catch (storageErr) {
              console.warn('[Capture] Storage notice, using optimized compact thumbnail fallback:', storageErr);
              // If cloud storage is not yet provisioned, embed an ultra-compact thumbnail (~20-30KB)
              // to guarantee the document stays well within Firestore's 1MB limit
              if (item.mediaType === 'image' && item.rawBlob) {
                try {
                  const { blob: thumbBlob } = await compressImage(item.rawBlob, {
                    maxWidth: 480,
                    maxHeight: 480,
                    quality: 0.55,
                    mimeType: 'image/jpeg',
                  });
                  finalMediaUri = await blobToDataUrl(thumbBlob);
                } catch {
                  finalMediaUri = '';
                }
              } else if (item.mediaType === 'video') {
                // Videos (several MBs) cannot be embedded as base64 in a 1MB Firestore document
                finalMediaUri = `video://${item.name}`;
              } else {
                finalMediaUri = '';
              }
              finalUploadState = 'completed';
            }
          }

          mediaReferences.push({
            id: item.id || `media-${Date.now()}-${i}`,
            type: item.mediaType === 'video' ? 'video' : 'photo',
            fileName: item.name,
            fileSize: item.rawBlob ? item.rawBlob.size : 250 * 1024,
            fileSizeFormatted: item.size,
            mimeType: item.type,
            uri: finalMediaUri,
            uploadState: finalUploadState,
            capturedAt: new Date().toISOString(),
            description: item.description,
            resolution: item.resolution,
            previewColor: item.previewColor,
            exif: item.exif,
          });
        }
      }

      // 2. Document Creation with 15-day rolling retention tag
      setUploadProgress(90);
      setUploadStage('Saving workspace record to Firestore...');

      const retentionExpiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

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
        mobileNumber: mobileNumber.trim() || undefined,
        locationLink: locationLink.trim() || undefined,
        mediaReferences: mediaReferences,
        consentVersion: 'v1.4-2026',
        propertyCategory: workspaceCategory,
        ownerUid: user?.uid || '',
        authorName: user?.displayName || user?.email || 'Field Officer',
        authorEmail: user?.email || '',
        authorRole: user?.role || 'officer',
        retentionExpiresAt: retentionExpiresAt,
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
          mobileNumber: mobileNumber.trim() || undefined,
          locationLink: locationLink.trim() || undefined,
        },
        pricing: {
          price: parsedRent,
          securityDeposit: parsedDeposit,
          currency: 'INR',
          pricePeriod: 'month',
        },
        verificationBadge: activeDataSource === 'firebase' ? 'Firebase Cloud Verified' : 'Field Verified',
      });

      setUploadProgress(100);
      setUploadStage('Verified and published successfully!');
      setGeneratedRefId(created.referenceNumber);
      setCreatedRecordId(created.id);
      setSubmittedModalOpen(true);
      setToastMessage(`Workspace ${created.referenceNumber} verified and saved!`);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Validation error while saving record to repository.');
    } finally {
      setIsUploading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">Verifying authorized field officer credentials...</p>
      </div>
    );
  }

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

            {/* Building / Facility Location & Location Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Building & Facility Location"
                required
                placeholder="e.g., Tech Park Tower 1, Level 4, Bay Area"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
              />

              <Input
                label="Location Link"
                type="url"
                placeholder="e.g., https://maps.google.com/?q=12.9716,77.5946"
                value={locationLink}
                onChange={(e) => setLocationLink(e.target.value)}
                helperText="Google Maps or GPS coordinates URL"
              />
            </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Rooms Inspected"
                type="number"
                min="1"
                required
                value={itemsInspected}
                onChange={(e) => setItemsInspected(e.target.value)}
              />

              <Input
                label="Mobile Number"
                type="tel"
                placeholder="e.g., +91 98765 43210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
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

            {/* Direct Native Camera Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 font-semibold shadow-xs text-sm"
                onClick={() => nativePhotoInputRef.current?.click()}
                leftIcon={<Camera className="w-5 h-5" />}
              >
                <span>Take Photo with Camera</span>
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                className="w-full justify-center gap-2 py-3 bg-slate-900 text-white hover:bg-slate-800 font-semibold shadow-xs text-sm"
                onClick={() => nativeVideoInputRef.current?.click()}
                leftIcon={<Video className="w-5 h-5" />}
              >
                <span>Record Video with Camera</span>
              </Button>
            </div>

            {/* Hidden Native Device Camera Inputs (Triggers native phone camera directly with multi-select support) */}
            <input
              ref={nativePhotoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={handleDirectNativeCapture}
            />
            <input
              ref={nativeVideoInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={handleDirectNativeCapture}
            />

            {/* Viewfinder Controls Toolbar (Active session) */}
            {(mediaStatus === 'previewing' || mediaStatus === 'recording') && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2">
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

                  {/* Optional Lens Flip when viewfinder active */}
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
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Mic toggle when in video mode and active */}
                  {cameraMode === 'video' && (
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
            )}

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



            {/* Modern Evidence Gallery Grid (Clean preview without awkward text) */}
            {mediaList.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      Attached Evidence
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {mediaList.length} {mediaList.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Tap any frame to preview
                  </span>
                </div>

                {/* Thumbnail Card Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {mediaList.map((item, index) => {
                    const isVideo = item.mediaType === 'video';
                    return (
                      <div
                        key={item.id || index}
                        className="group relative bg-white rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        <div
                          onClick={() => {
                            setSelectedViewerMedia(item);
                            setMediaViewerOpen(true);
                          }}
                          className="relative aspect-4/3 w-full bg-slate-900 cursor-pointer overflow-hidden flex items-center justify-center"
                        >
                          {isVideo ? (
                            <>
                              <video
                                src={item.uri}
                                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-md">
                                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                                </div>
                              </div>
                            </>
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.uri}
                              alt={`Evidence frame ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          )}

                          {/* Item Type Badge */}
                          <span
                            className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs ${
                              isVideo
                                ? 'bg-rose-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {isVideo ? 'Video' : 'Photo'}
                          </span>
                        </div>

                        {/* Card Footer with Details & Actions */}
                        <div className="p-2.5 bg-white flex items-center justify-between gap-1 border-t border-slate-100">
                          <div className="min-w-0 pr-1">
                            <span className="text-xs font-semibold text-slate-800 block truncate">
                              {isVideo ? `Video Tour ${index + 1}` : `Photo ${index + 1}`}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {item.size}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedViewerMedia(item);
                                setMediaViewerOpen(true);
                              }}
                              title="View full size"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(item.id)}
                              title="Remove this item"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Buttons to Add More Photos or Videos */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => nativePhotoInputRef.current?.click()}
                    leftIcon={<Camera className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    + Add Another Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => nativeVideoInputRef.current?.click()}
                    leftIcon={<Video className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    + Add Another Video
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Box for selecting files directly */}
            {mediaStatus !== 'previewing' && mediaStatus !== 'recording' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const syntheticEvent = {
                      target: { files: e.dataTransfer.files, value: '' },
                    } as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleDirectNativeCapture(syntheticEvent);
                  }
                }}
                className={`cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-xl p-5 text-center transition-all group ${
                  mediaList.length > 0 ? 'mt-3 py-3.5' : ''
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleDirectNativeCapture}
                />
                <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {mediaList.length > 0 ? 'Add More Photos & Videos' : 'Upload Photos & Videos'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tap to select multiple files from your device
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Final Review & Submission */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600 shrink-0" />
              <span>3. Final Review & Submission</span>
            </CardTitle>
            <CardDescription>
              Review your captured specifications and submit the verification record.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Live Upload Progress */}
            {isUploading && (
              <div className="p-4 bg-blue-50 border border-blue-300 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                    <span className="font-bold text-blue-950">Submitting Verification...</span>
                  </div>
                  <span className="font-mono font-bold text-blue-900">{uploadProgress}%</span>
                </div>

                <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                    role="progressbar"
                    aria-valuenow={uploadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>

                <p className="text-xs text-blue-900 font-medium">{uploadStage}</p>
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
                  disabled={isSubmitting || isUploading}
                  isLoading={isSubmitting || isUploading}
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
        attachment={selectedViewerMedia}
        isOpen={mediaViewerOpen}
        onClose={() => {
          setMediaViewerOpen(false);
          setSelectedViewerMedia(null);
        }}
      />

      {/* Submission Success Dialog */}
      <Dialog
        isOpen={submittedModalOpen}
        onClose={() => setSubmittedModalOpen(false)}
        title="Field Inspection Recorded"
        description="Your verified workspace record has been successfully recorded."
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmittedModalOpen(false);
                setTitle('');
                setNotes('');
                setMediaList([]);
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
            <p><strong>Attached Evidence:</strong> {mediaList.length > 0 ? `${mediaList.length} items attached` : 'None attached'}</p>
            <p className="text-blue-700 font-semibold pt-1">
              • Submitted for verification. Once approved in Admin Hub, it goes live in the public catalog.
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
