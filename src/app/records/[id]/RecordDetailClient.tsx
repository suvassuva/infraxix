'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Printer,
  Download,
  Building,
  User,
  MapPin,
  Clock,
  Check,
  Flag,
  Camera,
  Film,
  Eye,
  Navigation,
  ShieldCheck,
  Pencil,
  Trash2,
  AlertTriangle,
  Maximize2,
  Layers,
  Ruler,
  Zap,
  Car,
  Bath,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { MediaViewer } from '@/components/ui/MediaViewer';
import { useRecord } from '@/hooks/useRecords';
import { useAuth } from '@/hooks/useAuth';
import { RecordStatus, RecordPriority, AttachmentItem } from '@/types';

export default function RecordDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const isOfficer = user?.role === 'officer';
  const { record, isLoading, error, updateRecord, deleteRecord, approveRecord, flagRecord } = useRecord(id);

  // Dialog & Media state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [supervisorNote, setSupervisorNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Edit record states (11 Core Commercial Workspace Parameters)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState<RecordPriority>('medium');
  const [editArea, setEditArea] = useState('');
  const [editFloorNumber, setEditFloorNumber] = useState('');
  const [editTotalFloors, setEditTotalFloors] = useState('');
  const [editRent, setEditRent] = useState('');
  const [editDeposit, setEditDeposit] = useState('');
  const [editClearHeight, setEditClearHeight] = useState('');
  const [editBeamHeight, setEditBeamHeight] = useState('');
  const [editWashrooms, setEditWashrooms] = useState('');
  const [editPowerBackup, setEditPowerBackup] = useState('100% DG Backup');
  const [editParkingSpaces, setEditParkingSpaces] = useState('');
  const [editCapacitySeats, setEditCapacitySeats] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editMobileNumber, setEditMobileNumber] = useState('');
  const [editLocationLink, setEditLocationLink] = useState('');
  const [editSupervisorNote, setEditSupervisorNote] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete record confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Media Viewer lightbox state
  const [activeMedia, setActiveMedia] = useState<AttachmentItem | null>(null);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);

  // Map view toggle simulation
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite'>('streets');

  const handleOpenMedia = (item: AttachmentItem) => {
    setActiveMedia(item);
    setMediaViewerOpen(true);
  };

  const handleOpenEdit = () => {
    if (!record) return;
    setEditTitle(record.title || '');
    setEditCategory(record.category || 'Meeting Room');
    setEditPriority(record.priority || 'medium');
    setEditNotes(record.notes || '');
    setEditMobileNumber(record.mobileNumber || record.specs?.mobileNumber || '');
    setEditLocationLink(record.locationLink || record.specs?.locationLink || '');

    // 11 Core Commercial Workspace Parameters
    setEditArea(record.specs?.areaSqFt ? String(record.specs.areaSqFt) : '');
    setEditFloorNumber(record.specs?.floorNumber !== undefined ? String(record.specs.floorNumber) : '');
    setEditTotalFloors(record.specs?.totalFloors !== undefined ? String(record.specs.totalFloors) : '');
    setEditRent(
      record.specs?.rent !== undefined
        ? String(record.specs.rent)
        : record.pricing?.price !== undefined
        ? String(record.pricing.price)
        : ''
    );
    setEditDeposit(
      record.specs?.deposit !== undefined
        ? String(record.specs.deposit)
        : record.pricing?.securityDeposit !== undefined
        ? String(record.pricing.securityDeposit)
        : ''
    );
    setEditClearHeight(record.specs?.clearHeightFt !== undefined ? String(record.specs.clearHeightFt) : '');
    setEditBeamHeight(record.specs?.beamHeightFt !== undefined ? String(record.specs.beamHeightFt) : '');
    setEditWashrooms(record.specs?.washrooms !== undefined ? String(record.specs.washrooms) : '');
    setEditPowerBackup(record.specs?.powerBackup || '100% DG Backup');
    setEditParkingSpaces(record.specs?.parkingSpaces !== undefined ? String(record.specs.parkingSpaces) : '');
    setEditCapacitySeats(record.specs?.capacitySeats !== undefined ? String(record.specs.capacitySeats) : '');

    // Location & Coordinates
    setEditAddress(record.location?.address || record.facility || '');
    setEditLat(record.location?.latitude !== undefined ? String(record.location.latitude) : '');
    setEditLng(record.location?.longitude !== undefined ? String(record.location.longitude) : '');

    setEditSupervisorNote('');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!record) return;
    setIsSavingEdit(true);
    try {
      const parsedRent = editRent ? parseInt(editRent, 10) : undefined;
      const parsedDeposit = editDeposit ? parseInt(editDeposit, 10) : undefined;
      const latNum = editLat ? parseFloat(editLat) : undefined;
      const lngNum = editLng ? parseFloat(editLng) : undefined;
      const hasValidCoords =
        latNum !== undefined &&
        lngNum !== undefined &&
        !isNaN(latNum) &&
        !isNaN(lngNum);

      await updateRecord({
        title: editTitle.trim() || record.title,
        notes: editNotes,
        priority: editPriority,
        facility: editAddress.trim() || record.facility,
        category: editCategory,
        mobileNumber: editMobileNumber.trim() || undefined,
        locationLink: editLocationLink.trim() || undefined,
        specs: {
          areaSqFt: editArea ? parseInt(editArea, 10) : record.specs?.areaSqFt || 0,
          floorNumber: editFloorNumber ? parseInt(editFloorNumber, 10) : undefined,
          totalFloors: editTotalFloors ? parseInt(editTotalFloors, 10) : undefined,
          rent: parsedRent,
          deposit: parsedDeposit,
          clearHeightFt: editClearHeight ? parseFloat(editClearHeight) : undefined,
          beamHeightFt: editBeamHeight ? parseFloat(editBeamHeight) : undefined,
          washrooms: editWashrooms ? parseInt(editWashrooms, 10) : undefined,
          powerBackup: editPowerBackup.trim() || undefined,
          parkingSpaces: editParkingSpaces ? parseInt(editParkingSpaces, 10) : undefined,
          capacitySeats: editCapacitySeats ? parseInt(editCapacitySeats, 10) : undefined,
          mobileNumber: editMobileNumber.trim() || undefined,
          locationLink: editLocationLink.trim() || undefined,
        },
        pricing: {
          price: parsedRent,
          securityDeposit: parsedDeposit,
          currency: 'INR',
          pricePeriod: 'month',
        },
        location: hasValidCoords
          ? {
              latitude: latNum!,
              longitude: lngNum!,
              address: editAddress.trim() || record.location?.address || record.facility,
              accuracyMeters: record.location?.accuracyMeters || 2.5,
              capturedAt: record.location?.capturedAt || new Date().toISOString(),
            }
          : undefined,
        supervisorNote: editSupervisorNote ? `[Edit Workspace Specs] ${editSupervisorNote}` : undefined,
        reviewerName: 'Field Inspector (Demo Editor)',
      });
      setEditDialogOpen(false);
      setToastMessage(`Workspace ${record.referenceNumber} specifications updated successfully.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      alert('Failed to update workspace record specifications.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!record) return;
    setIsDeleting(true);
    try {
      await deleteRecord();
      setDeleteDialogOpen(false);
      router.push('/');
    } catch {
      alert('Failed to delete record from mock ledger.');
      setIsDeleting(false);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approveRecord(supervisorNote || 'Passed all verification checks.');
      setApproveDialogOpen(false);
      setSupervisorNote('');
      setToastMessage(`Record ${record?.referenceNumber} certified & verified.`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlag = async () => {
    setIsProcessing(true);
    try {
      await flagRecord(supervisorNote || 'Discrepancy noted during audit review.');
      setFlagDialogOpen(false);
      setSupervisorNote('');
      setToastMessage(`Record ${record?.referenceNumber} flagged for urgent remediation.`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-500 animate-pulse">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-medium text-slate-700">Loading inspection record from service layer...</p>
        <p className="text-xs text-slate-400 mt-1">Reading in-memory local repository</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-600">
        <h2 className="text-xl font-bold text-slate-900">Record Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          {error?.message || `Record with ID "${id}" could not be located in local memory.`}
        </p>
        <div className="mt-6">
          <Link href="/">
            <Button variant="outline" size="md">
              Return to Workspaces
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6 min-w-0 overflow-hidden">
      {/* Top Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspaces</span>
        </Link>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => alert(`Demo notice: Full compliance audit dossier for ${record.referenceNumber} exported.`)}
          >
            Export Dossier
          </Button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center justify-between gap-3 text-xs font-medium shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
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

      {/* Main Header Card */}
      <Card className="bg-white overflow-hidden border-slate-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              {/* Top Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white bg-blue-600 px-2.5 py-0.5 rounded">
                  {record.listingType?.toUpperCase() || 'RENT'}
                </span>
                <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                  {record.propertyCategory || record.category}
                </span>
              </div>

              {/* Title & Price */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-1">
                <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {record.title}
                </h1>
                <div className="flex flex-col sm:items-end shrink-0">
                  <div className="text-xl sm:text-3xl font-black text-blue-600">
                    {record.specs?.rent || record.pricing?.price
                      ? `₹${(record.specs?.rent || record.pricing?.price || 0).toLocaleString('en-IN')}/mo`
                      : 'Rent on Request'}
                  </div>
                  {(record.specs?.deposit || record.pricing?.securityDeposit) && (
                    <span className="text-xs font-semibold text-slate-500">
                      ₹{(record.specs?.deposit || record.pricing?.securityDeposit || 0).toLocaleString('en-IN')} Security Deposit
                    </span>
                  )}
                </div>
              </div>

              {/* Doorstep Address & Inspector */}
              <div className="text-sm text-slate-500 flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  {record.location?.address || record.facility}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  Verified by {record.capturedBy.name} ({record.capturedBy.role})
                </span>
              </div>

              {/* Core 11 Commercial Workspace Specifications Grid */}
              <div className="pt-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Verified Workspace Specifications (11 Parameters)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {/* Area */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Maximize2 className="w-3 h-3 text-blue-600" /> Area
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {record.specs?.areaSqFt ? `${record.specs.areaSqFt.toLocaleString()} sqft` : '—'}
                    </span>
                  </div>

                  {/* Floor */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-600" /> Floor
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {record.specs?.floorNumber !== undefined
                        ? record.specs.totalFloors
                          ? `Floor ${record.specs.floorNumber} of ${record.specs.totalFloors}`
                          : `Floor ${record.specs.floorNumber}`
                        : '—'}
                    </span>
                  </div>

                  {/* Clear Height */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Ruler className="w-3 h-3 text-emerald-600" /> Clear Ceiling Ht
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {record.specs?.clearHeightFt ? `${record.specs.clearHeightFt} ft` : '—'}
                    </span>
                  </div>

                  {/* Beam / Bheem Height */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Ruler className="w-3 h-3 text-emerald-600" /> Beam (Bheem) Ht
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {record.specs?.beamHeightFt ? `${record.specs.beamHeightFt} ft` : '—'}
                    </span>
                  </div>

                  {/* Washrooms */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Bath className="w-3 h-3 text-cyan-600" /> Washrooms
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {record.specs?.washrooms !== undefined ? `${record.specs.washrooms} WC` : '—'}
                    </span>
                  </div>

                  {/* Power Backup */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" /> Power Backup
                    </span>
                    <span className="font-bold text-slate-900 text-xs truncate block" title={record.specs?.powerBackup || 'None'}>
                      {record.specs?.powerBackup || '—'}
                    </span>
                  </div>

                  {/* Parking Spaces */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Car className="w-3 h-3 text-purple-600" /> Parking Slots
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {record.specs?.parkingSpaces !== undefined ? `${record.specs.parkingSpaces} slot(s)` : '—'}
                    </span>
                  </div>

                  {/* Lat / Long Coordinates */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-blue-600" /> Lat / Long (GPS)
                    </span>
                    <span className="font-mono text-slate-800 text-[11px] truncate block">
                      {record.location?.latitude !== undefined && record.location?.longitude !== undefined
                        ? `${record.location.latitude.toFixed(4)}°, ${record.location.longitude.toFixed(4)}°`
                        : 'Pending GPS'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isOfficer ? (
              <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-slate-700 border-slate-300 hover:bg-slate-50"
                  leftIcon={<Pencil className="w-4 h-4" />}
                  onClick={handleOpenEdit}
                >
                  Edit My Submission
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap sm:flex-nowrap md:flex-col gap-2 shrink-0 w-full md:w-auto">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Check className="w-4 h-4" />}
                  onClick={() => setApproveDialogOpen(true)}
                >
                  Certify & Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-slate-700 border-slate-300 hover:bg-slate-50"
                  leftIcon={<Pencil className="w-4 h-4" />}
                  onClick={handleOpenEdit}
                >
                  Edit Workspace (11 Specs)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-700 border-amber-200 hover:bg-amber-50"
                  leftIcon={<Flag className="w-4 h-4" />}
                  onClick={() => setFlagDialogOpen(true)}
                >
                  Flag Discrepancy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete Record
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid: Details & Metrics (2/3) + Timeline (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compliance Metrics & Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-2xl font-bold text-slate-900">
                    {record.metrics.complianceScore}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Compliance Grade</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="block text-2xl font-bold text-slate-900">
                    {record.metrics.itemsInspected}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Items Inspected</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className={`block text-2xl font-bold ${record.metrics.defectsFound > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {record.metrics.defectsFound}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Defects Found</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inspector Observations & Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Field Notes & Observations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                {record.notes}
              </p>

              <div className="pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Tags & Taxonomy
                </span>
                <div className="flex flex-wrap gap-2">
                  {record.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geolocation & Mock Coordinates Box */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Physical Location & Coordinates
              </CardTitle>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setMapLayer('streets')}
                  className={`px-2 py-0.5 rounded font-medium ${mapLayer === 'streets' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'}`}
                >
                  Cadastral
                </button>
                <button
                  type="button"
                  onClick={() => setMapLayer('satellite')}
                  className={`px-2 py-0.5 rounded font-medium ${mapLayer === 'satellite' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'}`}
                >
                  Satellite
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {record.location ? (
                <>
                  {/* Simulated Map Viewport */}
                  <div
                    className={`relative aspect-video max-h-48 w-full rounded-xl overflow-hidden border border-slate-300 flex flex-col justify-between p-4 text-white ${
                      mapLayer === 'satellite'
                        ? 'bg-slate-900 [background-image:radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px]'
                        : 'bg-slate-100 [background-image:linear-gradient(#cbd5e1_1px,transparent_1px),linear-gradient(90deg,#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] text-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start text-[11px] font-mono">
                      <span className="bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-xs">
                        MAP GRID • WGS 84
                      </span>
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-sans">
                        Bay Area Facility Gate
                      </span>
                    </div>

                    <div className="flex flex-col items-center my-auto">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg ring-4 ring-blue-400/30 animate-bounce">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold mt-1 bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-xs">
                        {record.location.address || 'Facility Inspection Site'}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] font-mono bg-black/60 text-white p-1.5 rounded backdrop-blur-xs">
                      <span>LAT: {record.location.latitude}° N</span>
                      <span>LNG: {record.location.longitude}° W</span>
                      <span>ACC: ±{record.location.accuracyMeters}m</span>
                    </div>
                  </div>

                  {/* Coordinates table */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-500 block">Reported Doorstep Address:</span>
                      <span className="font-semibold text-slate-900">{record.location.address || record.facility}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">GPS Uncertainty Radius:</span>
                      <span className="font-semibold text-emerald-700">±{record.location.accuracyMeters.toFixed(1)}m (Verified On-Site)</span>
                    </div>
                  </div>

                  {/* External Google Maps Verification Link */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      Cryptographic GPS proof locked directly at doorstep
                    </span>
                    <a
                      href={record.locationLink || `https://maps.google.com/?q=${record.location.latitude},${record.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Verify Coordinates on Google Maps
                    </a>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 space-y-3">
                  <MapPin className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">No GPS Coordinates Recorded</p>
                    <p className="text-slate-500">
                      This inspection was submitted without physical device GPS lock.
                    </p>
                  </div>
                  {record.locationLink && (
                    <div className="pt-2">
                      <a
                        href={record.locationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white px-3.5 py-2 rounded-lg border border-blue-200 shadow-xs transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Open Provided Location Link
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supporting Evidence Attachments & Media Viewer Launchers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Evidence Files & Media ({record.attachments?.length ?? record.mediaReferences.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {(record.attachments ??
                  record.mediaReferences.map(
                    (m): AttachmentItem => ({
                      id: m.id,
                      name: m.fileName,
                      size: m.fileSizeFormatted,
                      type: m.mimeType,
                      mediaType: m.type === 'video' ? 'video' : m.type === 'pdf' ? 'pdf' : 'image',
                      uploadState: m.uploadState,
                      description: m.description,
                      resolution: m.resolution,
                      duration: m.duration,
                      previewColor: m.previewColor,
                      exif: m.exif,
                    })
                  )
                ).map((att: AttachmentItem) => (
                  <div
                    key={att.id}
                    className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        {att.mediaType === 'image' && <Camera className="w-4 h-4" />}
                        {att.mediaType === 'video' && <Film className="w-4 h-4" />}
                        {att.mediaType === 'pdf' && <FileText className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 truncate">{att.name}</p>
                          {(att.uploadState === 'failed' || att.status === 'failed') && (
                            <Badge variant="error">Upload Failed</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {att.size} • {att.mediaType.toUpperCase()}
                          {att.resolution && ` • ${att.resolution}`}
                          {att.duration && ` • ${att.duration}`}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenMedia(att)}
                    >
                      Open Viewer
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Detailed Timestamps & Audit Timeline */}
        <div className="space-y-6">
          {/* Detailed Timestamps Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Verified Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Captured At:</span>
                <span className="font-mono font-medium text-slate-900">
                  {new Date(record.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Reviewed At:</span>
                <span className="font-mono font-medium text-slate-900">
                  {record.reviewedAt ? new Date(record.reviewedAt).toLocaleString() : 'Pending signoff'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Certified At:</span>
                <span className="font-mono font-medium text-slate-900">
                  {record.certifiedAt ? new Date(record.certifiedAt).toLocaleString() : 'Uncertified'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Local Integrity:</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  SHA-256 Validated
                </span>
              </div>
            </CardContent>
          </Card>



          {/* Inspector Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inspector Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Name:</span>
                <span className="font-medium text-slate-900">{record.capturedBy.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Role:</span>
                <span className="font-medium text-slate-900">{record.capturedBy.role}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-600">{record.capturedBy.email}</span>
              </div>
              {record.mobileNumber && (
                <div className="flex justify-between py-1 border-t border-slate-100">
                  <span className="text-slate-500">Mobile:</span>
                  <span className="font-mono text-slate-800 font-medium">{record.mobileNumber}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Media Viewer Modal Lightbox */}
      <MediaViewer
        attachment={activeMedia}
        isOpen={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
      />

      {/* Approve Modal Dialog */}
      <Dialog
        isOpen={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        title="Certify Field Verification Record"
        description={`You are validating ${record.referenceNumber} for permanent compliance archiving.`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isProcessing}
              onClick={handleApprove}
            >
              Sign & Confirm Approval
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Supervisor Sign-off Note"
            placeholder="Add any verification remarks or approval conditions..."
            value={supervisorNote}
            onChange={(e) => setSupervisorNote(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            This action will update the record status to <strong>Verified</strong> in the local demo state.
          </p>
        </div>
      </Dialog>

      {/* Flag Discrepancy Modal Dialog */}
      <Dialog
        isOpen={flagDialogOpen}
        onClose={() => setFlagDialogOpen(false)}
        title="Flag Discrepancy or Safety Violation"
        description={`Flagging ${record.referenceNumber} will escalate this item for urgent remediation.`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setFlagDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isProcessing}
              onClick={handleFlag}
            >
              Confirm Flag & Escalate
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Reason for Discrepancy Flag"
            required
            placeholder="Describe the defect, missing document, or hazard requiring resolution..."
            value={supervisorNote}
            onChange={(e) => setSupervisorNote(e.target.value)}
          />
          <p className="text-xs text-rose-600 font-medium">
            The status will be updated to <strong>Flagged Urgent</strong>.
          </p>
        </div>
      </Dialog>

      {/* Edit Workspace Specifications Modal Dialog */}
      <Dialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Edit Workspace Specifications (11 Parameters)"
        description={`Modify commercial specifications, physical clearance, and coordinates for ${record.referenceNumber}.`}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSavingEdit}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSavingEdit}
              onClick={handleSaveEdit}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Workspace Title / Name"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <Select
              label="Workspace Category"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
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

          {/* Row 1: Area, Rent, Deposit */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
              1. Commercials & Area
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Area (SqFt)"
                type="number"
                min="1"
                required
                placeholder="e.g. 1200"
                value={editArea}
                onChange={(e) => setEditArea(e.target.value)}
              />
              <Input
                label="Monthly Rent (₹)"
                type="number"
                min="0"
                placeholder="e.g. 65000"
                value={editRent}
                onChange={(e) => setEditRent(e.target.value)}
              />
              <Input
                label="Security Deposit (₹)"
                type="number"
                min="0"
                placeholder="e.g. 195000"
                value={editDeposit}
                onChange={(e) => setEditDeposit(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Floor, Total Floors, Parking */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
              2. Floor & Parking Layout
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Floor Number"
                type="number"
                placeholder="e.g. 2"
                value={editFloorNumber}
                onChange={(e) => setEditFloorNumber(e.target.value)}
              />
              <Input
                label="Total Building Floors"
                type="number"
                placeholder="e.g. 6"
                value={editTotalFloors}
                onChange={(e) => setEditTotalFloors(e.target.value)}
              />
              <Input
                label="Parking Spaces (Slots)"
                type="number"
                min="0"
                placeholder="e.g. 2"
                value={editParkingSpaces}
                onChange={(e) => setEditParkingSpaces(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Clear Height, Beam / Bheem Height, Washrooms */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
              3. Vertical Clearances & Washrooms
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Clear Ceiling Height (ft)"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 12.0"
                value={editClearHeight}
                onChange={(e) => setEditClearHeight(e.target.value)}
                helperText="Clear height to ceiling"
              />
              <Input
                label="Beam (Bheem) Height (ft)"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 10.5"
                value={editBeamHeight}
                onChange={(e) => setEditBeamHeight(e.target.value)}
                helperText="Clear height under beam"
              />
              <Input
                label="Washrooms Count"
                type="number"
                min="0"
                placeholder="e.g. 2"
                value={editWashrooms}
                onChange={(e) => setEditWashrooms(e.target.value)}
                helperText="Available washrooms"
              />
            </div>
          </div>

          {/* Row 4: Power Backup, Capacity Seats, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Power Backup System"
              value={editPowerBackup}
              onChange={(e) => setEditPowerBackup(e.target.value)}
              options={[
                { value: '100% DG Backup', label: '100% DG Backup' },
                { value: 'Partial DG Backup', label: 'Partial DG Backup' },
                { value: 'UPS + DG Backup', label: 'UPS + DG Backup' },
                { value: 'Dedicated Generator', label: 'Dedicated Generator' },
                { value: 'None', label: 'None' },
              ]}
            />
            <Input
              label="Seating Capacity (Seats)"
              type="number"
              min="1"
              value={editCapacitySeats}
              onChange={(e) => setEditCapacitySeats(e.target.value)}
            />
            <Select
              label="Priority Level"
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as RecordPriority)}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
            />
            <Input
              label="Mobile Number"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={editMobileNumber}
              onChange={(e) => setEditMobileNumber(e.target.value)}
            />
          </div>

          {/* Row 5: Location & Coordinates (Lat / Long) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
              4. Location & Geographic Coordinates
            </span>
            <Input
              label="Doorstep / Facility Address"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="e.g. Tech Park Tower 1, Level 4"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Latitude (WGS84)"
                type="number"
                step="0.000001"
                placeholder="e.g. 37.774900"
                value={editLat}
                onChange={(e) => setEditLat(e.target.value)}
              />
              <Input
                label="Longitude (WGS84)"
                type="number"
                step="0.000001"
                placeholder="e.g. -122.419400"
                value={editLng}
                onChange={(e) => setEditLng(e.target.value)}
              />
            </div>
            <Input
              label="Location Link (Map / GPS URL)"
              type="url"
              placeholder="e.g. https://maps.google.com/?q=..."
              value={editLocationLink}
              onChange={(e) => setEditLocationLink(e.target.value)}
            />
          </div>

          {/* Field Notes & Audit Remark */}
          <Textarea
            label="Field Notes & Observations"
            required
            rows={3}
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Record detailed onsite findings, metrology tolerances, or condition notes..."
          />

          <Textarea
            label="Audit Revision Remark (Optional)"
            rows={2}
            value={editSupervisorNote}
            onChange={(e) => setEditSupervisorNote(e.target.value)}
            placeholder="Context for this edit to be logged in the audit trail..."
          />

          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
            <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Updates to workspace specifications, financials, and coordinates are logged to the cryptographic timeline ledger.
            </p>
          </div>
        </div>
      </Dialog>

      {/* Delete Record Confirmation Dialog */}
      <Dialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Confirm Record Deletion"
        description="This action will delete the inspection from the local mock ledger."
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteRecord}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Permanently Delete Record
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-950">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-rose-900 text-sm">
                Permanently delete {record.referenceNumber}?
              </p>
              <p className="text-rose-800 leading-relaxed">
                Title: <strong>{record.title}</strong>
              </p>
              <p className="text-rose-700 text-[11px]">
                This will remove all associated optical attachments, GPS fixes, and audit timeline logs from this local session.
              </p>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
