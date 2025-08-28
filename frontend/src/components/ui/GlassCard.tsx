'use client';
import type { PropsWithChildren } from 'react';

export default function GlassCard({ children }: PropsWithChildren) {
  return (
    <div className="rounded-2xl bg-white/95 backdrop-blur-md ring-1 ring-neutral-200 shadow-sm text-neutral-900">
      {children}
    </div>
  );
}
