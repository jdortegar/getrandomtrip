"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import { CAMPAIGNS_API, campaignFailureMessage, readCampaignFailure } from "./campaignApi";
import { PendingButtonContent } from "./PendingButtonContent";

interface CampaignDeleteControlProps {
  campaignId: string;
  copy: EmailCampaignsAdminDict["editor"]["delete"];
  errorsCopy: EmailCampaignsAdminDict["errors"];
  onDeleted: () => void;
}

/** Deletes a DRAFT after an inline confirmation step. */
export function CampaignDeleteControl({
  campaignId,
  copy,
  errorsCopy,
  onDeleted,
}: CampaignDeleteControlProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function handleDelete() {
    if (inFlight.current) return;
    inFlight.current = true;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${CAMPAIGNS_API}/${campaignId}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted();
        return;
      }
      setError(campaignFailureMessage(await readCampaignFailure(res), errorsCopy));
    } catch {
      setError(errorsCopy.generic);
    } finally {
      inFlight.current = false;
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3" data-component="CampaignDeleteControl">
      {confirming ? (
        <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{copy.confirmBody}</p>
          <div className="flex flex-wrap gap-3">
            <Button
              aria-busy={deleting}
              disabled={deleting}
              onClick={() => void handleDelete()}
              size="sm"
              type="button"
              variant="destructive"
            >
              <PendingButtonContent
                icon={Trash2}
                label={copy.confirm}
                pending={deleting}
                pendingLabel={copy.deleting}
              />
            </Button>
            <Button
              disabled={deleting}
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              {copy.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          className="text-red-700 hover:bg-red-50"
          onClick={() => setConfirming(true)}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden className="h-4 w-4" />
          {copy.button}
        </Button>
      )}
      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
