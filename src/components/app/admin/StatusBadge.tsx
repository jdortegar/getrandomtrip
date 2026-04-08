import { cn } from '@/lib/utils';
import {
  PAYMENT_STATUS_COLORS,
  TRIP_STATUS_COLORS,
  type StatusColors,
} from '@/lib/admin/trip-status';

interface StatusBadgeProps {
  className?: string;
  status: string;
  variant?: 'payment' | 'trip';
}

const FALLBACK = {
  bg: 'bg-gray-100',
  border: 'border-gray-200',
  text: 'text-gray-700',
};

export function StatusBadge({ className, status, variant = 'trip' }: StatusBadgeProps) {
  const map = variant === 'payment'
    ? PAYMENT_STATUS_COLORS
    : (TRIP_STATUS_COLORS as Record<string, StatusColors>);
  const colors = map[status] ?? FALLBACK;
  return (
    <span
      className={cn(
        'inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold',
        colors.bg,
        colors.border,
        colors.text,
        className,
      )}
    >
      {status}
    </span>
  );
}
