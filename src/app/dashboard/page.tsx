'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="max-w-md mx-auto py-24 px-4 text-center space-y-3">
      <div className="w-8 h-8 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate-600">Redirecting to Workspaces Catalog...</p>
    </div>
  );
}
