"use client";

import { Download } from "lucide-react";
import { StatusBadge } from "@/components/app/admin/StatusBadge";
import { PanelCard } from "@/components/common/PanelCard";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { TripDetailDict } from "@/lib/types/dictionary";
import type { TripPaymentSummary } from "@/types/tripDetails";

interface TripPaymentCardProps {
  copy: Pick<
    TripDetailDict,
    | "downloadReceipt"
    | "paidOn"
    | "paymentIdLabel"
    | "paymentInfoTitle"
    | "paymentStatus"
    | "perPersonLabel"
  >;
  locale: string;
  payment: TripPaymentSummary;
  /**
   * Paid amount per traveler (major units). Shown for settled payments,
   * which replace the cost summary card; never a recomputed breakdown, as
   * no line items are stored with the payment.
   */
  perPerson?: number;
  /** Link to the receipt route; omit when the payment isn't settled. */
  receiptHref?: string;
}

/**
 * The buyer's payment in the profile editor's language: one protagonist
 * value (amount, with the KPI card's ochre accent bar), a quiet "paid on …
 * with …" caption, a small labelled reference, and the receipt as an
 * underlined Deep Teal text action rather than an outlined button.
 */
export function TripPaymentCard({
  copy,
  locale,
  payment,
  perPerson,
  receiptHref,
}: TripPaymentCardProps) {
  const currency = (payment.currency ?? "USD").toUpperCase();
  const number = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const amount = number.format(payment.amount);
  const paidOn = new Date(
    payment.paidAt ?? payment.createdAt,
  ).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const provider =
    payment.provider.charAt(0).toUpperCase() + payment.provider.slice(1);

  return (
    <PanelCard title={copy.paymentInfoTitle}>
      <div className="flex flex-col gap-5" data-component="TripPaymentCard">
        <StatusBadge
          label={
            copy.paymentStatus[
              payment.status as keyof typeof copy.paymentStatus
            ] ?? payment.status
          }
          status={payment.status}
          variant="payment"
        />

        <div>
          <div className="flex items-stretch gap-3">
            <span
              aria-hidden="true"
              className="w-1 shrink-0 rounded-full bg-feature"
            />
            <p className="flex items-baseline gap-2 font-barlow-condensed font-bold leading-none text-ink">
              <span className="text-lg text-neutral-500">{currency}</span>
              <span className="text-5xl leading-[.9]">{amount}</span>
            </p>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {interpolateTemplate(copy.paidOn, { date: paidOn, provider })}
          </p>
        </div>

        {perPerson !== undefined ? (
          <div className="flex items-baseline justify-between gap-4 border-t border-gray-200 pt-4 text-sm">
            <span className="text-neutral-600">{copy.perPersonLabel}</span>
            <span className="font-medium text-ink">
              {currency} {number.format(perPerson)}
            </span>
          </div>
        ) : null}

        {payment.providerPaymentId ? (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              {copy.paymentIdLabel}
            </p>
            <p
              className="mt-1 truncate font-mono text-xs text-ink"
              title={payment.providerPaymentId}
            >
              {payment.providerPaymentId}
            </p>
          </div>
        ) : null}

        {receiptHref ? (
          // Opens Stripe's hosted receipt (with its own PDF download) via our route.
          <a
            className="inline-flex min-h-11 items-center gap-2 self-start border-b border-primary text-sm text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            href={receiptHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            {copy.downloadReceipt}
          </a>
        ) : null}
      </div>
    </PanelCard>
  );
}
