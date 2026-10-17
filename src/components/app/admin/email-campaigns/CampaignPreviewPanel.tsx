"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import {
  CAMPAIGNS_API,
  campaignFailureMessage,
  fillTemplate,
  readCampaignFailure,
} from "./campaignApi";
import { PendingButtonContent } from "./PendingButtonContent";

type Feedback = { kind: "error" | "success"; message: string } | null;

interface CampaignPreviewPanelProps {
  campaignId: string;
  copy: EmailCampaignsAdminDict["preview"];
  errorsCopy: EmailCampaignsAdminDict["errors"];
  /** Changes whenever the campaign is saved, so the frame reloads. */
  version: string;
}

/** Rendered email in an inert iframe plus "send test to me". */
export function CampaignPreviewPanel({
  campaignId,
  copy,
  errorsCopy,
  version,
}: CampaignPreviewPanelProps) {
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const inFlight = useRef(false);
  const api = `${CAMPAIGNS_API}/${campaignId}`;

  async function handleTestSend() {
    if (inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setFeedback(null);
    try {
      const res = await fetch(`${api}/test-send`, { method: "POST" });
      if (!res.ok) {
        const failure = await readCampaignFailure(res);
        setFeedback({ kind: "error", message: campaignFailureMessage(failure, errorsCopy) });
        return;
      }
      const data = (await res.json()) as { to: string };
      setFeedback({ kind: "success", message: fillTemplate(copy.testSent, { email: data.to }) });
    } catch {
      setFeedback({ kind: "error", message: errorsCopy.generic });
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  return (
    <section
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-8"
      data-component="CampaignPreviewPanel"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-ink">{copy.heading}</h3>
        <Button
          aria-busy={sending}
          disabled={sending}
          onClick={() => void handleTestSend()}
          size="sm"
          type="button"
          variant="secondary"
        >
          <PendingButtonContent
            icon={Send}
            label={copy.testSend}
            pending={sending}
            pendingLabel={copy.testSending}
          />
        </Button>
      </div>
      {feedback && (
        <p
          className={feedback.kind === "error" ? "text-sm text-red-700" : "text-sm text-green-700"}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      )}
      <iframe
        className="h-[640px] w-full rounded-lg border border-gray-200 bg-ground"
        sandbox=""
        src={`${api}/preview?v=${encodeURIComponent(version)}`}
        title={copy.frameTitle}
      />
      <p className="text-xs text-neutral-500">{copy.unsubscribeNote}</p>
    </section>
  );
}
