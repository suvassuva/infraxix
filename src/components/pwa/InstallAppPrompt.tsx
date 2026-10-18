'use client';

import React, { useState } from 'react';
import { Download, X, Share2, PlusSquare, Smartphone, Monitor, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/Button';

export function InstallAppPrompt() {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isDismissed,
    triggerInstall,
    dismissPrompt,
    hasPromptEvent,
  } = usePWAInstall();

  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed as standalone app, don't show prompt banner
  if (isInstalled) {
    return null;
  }

  // If user dismissed in this session and iOS guide is closed, don't show
  if (isDismissed && !showIOSGuide) {
    return null;
  }

  const handleInstallClick = async () => {
    const outcome = await triggerInstall();
    if (outcome === 'accepted') {
      setInstallSuccess(true);
      setTimeout(() => {
        dismissPrompt();
      }, 3000);
    } else if (outcome === 'manual_ios') {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {/* Floating Install Prompt Banner */}
      <aside
        aria-label="Install Infraxix App"
        className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-blue-200/80 animate-fade-in transition-all"
      >
        {installSuccess ? (
          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Infraxix Installed!</h3>
              <p className="text-xs text-slate-500">
                You can now launch Infraxix directly from your home screen or desktop.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            {/* Infraxix Blue Squircle App Icon */}
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-7 h-7"
              >
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                <path d="M6 12H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                <path d="M18 10h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" />
                <path d="M10 6h4" />
                <path d="M10 10h4" />
                <path d="M10 14h4" />
                <path d="M10 22v-3a2 2 0 0 1 4 0v3" />
              </svg>
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
                  <span>Download Infraxix App</span>
                </h3>
                <button
                  type="button"
                  onClick={dismissPrompt}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                  aria-label="Dismiss download prompt"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                Install on your device for one-tap field access, offline capture, and home screen icon.
              </p>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleInstallClick}
                  className="w-full sm:w-auto text-xs py-1.5 px-3 bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center justify-center gap-1.5 font-semibold"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  {isIOS ? 'Add to Home Screen' : 'Install App'}
                </Button>
                <button
                  type="button"
                  onClick={dismissPrompt}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 font-medium transition-colors cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* iOS Safari Guided Modal */}
      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h4 className="text-base font-bold text-slate-900">Install on iPhone / iPad</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="pt-0.5">
                  Tap the <strong className="text-slate-900">Share</strong> button in Safari's bottom toolbar:
                  <div className="mt-1 flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md font-semibold">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="pt-0.5">
                  Scroll down and tap <strong className="text-slate-900">Add to Home Screen</strong>:
                  <div className="mt-1 flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md font-semibold">
                    <PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="pt-0.5">
                  Tap <strong className="text-slate-900">Add</strong> at top right. The Infraxix icon will appear on your home screen!
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs py-2"
                onClick={() => setShowIOSGuide(false)}
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Compact Navbar Install Button for Desktop & Mobile
 */
export function NavbarInstallButton() {
  const { isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  const handleClick = async () => {
    const outcome = await triggerInstall();
    if (outcome === 'manual_ios') {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Download Infraxix app to your desktop or mobile home screen"
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>

      {/* iOS Safari Guided Modal */}
      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h4 className="text-base font-bold text-slate-900">Install on iPhone / iPad</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="pt-0.5">
                  Tap the <strong className="text-slate-900">Share</strong> button in Safari's bottom toolbar:
                  <div className="mt-1 flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md font-semibold">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="pt-0.5">
                  Scroll down and tap <strong className="text-slate-900">Add to Home Screen</strong>:
                  <div className="mt-1 flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md font-semibold">
                    <PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="pt-0.5">
                  Tap <strong className="text-slate-900">Add</strong> at top right. The Infraxix icon will appear on your home screen!
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs py-2"
                onClick={() => setShowIOSGuide(false)}
              >
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
