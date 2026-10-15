'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  Building2,
  ShieldCheck,
  Search,
  MapPin,
  ArrowRight,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { useRecords, useStats } from '@/hooks/useRecords';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useAuth();
  const isOfficer = user?.role === 'officer';

  const { stats } = useStats();
  const { records, isLoading } = useRecords({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    searchTerm: searchQuery || undefined,
    ownerUid: isOfficer ? (user?.uid || 'mock-usr-officer-001') : undefined,
    pageSize: 12,
  });

  // Calculate personal metrics for the logged-in officer
  const officerTotal = records.length;
  const officerVerified = records.filter((r) => r.status === 'verified').length;
  const officerPending = records.filter((r) => r.status === 'pending').length;
  const officerFlagged = records.filter((r) => r.status === 'flagged').length;

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
      {/* Clean Hero Header */}
      <section className="bg-slate-900 text-white pt-6 sm:pt-8 pb-8 sm:pb-10 px-3.5 sm:px-6 lg:px-8 border-b border-slate-800 w-full min-w-0 overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
          {/* Top Status Pill */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {isOfficer
                  ? `Field Officer Station • ${user?.displayName || 'Officer Alex Rivera'}`
                  : 'Workspace Capture & Verification Station'}
              </span>
            </div>

            <Link
              href="/capture"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Start New Inspection <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Heading */}
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {isOfficer ? 'My Capture History' : 'Verified Workspaces'}
            </h1>
            <p className="mt-2 text-xs sm:text-base text-slate-300 leading-relaxed">
              {isOfficer
                ? 'Your personal submission log of on-site verified commercial workspaces, telemetry GPS locks, and inspection media.'
                : 'Browse and capture on-site verified meeting rooms, executive offices, dedicated desks, and coworking labs with hardware GPS telemetry.'}
            </p>
          </div>

          {/* Search Bar & Capture CTA */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  isOfficer
                    ? 'Search your submitted workspaces, buildings, or tags...'
                    : 'Search by workspace title, building, or inspector...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            <Link href="/capture" className="shrink-0 w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Camera className="w-4 h-4" />}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
              >
                Capture Workspace
              </Button>
            </Link>
          </div>

          {/* Quick Metrics Strip */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
            {isOfficer ? (
              <>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="block text-lg sm:text-xl font-bold text-white">
                    {officerTotal}
                  </span>
                  <span className="text-slate-400 text-[11px]">My Submissions</span>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="block text-lg sm:text-xl font-bold text-emerald-400">
                    {officerVerified}
                  </span>
                  <span className="text-slate-400 text-[11px]">Approved & Verified</span>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="block text-lg sm:text-xl font-bold text-amber-400">
                    {officerPending}
                  </span>
                  <span className="text-slate-400 text-[11px]">Pending Review</span>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="block text-lg sm:text-xl font-bold text-rose-400">
                    {officerFlagged}
                  </span>
                  <span className="text-slate-400 text-[11px]">Flagged / Revisions</span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="block text-lg sm:text-xl font-bold text-white">
                    {stats.totalRecords.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[11px]">Total Workspaces</span>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="block text-lg sm:text-xl font-bold text-emerald-400">
                    {stats.approvedToday.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[11px]">GPS Verified</span>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="block text-lg sm:text-xl font-bold text-amber-400">
                    {stats.pendingReview.toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[11px]">Pending Review</span>
                </div>
                <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="block text-lg sm:text-xl font-bold text-cyan-400">
                    ±2.4m
                  </span>
                  <span className="text-slate-400 text-[11px]">Avg GPS Precision</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area: Category Filter & Grid */}
      <section className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 min-w-0">
        {/* Workspace Category Filter Pills */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar touch-pan-x w-full sm:w-auto min-w-0">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
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

          {!isOfficer && (
            <Link
              href="/records"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
            >
              Open Full Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Workspace Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        ) : records.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
