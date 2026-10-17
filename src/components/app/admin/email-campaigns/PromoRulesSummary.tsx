import { AlertTriangle, TicketPercent } from "lucide-react";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import type { PromotionCodeSummary } from "@/types/emailCampaign";
import { fillTemplate } from "./campaignApi";

interface PromoRulesSummaryProps {
  copy: EmailCampaignsAdminDict["editor"]["promo"];
  /** BCP 47 locale for dates and money, e.g. `es-ES`. */
  dateLocale: string;
  promo: PromotionCodeSummary;
}

function money(cents: number, currency: string, dateLocale: string) {
  return new Intl.NumberFormat(dateLocale, {
    currency: currency.toUpperCase(),
    style: "currency",
  }).format(cents / 100);
}

/** Read-only rules of a Stripe promotion code, for the admin to confirm. */
export function PromoRulesSummary({ copy, dateLocale, promo }: PromoRulesSummaryProps) {
  const discount =
    promo.percentOff !== null
      ? fillTemplate(copy.percentOff, { n: promo.percentOff })
      : promo.amountOffCents !== null
        ? fillTemplate(copy.amountOff, {
            amount: money(promo.amountOffCents, promo.currency ?? "usd", dateLocale),
          })
        : null;
  const expiry = promo.expiresAt
    ? fillTemplate(copy.expires, {
        date: new Date(promo.expiresAt).toLocaleDateString(dateLocale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      })
    : copy.noExpiry;
  const uses =
    promo.maxRedemptions !== null
      ? fillTemplate(copy.uses, { max: promo.maxRedemptions, used: promo.redemptionsUsed })
      : fillTemplate(copy.usesUnlimited, { used: promo.redemptionsUsed });
  const minimum =
    promo.minimumAmountCents !== null
      ? fillTemplate(copy.minimum, {
          amount: money(promo.minimumAmountCents, "usd", dateLocale),
        })
      : copy.noMinimum;
  const rules = [
    discount,
    expiry,
    uses,
    promo.firstTimeOnly ? copy.firstTimeOnly : copy.anyCustomer,
    minimum,
  ].filter((rule): rule is string => Boolean(rule));

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink">
        <TicketPercent aria-hidden className="h-4 w-4 text-primary" />
        {fillTemplate(copy.rulesTitle, { code: promo.code })}
      </p>
      <ul className="grid gap-1.5 text-sm text-neutral-700 sm:grid-cols-2">
        {rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      {!promo.active && (
        <p className="flex items-start gap-2 text-sm text-red-700" role="alert">
          <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          {copy.inactive}
        </p>
      )}
    </div>
  );
}
