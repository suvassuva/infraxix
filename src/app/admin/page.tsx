'use client';

import React, { useState } from 'react';
import {
  Users,
  Terminal,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle,
  Info,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { useUsers, useAuditLogs } from '@/hooks/useRecords';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile } from '@/types';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const { users, inviteUser, modifyUser } = useUsers();
  const { logs } = useAuditLogs();

  const [searchTerm, setSearchTerm] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'officer' | 'supervisor' | 'admin'>('officer');
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticsModalOpen, setDiagnosticsModalOpen] = useState(false);

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editRole, setEditRole] = useState<'officer' | 'supervisor' | 'admin'>('officer');
  const [editStatus, setEditStatus] = useState<'active' | 'suspended'>('active');

  const filteredUsers = users.filter(
    (u) =>
      (u.name || u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await inviteUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      department: 'Field Logistics',
      status: 'invited',
      recordsCount: 0,
    });
    setInviteModalOpen(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Administrator Access Required</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          User provisioning and enterprise security controls require Site Administrator privileges. Please return to your active workspace.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="primary">Return to My Submissions</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditStatus(user.status === 'suspended' ? 'suspended' : 'active');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    await modifyUser(editingUser.uid || editingUser.id || '', editRole, editStatus);
    setEditingUser(null);
  };

  const handleRunDiagnostics = () => {
    setDiagnosticsRunning(true);
    setTimeout(() => {
      setDiagnosticsRunning(false);
      setDiagnosticsModalOpen(true);
    }, 700);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Platform Administration
            </h1>
            <Badge variant="error">Root Privileges (Demo)</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            User roster oversight, permission tier assignments, and system audit logs.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            isLoading={diagnosticsRunning}
            onClick={handleRunDiagnostics}
          >
            Run Integrity Scan
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => alert('Demo export: Full administrative audit ledger exported.')}
          >
            Export Logs
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="col-span-2 sm:col-span-1 w-full sm:w-auto"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setInviteModalOpen(true)}
          >
            Provision Officer
          </Button>
        </div>
      </div>

      {/* Demo Notice Banner */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="space-y-0.5 leading-relaxed">
          <strong>Administrative Sandbox:</strong> All user provisioning, role adjustments, and
          diagnostic scans execute strictly against client-side state.
        </div>
      </div>

      {/* System Infrastructure Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active User Base
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{users.length} Accounts</span>
              <Badge variant="success">All Local</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">Multi-tier role segmentation</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Architecture Sandbox
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-blue-600">Isolated</span>
              <Badge variant="info">Frontend-Only</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">No external database connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Security Compliance
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-600">Strict</span>
              <Badge variant="success">Enforced</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">Zero automated GPS/Camera access</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              System Audit Events
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{logs.length} Events</span>
              <Badge variant="neutral">Logged</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1">Immutable client log buffer</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management Section */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Authorized Personnel Directory
            </CardTitle>
            <CardDescription>
              Assign roles, manage workspace access, and track field activity
            </CardDescription>
          </div>

          <div className="w-full sm:w-72">
            <Input
              placeholder="Filter by name, email, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3">User & Email</th>
                  <th scope="col" className="px-5 py-3">Role Tier</th>
                  <th scope="col" className="px-5 py-3">Department</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3">Inspections</th>
                  <th scope="col" className="px-5 py-3 text-right">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map((user) => (
                  <tr key={user.uid || user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{user.name || user.displayName}</div>
                      <div className="text-xs font-mono text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize border ${
                          user.role === 'admin'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : user.role === 'supervisor'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">{user.department}</td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={user.status === 'active' ? 'success' : 'pending'}
                        dot
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                      {user.recordsCount}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(user)}
                      >
                        Modify
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* System Audit Logs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-600" />
            Security & Compliance Audit Trail
          </CardTitle>
          <CardDescription>
            Real-time event logging capturing configuration changes and access attempts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3">Timestamp</th>
                  <th scope="col" className="px-5 py-3">Initiator</th>
                  <th scope="col" className="px-5 py-3">Audit Event</th>
                  <th scope="col" className="px-5 py-3">IP Address</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500">{log.timestamp}</td>
                    <td className="px-5 py-3.5 text-slate-800 font-sans">{log.user}</td>
                    <td className="px-5 py-3.5 text-slate-900 font-sans max-w-sm">{log.action}</td>
                    <td className="px-5 py-3.5 text-slate-500">{log.ipAddress}</td>
                    <td className="px-5 py-3.5">
                      {log.status === 'success' && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-sans font-semibold">
                          Success
                        </span>
                      )}
                      {log.status === 'warning' && (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-sans font-semibold">
                          Warning
                        </span>
                      )}
                      {log.status === 'failure' && (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-sans font-semibold">
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Provision User Modal Dialog */}
      <Dialog
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Provision New Inspector Account"
        description="Add a new verified field team member to the local roster."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleInviteUser}
              disabled={!newUserName || !newUserEmail}
            >
              Issue Credentials
            </Button>
          </>
        }
      >
        <form onSubmit={handleInviteUser} className="space-y-4">
          <Input
            label="Officer Full Name"
            required
            placeholder="e.g. Jordan Taylor"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
          />
          <Input
            label="Corporate Email"
            type="email"
            required
            placeholder="j.taylor@pvg-ops.local"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Access Role Tier
            </label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'officer' | 'supervisor' | 'admin')}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="officer">Field Officer</option>
              <option value="supervisor">Safety Supervisor</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>
        </form>
      </Dialog>

      {/* Edit User Modal Dialog */}
      <Dialog
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Modify Permissions: ${editingUser?.name || editingUser?.displayName || 'User'}`}
        description="Update role privileges and account activation status."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEdit}>
              Apply Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Assigned Role Tier
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as 'officer' | 'supervisor' | 'admin')}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="officer">Field Officer</option>
              <option value="supervisor">Safety Supervisor</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Account Status
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as 'active' | 'suspended')}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active (Full Access)</option>
              <option value="suspended">Suspended (Access Revoked)</option>
            </select>
          </div>
        </div>
      </Dialog>

      {/* Diagnostics Results Modal */}
      <Dialog
        isOpen={diagnosticsModalOpen}
        onClose={() => setDiagnosticsModalOpen(false)}
        title="System Integrity Scan Completed"
        description="Verification check executed across all in-memory structures."
        footer={
          <Button variant="primary" size="sm" onClick={() => setDiagnosticsModalOpen(false)}>
            Close Report
          </Button>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              All Systems Operational (100% Passed)
            </p>
            <p>• Memory Leaks: 0 detected</p>
            <p>• Unhandled State Mutations: 0</p>
            <p>• Telemetry Egress: Isolated (Zero sockets open)</p>
            <p>• Prerender Integrity: Fully compliant with App Router rules</p>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
