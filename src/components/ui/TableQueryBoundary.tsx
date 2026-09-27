"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TableLoadingOverlay } from "@/components/ui/TableLoadingOverlay";

interface TableQueryBoundaryProps {
  children: ReactNode;
  className?: string;
  copy: { loading: string; retry: string };
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
}

export function TableQueryBoundary({
  children,
  className,
  copy,
  error,
  isLoading,
  onRetry,
}: TableQueryBoundaryProps) {
  return (
    <div
      aria-busy={isLoading}
      className={className}
      data-component="TableQueryBoundary"
    >
      {error && (
        <div
          className="flex flex-col gap-3 items-center p-6 text-center"
          role="alert"
        >
          <p className="text-red-600 text-sm">{error}</p>
          <Button
            aria-busy={isLoading}
            disabled={isLoading}
            onClick={onRetry}
            type="button"
            variant="secondary"
          >
            {isLoading && (
              <Loader2 aria-hidden="true" className="animate-spin h-4 w-4" />
            )}
            {isLoading ? copy.loading : copy.retry}
          </Button>
        </div>
      )}
      <TableLoadingOverlay isLoading={isLoading}>
        <div hidden={!!error} inert={isLoading || !!error || undefined}>
          {children}
        </div>
      </TableLoadingOverlay>
    </div>
  );
}
