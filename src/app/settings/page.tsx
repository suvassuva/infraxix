'use client';

import React, { useState } from 'react';
import {
  Bell,
  Shield,
  Database,
  Trash2,
  Check,
  Save,
  Download,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { user, activeDataSource } = useAuth();
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [facility, setFacility] = useState(user?.facility || 'Primary Facility');
  const [offlineMode, setOfflineMode] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [urgentAlerts, setUrgentAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  React.useEffect(() => {
    if (user) {
      if (user.displayName) setName(user.displayName);
      if (user.email) setEmail(user.email);
      if (user.facility) setFacility(user.facility);
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportConfig = () => {
    const config = {
      profile: { name, email, facility },
      safeguards: { offlineMode, hapticFeedback },
      notifications: { urgentAlerts, dailyDigest },
      dataSource: activeDataSource,
      exportedAt: new Date().toISOString(),
    };
    alert(`Configuration Exported:\n${JSON.stringify(config, null, 2)}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 pb-28 sm:py-8 space-y-4 sm:space-y-6 min-w-0">
      {/* Header */}
      <div className="pb-3 sm:pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage profile, safeguards, and preferences.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs sm:text-sm animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Preferences saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Officer Profile</CardTitle>
            <CardDescription>Default signatory for inspection logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Work Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>
            <Select
              label="Assigned Facility"
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
              options={[
                { value: 'Central Logistics Hub A', label: 'Central Logistics Hub A' },
                { value: 'Bio-Research Wing 3', label: 'Bio-Research Wing 3' },
                { value: 'Chemical Depot West', label: 'Chemical Depot West' },
                { value: 'Corporate Tower East', label: 'Corporate Tower East' },
                { value: 'Utility Boiler Room B', label: 'Utility Boiler Room B' },
              ]}
            />
          </CardContent>
        </Card>

        {/* Hardware & Privacy Safeguards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Hardware & Privacy
            </CardTitle>
            <CardDescription>
              Sensor and device permission controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 sm:space-y-4">
            <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                    Camera Protection
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    Opens only on manual shutter tap.
                  </p>
                </div>
                <Badge variant="success" className="shrink-0 text-[10px] sm:text-xs">Enforced</Badge>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                    GPS Protection
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    Location tagged only on manual capture.
                  </p>
                </div>
                <Badge variant="success" className="shrink-0 text-[10px] sm:text-xs">Enforced</Badge>
              </div>
            </div>

            <Checkbox
              label="Offline Storage Mode"
              description="Keep drafts locally in browser memory."
              checked={offlineMode}
              onChange={(e) => setOfflineMode(e.target.checked)}
            />

            <Checkbox
              label="Haptic & Audio Feedback"
              description="Vibrate and tone on capture."
              checked={hapticFeedback}
              onChange={(e) => setHapticFeedback(e.target.checked)}
            />

            {/* Cloud Multi-Device Sync */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium truncate">Cloud Multi-Device Sync</span>
              </div>
              <Badge variant="neutral" className="shrink-0 text-[10px] sm:text-xs">Disabled (Phase 1)</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              Notifications
            </CardTitle>
            <CardDescription>Inspection alert and dispatch rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-3.5">
            <Checkbox
              label="Urgent Discrepancy Alerts"
              description="Banner alert when an item is marked critical."
              checked={urgentAlerts}
              onChange={(e) => setUrgentAlerts(e.target.checked)}
            />
            <Checkbox
              label="Daily Compliance Digest (08:00)"
              description="Morning summary of open inspection items."
              checked={dailyDigest}
              onChange={(e) => setDailyDigest(e.target.checked)}
            />
          </CardContent>
        </Card>

        {/* Storage & Cache Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Storage & Cache
            </CardTitle>
            <CardDescription>Local cache and diagnostic state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-xl border border-slate-200 gap-2">
              <span className="text-slate-500 font-medium">Provider</span>
              <span className="font-mono font-semibold text-slate-900 text-right truncate">
                {activeDataSource === 'firebase' ? 'Cloud Firestore' : 'Client In-Memory'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-rose-600 border-rose-300 hover:bg-rose-50"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => setClearDialogOpen(true)}
              >
                Clear Cache
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExportConfig}
              >
                Export JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex justify-end gap-3 pt-1">
          <Button type="submit" size="md" className="w-full sm:w-auto" leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Clear Cache Confirmation Dialog */}
      <Dialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        title="Clear Cache"
        description="Purge local temporary browser cache?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem('pvg_workspaces_demo_store_v4');
                  window.localStorage.removeItem('pvg_mock_auth_session');
                }
                setClearDialogOpen(false);
                alert('Local cache reset.');
              }}
            >
              Confirm Clear
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          This purges offline drafts and cached views without modifying remote Firestore documents.
        </p>
      </Dialog>
    </div>
  );
}
