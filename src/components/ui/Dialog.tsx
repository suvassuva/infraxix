'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centering Wrapper */}
      <div className="flex min-h-full items-center justify-center p-3.5 sm:p-6 text-center">
        {/* Modal Dialog Card */}
        <div
          ref={dialogRef}
          className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 text-left overflow-hidden transform transition-all my-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100">
            <div className="pr-2">
              <h2 id="dialog-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                {title}
              </h2>
              {description && (
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 sm:px-6 py-4 max-h-[72vh] overflow-y-auto">{children}</div>

          {/* Footer */}
          {footer ? (
            <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5 sm:gap-3">
              {footer}
            </div>
          ) : (
            <div className="px-5 sm:px-6 py-3 sm:py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end">
              <Button variant="outline" size="sm" onClick={onClose}>
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
