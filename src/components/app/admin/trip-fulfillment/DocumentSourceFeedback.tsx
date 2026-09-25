"use client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import type { TripDocumentSourceSelection } from "@/lib/types/TripDocumentSource";

interface Props {
  copy: Pick<
    MarketingDictionary["documentWorkflow"],
    "sourceLoading" | "sourceError" | "retry"
  >;
  source: TripDocumentSourceSelection;
}

export function DocumentSourceFeedback({ copy, source }: Props) {
  if (source.status === "ready") return null;
  const loading = source.status === "loading";
  return (
    <div role={loading ? "status" : "alert"}>
      {!loading && <p>{copy.sourceError}</p>}
      <Button
        aria-busy={loading}
        disabled={loading}
        onClick={() => {
          if (!loading) source.retry();
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        {loading && (
          <Loader2 aria-hidden="true" className="animate-spin h-4 w-4" />
        )}
        {loading ? copy.sourceLoading : copy.retry}
      </Button>
    </div>
  );
}
