'use client';
import { PropsWithChildren } from 'react';

export default function SectionCard({ title, actions, children }: PropsWithChildren<{ title?: string; actions?: React.ReactNode }>) {
  return (
    <div className="rt-card">
      <div className="rt-card-body">
        {(title || actions) && (
          <div className="mb-3 flex items-center justify-between gap-3">
            {title ? <h2 className="rt-h2">{title}</h2> : <div />}
            {actions}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
