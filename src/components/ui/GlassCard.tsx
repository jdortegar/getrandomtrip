'use client';
import type { ElementType, PropsWithChildren } from 'react';

type GlassCardProps = PropsWithChildren<{
  className?: string;
  /** Opcional: cambiar el tag raíz (div, section, article, etc.) */
  as?: ElementType;
}>;

export default function GlassCard({
  children,
  className = '',
  as: Tag = 'div',
}: GlassCardProps) {
  return (
    <Tag
      className={`rounded-2xl bg-white/95 backdrop-blur-md ring-1 ring-neutral-200 shadow-sm text-neutral-900 ${className}`}
    >
      {children}
    </Tag>
  );
}
