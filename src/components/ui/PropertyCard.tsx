'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  ShieldCheck,
  Maximize2,
  Clock,
  ArrowRight,
  Layers,
  Building2,
  Car,
  Bath,
  User,
  Video,
  Camera,
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
  const specs = property.specs;
  const rent = specs?.rent || property.pricing?.price;
  const deposit = specs?.deposit || property.pricing?.securityDeposit;
  const isVerified = property.status === 'verified';
  const isPending = property.status === 'pending';
  const isFlagged = property.status === 'flagged';

  const accuracyText = property.location?.accuracyMeters
    ? `±${property.location.accuracyMeters.toFixed(1)}m`
    : '±2.5m';

  // Count evidence items (photos / videos)
  const mediaCount = Math.max(
    property.mediaReferences?.length || 0,
    property.attachments?.length || 0
  );
  const hasVideo =
    property.mediaReferences?.some((m) => m.type === 'video') ||
    property.attachments?.some((a) => a.mediaType === 'video' || a.type === 'video');

  const officerName = property.capturedBy?.name || 'Field Officer';

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 p-4 sm:p-5 ${className}`}
    >
      <div className="space-y-3.5">
        {/* Top Header Row: Category Badge & Verification Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            {property.category || property.propertyCategory || 'Workspace'}
          </span>

          {isVerified && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              GPS ({accuracyText})
            </span>
          )}
          {isPending && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Pending
            </span>
          )}
          {isFlagged && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              Flagged
            </span>
          )}
        </div>

        {/* Pricing Banner */}
        <div className="flex items-baseline justify-between gap-2 pt-0.5">
          <div className="text-xl font-bold tracking-tight text-slate-900">
            {formatRent(rent)}
          </div>
          {deposit ? (
            <span className="text-xs font-medium text-slate-500">
              {formatDeposit(deposit)}
            </span>
          ) : null}
        </div>

        {/* Title & Doorstep Address */}
        <div>
          <Link href={`/records/${property.id}`} className="block group/link">
            <h3 className="text-base font-bold text-slate-900 group-hover/link:text-blue-600 transition-colors line-clamp-1">
              {property.title}
            </h3>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {property.location?.address || property.facility || 'On-Site Location'}
            </span>
          </div>
        </div>

        {/* Core Specs Chips (Grid of 4) */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
          {/* Area */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-slate-700">
            <Maximize2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-medium truncate">
              {specs?.areaSqFt ? `${specs.areaSqFt} sqft` : '—'}
            </span>
          </div>

          {/* Floor */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-slate-700">
            <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-medium truncate">
              {specs?.floorNumber !== undefined
                ? `Fl ${specs.floorNumber}${specs.totalFloors ? `/${specs.totalFloors}` : ''}`
                : '—'}
            </span>
          </div>

          {/* Washroom */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-slate-700">
            <Bath className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <span className="font-medium truncate">
              {specs?.washrooms !== undefined ? `${specs.washrooms} WC` : '—'}
            </span>
          </div>

          {/* Parking */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-slate-700">
            <Car className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="font-medium truncate">
              {specs?.parkingSpaces !== undefined ? `${specs.parkingSpaces} Car` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer: Field Officer Details & Action Link */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        {/* Field Officer Badge */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider leading-none">
              Field Officer
            </span>
            <span className="font-semibold text-slate-800 truncate block text-xs mt-0.5">
              {officerName}
            </span>
          </div>
        </div>

        {/* Evidence tag & View & Edit Link */}
        <div className="flex items-center gap-2 shrink-0">
          {mediaCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {hasVideo ? <Video className="w-3 h-3 text-blue-600" /> : <Camera className="w-3 h-3 text-slate-500" />}
              <span>{mediaCount}</span>
            </span>
          )}
          <Link
            href={`/records/${property.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-all bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200/60"
          >
            <span>View & Edit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
