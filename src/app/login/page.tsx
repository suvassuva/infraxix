'use client';

// ==============================================================================
// PVG Ops - Login & Authentication Station
// Connected to typed IAuthRepository via useAuth hook
// Displays prominent Demo Safeguards to prevent confusion with production
// ==============================================================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Mail,
  Key,
  Eye,
  EyeOff,
  UserCheck,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithRole, register, isMock, activeDataSource } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('officer@pvg-ops.local');
  const [loginPassword, setLoginPassword] = useState('demo-password-2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole>('officer');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFacility, setRegFacility] = useState('Central Logistics Hub A');
  const [regRole, setRegRole] = useState<UserRole>('officer');
  const [regPassword, setRegPassword] = useState('');
  const [regAgreed, setRegAgreed] = useState(false);

  // Submission state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'officer') {
      setLoginEmail('officer@pvg-ops.local');
    } else {
      setLoginEmail('admin.root@pvg-ops.local');
    }
  };

  const handleQuickRoleLogin = async (role: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const user = await loginWithRole(role);
      setStatusMessage(
        `Signed in as ${user.displayName} (${user.role.toUpperCase()}) via MockAuthRepository.`
      );
      const targetPath = user.role === 'officer' ? '/' : '/dashboard';
      setTimeout(() => {
        router.push(targetPath);
      }, 600);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Failed to authenticate with mock role.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const user = await login({
        email: loginEmail,
        password: loginPassword,
        rememberMe,
      });
      setStatusMessage(
        `Authorized as ${user.displayName}! Redirecting...`
      );
      const targetPath = user.role === 'officer' ? '/' : '/dashboard';
      setTimeout(() => {
        router.push(targetPath);
      }, 600);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Authentication rejected by auth repository.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regAgreed) {
      setErrorMessage('Please acknowledge the simulated demo environment checkbox.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const user = await register({
        email: regEmail,
        password: regPassword,
        displayName: regName,
        role: regRole,
        facility: regFacility,
      });
      setStatusMessage(
        `Demo profile created for ${user.displayName}! Session initiated.`
      );
      const targetPath = user.role === 'officer' ? '/' : '/dashboard';
      setTimeout(() => {
        router.push(targetPath);
      }, 700);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Registration failed in auth repository.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8 bg-slate-50 w-full min-w-0 overflow-hidden">
      <div className="w-full max-w-md space-y-5 sm:space-y-6">
        {/* Header with Mock Mode Watermark */}
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-blue-600 items-center justify-center text-white shadow-md shadow-blue-500/20 mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Field Personnel Access Station
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standardized repository contract • Zero unauthenticated cloud transmission
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge variant={isMock ? 'warning' : 'success'} className="px-2.5 py-0.5 text-xs font-semibold">
              <Database className="w-3.5 h-3.5 mr-1 inline" />
              Active Auth Source: {activeDataSource.toUpperCase()} {isMock ? '(MOCK MODE)' : '(FIREBASE)'}
            </Badge>
          </div>
        </div>

        {/* Demo Mode Safeguard Notice */}
        {isMock && (
          <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold">DEMO ENVIRONMENT NOTICE:</strong> This application is currently operating
              under <span className="underline decoration-amber-400 font-semibold">MockAuthRepository</span>.
              Accounts, passwords, and sessions are simulated locally and are{' '}
              <strong>never transmitted to Firebase Authentication</strong>. Do not use actual production credentials.
            </div>
          </div>
        )}

        {/* Tab Switcher: Login vs Register */}
        <div className="flex p-1 bg-slate-200/80 rounded-xl border border-slate-300">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setStatusMessage(null);
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In (Demo Presets)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setStatusMessage(null);
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Demo Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Status Message */}
        {statusMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {activeTab === 'login' ? (
          <div className="space-y-4">
            {/* Demo Fast Preset Switcher */}
            {isMock && (
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Fast Demo Role Fill
                  </p>
                  <span className="text-[10px] text-slate-400">MockAuthRepository</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('officer')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                      selectedRole === 'officer'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Field Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('admin')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                      selectedRole === 'admin'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Admin
                  </button>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Instant login as selected role:</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-xs text-blue-600 font-semibold hover:bg-blue-50 h-7 px-2"
                    onClick={() => handleQuickRoleLogin(selectedRole)}
                    isLoading={isLoading}
                  >
                    1-Click Sign In →
                  </Button>
                </div>
              </div>
            )}

            {/* Form Card */}
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <Input
                    label="Official Work Email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="officer@pvg-ops.local"
                    leftIcon={<Mail className="w-4 h-4" />}
                  />

                  <div className="relative">
                    <Input
                      label="Security Password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      leftIcon={<Key className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate-400 hover:text-slate-600 focus:outline-none"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <Checkbox
                      label="Remember workstation"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <button
                      type="button"
                      onClick={() => alert('Demo notice: In Mock Mode, password recovery resets session state to seed defaults.')}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Forgot access?
                    </button>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      isLoading={isLoading}
                      leftIcon={<UserCheck className="w-4 h-4" />}
                    >
                      Authorize & Access Workspace
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* TAB 2: REGISTER */
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <Input
                  label="Inspector Full Name"
                  required
                  placeholder="e.g. Robin Zhao"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />

                <Input
                  label="Official Work Email"
                  type="email"
                  required
                  placeholder="r.zhao@pvg-ops.local"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Assigned Site"
                    value={regFacility}
                    onChange={(e) => setRegFacility(e.target.value)}
                    options={[
                      { value: 'Central Logistics Hub A', label: 'Hub A' },
                      { value: 'Bio-Research Wing 3', label: 'Wing 3' },
                      { value: 'Chemical Depot West', label: 'Depot West' },
                      { value: 'Utility Boiler Room B', label: 'Boiler Room B' },
                    ]}
                  />

                  <Select
                    label="Requested Role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    options={[
                      { value: 'officer', label: 'Field Officer' },
                      { value: 'admin', label: 'Site Admin' },
                    ]}
                  />
                </div>

                <Input
                  label="Create Password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  leftIcon={<Key className="w-4 h-4" />}
                />

                <Checkbox
                  label="Acknowledge local demo policy"
                  description="I understand this is a mock repository simulation and no real credentials or cloud databases are connected."
                  checked={regAgreed}
                  onChange={(e) => setRegAgreed(e.target.checked)}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    isLoading={isLoading}
                    disabled={!regAgreed}
                    leftIcon={<UserPlus className="w-4 h-4" />}
                  >
                    Register Demo Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-slate-500">
          Need auditing guidelines? Review our{' '}
          <Link href="/privacy" className="text-blue-600 hover:underline font-medium">
            Privacy & Compliance Charter
          </Link>
        </p>
      </div>
    </div>
  );
}
