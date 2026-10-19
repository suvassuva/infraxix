'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function BottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const isOfficer = user?.role === 'officer';
  const isAdmin = user?.role === 'admin';

  const isRouteActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)]"
    >
      <div className="relative max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {/* Item 1: Workspaces / My Hub */}
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
            isRouteActive('/')
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-5 h-5 transition-transform active:scale-90" />
          <span className="text-[10px] mt-1 tracking-tight leading-none">
            {isOfficer ? 'My Hub' : 'Workspaces'}
          </span>
        </Link>

        {/* Item 2: Admin Hub (if admin) */}
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
              isRouteActive('/admin')
                ? 'text-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[10px] mt-1 tracking-tight leading-none">Admin</span>
          </Link>
        )}

        {/* Item 3: Settings (if admin) */}
        {isAdmin && (
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
        )}

        {/* Item 3: Sign Out / Sign In */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => logout()}
            className="flex-1 flex flex-col items-center justify-center py-1 text-slate-500 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[10px] mt-1 tracking-tight leading-none">Sign Out</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="flex-1 flex flex-col items-center justify-center py-1 text-slate-500 hover:text-blue-600 transition-colors"
          >
            <User className="w-5 h-5 transition-transform active:scale-90" />
            <span className="text-[10px] mt-1 tracking-tight leading-none">Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
