'use client';

import { Suspense } from 'react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { TrippersDecodePageContent } from './TrippersDecodePageContent';

export default function TrippersDecodePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        <TrippersDecodePageContent />
      </Suspense>
    </main>
  );
}
