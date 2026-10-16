'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Camera,
  Settings,
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  Plus,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const isOfficer = user?.role === 'officer';
  const isAdmin = user?.role === 'admin';

  const navigation = isOfficer
    ? []
    : isAdmin
    ? [
        { name: 'Workspaces', href: '/', icon: Building2 },
        { name: 'Admin Hub', href: '/admin', icon: User },
        { name: 'Settings', href: '/settings', icon: Settings },
      ]
    : [
        { name: 'Workspaces', href: '/', icon: Building2 },
      ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 w-full overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:bg-blue-700 transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 leading-tight tracking-tight flex items-center gap-1.5">
                Infraxix
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                Field Capture & Verification
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-lg py-1 px-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 leading-none">
                    {user.displayName || 'Inspector'}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-medium leading-tight">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  title="Sign out"
                  className="ml-1 p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <Button
                  variant={pathname === '/login' ? 'secondary' : 'outline'}
                  size="sm"
                  leftIcon={<LogIn className="w-4 h-4" />}
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {navigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{user.displayName || 'Inspector'}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{user.role}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-600 font-medium px-2 py-1 rounded hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
