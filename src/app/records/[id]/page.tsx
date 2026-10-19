import React, { Suspense } from 'react';
import { recordService } from '@/services/recordService';
import RecordDetailClient from './RecordDetailClient';

export function generateStaticParams() {
  const ids = recordService.getAllRecordIds();
  return ids.map((id) => ({ id }));
}

async function RecordDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecordDetailClient id={id} />;
}

export default function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-500 animate-pulse">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-medium text-slate-700">Loading workspace inspection record...</p>
        </div>
      }
    >
      <RecordDetailContent params={params} />
    </Suspense>
  );
}
