import { cn } from "@/lib/utils";

interface ReviewBadgeProps {
  className?: string;
  rating: string;
}

export function ReviewBadge({ className, rating }: ReviewBadgeProps) {
  return (
    <div
      className={cn(
        "absolute flex gap-1 items-center rounded-lg bg-white/10 px-2 py-1 backdrop-blur-sm right-4 top-4 z-20",
        className,
      )}
    >
      <span className="text-xs font-semibold text-white">{rating}</span>
      <svg
        aria-hidden
        className="h-3 w-3 text-yellow-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </div>
  );
}
