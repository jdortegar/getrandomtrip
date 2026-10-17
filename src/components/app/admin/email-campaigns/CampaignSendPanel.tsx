"use client";

import { useRef, useState } from "react";
import { AlertTriangle, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type { CampaignSendSummary, CampaignStatus } from "@/types/emailCampaign";
import {
  CAMPAIGNS_API,
  campaignFailureMessage,
  fillTemplate,
  readCampaignFailure,
} from "./campaignApi";
import { PendingButtonContent } from "./PendingButtonContent";

const CTA_CLASS =
  "h-11 rounded-sm border-2 border-primary bg-primary px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-primary-800";

type Phase = "idle" | "checking" | "confirm" | "sending";

interface CampaignSendPanelProps {
  campaignId: string;
  copy: EmailCampaignsAdminDict["send"];
  errorsCopy: EmailCampaignsAdminDict["errors"];
  /** Called with the run summary after a send or retry finished. */
  onSent: (summary: CampaignSendSummary) => void;
  status: CampaignStatus;
  statusCopy: EmailCampaignsAdminDict["campaigns"]["status"];
}

/**
 * "Send now" for DRAFT and "Retry failed sends" for PARTIAL campaigns: counts
 * the audience, asks for an explicit irreversible confirmation, then sends.
 */
export function CampaignSendPanel({
  campaignId,
  copy,
  errorsCopy,
  onSent,
  status,
  statusCopy,
}: CampaignSendPanelProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CampaignSendSummary | null>(null);
  const inFlight = useRef(false);
  const api = `${CAMPAIGNS_API}/${campaignId}`;
  const isRetry = status === "PARTIAL";
  const canSend = status === "DRAFT" || isRetry;

  async function run(work: () => Promise<void>, fallback: Phase) {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    try {
      await work();
    } catch {
      setError(errorsCopy.generic);
      setPhase(fallback);
    } finally {
      inFlight.current = false;
    }
  }

  const handleCheck = () =>
    run(async () => {
      setPhase("checking");
      const res = await fetch(`${api}/audience`);
      if (!res.ok) {
        setError(campaignFailureMessage(await readCampaignFailure(res), errorsCopy));
        setPhase("idle");
        return;
      }
      const data = (await res.json()) as { count: number };
      setCount(data.count);
      setPhase("confirm");
    }, "idle");

  const handleSend = () =>
    run(async () => {
      setPhase("sending");
      const res = await fetch(`${api}/send`, { method: "POST" });
      if (!res.ok) {
        setError(campaignFailureMessage(await readCampaignFailure(res), errorsCopy));
        setPhase("idle");
        return;
      }
      const result = (await res.json()) as CampaignSendSummary;
      setSummary(result);
      setPhase("idle");
      onSent(result);
    }, "idle");

  if (!canSend && !summary && status !== "SENDING") return null;

  return (
    <section
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-8"
      data-component="CampaignSendPanel"
    >
      <div>
        <h3 className="text-xl font-semibold text-ink">{copy.heading}</h3>
        {canSend && <p className="mt-1 text-xs text-neutral-500">{copy.description}</p>}
      </div>

      {status === "SENDING" && !summary && (
        <p className="text-sm text-neutral-700">{copy.inProgress}</p>
      )}

      {summary && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4" role="status">
          <p className="text-sm font-semibold text-ink">
            {fillTemplate(copy.summaryTitle, { status: statusCopy[summary.status] })}
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            {fillTemplate(copy.summary, {
              failed: summary.failed,
              sent: summary.sent,
              total: summary.total,
            })}
          </p>
        </div>
      )}

      {canSend && (phase === "confirm" || phase === "sending") ? (
        <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            {count === 0
              ? copy.emptyAudience
              : isRetry
                ? copy.retryBody
                : fillTemplate(copy.confirmBody, { count })}
          </p>
          <div className="flex flex-wrap gap-3">
            {count > 0 && (
              <Button
                aria-busy={phase === "sending"}
                className={CTA_CLASS}
                disabled={phase === "sending"}
                onClick={() => void handleSend()}
                type="button"
              >
                <PendingButtonContent
                  icon={Send}
                  label={copy.confirm}
                  pending={phase === "sending"}
                  pendingLabel={copy.sending}
                />
              </Button>
            )}
            <Button
              disabled={phase === "sending"}
              onClick={() => setPhase("idle")}
              size="sm"
              type="button"
              variant="secondary"
            >
              {copy.cancel}
            </Button>
          </div>
        </div>
      ) : canSend ? (
        <Button
          aria-busy={phase === "checking"}
          className={CTA_CLASS}
          disabled={phase === "checking"}
          onClick={() => void handleCheck()}
          type="button"
        >
          <PendingButtonContent
            icon={isRetry ? RotateCcw : Send}
            label={isRetry ? copy.retry : copy.sendNow}
            pending={phase === "checking"}
            pendingLabel={copy.checking}
          />
        </Button>
      ) : null}

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
