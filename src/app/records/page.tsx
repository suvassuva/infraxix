'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  PlusCircle,
  Download,
  LayoutGrid,
  List,
  Eye,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  MapPin,
  Compass,
  ShieldCheck,
  Video,
  Camera,
  Map,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { useRecords } from '@/hooks/useRecords';
import { useAuth } from '@/hooks/useAuth';
import { RecordStatus, ListingType, CaptureRecord } from '@/types';

export default function RecordsPage() {
  const { user } = useAuth();
  const isOfficer = user?.role === 'officer';
  const [searchTerm, setSearchTerm] = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState<ListingType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score' | 'price_low' | 'price_high'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'map'>('grid');

  // Map view selected property
  const [selectedMapProperty, setSelectedMapProperty] = useState<CaptureRecord | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  // Batch selection demo state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Query records via service hook
  const {
    records,
    totalCount,
    totalPages,
    page: safeCurrentPage,
  } = useRecords({
    searchTerm: searchTerm || undefined,
    listingType: listingTypeFilter,
    propertyCategory: categoryFilter !== 'all' ? categoryFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    status: statusFilter !== 'all' ? (statusFilter as RecordStatus) : undefined,
    priority: priorityFilter !== 'all' ? (priorityFilter as 'low' | 'medium' | 'high' | 'urgent') : undefined,
    ownerUid: isOfficer ? (user?.uid || 'mock-usr-officer-001') : undefined,
    sortBy,
    page: currentPage,
    pageSize,
  });

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedRecords = records;

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val);
    setCurrentPage(1);
  };

  const handlePriorityChange = (val: string) => {
    setPriorityFilter(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (val: number) => {
    setPageSize(val);
    setCurrentPage(1);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRecords.map((r) => r.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const getStatusBadge = (status: RecordStatus) => {
    switch (status) {
      case 'verified':
        return <Badge variant="success" dot>GPS Verified</Badge>;
      case 'pending':
        return <Badge variant="pending" dot>Pending GPS Lock</Badge>;
      case 'flagged':
        return <Badge variant="error" dot>Flagged (Retry)</Badge>;
      case 'rejected':
        return <Badge variant="neutral">Rejected</Badge>;
      default:
        return <Badge variant="neutral">Draft</Badge>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6 min-w-0 overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {isOfficer ? 'My Submissions Ledger' : 'Workspace Verification Ledger'}
            </h1>
            <Badge variant={isOfficer ? 'warning' : 'info'}>
              {isOfficer ? 'My Uploads Only' : 'Verified Registry'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {isOfficer
              ? 'Personal inspection log showing only records and commercial spaces captured by your officer account.'
              : 'Audit ledger of captured meeting rooms, private offices, and coworking facilities with verified hardware GPS telemetry.'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => {
              const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute('href', dataStr);
              downloadAnchor.setAttribute('download', `pvg_verified_workspaces_${Date.now()}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
          >
            Export Ledger
          </Button>

          <Link href="/capture" className="flex-1 sm:flex-none">
            <Button size="sm" className="w-full sm:w-auto" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Capture Workspace
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar Controls Card */}
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-2 md:col-span-4">
              <Input
                placeholder="Search title, address, agent, specs..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            {/* Category Select */}
            <div className="md:col-span-3">
              <Select
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                options={[
                  { value: 'all', label: 'All Workspaces' },
                  { value: 'Meeting Room', label: 'Meeting Room' },
                  { value: 'Private Office', label: 'Private Office' },
                  { value: 'Dedicated Desk', label: 'Dedicated Desk' },
                  { value: 'Coworking Floor', label: 'Coworking Floor' },
                  { value: 'Lab / Studio', label: 'Lab / Studio' },
                  { value: 'Executive Suite', label: 'Executive Suite' },
                ]}
              />
            </div>

            {/* Status Select */}
            <div className="md:col-span-2">
              <Select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'verified', label: 'GPS Verified' },
                  { value: 'pending', label: 'Pending Lock' },
                  { value: 'flagged', label: 'Flagged (Retry)' },
                ]}
              />
            </div>

            {/* Sort Select */}
            <div className="md:col-span-3">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                options={[
                  { value: 'newest', label: 'Sort: Newest' },
                  { value: 'oldest', label: 'Sort: Oldest' },
                  { value: 'score', label: 'Verification Score' },
                ]}
              />
            </div>
          </div>

          {/* Sub bar: View Mode Toggle & Active filter summary */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span>
                Found <strong>{totalCount}</strong> verified workspaces (Page {safeCurrentPage} of {totalPages})
              </span>
              {(searchTerm || listingTypeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setListingTypeFilter('all');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setCurrentPage(1);
                  }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              {/* Batch Actions Button */}
              {selectedIds.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => alert(`Simulated batch export/verification for ${selectedIds.length} properties.`)}
                >
                  Selected ({selectedIds.length})
                </Button>
              )}

              {/* View Toggle: Grid / Table / Map */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="Grid card view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="Table view"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'map'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label="Map view"
                >
                  <Map className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Map View</span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Depending on ViewMode */}
      {paginatedRecords.length === 0 ? (
        <EmptyState
          title="No verified properties found"
          description="Try modifying your search criteria or workspace category filter."
          actionLabel="Clear All Filters"
          onAction={() => {
            setSearchTerm('');
            setListingTypeFilter('all');
            setCategoryFilter('all');
            setStatusFilter('all');
            setCurrentPage(1);
          }}
        />
      ) : viewMode === 'grid' ? (
        /* GRID DECK VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedRecords.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE LEDGER VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="p-4 w-10">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {selectedIds.length === paginatedRecords.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Workspace & Location</th>
                  <th className="py-3 px-4">Rent & Deposit</th>
                  <th className="py-3 px-4">Area & Floor</th>
                  <th className="py-3 px-4">Clearance & Facilities</th>
                  <th className="py-3 px-4">Status & GPS</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.map((item) => {
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(item.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <Link
                            href={`/records/${item.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {item.title}
                          </Link>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.location?.address || item.facility}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {item.referenceNumber} • {item.category || item.propertyCategory}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-bold text-slate-900">
                          {item.specs?.rent || item.pricing?.price
                            ? `₹${(item.specs?.rent || item.pricing?.price || 0).toLocaleString('en-IN')}/mo`
                            : 'On Request'}
                        </div>
                        {(item.specs?.deposit || item.pricing?.securityDeposit) ? (
                          <div className="text-[11px] text-slate-500">
                            Dep: ₹{(item.specs?.deposit || item.pricing?.securityDeposit || 0).toLocaleString('en-IN')}
                          </div>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-slate-800">
                          {item.specs?.areaSqFt ? `${item.specs.areaSqFt.toLocaleString()} sqft` : '—'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.specs?.floorNumber !== undefined
                            ? item.specs.totalFloors
                              ? `Floor ${item.specs.floorNumber} / ${item.specs.totalFloors}`
                              : `Floor ${item.specs.floorNumber}`
                            : '—'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        <div>
                          Ht: {item.specs?.clearHeightFt ? `${item.specs.clearHeightFt}ft` : '—'}
                          {item.specs?.beamHeightFt ? ` (Beam: ${item.specs.beamHeightFt}ft)` : ''}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.specs?.washrooms !== undefined ? `${item.specs.washrooms} WC` : ''}
                          {item.specs?.washrooms !== undefined && item.specs?.parkingSpaces !== undefined ? ' • ' : ''}
                          {item.specs?.parkingSpaces !== undefined ? `${item.specs.parkingSpaces} Parking` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(item.status)}
                          {item.location?.latitude !== undefined && item.location?.longitude !== undefined && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {item.location.latitude.toFixed(4)}°, {item.location.longitude.toFixed(4)}°
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/records/${item.id}`}>
                          <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                            View / Edit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* INTERACTIVE GPS MAP VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                Doorstep GPS Telemetry Map
              </h3>
              <p className="text-xs text-slate-500">
                Visualizing physical GPS pins verified at each doorstep across Bay Area.
              </p>
            </div>
            <Badge variant="info">Sensor Map Sandbox</Badge>
          </div>

          {/* Map canvas simulation with pin markers */}
          <div className="relative w-full h-96 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 rounded-xl overflow-hidden p-6 border border-slate-800 shadow-inner flex flex-col justify-between">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

            {/* Top map telemetry indicator */}
            <div className="relative z-10 flex items-center justify-between text-xs text-white">
              <span className="bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs font-mono">
                CENTER: 37.7749° N, 122.4194° W • ZOOM 14X
              </span>
              <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full backdrop-blur-xs font-semibold">
                {paginatedRecords.filter((r) => r.location).length} GPS Doorstep Fixes Active
              </span>
            </div>

            {/* Pins on simulated map */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-4 my-auto">
              {paginatedRecords.map((item, idx) => {
                const hasLoc = Boolean(item.location);
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMapProperty(item)}
                    className="p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-left text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                        {item.listingType || 'RENT'}
                      </span>
                      {hasLoc ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                      )}
                    </div>
                    <p className="text-xs font-bold truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                      {item.location
                        ? `±${item.location.accuracyMeters.toFixed(1)}m • ${item.location.latitude.toFixed(3)}°`
                        : 'GPS Pending'}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Bottom status bar */}
            <div className="relative z-10 text-[11px] text-slate-400 text-center font-mono">
              Click any workspace node above to inspect GPS coordinates and media
            </div>
          </div>

          {/* Selected Property Modal / Card */}
          {selectedMapProperty && (
            <div className="mt-4 p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-700 uppercase">
                  Selected Doorstep Pin
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  {selectedMapProperty.title}
                </h4>
                <p className="text-xs text-slate-600">
                  📍 {selectedMapProperty.location?.address || selectedMapProperty.facility}
                </p>
                {selectedMapProperty.location && (
                  <p className="text-xs font-mono text-blue-900">
                    Lat: {selectedMapProperty.location.latitude.toFixed(6)}° | Lng: {selectedMapProperty.location.longitude.toFixed(6)}° (Accuracy ±{selectedMapProperty.location.accuracyMeters.toFixed(1)}m)
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMapProperty(null)}
                >
                  Dismiss
                </Button>
                <Link href={`/records/${selectedMapProperty.id}`}>
                  <Button variant="primary" size="sm">
                    Open Full Listing
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination Footer Controls */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-slate-200 rounded px-2 py-1 text-xs bg-white"
            >
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={12}>12</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <span className="text-xs font-semibold text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
