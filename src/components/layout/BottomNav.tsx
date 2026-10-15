'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, FileSpreadsheet, Camera, BarChart3, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function BottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const isOfficer = user?.role === 'officer';

  const isRouteActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isCaptureActive = pathname.startsWith('/capture');

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)]"
    >
      <div className="relative max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {/* Item 1: Primary List / Submissions */}
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            isRouteActive('/')
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isOfficer ? (
            <FileSpreadsheet className="w-5 h-5 transition-transform active:scale-90" />
          ) : (
            <Building2 className="w-5 h-5 transition-transform active:scale-90" />
          )}
          <span className="text-[10px] mt-1 tracking-tight leading-none">
            {isOfficer ? 'My History' : 'Workspaces'}
          </span>
        </Link>

        {/* Item 2: Records (Admin/Guest only) */}
        {!isOfficer && (
          <Link
            href="/records"
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
              isRouteActive('/records')
                ? 'text-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[10px] mt-1 tracking-tight leading-none">Ledger</span>
          </Link>
        )}

        {/* Center Item: Floating Camera Action Button (FAB) */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-5">
          <Link
            href="/capture"
            className={`group relative flex flex-col items-center justify-center w-13 h-13 rounded-full shadow-lg transition-all duration-200 active:scale-95 border-2 border-white ${
              isCaptureActive
                ? 'bg-blue-700 text-white ring-4 ring-blue-500/20'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            aria-label="Capture Workspace"
          >
            <Camera className="w-6 h-6" />
          </Link>
          <span className="text-[10px] mt-1 font-semibold text-blue-600 tracking-tight leading-none">
            Capture
          </span>
        </div>

        {/* Item 3: Metrics (Admin only) or Logout (Officer) */}
        {!isOfficer ? (
          <Link
            href="/dashboard"
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
              isRouteActive('/dashboard')
                ? 'text-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[10px] mt-1 tracking-tight leading-none">Metrics</span>
          </Link>
        ) : null}

        {/* Item 4: Settings (Admin) or Sign Out button (Officer) */}
        {!isOfficer ? (
          <Link
            href="/settings"
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
              isRouteActive('/settings')
                ? 'text-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[10px] mt-1 tracking-tight leading-none">Settings</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => logout()}
            className="flex-1 flex flex-col items-center justify-center py-1 text-slate-500 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[10px] mt-1 tracking-tight leading-none">Sign Out</span>
          </button>
        )}
      </div>
    </nav>
  );
}
