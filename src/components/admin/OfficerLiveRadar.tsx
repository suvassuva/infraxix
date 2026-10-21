'use client';

// ==============================================================================
// Infraxix - OfficerLiveRadar Component
// Admin Station: Real-time telemetry monitoring for Field Officer live locations
// ==============================================================================

import React, { useState } from 'react';
import {
  Radio,
  MapPin,
  ExternalLink,
  Search,
  Navigation,
  Clock,
  User,
  ShieldCheck,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { useAdminLiveRadar } from '@/hooks/useLiveLocation';
import { OfficerDutyLocation } from '@/types/gps';

export function OfficerLiveRadar() {
  const { officers, liveOfficers, totalOfficers, activeCount, isLoading } = useAdminLiveRadar();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'live' | 'offline'>('all');

  const filtered = officers.filter((o) => {
    if (filterType === 'live' && (!o.isLive || o.status !== 'on_duty')) return false;
    if (filterType === 'offline' && o.isLive && o.status === 'on_duty') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = (o.officerName || '').toLowerCase().includes(q);
      const matchEmail = (o.officerEmail || '').toLowerCase().includes(q);
      const matchDate = (o.dutyDate || '').includes(q);
      return matchName || matchEmail || matchDate;
    }
    return true;
  });

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Unknown';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      return `${diffHr}h ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-4">
      {/* Header with Metrics */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Field Officers Live Radar
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                {activeCount} Live Now
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-tight mt-0.5">
              Live telemetry coordinates broadcasting from frontline inspectors on duty.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Personnel ({totalOfficers})
          </button>
          <button
            onClick={() => setFilterType('live')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'live'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            On Duty ({activeCount})
          </button>
          <button
            onClick={() => setFilterType('offline')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterType === 'offline'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Off Duty ({totalOfficers - activeCount})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-4 sm:px-5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search officer by name, email, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Officers Grid */}
      <div className="px-4 sm:px-5 pb-5">
        {isLoading ? (
          <div className="py-12 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Connecting to Live Radar...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
            <Compass className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-semibold text-slate-700">No Officers Matching Filter</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Field officers will appear here when they activate their daily live location broadcast on their station.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filtered.map((officer) => {
              const isLive = officer.isLive && officer.status === 'on_duty';
              return (
                <div
                  key={officer.officerUid}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isLive
                      ? 'bg-white border-emerald-300 shadow-xs hover:border-emerald-400'
                      : 'bg-slate-50/70 border-slate-200 opacity-80'
                  }`}
                >
                  {/* Top Card Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isLive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {officer.officerName ? officer.officerName.slice(0, 2).toUpperCase() : 'FO'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {officer.officerName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {officer.officerEmail || 'Field Officer'}
                        </div>
                      </div>
                    </div>

                    {isLive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Live On Duty
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                        Off Duty
                      </span>
                    )}
                  </div>

                  {/* Telemetry Details */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">GPS Fix:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {officer.latitude ? `${officer.latitude.toFixed(4)}, ${officer.longitude.toFixed(4)}` : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">Accuracy:</span>
                      <span className="font-semibold text-emerald-700">
                        {officer.accuracyMeters ? `±${officer.accuracyMeters}m` : 'Normal'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">Last Telemetry:</span>
                      <span className="font-medium text-slate-700">
                        {formatRelativeTime(officer.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">Shift Date:</span>
                      <span className="font-medium text-slate-700">
                        {officer.dutyDate || 'Today'}
                      </span>
                    </div>
                  </div>

                  {/* Action Link */}
                  {officer.locationLink && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end">
                      <a
                        href={officer.locationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs py-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium transition-colors"
                      >
                        <Navigation className="w-3 h-3 text-blue-600" />
                        <span>Track on Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
