'use client';

// ==============================================================================
// Infraxix - DailyLocationShareCard Component
// Field Officer Station: Daily duty check-in & Live GPS location broadcasting
// ==============================================================================

import React, { useState } from 'react';
import {
  Radio,
  MapPin,
  RefreshCw,
  Power,
  ExternalLink,
  Shield,
  Clock,
  Navigation,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useOfficerLiveLocation } from '@/hooks/useLiveLocation';

export function DailyLocationShareCard() {
  const {
    dutyStatus,
    isOnDuty,
    isLoading,
    actionLoading,
    error,
    startDuty,
    pingNow,
    endDuty,
    clearError,
  } = useOfficerLiveLocation();

  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyCoords = () => {
    if (dutyStatus?.latitude && dutyStatus?.longitude) {
      navigator.clipboard.writeText(`${dutyStatus.latitude}, ${dutyStatus.longitude}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
      {/* Top Header Bar */}
      <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isOnDuty
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            <Radio className={`w-4 h-4 ${isOnDuty ? 'animate-pulse text-emerald-600' : ''}`} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
              Daily Duty & Live Location Sharing
            </h2>
            <p className="text-[11px] text-slate-500 leading-tight truncate">
              {isOnDuty
                ? 'Your live GPS coordinates are streaming in real-time to the Admin Station.'
                : 'Share your live GPS location with Administrator during on-site inspections.'}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="shrink-0">
          {isOnDuty ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              Live Sharing
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              Duty Offline
            </span>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-3.5 sm:p-5 space-y-3.5">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-xs font-semibold text-rose-800 hover:underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {isOnDuty && dutyStatus ? (
          /* Active On-Duty Broadcasting State */
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Coordinates Pill */}
              <div
                onClick={handleCopyCoords}
                title="Click to copy coordinates"
                className="bg-slate-50 hover:bg-slate-100/80 p-2.5 rounded-lg border border-slate-200 cursor-pointer transition-colors"
              >
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                  Live Coordinates
                </span>
                <span className="text-xs font-bold text-slate-800 font-mono block truncate">
                  {dutyStatus.latitude.toFixed(4)}, {dutyStatus.longitude.toFixed(4)}
                </span>
                <span className="text-[9px] text-blue-600 font-medium">
                  {copySuccess ? 'Copied!' : 'Click to copy'}
                </span>
              </div>

              {/* Accuracy Pill */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                  GPS Accuracy
                </span>
                <span className="text-xs font-bold text-emerald-700 block truncate">
                  ±{dutyStatus.accuracyMeters} meters
                </span>
                <span className="text-[9px] text-slate-500">High Precision Fix</span>
              </div>

              {/* Last Ping */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                  Last Admin Ping
                </span>
                <span className="text-xs font-bold text-slate-800 block truncate">
                  {formatTime(dutyStatus.updatedAt)}
                </span>
                <span className="text-[9px] text-slate-500">Auto-syncs 45s</span>
              </div>

              {/* Shift Started */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                  Shift Active Since
                </span>
                <span className="text-xs font-bold text-slate-800 block truncate">
                  {formatTime(dutyStatus.startedAt)}
                </span>
                <span className="text-[9px] text-slate-500">
                  {dutyStatus.dutyDate}
                </span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pingNow}
                  isLoading={actionLoading}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />}
                  className="text-xs py-1.5 px-3 font-medium text-slate-700 bg-white hover:bg-slate-50"
                >
                  Update GPS Now
                </Button>

                {dutyStatus.locationLink && (
                  <a
                    href={dutyStatus.locationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>View on Maps</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                  </a>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={endDuty}
                isLoading={actionLoading}
                leftIcon={<Power className="w-3.5 h-3.5 text-rose-500" />}
                className="text-xs py-1.5 px-3 font-semibold text-rose-700 hover:text-rose-800 bg-rose-50/50 hover:bg-rose-100/70 border-rose-200"
              >
                End Duty & Stop Sharing
              </Button>
            </div>
          </div>
        ) : (
          /* Offline / Inactive State */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs text-slate-600">
                Tap below every morning when starting field duty to stream your live inspection location to the administration workstation.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Protected with high-accuracy browser telemetry & TLS encryption</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={startDuty}
              isLoading={actionLoading || isLoading}
              leftIcon={<Radio className="w-3.5 h-3.5 text-white animate-pulse" />}
              className="w-full sm:w-auto text-xs py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs justify-center shrink-0"
            >
              Start Daily Duty & Share Live GPS
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
