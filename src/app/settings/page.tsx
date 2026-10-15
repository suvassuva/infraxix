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
  Info,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';

export default function SettingsPage() {
  const [name, setName] = useState('Alex Rivera');
  const [email, setEmail] = useState('a.rivera@pvg-ops.local');
  const [facility, setFacility] = useState('Central Logistics Hub A');
  const [offlineMode, setOfflineMode] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [urgentAlerts, setUrgentAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

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
      environment: 'demo-local',
      exportedAt: new Date().toISOString(),
    };
    alert(`Demo Configuration Exported:\n${JSON.stringify(config, null, 2)}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="pb-3 sm:pb-4 border-b border-slate-200">
        <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          System & Device Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Manage your field profile, hardware permission policies, and simulated storage preferences.
        </p>
      </div>

      {/* Demo Notice */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="space-y-0.5 leading-relaxed">
          <strong>Client Memory Sandbox:</strong> All configuration toggles below alter client-side
          state for testing. Never synced to remote databases or external storage.
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Preferences updated successfully in client memory.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Field Officer Profile</CardTitle>
            <CardDescription>Default signatory for inspection logs and certificates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Legal Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Work Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>
            <Select
              label="Primary Assigned Facility"
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
              <Shield className="w-5 h-5 text-blue-600" />
              Hardware & Privacy Safeguards
            </CardTitle>
            <CardDescription>
              Control how sensors and device hardware operate in the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Prohibit Unsolicited Camera Access
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ensures the camera shutter is never activated without an explicit user press.
                  </p>
                </div>
                <Badge variant="success">Enforced</Badge>
              </div>

              <div className="flex items-start justify-between pt-2 border-t border-slate-200/60">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Prohibit Automated GPS Geolocation
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Location coordinates are exclusively assigned via manual user simulation buttons.
                  </p>
                </div>
                <Badge variant="success">Enforced</Badge>
              </div>
            </div>

            <Checkbox
              label="Enable Simulated Offline Storage Mode"
              description="Keep all newly created inspection drafts locally in memory without attempting network transmission."
              checked={offlineMode}
              onChange={(e) => setOfflineMode(e.target.checked)}
            />

            <Checkbox
              label="Haptic and audio cues on evidence capture"
              description="Provides tactile response when a simulated photo or document is tagged."
              checked={hapticFeedback}
              onChange={(e) => setHapticFeedback(e.target.checked)}
            />

            {/* Clearly disabled feature with explanation */}
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Cloud Multi-Device Sync</span>
              </div>
              <Badge variant="neutral">Disabled in Phase 1 (Frontend-First)</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Notification Routing
            </CardTitle>
            <CardDescription>Alert dispatch rules for inspections and flags</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Checkbox
              label="Immediate alert upon Urgent Discrepancy flags"
              description="Displays banner when an item in your facility is marked critical."
              checked={urgentAlerts}
              onChange={(e) => setUrgentAlerts(e.target.checked)}
            />
            <Checkbox
              label="Daily morning compliance digest (08:00 Local)"
              description="Summary of open items across North and South terminals."
              checked={dailyDigest}
              onChange={(e) => setDailyDigest(e.target.checked)}
            />
          </CardContent>
        </Card>

        {/* Local Storage & Cache Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Local Storage Diagnostics
            </CardTitle>
            <CardDescription>Frontend-first in-memory ledger telemetry</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-600">Simulated Cache Utilization:</span>
              <span className="font-mono font-semibold text-slate-900">2.1 MB (12 Records in Memory)</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-300 hover:bg-rose-50"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => setClearDialogOpen(true)}
              >
                Clear Client Preview Cache
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExportConfig}
              >
                Export Settings JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" size="md" leftIcon={<Save className="w-4 h-4" />}>
            Save Preferences
          </Button>
        </div>
      </form>

      {/* Clear Cache Confirmation Dialog */}
      <Dialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        title="Reset Client Cache"
        description="Are you sure you want to purge all local mock ledger drafts?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setClearDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setClearDialogOpen(false);
                alert('Local cache reset executed.');
              }}
            >
              Confirm Purge
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          This will revert all modified records back to the default demo fixtures.
        </p>
      </Dialog>
    </div>
  );
}
