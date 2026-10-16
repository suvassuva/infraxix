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
      className={`group relative flex flex-col rounded-xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Visual Media Header - Compact Height */}
      <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-slate-900">
        <div
          className={`absolute inset-0 bg-gradient-to-tr ${
            currentMedia?.previewColor || 'from-slate-800 via-indigo-950 to-slate-900'
          } flex flex-col items-center justify-center p-2 text-center transition-transform duration-300 group-hover:scale-102`}
        >
          {currentMedia?.type === 'video' ? (
            <div className="flex flex-col items-center text-white/95">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xs mb-1">
                <Video className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-semibold tracking-wide uppercase bg-black/40 px-2 py-0.5 rounded-full">
                Walkthrough ({currentMedia.duration || '00:30'})
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-white/95">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xs mb-1">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-semibold tracking-wide uppercase bg-black/40 px-2 py-0.5 rounded-full">
                Optical Capture
              </span>
            </div>
          )}
        </div>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-white/95 backdrop-blur-md text-slate-800 shadow-xs border border-slate-200 shrink-0">
            <Building2 className="w-3 h-3 text-blue-600" />
            {property.category || property.propertyCategory || 'Workspace'}
          </span>

          {isVerified && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white shadow-xs shrink-0">
              <ShieldCheck className="w-3 h-3" />
              GPS ({accuracyText})
            </span>
          )}
          {isPending && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500 text-white shadow-xs shrink-0">
              <Clock className="w-3 h-3" />
              Pending
            </span>
          )}
          {isFlagged && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-600 text-white shadow-xs shrink-0">
              Flagged
            </span>
          )}
        </div>

        {/* Carousel controls */}
        {mediaList.length > 1 && (
          <>
            <button
              onClick={handlePrevMedia}
              aria-label="Previous photo"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-opacity z-10"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={handleNextMedia}
              aria-label="Next photo"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-opacity z-10"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
            <div className="absolute bottom-1.5 right-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-medium px-1.5 py-0.2 rounded-full z-10">
              {activeMediaIndex + 1}/{mediaList.length}
            </div>
          </>
        )}

        {hasVideo && (
          <div className="absolute bottom-1.5 left-2 bg-black/70 backdrop-blur-xs text-emerald-300 text-[9px] font-semibold px-1.5 py-0.2 rounded-full flex items-center gap-1 z-10">
            <Video className="w-2.5 h-2.5 text-emerald-400" />
            Video
          </div>
        )}
      </div>

      {/* Workspace Details Body - Compact */}
      <div className="p-3 flex flex-col justify-between space-y-2">
        <div>
          {/* Rent & Deposit Banner */}
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-base font-bold tracking-tight text-slate-900">
              {formatRent(rent)}
            </div>
            {deposit ? (
              <span className="text-[11px] font-medium text-slate-500">
                {formatDeposit(deposit)}
              </span>
            ) : null}
          </div>

          {/* Title & Ref */}
          <Link href={`/records/${property.id}`} className="block group/link mt-0.5">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover/link:text-blue-600 transition-colors line-clamp-1">
              {property.title}
            </h3>
          </Link>

          {/* Location & Address */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">
              {property.location?.address || property.facility || 'On-Site Location'}
            </span>
          </div>

          {/* Core Specs Chips - Streamlined single-line badges */}
          <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
            {/* Area */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100/80 rounded px-1.5 py-0.5 text-slate-700">
              <Maximize2 className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="font-medium truncate">{specs?.areaSqFt ? `${specs.areaSqFt} sqft` : '—'}</span>
            </div>

            {/* Floor */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100/80 rounded px-1.5 py-0.5 text-slate-700">
              <Layers className="w-3 h-3 text-indigo-600 shrink-0" />
              <span className="font-medium truncate">
                {specs?.floorNumber !== undefined
                  ? `Fl ${specs.floorNumber}${specs.totalFloors ? `/${specs.totalFloors}` : ''}`
                  : '—'}
              </span>
            </div>

            {/* Washroom */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100/80 rounded px-1.5 py-0.5 text-slate-700">
              <Bath className="w-3 h-3 text-cyan-600 shrink-0" />
              <span className="font-medium truncate">{specs?.washrooms !== undefined ? `${specs.washrooms} WC` : '—'}</span>
            </div>

            {/* Parking */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-100/80 rounded px-1.5 py-0.5 text-slate-700">
              <Car className="w-3 h-3 text-purple-600 shrink-0" />
              <span className="font-medium truncate">{specs?.parkingSpaces !== undefined ? `${specs.parkingSpaces} Car` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <div className="text-slate-400 font-mono text-[10px] truncate">
            {property.referenceNumber}
          </div>

          <Link
            href={`/records/${property.id}`}
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-all"
          >
            View & Edit <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
