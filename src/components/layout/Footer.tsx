'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, ShieldCheck, MapPin, Camera } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 text-lg">Infraxix</span>
            </div>
            <p className="text-sm text-slate-500 max-w-md leading-relaxed">
              On-site field verification platform for commercial workspaces, meeting rooms, coworking facilities, and tech labs. Built for frontline facility inspectors and space operators.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Verified Optical Evidence
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Hardware GPS Telemetry
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Workspaces
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Directory
                </Link>
              </li>
              <li>
                <Link href="/capture" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Capture Station
                </Link>
              </li>
              <li>
                <Link href="/records" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Inspection Ledger
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Operations Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Operations & Settings */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/settings" className="text-slate-600 hover:text-blue-600 transition-colors">
                  System Settings
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Hardware & Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-slate-600 hover:text-blue-600 transition-colors">
                  Inspector Administration
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 sm:gap-4 text-center sm:text-left">
          <p>© 2026 Infraxix. Precision Field Capture & Verification.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <span>Offline-First Frontend Architecture</span>
            <span className="hidden xs:inline">•</span>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              Privacy Standards
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
