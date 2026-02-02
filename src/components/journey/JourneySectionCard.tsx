import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface JourneySectionCardProps {
  actionLabel?: string;
  children?: ReactNode;
  className?: string;
  description?: string;
  isOpen?: boolean;
  onActionClick?: () => void;
  onToggle?: () => void;
  title: string;
}

export function JourneySectionCard({
  actionLabel,
  children,
  className,
  description,
  isOpen = false,
  onActionClick,
  onToggle,
  title,
}: JourneySectionCardProps) {
  const hasBody = Boolean(children);

  return (
    <section className={cn('bg-white rounded-lg shadow-md', className)}>
      <header className="flex items-center justify-between px-6 py-5">
        <div className="min-w-0">
          <h2 className="text-xl font-medium font-barlow text-gray-900">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>

        {actionLabel && (
          <button
            className="text-sm font-semibold text-gray-900 underline underline-offset-4"
            onClick={onActionClick ?? onToggle}
            type="button"
          >
            {actionLabel}
          </button>
        )}
      </header>

      {hasBody && isOpen && <div className="px-6 pb-6">{children}</div>}
    </section>
  );
}

