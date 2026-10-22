"use client";

import { Loader2 } from "lucide-react";
import Chip from "@/components/Chip";
import { Button } from "@/components/ui/Button";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type { SegmentSummary, SegmentsLoadStatus } from "@/types/emailCampaign";
import { fillTemplate } from "./campaignApi";

interface SegmentChipPickerProps {
  copy: EmailCampaignsAdminDict["segments"]["picker"];
  onRetry: () => void;
  onToggle: (id: string) => void;
  segments: SegmentSummary[];
  selectedIds: string[];
  /** Appends each segment's subscribed contacts to its chip label. */
  showCounts?: boolean;
  status: SegmentsLoadStatus;
}

/** Multi-select segment chips with loading, error (retry) and empty states. */
export function SegmentChipPicker({
  copy,
  onRetry,
  onToggle,
  segments,
  selectedIds,
  showCounts = false,
  status,
}: SegmentChipPickerProps) {
  if (status === "loading") {
    return (
      <p className="flex items-center gap-2 text-sm text-neutral-500" role="status">
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
        {copy.loading}
      </p>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-wrap items-center gap-3" role="alert">
        <p className="text-sm text-red-700">{copy.error}</p>
        <Button onClick={onRetry} size="sm" type="button" variant="secondary">
          {copy.retry}
        </Button>
      </div>
    );
  }

  if (segments.length === 0) {
    return <p className="text-sm text-neutral-500">{copy.empty}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {segments.map((segment) => (
        <Chip
          active={selectedIds.includes(segment.id)}
          key={segment.id}
          onClick={() => onToggle(segment.id)}
          size="touch"
        >
          {showCounts
            ? fillTemplate(copy.count, { count: segment.subscribedCount, name: segment.name })
            : segment.name}
        </Chip>
      ))}
    </div>
  );
}
