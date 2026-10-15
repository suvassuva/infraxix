import React, { Suspense } from 'react';
import { recordService } from '@/services/recordService';
import RecordDetailClient from './RecordDetailClient';

export function generateStaticParams() {
  const ids = recordService.getAllRecordIds();
  return ids.map((id) => ({ id }));
}

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500">
          Loading field inspection record...
        </div>
      }
    >
      <RecordDetailClient id={id} />
    </Suspense>
  );
}
