'use client';

// ==============================================================================
// Infraxix - Authentication Station
// Connected to typed IAuthRepository via useAuth hook
// Supports Live Firebase Authentication and Mock fallback
// ==============================================================================

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, login, register, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const getDestination = (role?: string) => {
    if (typeof window !== 'undefined') {
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      if (redirect) return redirect;
    }
    return role === 'officer' ? '/' : '/dashboard';
  };

  // If already authenticated, forward directly to intended destination
  useEffect(() => {
    if (!authLoading && user) {
      const targetPath = getDestination(user.role);
      router.replace(targetPath);
    }
  }, [user, authLoading, router]);

  // Login form state - clean and empty (no hardcoded mock credentials)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state - clean and empty
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('officer');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAgreed, setRegAgreed] = useState(false);

  // Submission state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const loggedUser = await login({
        email: loginEmail.trim(),
        password: loginPassword,
        rememberMe,
      });
      setStatusMessage(
        `Authorized as ${loggedUser.displayName || loggedUser.email}! Redirecting...`
      );
      const targetPath = getDestination(loggedUser.role);
      setTimeout(() => {
        router.push(targetPath);
      }, 600);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword) {
      setErrorMessage('Please provide an email and password to create an account.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (!regAgreed) {
      setErrorMessage('Please accept the platform compliance terms to continue.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const newUser = await register({
        email: regEmail.trim(),
        password: regPassword,
        displayName: regName.trim() || (regRole === 'admin' ? 'Administrator' : 'Field Officer'),
        role: regRole,
      });
      setStatusMessage(
        `Account created successfully for ${newUser.displayName || newUser.email}! Signing in...`
      );
      const targetPath = getDestination(newUser.role);
      setTimeout(() => {
        router.push(targetPath);
      }, 700);
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    const targetPath = getDestination(user.role);
    return (
      <div className="min-h-[85vh] flex items-center justify-center pt-6 pb-28 sm:py-10 px-3.5 sm:px-6 lg:px-8 bg-slate-50 w-full min-w-0">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Signed In</h2>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {user.displayName || user.email} ({user.role})
            </p>
          </div>
          <p className="text-xs text-blue-700 bg-blue-50 py-2 px-3 rounded-lg border border-blue-200 font-medium">
            Redirecting to workspace...
          </p>
          <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => router.push(targetPath)}
            >
              Continue
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-slate-600 hover:text-rose-600"
              onClick={() => logout()}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center pt-6 pb-28 sm:py-10 px-3.5 sm:px-6 lg:px-8 bg-slate-50 w-full min-w-0">
      <div className="w-full max-w-md space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex w-11 h-11 rounded-2xl bg-blue-600 items-center justify-center text-white shadow-md shadow-blue-500/20 mb-2.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {activeTab === 'login' ? 'Field Access Portal' : 'Create Account'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {activeTab === 'login'
              ? 'Sign in to access your assigned workspaces.'
              : 'Register your field personnel account.'}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
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
            Sign In
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
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Status Message */}
        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {activeTab === 'login' ? (
          <Card>
            <CardContent className="pt-5 sm:pt-6">
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 sm:space-y-4">
                <Input
                  label="Work Email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@company.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    leftIcon={<Key className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.preventDefault();
                          setShowPassword((prev) => !prev);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-1.5 -mr-1.5 rounded-md focus:outline-none cursor-pointer transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <Checkbox
                    label="Remember me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <button
                    type="button"
                    onClick={() => alert('Please contact your administrator to reset credentials.')}
                    className="text-blue-600 hover:underline font-medium shrink-0 ml-2"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    size="md"
                    className="w-full"
                    isLoading={isLoading}
                    leftIcon={<UserCheck className="w-4 h-4" />}
                  >
                    Sign In
                  </Button>
                </div>

                <div className="text-center pt-1.5">
                  <p className="text-xs text-slate-500">
                    New to Infraxix?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('register');
                        setErrorMessage(null);
                        setStatusMessage(null);
                      }}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Create account
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* TAB 2: REGISTER */
          <Card>
            <CardContent className="pt-5 sm:pt-6">
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 sm:space-y-4">
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g. John Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />

                <Input
                  label="Work Email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                />

                <Select
                  label="Account Role"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  options={[
                    { value: 'officer', label: 'Field Officer' },
                    { value: 'admin', label: 'Site Administrator' },
                  ]}
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    leftIcon={<Key className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.preventDefault();
                          setShowRegPassword((prev) => !prev);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-1.5 -mr-1.5 rounded-md focus:outline-none cursor-pointer transition-colors"
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                </div>

                <Checkbox
                  label="Accept Terms & Policies"
                  description="For authorized field verification use only."
                  checked={regAgreed}
                  onChange={(e) => setRegAgreed(e.target.checked)}
                />

                <div className="pt-1">
                  <Button
                    type="submit"
                    size="md"
                    className="w-full"
                    isLoading={isLoading}
                    disabled={!regAgreed}
                    leftIcon={<UserPlus className="w-4 h-4" />}
                  >
                    Create Account
                  </Button>
                </div>

                <div className="text-center pt-1.5">
                  <p className="text-xs text-slate-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setErrorMessage(null);
                        setStatusMessage(null);
                      }}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-slate-500">
          <Link href="/privacy" className="text-blue-600 hover:underline font-medium">
            Privacy & Compliance Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
