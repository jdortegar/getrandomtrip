import { cn } from '@/lib/utils';

interface LabelProps {
  className?: string;
  text: string;
}

export function Label({ className, text }: LabelProps) {
  return (
    <div className={className}>
      <div className="rounded-md bg-yellow-400 px-3 py-1">
        <span className="text-xs font-semibold uppercase text-gray-900">
          {text}
        </span>
      </div>
    </div>
  );
}
