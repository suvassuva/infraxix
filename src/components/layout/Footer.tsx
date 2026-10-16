'use client';

import React from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 sm:py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 lg:gap-16">
          {/* Brand Info */}
          <div className="max-w-md space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-base">Infraxix</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              On-site field verification platform for commercial workspaces, meeting rooms, coworking facilities, and tech labs. Built for frontline facility inspectors and space operators.
            </p>
          </div>

          {/* Navigation Links Group */}
          <div className="flex flex-wrap sm:flex-nowrap gap-10 sm:gap-14 lg:gap-20">
            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 sm:pt-1">
                Workspaces
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm">
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
                  <Link href="/admin" className="text-slate-600 hover:text-blue-600 transition-colors">
                    Admin Hub
                  </Link>
                </li>
              </ul>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 sm:pt-1">
                Platform
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm">
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
        </div>

        <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 sm:gap-4 text-center sm:text-left">
          <p>© 2026 Infraxix. Precision Field Capture & Verification.</p>
        </div>
      </div>
    </footer>
  );
}
