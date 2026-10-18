import type { Metadata, Viewport } from 'next';
import React, { Suspense } from 'react';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { InstallAppPrompt } from '@/components/pwa/InstallAppPrompt';

export const metadata: Metadata = {
  title: 'Infraxix — Workspace Capture & GPS Verification Platform',
  description:
    'On-site field verification platform for enterprise workspaces, meeting rooms, and coworking facilities with verified optical evidence and hardware GPS telemetry.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Infraxix',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased overflow-x-hidden">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden w-full max-w-full">
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col pb-20 md:pb-0 w-full max-w-full overflow-x-hidden">{children}</main>
        <Footer />
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
        <Suspense fallback={null}>
          <InstallAppPrompt />
        </Suspense>
      </body>
    </html>
  );
}
