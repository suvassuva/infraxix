'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Camera,
  MapPin,
  Lock,
  Server,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function PrivacyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-10 space-y-6 sm:space-y-8 min-w-0 overflow-hidden">
      {/* Back link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-500 hover:text-slate-900 transition-colors mb-3 sm:mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Workspaces</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Hardware Privacy & Inspection Standards
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              PVG Workspace Verification & Sensor Telemetry Standards • Effective 2026
            </p>
          </div>
        </div>
      </div>

      {/* Summary Highlight Box */}
      <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-4">
        <Lock className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-950 space-y-1">
          <p className="font-semibold text-blue-900">
            Workspace Verification & Transparency Charter:
          </p>
          <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
            Infraxix provides frontline facilities inspectors and space managers with on-site optical evidence and hardware GPS telemetry.
            Every registered meeting room, office suite, or dedicated desk is verified directly at the facility using browser-verified sensors.
          </p>
        </div>
      </div>

      {/* Structured Sections */}
      <div className="space-y-6">
        {/* Section 1: 100% Genuine On-Site Media */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              1. Optical Authenticity & Direct Capture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              Stock photos and unverified 3D renderings presented as operational workspaces are prohibited:
            </p>
            <ul className="space-y-2 list-disc pl-5 text-xs sm:text-sm">
              <li>
                <strong>Direct Device Capture:</strong> Photos and video tours must originate from the inspector&apos;s active device camera stream on-site.
              </li>
              <li>
                <strong>Continuous Walkthroughs:</strong> Room-by-room walkthrough video tours demonstrate actual seating capacity, AV equipment, and layout flow.
              </li>
              <li>
                <strong>Zero Unsolicited Hardware Access:</strong> The camera and microphone are accessed only when the inspector explicitly taps &ldquo;Open Camera&rdquo; on <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-mono">/capture</code>.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 2: GPS Telemetry & Precision Bounds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              2. Hardware GPS Telemetry & Precision Bounds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              To ensure workspace facilities exist at their exact declared physical coordinates:
            </p>
            <ul className="space-y-2 list-disc pl-5 text-xs sm:text-sm">
              <li>
                <strong>On-Site Coordinate Lock:</strong> The browser Geolocation API queries device GNSS satellites with high accuracy mode enabled directly at the facility.
              </li>
              <li>
                <strong>Uncertainty Radius Transparency:</strong> Every record displays its GPS accuracy radius (e.g. <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono">±2.1m</code>) indicating coordinate precision.
              </li>
              <li>
                <strong>Zero Background Tracking:</strong> GPS coordinates are queried exclusively on demand. Background device tracking is forbidden.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 3: Data Governance & Offline-First Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              3. Data Governance & Session Sandboxing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              In this demonstrator environment:
            </p>
            <ul className="space-y-2 list-disc pl-5 text-xs sm:text-sm">
              <li>
                All verification records, media evidence, and workspace logs are retained strictly within isolated browser memory and local repository storage.
              </li>
              <li>
                No sensor telemetry or photos are transmitted to external marketing brokers or unauthorized third parties.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Call to action */}
      <div className="pt-4 flex items-center justify-between border-t border-slate-200">
        <Link href="/">
          <Button variant="outline" size="sm">
            Back to Workspaces
          </Button>
        </Link>
        <Link href="/capture">
          <Button variant="primary" size="sm" leftIcon={<Camera className="w-4 h-4" />}>
            Capture a Workspace Now
          </Button>
        </Link>
      </div>
    </div>
  );
}
