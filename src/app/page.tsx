'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  Building2,
  Search,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { useRecords } from '@/hooks/useRecords';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useAuth();
  const isOfficer = user?.role === 'officer';

  const { records, isLoading } = useRecords({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    searchTerm: searchQuery || undefined,
    ownerUid: isOfficer ? user?.uid : undefined,
    pageSize: 12,
  });

  const officerTotal = records.length;

  const categories = [
    { id: 'all', label: isOfficer ? 'All My Submissions' : 'All Workspaces' },
    { id: 'Meeting Room', label: 'Meeting Rooms' },
    { id: 'Private Office', label: 'Private Offices' },
    { id: 'Dedicated Desk', label: 'Dedicated Desks' },
    { id: 'Coworking Floor', label: 'Coworking Floors' },
    { id: 'Lab / Studio', label: 'Labs & Studios' },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Clean Light Hero Header */}
      <section className="bg-white text-slate-900 pt-4 sm:pt-8 pb-5 sm:pb-8 px-3.5 sm:px-6 lg:px-8 border-b border-slate-200 w-full min-w-0 overflow-hidden shadow-2xs">
        <div className="max-w-7xl mx-auto space-y-3.5 sm:space-y-5">
          {/* Top Status Pill */}
          <div className="flex items-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] sm:text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">
                {isOfficer
                  ? `Field Officer Station • ${user?.displayName || user?.email || 'Officer'}`
                  : 'Workspace Capture & Verification Station'}
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="max-w-2xl">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
              {isOfficer ? 'Field Officer Hub' : 'Verified Workspaces'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isOfficer
                ? 'Your central workstation for on-site workspace submissions, telemetry GPS verification, and hardware captures.'
                : 'Browse and inspect on-site verified meeting rooms, executive offices, dedicated desks, and coworking labs.'}
            </p>
          </div>

          {/* Officer Action Buttons & Search - Sized and side-by-side on mobile */}
          <div className="flex flex-col gap-2.5 sm:gap-3 max-w-3xl">
            {isOfficer && (
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5">
                <Link href="/capture" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Camera className="w-3.5 h-3.5 shrink-0" />}
                    className="w-full sm:w-auto text-xs py-2 px-2.5 sm:px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs justify-center gap-1.5"
                  >
                    Capture Workspace
                  </Button>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs py-2 px-2.5 sm:px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-medium transition-colors cursor-pointer select-none"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-slate-800 font-medium">My Submissions ({officerTotal})</span>
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    isOfficer
                      ? 'Search submissions...'
                      : 'Search workspaces...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>

              {!isOfficer && (
                <Link href="/capture" className="shrink-0 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Camera className="w-3.5 h-3.5 shrink-0" />}
                    className="w-full sm:w-auto text-xs py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs justify-center gap-1.5"
                  >
                    Capture Workspace
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Category Filter & Grid */}
      <section className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 min-w-0">
        {/* Workspace Category Filter Pills */}
        <div className="flex items-center justify-between gap-2.5 flex-wrap border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar touch-pan-x w-full sm:w-auto min-w-0">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
            >
              Admin Review Queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Workspace Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-56 rounded-xl bg-slate-100 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : records.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {records.map((workspace) => (
              <PropertyCard key={workspace.id} property={workspace} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              {isOfficer ? 'No personal submissions match this filter' : 'No workspaces match this filter'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isOfficer
                ? 'Try resetting your filter, or tap below to record a new workspace inspection.'
                : 'Try switching your category filter or search query to find registered workspaces.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
              >
                Reset Filters
              </Button>
              {isOfficer && (
                <Link href="/capture">
                  <Button variant="primary" size="sm" leftIcon={<Camera className="w-4 h-4" />}>
                    Capture Workspace
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
