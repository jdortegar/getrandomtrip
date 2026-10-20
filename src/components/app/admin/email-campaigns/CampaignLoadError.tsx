import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PendingButtonContent } from "./PendingButtonContent";

interface CampaignLoadErrorProps {
  copy: { loading: string; retry: string };
  message: string;
  onRetry: () => void;
  retrying: boolean;
}

/** Failed load with an actionable retry. */
export function CampaignLoadError({ copy, message, onRetry, retrying }: CampaignLoadErrorProps) {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm"
      role="alert"
    >
      <p className="text-sm text-red-700">{message}</p>
      <Button
        aria-busy={retrying}
        disabled={retrying}
        onClick={onRetry}
        size="sm"
        type="button"
        variant="secondary"
      >
        <PendingButtonContent
          icon={RotateCcw}
          label={copy.retry}
          pending={retrying}
          pendingLabel={copy.loading}
        />
      </Button>
    </div>
  );
}
