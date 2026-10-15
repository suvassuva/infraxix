'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  ShieldCheck,
  Video,
  Camera,
  Maximize2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Layers,
  Building2,
  Ruler,
  Zap,
  Car,
  Bath,
  Compass,
} from 'lucide-react';
import { CaptureRecord } from '@/types';

interface PropertyCardProps {
  property: CaptureRecord;
  className?: string;
}

function formatRent(amount?: number): string {
  if (!amount) return 'Rent on Request';
  return `₹${amount.toLocaleString('en-IN')}/mo`;
}

function formatDeposit(amount?: number): string {
  if (!amount) return '—';
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1).replace(/\.0$/, '')}L Deposit`;
  }
  return `₹${amount.toLocaleString('en-IN')} Deposit`;
}

export function PropertyCard({ property, className = '' }: PropertyCardProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const mediaList = property.mediaReferences || [];
  const currentMedia = mediaList[activeMediaIndex] || mediaList[0];
  const hasVideo = mediaList.some((m) => m.type === 'video');

  const specs = property.specs;
  const rent = specs?.rent || property.pricing?.price;
  const deposit = specs?.deposit || property.pricing?.securityDeposit;
  const isVerified = property.status === 'verified';
  const isPending = property.status === 'pending';
  const isFlagged = property.status === 'flagged';

  const accuracyText = property.location?.accuracyMeters
    ? `±${property.location.accuracyMeters.toFixed(1)}m`
    : '±2.5m';

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
  };

  const handleNextMedia = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMediaIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      className={`group relative flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-lg hover:border-slate-300 transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Visual Media Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        <div
          className={`absolute inset-0 bg-gradient-to-tr ${
            currentMedia?.previewColor || 'from-slate-800 via-indigo-950 to-slate-900'
          } flex flex-col items-center justify-center p-4 text-center transition-transform duration-300 group-hover:scale-102`}
        >
          {currentMedia?.type === 'video' ? (
            <div className="flex flex-col items-center text-white/95">
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-md mb-2">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold tracking-wide uppercase bg-black/40 px-2 py-0.5 rounded-full">
                Video Walkthrough ({currentMedia.duration || '00:30'})
              </span>
              <span className="text-[11px] text-white/70 mt-1 max-w-[200px] truncate">
                {currentMedia.fileName}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-white/95">
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-md mb-2">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold tracking-wide uppercase bg-black/40 px-2 py-0.5 rounded-full">
                On-Site Optical Capture
              </span>
              <span className="text-[11px] text-white/70 mt-1 max-w-[200px] truncate">
                {currentMedia?.description || currentMedia?.fileName || 'Workspace Still'}
              </span>
            </div>
          )}
        </div>

        {/* Top Badges */}
        <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-start justify-between gap-1.5 sm:gap-2 z-10 pointer-events-none">
          {/* Workspace Category Badge */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-bold bg-white/95 backdrop-blur-md text-slate-800 shadow-sm border border-slate-200 shrink-0">
            <Building2 className="w-3 h-3 text-blue-600" />
            {property.category || property.propertyCategory || 'Workspace'}
          </span>

          {/* Verification Status Badge */}
          {isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-semibold bg-emerald-600 text-white shadow-sm shrink-0">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Verified GPS ({accuracyText})
            </span>
          )}
          {isPending && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-semibold bg-amber-500 text-white shadow-sm shrink-0">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Pending GPS
            </span>
          )}
          {isFlagged && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-semibold bg-rose-600 text-white shadow-sm shrink-0">
              Flagged (Retry)
            </span>
          )}
        </div>

        {/* Carousel controls */}
        {mediaList.length > 1 && (
          <>
            <button
              onClick={handlePrevMedia}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-opacity z-10"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextMedia}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-opacity z-10"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-2.5 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full z-10">
              {activeMediaIndex + 1}/{mediaList.length}
            </div>
          </>
        )}

        {hasVideo && (
          <div className="absolute bottom-2.5 left-3 bg-black/70 backdrop-blur-xs text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
            <Video className="w-3 h-3 text-emerald-400" />
            Walkthrough Video
          </div>
        )}
      </div>

      {/* Workspace Details Body */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between space-y-3.5">
        <div>
          {/* Rent & Deposit Banner */}
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <div className="text-lg font-black tracking-tight text-slate-900">
              {formatRent(rent)}
            </div>
            {deposit ? (
              <span className="text-xs font-semibold text-slate-500">
                {formatDeposit(deposit)}
              </span>
            ) : null}
          </div>

          {/* Title & Ref */}
          <Link href={`/records/${property.id}`} className="block group/link">
            <h3 className="text-base font-bold text-slate-900 group-hover/link:text-blue-600 transition-colors line-clamp-1">
              {property.title}
            </h3>
          </Link>

          {/* Location & Address */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {property.location?.address || property.facility || 'On-Site Location'}
            </span>
          </div>

          {/* Lat / Long Coordinates Line */}
          {property.location?.latitude !== undefined && property.location?.longitude !== undefined && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mt-0.5">
              <Compass className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                {property.location.latitude.toFixed(4)}°, {property.location.longitude.toFixed(4)}°
              </span>
            </div>
          )}

          {/* Core 11 Commercial Workspace Specs Grid */}
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            {/* Area */}
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-2 text-slate-700">
              <Maximize2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Area</div>
                <div className="font-bold text-slate-900">
                  {specs?.areaSqFt ? `${specs.areaSqFt.toLocaleString()} sqft` : '—'}
                </div>
              </div>
            </div>

            {/* Floor */}
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-2 text-slate-700">
              <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Floor</div>
                <div className="font-bold text-slate-900 truncate">
                  {specs?.floorNumber !== undefined
                    ? specs.totalFloors
                      ? `${specs.floorNumber} / ${specs.totalFloors}`
                      : `${specs.floorNumber}`
                    : '—'}
                </div>
              </div>
            </div>

            {/* Clear Height & Beam Height */}
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-2 text-slate-700">
              <Ruler className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Height / Beam</div>
                <div className="font-bold text-slate-900">
                  {specs?.clearHeightFt ? `${specs.clearHeightFt}ft` : '—'}
                  {specs?.beamHeightFt ? ` (${specs.beamHeightFt}ft beam)` : ''}
                </div>
              </div>
            </div>

            {/* Washroom */}
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-2 text-slate-700">
              <Bath className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Washroom</div>
                <div className="font-bold text-slate-900">
                  {specs?.washrooms !== undefined ? `${specs.washrooms} WC` : '—'}
                </div>
              </div>
            </div>

            {/* Power Backup */}
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-2 text-slate-700">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div className="overflow-hidden">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Power Backup</div>
                <div className="font-bold text-slate-900 truncate" title={specs?.powerBackup || 'None'}>
                  {specs?.powerBackup || '—'}
                </div>
              </div>
            </div>

            {/* Parking */}
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg p-2 text-slate-700">
              <Car className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Parking</div>
                <div className="font-bold text-slate-900">
                  {specs?.parkingSpaces !== undefined ? `${specs.parkingSpaces} slot(s)` : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="text-slate-400 font-mono text-[11px] truncate">
            {property.referenceNumber}
          </div>

          <Link
            href={`/records/${property.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-all"
          >
            View & Edit <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
