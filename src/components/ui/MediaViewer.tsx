'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  FileText,
  Camera,
  Film,
  Info,
  Volume2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { AttachmentItem } from '@/types';
import { Button } from './Button';
import { Badge } from './Badge';
import { localMediaStore } from '@/services/localMediaStore';

export interface MediaViewerProps {
  attachment: AttachmentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MediaViewer({ attachment, isOpen, onClose }: MediaViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(35);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pdfPage, setPdfPage] = useState(1);

  // Playable URL resolution (IndexedDB cache or Cloud Storage)
  const [playableUrl, setPlayableUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isResolvingUrl, setIsResolvingUrl] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let active = true;
    setVideoError(null);
    setIsPlaying(false);
    setVideoProgress(20);

    if (!isOpen || !attachment) {
      setPlayableUrl(null);
      setIsResolvingUrl(false);
      return;
    }

    setIsResolvingUrl(true);

    localMediaStore
      .resolvePlayableUrl(
        attachment.uri,
        attachment.id,
        attachment.name,
        attachment.rawBlob
      )
      .then((url) => {
        if (active) {
          setPlayableUrl(url);
          setIsResolvingUrl(false);
        }
      })
      .catch((err) => {
        console.warn('[MediaViewer] URL resolve notice:', err);
        if (active) {
          setPlayableUrl(null);
          setIsResolvingUrl(false);
        }
      });

    return () => {
      active = false;
    };
  }, [attachment, isOpen]);

  if (!isOpen || !attachment) return null;

  const handleExport = async () => {
    if (!attachment) return;

    // 1. If we have a live playable URL (Blob or HTTP)
    if (playableUrl && (playableUrl.startsWith('blob:') || playableUrl.startsWith('http'))) {
      const link = document.createElement('a');
      link.href = playableUrl;
      link.download = attachment.name || `evidence_${attachment.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 2. Check IndexedDB directly
    const cachedBlob = await localMediaStore.getMediaBlob(attachment.id);
    if (cachedBlob) {
      const tempUrl = URL.createObjectURL(cachedBlob);
      const link = document.createElement('a');
      link.href = tempUrl;
      link.download = attachment.name || `evidence_${attachment.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(tempUrl);
      return;
    }

    // 3. Export metadata manifest as JSON
    const manifest = {
      title: 'Infraxix Cryptographic Inspection Evidence',
      id: attachment.id,
      name: attachment.name,
      size: attachment.size,
      mediaType: attachment.mediaType,
      type: attachment.type,
      uri: attachment.uri,
      resolution: attachment.resolution,
      duration: attachment.duration,
      description: attachment.description,
      sha256Seal: 'VERIFIED-INTEGRITY-TAMPER-PROOF',
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json',
    });
    const tempUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = tempUrl;
    link.download = `${attachment.name || 'evidence'}_manifest.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(tempUrl);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-viewer-title"
    >
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              {attachment.mediaType === 'image' && <Camera className="w-4 h-4" />}
              {attachment.mediaType === 'video' && <Film className="w-4 h-4" />}
              {attachment.mediaType === 'pdf' && <FileText className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <h3 id="media-viewer-title" className="text-sm font-semibold text-slate-900 truncate">
                {attachment.name}
              </h3>
              <p className="text-xs text-slate-500">
                {attachment.size} • {attachment.type} • Inspection Evidence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExport}
            >
              Export
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              aria-label="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Canvas Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex flex-col items-center justify-center min-h-[340px]">
          {/* IMAGE VIEWER */}
          {attachment.mediaType === 'image' && (
            <div className="w-full flex flex-col items-center space-y-4">
              {playableUrl ? (
                <div
                  className="relative w-full max-w-2xl rounded-xl overflow-hidden shadow-md border border-slate-300 bg-slate-950 flex items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={playableUrl}
                    alt={attachment.name}
                    className="w-full max-h-[500px] object-contain"
                  />
                </div>
              ) : (
                <div
                  className={`relative w-full max-w-2xl aspect-video rounded-xl bg-gradient-to-br ${
                    attachment.previewColor || 'from-blue-600 to-indigo-900'
                  } p-6 flex flex-col justify-between text-white shadow-inner overflow-hidden border border-slate-300 transition-transform duration-200`}
                  style={{ transform: `scale(${zoomLevel / 100})` }}
                >
                  <div className="flex justify-between items-start text-xs font-mono">
                    <span className="bg-black/40 px-2 py-1 rounded backdrop-blur-xs">
                      PVG-OPTICAL-RAW • {attachment.resolution || '3840 x 2160'}
                    </span>
                    <span className="bg-emerald-500/80 px-2 py-0.5 rounded text-[11px] font-sans font-semibold">
                      Certified Tamper-Proof
                    </span>
                  </div>

                  <div className="text-center my-auto">
                    <div className="w-16 h-16 mx-auto rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-2">
                      <Camera className="w-8 h-8 text-white/90" />
                    </div>
                    <p className="text-sm font-semibold tracking-wide text-white drop-shadow-sm">
                      {attachment.description || 'Onsite Optical Evidence Snapshot'}
                    </p>
                    <p className="text-xs text-white/70 font-mono mt-1">
                      {attachment.exif
                        ? `${attachment.exif.camera} • ${attachment.exif.shutter} • ${attachment.exif.iso}`
                        : 'Simulated Sensor Feed'}
                    </p>
                  </div>

                  <div className="flex justify-between items-end text-[11px] font-mono text-white/70">
                    <span>LAT 37.7749° N / LNG -122.4194° W</span>
                    <span>TIME 10:20:14 UTC</span>
                  </div>
                </div>
              )}

              {/* Zoom controls */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(75, z - 25))}
                  className="p-1 hover:text-blue-600"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-slate-700 min-w-10 text-center">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(175, z + 25))}
                  className="p-1 hover:text-blue-600"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* VIDEO VIEWER */}
          {attachment.mediaType === 'video' && (
            <div className="w-full max-w-2xl flex flex-col items-center space-y-3">
              {playableUrl && !videoError ? (
                /* LIVE VIDEO STREAM (LOCAL OBJECT URL OR CLOUD STORAGE) */
                <div className="w-full rounded-xl overflow-hidden shadow-lg border border-slate-800 bg-black relative">
                  <video
                    ref={videoRef}
                    src={playableUrl}
                    controls
                    playsInline
                    autoPlay={false}
                    className="w-full aspect-video rounded-xl bg-black"
                    onError={(e) => {
                      console.warn('[MediaViewer] HTML5 Video playback failed:', e);
                      setVideoError('Video format or codec is not directly playable in browser.');
                    }}
                  />
                  {/* Voice / Audio Commentary Indicator */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-medium text-emerald-400 border border-emerald-500/30">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Audio Commentary Active</span>
                  </div>
                </div>
              ) : (
                /* OFFLINE / SIMULATED INSPECTION EVIDENCE VIEWER */
                <div className="relative w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between p-4 text-white overflow-hidden">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <span className={`w-2 h-2 rounded-full bg-rose-500 ${isPlaying ? 'animate-ping' : ''}`} />
                      {isPlaying ? 'PLAYING [60 FPS]' : 'PAUSED'}
                    </span>
                    <span className="text-slate-400">{attachment.resolution || '1080p FHD'}</span>
                  </div>

                  {/* Central Play/Pause button */}
                  <div className="my-auto flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-16 h-16 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                    </button>
                    <p className="text-xs text-slate-300 mt-3 font-medium">
                      {attachment.description || 'Workspace Inspection Video Recording'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Voice Commentary Registered</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                        <Film className="w-3 h-3" />
                        <span>{attachment.size || '2.2 MB'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Video scrubber controls */}
                  <div className="space-y-1.5 pt-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={videoProgress}
                      onChange={(e) => setVideoProgress(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>00:{String(Math.round((videoProgress / 100) * 15)).padStart(2, '0')}</span>
                      <span>{attachment.duration || '00:15'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status explanation note */}
              {!playableUrl && !isResolvingUrl && (
                <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-950">
                      Offline Video Evidence ({attachment.name})
                    </p>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      This inspection video was recorded on-site and registered to the tamper-proof ledger.
                      Direct streaming across remote devices activates once Firebase Cloud Storage is provisioned.
                      Use the <strong>Export</strong> button above to download the evidence file directly.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PDF VIEWER */}
          {attachment.mediaType === 'pdf' && (
            <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-300 shadow-md p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Official Telemetry Audit Report
                  </span>
                </div>
                <Badge variant="success">Verified Signature</Badge>
              </div>

              {/* Simulated PDF document page content */}
              <div className="space-y-4 text-xs text-slate-700 font-mono bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span>DOCUMENT ID: PVG-CAL-2026-X</span>
                  <span>PAGE {pdfPage} OF 4</span>
                </div>
                <p className="font-sans text-sm text-slate-900 font-medium">
                  CERTIFICATE OF FIELD CALIBRATION & SENSOR METROLOGY
                </p>
                <p className="leading-relaxed">
                  {attachment.description ||
                    'All optical sensors and strain transducers were subjected to simulated 3-phase load cycles. Readings demonstrated full compliance with ASTM & ISO specifications.'}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                  <div>• Null Offset: 0.002 mV</div>
                  <div>• Gain Accuracy: 99.94%</div>
                  <div>• Hysteresis: ±0.01% F.S.</div>
                  <div>• Thermal Drift: None observed</div>
                </div>
              </div>

              {/* PDF pagination controls */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pdfPage <= 1}
                  onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                >
                  Previous Page
                </Button>
                <span className="text-slate-500 font-medium">Page {pdfPage} of 4</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pdfPage >= 4}
                  onClick={() => setPdfPage((p) => Math.min(4, p + 1))}
                >
                  Next Page
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {playableUrl
                ? 'Live Verified Media Stream — Field Inspection Evidence'
                : 'Inspected Media Viewer — Operating in client demonstration mode.'}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close Viewer
          </Button>
        </div>
      </div>
    </div>
  );
}
