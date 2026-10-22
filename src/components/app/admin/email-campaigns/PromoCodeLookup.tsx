"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type { PromoLookupState, PromotionCodeSummary } from "@/types/emailCampaign";
import { CAMPAIGN_FIELD_LIMITS } from "./campaignForm";
import { PendingButtonContent } from "./PendingButtonContent";
import { PromoRulesSummary } from "./PromoRulesSummary";

interface PromoCodeLookupProps {
  copy: EmailCampaignsAdminDict["editor"]["promo"];
  /** BCP 47 locale for dates and money, e.g. `es-ES`. */
  dateLocale: string;
  onChange: (value: string) => void;
  value: string;
}

/**
 * Promo code input with a Stripe lookup that shows the code's rules for
 * confirmation. An empty value means the campaign has no promo.
 */
export function PromoCodeLookup({ copy, dateLocale, onChange, value }: PromoCodeLookupProps) {
  const [lookup, setLookup] = useState<PromoLookupState>({ status: "idle" });
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const code = value.trim().toUpperCase();

  async function handleLookup() {
    if (inFlight.current || !code) return;
    inFlight.current = true;
    setPending(true);
    try {
      const res = await fetch(
        `/api/admin/email-campaigns/promo-lookup?code=${encodeURIComponent(code)}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { promo: PromotionCodeSummary };
        setLookup({ promo: data.promo, status: "found" });
      } else {
        setLookup({ status: res.status === 404 ? "notFound" : "error" });
      }
    } catch {
      setLookup({ status: "error" });
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div className="space-y-3" data-component="PromoCodeLookup">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <FormField
            aria-describedby="campaign-promo-code-hint"
            autoComplete="off"
            id="campaign-promo-code"
            label={copy.label}
            maxLength={CAMPAIGN_FIELD_LIMITS.promoCode}
            name="promoCode"
            onChange={(event) => {
              onChange(event.target.value);
              setLookup({ status: "idle" });
            }}
            placeholder={copy.placeholder}
            value={value}
          />
        </div>
        <Button
          aria-busy={pending}
          className="h-14 shrink-0"
          disabled={pending || !code}
          onClick={() => void handleLookup()}
          type="button"
          variant="secondary"
        >
          <PendingButtonContent
            icon={Search}
            label={copy.lookup}
            pending={pending}
            pendingLabel={copy.lookingUp}
          />
        </Button>
      </div>
      <p className="text-xs text-neutral-500" id="campaign-promo-code-hint">
        {copy.hint}
      </p>
      {lookup.status === "found" && (
        <PromoRulesSummary copy={copy} dateLocale={dateLocale} promo={lookup.promo} />
      )}
      {(lookup.status === "notFound" || lookup.status === "error") && (
        <p className="text-sm text-red-700" role="alert">
          {lookup.status === "notFound" ? copy.notFound : copy.error}
        </p>
      )}
    </div>
  );
}
