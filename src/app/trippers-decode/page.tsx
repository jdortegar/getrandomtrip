'use client';

import { Suspense } from 'react';
import { TrippersDecodePageContent } from './TrippersDecodePageContent';

export default function TrippersDecodePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            Loading...
          </div>
        }
      >
        <TrippersDecodePageContent />
      </Suspense>
    </main>
  );
}
