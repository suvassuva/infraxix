'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertOctagon,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  ShieldCheck,
  Building,
  User,
  RefreshCw,
  Download,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useStats, useRecords } from '@/hooks/useRecords';
import { useAuth } from '@/hooks/useAuth';
import { CaptureRecord } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { stats, isLoading: statsLoading, refetch: refetchStats } = useStats();
  const {
    records,
    isLoading: recordsLoading,
    refetch: refetchRecords,
  } = useRecords({
    category: filterCategory !== 'all' ? filterCategory : undefined,
    pageSize: 5,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchStats(), refetchRecords()]);
    setIsRefreshing(false);
    setToastMessage('Operational metrics refreshed from local service layer.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (user?.role === 'officer') {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Field Officer Workstation Active</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          System analytics and facility command metrics are reserved for Operations Administrators. Your account is dedicated to capturing and tracking on-site workspace submissions.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary">Return to My Submissions</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6 min-w-0 overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Workspace Operations Command Center
            </h1>
            <Badge variant="info">Facilities & Inspection Hub</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Real-time verified workspaces, hardware GPS telemetry locks, and inspection audit throughput.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            isLoading={isRefreshing}
            onClick={handleRefresh}
          >
            Refresh KPIs
          </Button>
          <Link href="/records" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              View Ledger
            </Button>
          </Link>
          <Link href="/capture" className="col-span-2 sm:col-span-1 w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Capture Workspace
            </Button>
          </Link>
        </div>
      </div>

      {/* Prominent Demo Mode Disclaimer Banner */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="space-y-0.5 leading-relaxed">
          <strong>PVG Workspace Verification Active:</strong> Workspace records, on-site optical evidence, and hardware GPS telemetry
          are maintained in the offline-first local service layer.
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Verified Workspaces
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">
                {statsLoading ? '...' : stats.totalRecords.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-600 font-medium inline-flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +18% MoM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">100% on-site verified listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending GPS Lock
              </span>
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-violet-700">
                {statsLoading ? '...' : stats.pendingReview}
              </span>
              <span className="text-xs text-slate-500">Awaiting doorstep telemetry</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Avg doorstep fix time: &lt;45s</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Approved Today
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-700">
                {statsLoading ? '...' : stats.approvedToday}
              </span>
              <span className="text-xs text-emerald-600 font-medium">Verified Badges</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Zero fake listing disputes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Flagged / Retry Sync
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-rose-700">
                {statsLoading ? '...' : stats.flaggedItems}
              </span>
              <span className="text-xs text-rose-600 font-medium">Requires action</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Immediate containment alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Split: Recent Field Records & Facility Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3): Recent Activity / Queue */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>Recent Field Inspection Queue</CardTitle>
                <CardDescription>
                  Displaying latest verified & pending records in the system.
                </CardDescription>
              </div>

              {/* Quick filter pills */}
              <div className="w-full sm:w-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none pb-1 max-w-full touch-pan-x self-start sm:self-auto min-w-0">
                {['all', 'Meeting Room', 'Private Office', 'Dedicated Desk', 'Coworking Floor'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-md font-medium capitalize whitespace-nowrap transition-colors ${
                      filterCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {recordsLoading ? (
                <div className="p-8 text-center text-sm text-slate-500 animate-pulse">
                  Loading records from local service...
                </div>
              ) : records.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No records found matching this category filter.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {records.map((item: CaptureRecord) => (
                    <div
                      key={item.id}
                      className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {item.referenceNumber}
                          </span>
                          <Badge
                            variant={
                              item.status === 'verified'
                                ? 'success'
                                : item.status === 'pending'
                                ? 'pending'
                                : item.status === 'flagged'
                                ? 'error'
                                : 'neutral'
                            }
                            dot
                          >
                            {item.status}
                          </Badge>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500 font-medium">{item.category}</span>
                        </div>

                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                          {item.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            {item.facility}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {item.capturedBy.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <div className="text-right hidden sm:block">
                          <span className="block text-xs font-semibold text-slate-900">
                            Score: {item.metrics.complianceScore}%
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <Link href={`/records/${item.id}`}>
                          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                            Review
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3): Operational Status & Fast Audit Info */}
        <div className="space-y-6">
          {/* Status Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Frontend Environment Status
              </CardTitle>
              <CardDescription>Local runtime parameters & device controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Cloud Egress:</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Disabled (Isolated)
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">GPS Auto-Request:</span>
                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  Manual Only
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Camera Auto-Request:</span>
                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  Manual Only
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Local Ledger Storage:</span>
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Active (In-Memory)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Compliance targets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Facility Safety Index
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Central Logistics Hub A</span>
                  <span className="font-bold text-slate-900">98%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '98%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Bio-Research Wing 3</span>
                  <span className="font-bold text-slate-900">84%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '84%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Chemical Depot West</span>
                  <span className="font-bold text-rose-600">62% (Flagged)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: '62%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
