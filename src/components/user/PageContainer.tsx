'use client';
import { PropsWithChildren } from 'react';

export default function PageContainer({ children }: PropsWithChildren) {
  return (
    <div className="rt-page">
      {children}
    </div>
  );
}
